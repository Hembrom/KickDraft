import { normalizeMatchResult } from './match-result.js';
import type { MatchRecord, MatchResult } from './types.js';

type TeamAPayload = MatchRecord['teamA'] & {
  matchResult?: MatchResult;
  externalMatch?: boolean;
};

/** Persist scorecard + external flag inside team_a jsonb (no extra DB column). */
export function attachResultToTeamA(record: MatchRecord): MatchRecord['teamA'] {
  const { matchResult: _drop, externalMatch: _flag, ...rest } = record.teamA as TeamAPayload;
  const result = normalizeMatchResult(record.result);
  const external = record.external === true;
  if (!result && !external) return rest;
  return {
    ...rest,
    ...(result ? { matchResult: result } : {}),
    ...(external ? { externalMatch: true } : {}),
  } as MatchRecord['teamA'];
}

export function parseResultFromTeamA(
  teamA: MatchRecord['teamA'] | TeamAPayload,
): { teamA: MatchRecord['teamA']; result?: MatchResult; external?: boolean } {
  const payload = teamA as TeamAPayload;
  const { matchResult, externalMatch, ...rest } = payload;
  return {
    teamA: rest,
    result: normalizeMatchResult(matchResult),
    external: externalMatch === true,
  };
}
