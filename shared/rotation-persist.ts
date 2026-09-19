import {
  isRotationMatch,
  type MatchRecord,
  type RotationBoxes,
} from './types.js';

type TeamBPayload = MatchRecord['teamB'] & {
  matchKind?: 'rotation';
  rotation?: RotationBoxes;
};

function emptyBoxes(): RotationBoxes {
  return { GK: [], DEF: [], MID: [], FWD: [] };
}

/** Persist rotation metadata inside team_b jsonb so no extra DB column is required. */
export function attachRotationToTeamB(record: MatchRecord): MatchRecord['teamB'] {
  if (!isRotationMatch(record)) return record.teamB;
  const payload: TeamBPayload = {
    ...record.teamB,
    matchKind: 'rotation',
    rotation: record.rotation ?? emptyBoxes(),
  };
  return payload;
}

export function parseRotationFromTeamB(
  teamB: MatchRecord['teamB'] | TeamBPayload,
): { kind?: 'rotation'; rotation?: RotationBoxes; teamB: MatchRecord['teamB'] } {
  const payload = teamB as TeamBPayload;
  if (payload?.matchKind !== 'rotation') {
    return { teamB };
  }

  const { matchKind: _kind, rotation, ...rest } = payload;
  return {
    kind: 'rotation',
    rotation: rotation ?? emptyBoxes(),
    teamB: rest,
  };
}
