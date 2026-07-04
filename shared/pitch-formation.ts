import type { Player, PlayerPosition } from './types';

/** Rows from goal line to attack, e.g. 5-a-side = [1 GK, 2 mid, 2 fwd] */
const FORMATIONS: Record<number, number[]> = {
  5: [1, 2, 2],
  6: [1, 2, 3],
  7: [1, 3, 3],
  8: [1, 3, 4],
  9: [1, 4, 4],
  10: [1, 4, 5],
  11: [1, 4, 4, 2],
};

function isGoalkeeper(player: Player): boolean {
  return player.positions.includes('GK');
}

function isGoalkeeperOnly(player: Player): boolean {
  return player.positions.length === 1 && player.positions[0] === 'GK';
}

function preferredRow(position: PlayerPosition, rowCount: number): number {
  if (position === 'GK') return 0;
  if (position === 'DEF') return Math.min(1, rowCount - 1);
  if (position === 'FWD') return rowCount - 1;
  return Math.floor(rowCount / 2);
}

function bestPreferredRow(player: Player, rowCount: number): number {
  const outfield = player.positions.filter((pos) => pos !== 'GK');
  const positions = outfield.length > 0 ? outfield : player.positions;
  return Math.min(...positions.map((pos) => preferredRow(pos, rowCount)));
}

function pickBestForRow(pool: Player[], rowIndex: number, rowCount: number): number {
  const preferred = pool.findIndex((player) => bestPreferredRow(player, rowCount) === rowIndex);
  if (preferred !== -1) return preferred;
  return 0;
}

function pickGoalkeeperIndex(pool: Player[]): number {
  const primary = pool.findIndex((player) => player.positions[0] === 'GK');
  if (primary !== -1) return primary;

  const secondary = pool.findIndex(isGoalkeeper);
  return secondary;
}

function outfieldCandidates(pool: Player[], gkSlotFilled: boolean): Player[] {
  if (!gkSlotFilled) return pool;

  const hasOutfield = pool.some((player) => !isGoalkeeperOnly(player) && !isGoalkeeper(player));
  if (!hasOutfield) return pool;

  return pool.filter((player) => {
    if (isGoalkeeperOnly(player)) return false;
    if (isGoalkeeper(player)) return false;
    return true;
  });
}

export function getFormationLabel(teamSize: number): string {
  const rows = FORMATIONS[teamSize];
  return rows ? rows.join('-') : `${teamSize}`;
}

export function getPitchSlotRole(rowIndex: number, rowCount: number): PlayerPosition {
  if (rowIndex === 0) return 'GK';
  if (rowCount >= 4) {
    if (rowIndex === 1) return 'DEF';
    if (rowIndex === rowCount - 1) return 'FWD';
    return 'MID';
  }
  if (rowIndex === rowCount - 1) return 'FWD';
  return 'MID';
}

export function assignPitchRows(players: Player[], teamSize: number): Player[][] {
  const rows = FORMATIONS[teamSize] ?? [1, ...Array(teamSize - 1).fill(1)];
  const result: Player[][] = rows.map(() => []);
  const pool = [...players];

  const takeAt = (index: number) => pool.splice(index, 1)[0];

  const gkIndex = pickGoalkeeperIndex(pool);
  if (gkIndex !== -1) {
    result[0].push(takeAt(gkIndex));
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    while (result[rowIndex].length < rows[rowIndex] && pool.length > 0) {
      if (rowIndex === 0 && result[0].length === 0) {
        const defIndex = pool.findIndex((player) => player.positions.includes('DEF'));
        result[0].push(takeAt(defIndex !== -1 ? defIndex : 0));
        continue;
      }

      const gkSlotFilled = result[0].some(isGoalkeeper);
      const candidates = outfieldCandidates(pool, gkSlotFilled);
      const pickInPool = (predicate: (player: Player) => boolean) =>
        pool.findIndex((player) => candidates.includes(player) && predicate(player));

      let pickIndex = pickInPool(
        (player) => bestPreferredRow(player, rows.length) === rowIndex,
      );
      if (pickIndex === -1) {
        pickIndex = pool.findIndex((player) => candidates.includes(player));
      }
      if (pickIndex === -1) {
        pickIndex = pickBestForRow(pool, rowIndex, rows.length);
      }

      result[rowIndex].push(takeAt(pickIndex));
    }
  }

  if (pool.length > 0) {
    result[result.length - 1].push(...pool);
  }

  return result;
}
