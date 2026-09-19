import {
  isRotationMatch,
  type MatchRecord,
  type Player,
  type RotationBoxes,
  type RotationSlot,
} from './types.js';

const ROTATION_BENCH_NAME = 'Rotation';

type TeamBPayload = MatchRecord['teamB'] & {
  matchKind?: 'rotation';
  rotation?: RotationBoxes;
  formation?: number[] | string;
  formationKey?: string;
  starterIds?: string[];
};

function emptyBoxes(): RotationBoxes {
  return { GK: [], DEF: [], MID: [], FWD: [] };
}

function hasRotationBoxes(boxes: RotationBoxes | undefined): boolean {
  if (!boxes) return false;
  return (['GK', 'DEF', 'MID', 'FWD'] as RotationSlot[]).some(
    (slot) => (boxes[slot]?.length ?? 0) > 0,
  );
}

function boxesFromPlayers(players: Player[] | undefined): RotationBoxes {
  const boxes = emptyBoxes();
  for (const player of players ?? []) {
    const first = player.positions?.[0];
    if (first === 'GK' || first === 'DEF' || first === 'MID' || first === 'FWD') {
      boxes[first].push(player);
    } else {
      boxes.MID.push(player);
    }
  }
  return boxes;
}

function isRotationPayload(payload: TeamBPayload | undefined): boolean {
  if (!payload) return false;
  return (
    payload.matchKind === 'rotation' ||
    payload.name === ROTATION_BENCH_NAME ||
    hasRotationBoxes(payload.rotation) ||
    Boolean(payload.formationKey) ||
    Boolean(payload.formation)
  );
}

/** Persist rotation metadata inside team_b jsonb so no extra DB column is required. */
export function attachRotationToTeamB(record: MatchRecord): MatchRecord['teamB'] {
  if (!isRotationMatch(record) && record.teamB?.name !== ROTATION_BENCH_NAME) {
    return record.teamB;
  }
  const formationKey = record.formation?.filter((n) => n > 0).join('-');
  const payload: TeamBPayload = {
    ...record.teamB,
    name: record.teamB?.name || ROTATION_BENCH_NAME,
    matchKind: 'rotation',
    rotation: record.rotation ?? emptyBoxes(),
    formation: record.formation,
    formationKey,
    starterIds: record.teamA.players.map((player) => player.id),
  };
  return payload;
}

export function parseRotationFromTeamB(
  teamB: MatchRecord['teamB'] | TeamBPayload,
): {
  kind?: 'rotation';
  rotation?: RotationBoxes;
  formation?: number[] | string;
  starterIds?: string[];
  teamB: MatchRecord['teamB'];
} {
  const payload = teamB as TeamBPayload;
  if (!isRotationPayload(payload)) {
    return { teamB };
  }

  const {
    matchKind: _kind,
    rotation,
    formation,
    formationKey,
    starterIds,
    ...rest
  } = payload;

  return {
    kind: 'rotation',
    rotation: hasRotationBoxes(rotation) ? rotation : boxesFromPlayers(rest.players),
    formation: formation ?? formationKey,
    starterIds: Array.isArray(starterIds) ? starterIds.filter(Boolean) : undefined,
    teamB: rest,
  };
}

export function hydrateMatchRecord(record: MatchRecord): MatchRecord {
  const parsed = parseRotationFromTeamB({
    ...record.teamB,
    ...(record.kind === 'rotation' ? { matchKind: 'rotation' as const } : {}),
    ...(record.rotation ? { rotation: record.rotation } : {}),
    ...(record.formation ? { formation: record.formation } : {}),
    starterIds: record.teamA.players.map((player) => player.id),
  });
  if (parsed.kind !== 'rotation' && record.kind !== 'rotation') return record;
  return {
    ...record,
    kind: 'rotation',
    teamB: parsed.kind === 'rotation' ? parsed.teamB : record.teamB,
    rotation: record.rotation ?? parsed.rotation,
    formation: record.formation ?? (Array.isArray(parsed.formation) ? parsed.formation : undefined),
  };
}
