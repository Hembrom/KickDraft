import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getGroupPlayers,
  getMatch,
  groupExists,
  updateMatch,
} from '../lib/storage.js';
import { error, json, readBody } from '../lib/auth.js';
import { buildGeneratedTeam } from '../../shared/team-generator.js';
import { isThreeTeamMatch, roundRating, slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = slugify(String(req.query.slug ?? ''));
  const matchId = String(req.query.matchId ?? '').trim();

  if (!slug || !matchId) return error(res, 400, 'Invalid group or match');

  if (!(await groupExists(slug))) {
    return error(res, 404, 'Group not found');
  }

  const match = await getMatch(slug, matchId);
  if (!match) {
    return error(res, 404, 'Match not found');
  }

  if (req.method === 'GET') {
    return json(res, 200, match);
  }

  if (req.method === 'PUT') {
    const body = await readBody<{
      teamAPlayerIds?: string[];
      teamBPlayerIds?: string[];
      teamCPlayerIds?: string[];
    }>(req);
    const teamAPlayerIds = body.teamAPlayerIds ?? [];
    const teamBPlayerIds = body.teamBPlayerIds ?? [];
    const teamCPlayerIds = body.teamCPlayerIds ?? [];
    const isThreeWay = isThreeTeamMatch(match);
    const submittedIds = isThreeWay
      ? [...teamAPlayerIds, ...teamBPlayerIds, ...teamCPlayerIds]
      : [...teamAPlayerIds, ...teamBPlayerIds];

    if (
      teamAPlayerIds.length !== match.teamA.players.length ||
      teamBPlayerIds.length !== match.teamB.players.length ||
      (isThreeWay &&
        match.teamC &&
        teamCPlayerIds.length !== match.teamC.players.length)
    ) {
      return error(res, 400, 'Team sizes must stay the same');
    }
    if (new Set(submittedIds).size !== submittedIds.length) {
      return error(res, 400, 'A player cannot appear on more than one team');
    }

    const expectedIds = new Set(match.selectedPlayerIds);
    if (
      submittedIds.length !== expectedIds.size ||
      submittedIds.some((id) => !expectedIds.has(id))
    ) {
      return error(res, 400, 'Teams must contain the same selected players');
    }

    const { players } = await getGroupPlayers(slug);
    const byId = new Map(players.map((player) => [player.id, player]));
    const teamAPlayers = teamAPlayerIds.map((id) => byId.get(id));
    const teamBPlayers = teamBPlayerIds.map((id) => byId.get(id));
    const teamCPlayers = isThreeWay ? teamCPlayerIds.map((id) => byId.get(id)) : [];
    if ([...teamAPlayers, ...teamBPlayers, ...teamCPlayers].some((player) => !player)) {
      return error(res, 400, 'One or more players were not found');
    }

    const teamA = buildGeneratedTeam(
      'Team A',
      teamAPlayers as NonNullable<(typeof teamAPlayers)[number]>[],
    );
    const teamB = buildGeneratedTeam(
      'Team B',
      teamBPlayers as NonNullable<(typeof teamBPlayers)[number]>[],
    );

    if (isThreeWay && match.teamC) {
      const teamC = buildGeneratedTeam(
        'Team C',
        teamCPlayers as NonNullable<(typeof teamCPlayers)[number]>[],
      );
      const totals = [teamA.totalRating, teamB.totalRating, teamC.totalRating];
      const updated = {
        ...match,
        teamA,
        teamB,
        teamC,
        ratingDifference: roundRating(Math.max(...totals) - Math.min(...totals)),
      };
      await updateMatch(updated);
      return json(res, 200, updated);
    }

    const updated = {
      ...match,
      teamA,
      teamB,
      ratingDifference: roundRating(Math.abs(teamA.totalRating - teamB.totalRating)),
    };

    await updateMatch(updated);
    return json(res, 200, updated);
  }

  return error(res, 405, 'Method not allowed');
}
