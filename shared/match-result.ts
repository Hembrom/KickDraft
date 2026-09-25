import {
  isExternalMatch,
  isRotationMatch,
  isThreeTeamMatch,
  type MatchRecord,
  type MatchResult,
  type Player,
} from './types.js';

export const MAX_PLAYER_GOALS = 30;

export function normalizeMatchResult(input: unknown): MatchResult | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const payload = input as { scorers?: unknown; conceded?: unknown };
  const scorers: Record<string, number> = {};
  if (payload.scorers && typeof payload.scorers === 'object' && !Array.isArray(payload.scorers)) {
    for (const [id, value] of Object.entries(payload.scorers)) {
      const n = Number(value);
      if (!id || !Number.isInteger(n) || n <= 0) continue;
      scorers[id] = Math.min(n, MAX_PLAYER_GOALS);
    }
  }
  const concededRaw = Number(payload.conceded);
  const conceded =
    Number.isInteger(concededRaw) && concededRaw > 0
      ? Math.min(concededRaw, 99)
      : undefined;
  if (Object.keys(scorers).length === 0 && conceded == null) return undefined;
  return { scorers, ...(conceded != null ? { conceded } : {}) };
}

export function goalsFor(match: MatchRecord): number {
  const totals = scoreTotals(match);
  if (isRotationMatch(match)) return totals.A + totals.B;
  return totals.A;
}

export function goalsAgainst(match: MatchRecord): number {
  if (isRotationMatch(match)) return match.result?.conceded ?? 0;
  if (isThreeTeamMatch(match)) return 0;
  return scoreTotals(match).B;
}

export function matchPlayers(match: MatchRecord): Player[] {
  const seen = new Set<string>();
  const players: Player[] = [];
  for (const player of [
    ...match.teamA.players,
    ...match.teamB.players,
    ...(match.teamC?.players ?? []),
  ]) {
    if (seen.has(player.id)) continue;
    seen.add(player.id);
    players.push(player);
  }
  return players;
}

export function playerTeamKey(match: MatchRecord, playerId: string): 'A' | 'B' | 'C' | null {
  if (match.teamA.players.some((player) => player.id === playerId)) return 'A';
  if (match.teamB.players.some((player) => player.id === playerId)) return 'B';
  if (match.teamC?.players.some((player) => player.id === playerId)) return 'C';
  return null;
}

export function scoreTotals(match: MatchRecord): { A: number; B: number; C: number } {
  const totals = { A: 0, B: 0, C: 0 };
  for (const [playerId, goals] of Object.entries(match.result?.scorers ?? {})) {
    const key = playerTeamKey(match, playerId);
    if (key) totals[key] += goals;
  }
  return totals;
}

export function totalGoals(match: MatchRecord): number {
  const totals = scoreTotals(match);
  return totals.A + totals.B + totals.C;
}

export function formatMatchScore(match: MatchRecord): string | null {
  if (!isExternalMatch(match) || !match.result) return null;
  const totals = scoreTotals(match);
  if (isRotationMatch(match)) {
    return `${goalsFor(match)}–${goalsAgainst(match)}`;
  }
  if (isThreeTeamMatch(match)) {
    return `${totals.A}–${totals.B}–${totals.C}`;
  }
  return `${totals.A}–${totals.B}`;
}

export function applyGoalDelta(
  match: MatchRecord,
  playerId: string,
  delta: number,
): MatchRecord {
  if (!isExternalMatch(match)) {
    throw new Error('Mark this as an external match before recording goals');
  }
  if (!matchPlayers(match).some((player) => player.id === playerId)) {
    throw new Error('Player is not in this match');
  }
  const step = Math.trunc(delta);
  if (step === 0) return match;

  const scorers = { ...(match.result?.scorers ?? {}) };
  const next = Math.max(0, Math.min(MAX_PLAYER_GOALS, (scorers[playerId] ?? 0) + step));
  if (next === 0) delete scorers[playerId];
  else scorers[playerId] = next;

  const result = normalizeMatchResult({
    scorers,
    conceded: match.result?.conceded,
  });
  return { ...match, result };
}

export function applyConcededDelta(match: MatchRecord, delta: number): MatchRecord {
  if (!isRotationMatch(match)) {
    throw new Error('Goals conceded are only for rotation matches');
  }
  if (!isExternalMatch(match)) {
    throw new Error('Mark this as an external match before recording the score');
  }
  const step = Math.trunc(delta);
  if (step === 0) return match;
  const next = Math.max(0, Math.min(99, (match.result?.conceded ?? 0) + step));
  const result = normalizeMatchResult({
    scorers: match.result?.scorers ?? {},
    conceded: next,
  });
  return { ...match, result };
}
