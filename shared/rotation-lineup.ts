import { buildGeneratedTeam } from './team-generator.js';
import {
  canPlayGoalkeeper,
  isGoalkeeperOnly,
  type Player,
  type PlayerPosition,
  type RotationBoxes,
  type RotationSlot,
} from './types.js';

export const ROTATION_FORMATS = [5, 6, 7, 8, 9, 10, 11] as const;
export type RotationFormat = (typeof ROTATION_FORMATS)[number];

export const ROTATION_SLOTS: RotationSlot[] = ['GK', 'DEF', 'MID', 'FWD'];

export const ROTATION_SLOT_LABELS: Record<RotationSlot, string> = {
  GK: 'GK',
  DEF: 'Defence',
  MID: 'Mid',
  FWD: 'Striker',
};

export const ROTATION_BENCH_NAME = 'Rotation';

/** Default single-team shape per size. */
const ROTATION_FORMATIONS: Record<number, number[]> = {
  5: [1, 2, 2],
  6: [1, 2, 1, 2],
  7: [1, 2, 2, 2],
  8: [1, 2, 3, 2],
  9: [1, 3, 3, 2],
  10: [1, 3, 4, 2],
  11: [1, 4, 4, 2],
};

/** Alternate shapes (always sum to the on-pitch count). */
const ROTATION_SHAPES: Record<number, number[][]> = {
  5: [
    [1, 2, 2],
    [1, 3, 1],
    [1, 2, 1, 1],
    [1, 1, 2, 1],
  ],
  6: [
    [1, 2, 1, 2],
    [1, 3, 2],
    [1, 2, 2, 1],
    [1, 3, 1, 1],
  ],
  7: [
    [1, 2, 2, 2],
    [1, 3, 3],
    [1, 2, 3, 1],
    [1, 3, 2, 1],
  ],
  8: [
    [1, 2, 3, 2],
    [1, 3, 2, 2],
    [1, 3, 3, 1],
    [1, 2, 2, 3],
  ],
  9: [
    [1, 3, 3, 2],
    [1, 4, 4],
    [1, 3, 4, 1],
    [1, 2, 4, 2],
  ],
  10: [
    [1, 3, 4, 2],
    [1, 4, 3, 2],
    [1, 4, 4, 1],
    [1, 3, 3, 3],
  ],
  11: [
    [1, 4, 4, 2],
    [1, 4, 3, 3],
    [1, 3, 5, 2],
    [1, 5, 4, 1],
  ],
};

export function isRotationFormat(value: number): value is RotationFormat {
  return (ROTATION_FORMATS as readonly number[]).includes(value);
}

export function getRotationFormation(format: number): number[] {
  return ROTATION_FORMATIONS[format] ?? ROTATION_FORMATIONS[5];
}

export function formationLabel(shape: number[]): string {
  return shape.join('-');
}

export function getRotationShapes(format: number): number[][] {
  return ROTATION_SHAPES[format] ?? [getRotationFormation(format)];
}

export function parseRotationFormation(input: unknown, format: number): number[] {
  const fallback = getRotationFormation(format);
  if (!Array.isArray(input) || input.length < 2) return fallback;
  const rows = input.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);
  const total = rows.reduce((sum, n) => sum + n, 0);
  if (total !== format) return fallback;
  const allowed = getRotationShapes(format);
  const match = allowed.find((shape) => formationLabel(shape) === formationLabel(rows));
  return match ?? fallback;
}

function getPitchSlotRole(rowIndex: number, rowCount: number): PlayerPosition {
  if (rowIndex === 0) return 'GK';
  if (rowIndex === 1) return 'DEF';
  if (rowIndex === rowCount - 1) return 'FWD';
  return 'MID';
}

export function emptyRotationBoxes(): RotationBoxes {
  return { GK: [], DEF: [], MID: [], FWD: [] };
}

export function flattenRotation(boxes: RotationBoxes | undefined): Player[] {
  if (!boxes) return [];
  return ROTATION_SLOTS.flatMap((slot) => boxes[slot]);
}

export function rotationSlotRoles(format: number, shape?: number[]): PlayerPosition[] {
  const rows = parseRotationFormation(shape, format);
  const roles: PlayerPosition[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const role = getPitchSlotRole(rowIndex, rows.length);
    for (let i = 0; i < rows[rowIndex]; i++) roles.push(role);
  }
  return roles;
}

