import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getGroupPlayers,
  getMatch,
  groupExists,
  updateMatch,
} from '../lib/storage.js';
import {
  buildAppearancesFromMatch,
  replaceAppearancesForMatch,
} from '../lib/appearances.js';
import { applyEffectiveRatingsForGroup } from '../lib/peer-ratings.js';
import { error, json, readBody } from '../lib/auth.js';
import { buildGeneratedTeam } from '../../shared/team-generator.js';
import { isThreeTeamMatch, roundRating, sanitizeTeamName, slugify } from '../../shared/types.js';

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
      namesOnly?: boolean;
      teamAPlayerIds?: string[];
      teamBPlayerIds?: string[];
      teamCPlayerIds?: string[];
      teamAName?: string;
      teamBName?: string;
      teamCName?: string;
    }>(req);
    const isThreeWay = isThreeTeamMatch(match);
    const namesOnly = body.namesOnly === true;

    const teamAPlayerIds = namesOnly
      ? match.teamA.players.map((player) => player.id)
      : (body.teamAPlayerIds ?? []);
    const teamBPlayerIds = namesOnly
      ? match.teamB.players.map((player) => player.id)
      : (body.teamBPlayerIds ?? []);
    const teamCPlayerIds = namesOnly
      ? (match.teamC?.players.map((player) => player.id) ?? [])
      : (body.teamCPlayerIds ?? []);
    const submittedIds = isThreeWay
      ? [...teamAPlayerIds, ...teamBPlayerIds, ...teamCPlayerIds]
      : [...teamAPlayerIds, ...teamBPlayerIds];

    if (new Set(submittedIds).size !== submittedIds.length) {
      return error(res, 400, 'A player cannot appear on more than one team');
    }

    if (teamAPlayerIds.length < 1 || teamBPlayerIds.length < 1) {
      return error(res, 400, 'Each team needs at least one player');
    }
    if (isThreeWay && teamCPlayerIds.length < 1) {
      return error(res, 400, 'Each team needs at least one player');
    }

    // Team sizes may change when late arrivals hop in via quick swap edit.

    const { players: rawPlayers } = await getGroupPlayers(slug);
    const players = await applyEffectiveRatingsForGroup(slug, rawPlayers);
    const byId = new Map(players.map((player) => [player.id, player]));
    const teamAPlayers = teamAPlayerIds.map((id) => byId.get(id));
    const teamBPlayers = teamBPlayerIds.map((id) => byId.get(id));
    const teamCPlayers = isThreeWay ? teamCPlayerIds.map((id) => byId.get(id)) : [];
    if ([...teamAPlayers, ...teamBPlayers, ...teamCPlayers].some((player) => !player)) {
      return error(res, 400, 'One or more players were not found in this group');
    }

    const teamA = buildGeneratedTeam(
      typeof body.teamAName === 'string'
        ? sanitizeTeamName(body.teamAName, match.teamA.name)
        : match.teamA.name,
      teamAPlayers as NonNullable<(typeof teamAPlayers)[number]>[],
    );
    const teamB = buildGeneratedTeam(
      typeof body.teamBName === 'string'
        ? sanitizeTeamName(body.teamBName, match.teamB.name)
        : match.teamB.name,
      teamBPlayers as NonNullable<(typeof teamBPlayers)[number]>[],
    );

    let updated = {
      ...match,
      selectedPlayerIds: submittedIds,
      teamA,
      teamB,
      ratingDifference: roundRating(Math.abs(teamA.totalRating - teamB.totalRating)),
    };

    if (isThreeWay && match.teamC) {
      const teamC = buildGeneratedTeam(
        typeof body.teamCName === 'string'
          ? sanitizeTeamName(body.teamCName, match.teamC.name)
          : match.teamC.name,
        teamCPlayers as NonNullable<(typeof teamCPlayers)[number]>[],
      );
      const totals = [teamA.totalRating, teamB.totalRating, teamC.totalRating];
      updated = {
        ...match,
        selectedPlayerIds: submittedIds,
        teamA,
        teamB,
        teamC,
        ratingDifference: roundRating(Math.max(...totals) - Math.min(...totals)),
      };
    }

    await updateMatch(updated);

    if (updated.recordedAsPlayed) {
      const recordedAt = updated.recordedAt ?? new Date().toISOString();
      const rows = buildAppearancesFromMatch({ ...updated, recordedAt }, recordedAt);
      await replaceAppearancesForMatch(updated, rows);
    }

    return json(res, 200, updated);
  }

  return error(res, 405, 'Method not allowed');
}
