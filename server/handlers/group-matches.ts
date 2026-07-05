import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getGroupPlayers,
  groupExists,
  listMatches,
  saveMatch,
} from '../lib/storage.js';
import { error, json, readBody } from '../lib/auth.js';
import { generateBalancedTeams } from '../../shared/team-generator.js';
import { resolveTeamSizes, slugify, type MatchRecord } from '../../shared/types.js';

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
    const playerIds = body.playerIds ?? [];
    const format = Number(body.format);

    if (!format || format < 5 || format > 11) {
      return error(res, 400, 'Format must be between 5 and 11');
    }

    const split = resolveTeamSizes(format, playerIds.length);
    if (!split) {
      const min = format * 2 - 1;
      const max = format * 2 + 1;
      return error(
        res,
        400,
        `Select ${min}–${max} players for ${format}v${format} (e.g. 11 players → 5v6)`,
      );
    }

    const { players: allPlayers } = await getGroupPlayers(slug);
    const selected = playerIds
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    if (selected.length !== playerIds.length) {
      return error(res, 400, 'One or more selected players were not found');
    }

    try {
      const { teamA, teamB, ratingDifference } = generateBalancedTeams(
        selected,
        split.teamASize,
        split.teamBSize,
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
