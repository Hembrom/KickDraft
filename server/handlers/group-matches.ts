import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getGroupPlayers,
  groupExists,
  listMatches,
  saveMatch,
} from '../lib/blob-storage.js';
import { error, json, readBody } from '../lib/auth.js';
import { generateBalancedTeams, pickPlayersForMatch } from '../../shared/team-generator.js';
import { slugify, type MatchRecord } from '../../shared/types.js';

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
    const body = await readBody<{ playerIds?: string[]; format?: number }>(req);
    const format = Number(body.format);

    if (!format || format < 5 || format > 11) {
      return error(res, 400, 'Format must be between 5 and 11');
    }

    const needed = format * 2;
    const { players: allPlayers } = await getGroupPlayers(slug);

    if (allPlayers.length < needed) {
      return error(
        res,
        400,
        `Need at least ${needed} players in the squad for ${format}v${format}`,
      );
    }

    let selected = allPlayers;
    const playerIds = body.playerIds ?? [];

    if (playerIds.length === needed) {
      selected = playerIds
        .map((id) => allPlayers.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      if (selected.length !== playerIds.length) {
        return error(res, 400, 'One or more selected players were not found');
      }
    } else {
      selected = pickPlayersForMatch(allPlayers, needed);
    }

    try {
      const { teamA, teamB, ratingDifference } = generateBalancedTeams(
        selected,
        format as 5 | 6 | 7 | 8 | 9 | 10 | 11,
      );

      const record: MatchRecord = {
        id: crypto.randomUUID(),
        groupSlug: slug,
        date: new Date().toISOString(),
        format,
        selectedPlayerIds: selected.map((p) => p.id),
        teamA,
        teamB,
        ratingDifference,
      };

      await saveMatch(record);
      return json(res, 201, record);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate teams';
      return error(res, 400, message);
    }
  }

  return error(res, 405, 'Method not allowed');
}