export function startersToRows(
  starters: Array<Player | null>,
  format: number,
  shape?: number[],
): Array<Array<Player | null>> {
  const rows = parseRotationFormation(shape, format);
  const result: Array<Array<Player | null>> = [];
  let offset = 0;
  for (const count of rows) {
    const row = starters.slice(offset, offset + count);
    while (row.length < count) row.push(null);
    result.push(row);
    offset += count;
  }
  return result;
}

function outfieldPositions(player: Player): PlayerPosition[] {
  const outfield = player.positions.filter((pos) => pos !== 'GK');
  return outfield.length > 0 ? outfield : player.positions;
}

export function preferredRotationSlot(player: Player): RotationSlot {
  const first = player.positions[0];
  if (first === 'GK' || first === 'DEF' || first === 'MID' || first === 'FWD') return first;
  return 'MID';
}

function fitScore(player: Player, role: PlayerPosition): number {
  if (role === 'GK') {
    if (player.positions[0] === 'GK') return 200;
    if (canPlayGoalkeeper(player)) return 140;
    if (player.positions[0] === 'DEF') return 15;
    return 0;
  }

  if (isGoalkeeperOnly(player)) return -80;

  const outfield = outfieldPositions(player);
  if (outfield[0] === role) return 100;
  if (outfield.includes(role)) return 70;
  if (role === 'DEF' && outfield.includes('MID')) return 40;
  if (role === 'MID' && outfield.includes('FWD')) return 45;
  if (role === 'MID' && outfield.includes('DEF')) return 35;
  if (role === 'FWD' && outfield.includes('MID')) return 50;
  return 10;
}

function pickBestForRole(pool: Player[], role: PlayerPosition): number {
  const avoidKeeperOnly = role !== 'GK' && pool.some((player) => !isGoalkeeperOnly(player));
  let bestIndex = 0;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < pool.length; i++) {
    const player = pool[i];
    if (avoidKeeperOnly && isGoalkeeperOnly(player)) continue;
    const score = fitScore(player, role);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function buildRotationLineup(
  players: Player[],
  format: RotationFormat,
  shape?: number[],
): { starters: Player[]; rotation: RotationBoxes } {
  const roles = rotationSlotRoles(format, shape);
  const pool = [...players];
  const starters: Player[] = [];

  for (const role of roles) {
    if (pool.length === 0) break;
    const index = pickBestForRole(pool, role);
    starters.push(pool.splice(index, 1)[0]);
  }

  const rotation = emptyRotationBoxes();
  for (const player of pool) {
    rotation[preferredRotationSlot(player)].push(player);
  }

  return { starters, rotation };
}

export function buildRotationMatchTeams(
  starters: Player[],
  rotation: RotationBoxes,
  starterName = 'Starting XI',
) {
  const bench = flattenRotation(rotation);
  return {
    teamA: buildGeneratedTeam(starterName, starters),
    teamB: buildGeneratedTeam(ROTATION_BENCH_NAME, bench),
    rotation,
  };
}

export function idsToRotationBoxes(
  playersById: Map<string, Player>,
  ids: Partial<Record<RotationSlot, string[]>>,
): RotationBoxes {
  const boxes = emptyRotationBoxes();
  for (const slot of ROTATION_SLOTS) {
    boxes[slot] = (ids[slot] ?? [])
      .map((id) => playersById.get(id))
      .filter((player): player is Player => Boolean(player));
  }
  return boxes;
}

export function rotationBoxesToIds(boxes: RotationBoxes): Record<RotationSlot, string[]> {
  return {
    GK: boxes.GK.map((player) => player.id),
    DEF: boxes.DEF.map((player) => player.id),
    MID: boxes.MID.map((player) => player.id),
    FWD: boxes.FWD.map((player) => player.id),
  };
}

export function collectRotationPlayerIds(starters: Player[], rotation: RotationBoxes): string[] {
  return [...starters.map((player) => player.id), ...flattenRotation(rotation).map((p) => p.id)];
}

export function hasDuplicateIds(ids: string[]): boolean {
  return new Set(ids).size !== ids.length;
}
