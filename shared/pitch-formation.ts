import type { Player, PlayerPosition } from './types';

/** Rows from goal line to attack (GK → outfield). */
const FORMATIONS: Record<number, number[]> = {
  5: [1, 2, 2],
  6: [1, 3, 2],
  7: [1, 3, 3],
  8: [1, 2, 3, 1],
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

function outfieldPositions(player: Player): PlayerPosition[] {
  const outfield = player.positions.filter((pos) => pos !== 'GK');
  return outfield.length > 0 ? outfield : player.positions;
}

/** Higher score = better fit for this row (defenders behind GK, forwards up front). */
function fitScoreForRow(player: Player, rowIndex: number, rowCount: number): number {
  const role = getPitchSlotRole(rowIndex, rowCount);
  const positions = outfieldPositions(player);
  if (positions.includes(role)) return 100;

  if (role === 'DEF') {
    if (positions.includes('MID')) return 50;
    return 10;
  }
  if (role === 'MID') {
    if (positions.includes('DEF')) return 30;
    if (positions.includes('FWD')) return 40;
    return 10;
  }
  if (role === 'FWD') {
    if (positions.includes('MID')) return 60;
    if (positions.includes('DEF')) return 5;
    return 10;
  }
  return 0;
}

function pickBestForRow(
  pool: Player[],
  candidates: Player[],
  rowIndex: number,
  rowCount: number,
): number {
  let bestIndex = -1;
  let bestScore = -1;
  for (let i = 0; i < pool.length; i++) {
    const player = pool[i];
    if (!candidates.includes(player)) continue;
    const score = fitScoreForRow(player, rowIndex, rowCount);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  if (bestIndex !== -1) return bestIndex;
  return pool.findIndex((player) => candidates.includes(player));
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
  if (rowIndex === 1) return 'DEF';
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
      const pickIndex = pickBestForRow(pool, candidates, rowIndex, rows.length);

      result[rowIndex].push(takeAt(pickIndex));
    }
  }

  if (pool.length > 0) {
    result[result.length - 1].push(...pool);
  }

  return result;
}
