import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getGroupPlayers,
  groupExists,
  listMatches,
  saveMatch,
} from '../lib/storage.js';
import { applyEffectiveRatingsForGroup } from '../lib/peer-ratings.js';
import { error, getErrorMessage, json, readBody } from '../lib/auth.js';
import { generateBalancedTeams, generateBalancedThreeTeams } from '../../shared/team-generator.js';
import {
  formatFromPlayerCount,
  formatFromThreeWayPlayerCount,
  slugify,
  teamSizesFromPlayerCount,
  teamSizesFromThreeWaySplit,
  type MatchRecord,
  type TeamCount,
} from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');

  if (!(await groupExists(slug))) {
    return error(res, 404, 'Group not found');
  }

  if (req.method === 'GET') {
    const matches = await listMatches(slug);
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = matches.filter((m) => new Date(m.date).getTime() >= cutoff);
    return json(res, 200, { matches: recent });
  }

  if (req.method === 'POST') {
    const body = await readBody<{ playerIds?: string[]; name?: string; teamCount?: TeamCount }>(req);
    const playerIds = body.playerIds ?? [];
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const teamCount: TeamCount = body.teamCount === 3 ? 3 : 2;

    if (playerIds.length === 0) {
      return error(res, 400, 'Select players manually — tick who is playing today');
    }

    const { players: allPlayersRaw } = await getGroupPlayers(slug);
    const allPlayers = await applyEffectiveRatingsForGroup(slug, allPlayersRaw);
    const selected = playerIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    if (selected.length !== playerIds.length) {
      return error(res, 400, 'One or more selected players were not found');
    }

    try {
      if (teamCount === 3) {
        const sizes = teamSizesFromThreeWaySplit(playerIds.length);
        if (!sizes) {
          return error(res, 400, 'Select 12–22 players for a three-way split (e.g. 15 → 5v5v5)');
        }

        const format = formatFromThreeWayPlayerCount(playerIds.length);
        if (!format) {
          return error(res, 400, 'Could not determine match size from player count');
        }

        const [teamASize, teamBSize, teamCSize] = sizes;
        const { teamA, teamB, teamC, ratingDifference } = generateBalancedThreeTeams(
          selected,
          teamASize,
          teamBSize,
          teamCSize,
        );

        const record: MatchRecord = {
          id: crypto.randomUUID(),
          groupSlug: slug,
          date: new Date().toISOString(),
          name,
          format,
          teamCount: 3,
          selectedPlayerIds: selected.map((p) => p.id),
          teamA,
          teamB,
          teamC,
          ratingDifference,
        };

        await saveMatch(record);
        return json(res, 201, record);
      }

      const split = teamSizesFromPlayerCount(playerIds.length);
      if (!split) {
        return error(res, 400, 'Select 9–22 players for a match (e.g. 11 → 6v5, 12 → 6v6)');
      }

      const format = formatFromPlayerCount(playerIds.length);
      if (!format) {
        return error(res, 400, 'Could not determine match size from player count');
      }

      const { teamA, teamB, ratingDifference } = generateBalancedTeams(
        selected,
        split.teamASize,
        split.teamBSize,
      );

      const record: MatchRecord = {
        id: crypto.randomUUID(),
        groupSlug: slug,
        date: new Date().toISOString(),
        name,
        format,
        teamCount: 2,
        selectedPlayerIds: selected.map((p) => p.id),
        teamA,
        teamB,
        ratingDifference,
      };

      await saveMatch(record);
      return json(res, 201, record);
    } catch (err) {
      return error(res, 400, getErrorMessage(err, 'Failed to generate teams'));
    }
  }

  return error(res, 405, 'Method not allowed');
}
