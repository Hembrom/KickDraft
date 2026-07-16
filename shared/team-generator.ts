import type { GeneratedTeam, Player } from './types.js';
import { calculateOvr, canPlayGoalkeeper, roundRating } from './types.js';

/** Target avg OVR advantage for the smaller team in uneven splits (e.g. 6v5). */
const UNEVEN_AVG_HANDICAP = 4;

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildTeam(name: string, players: Player[]): GeneratedTeam {
  const totalRating = players.reduce((sum, p) => sum + p.ovr, 0);
  return {
    name,
    players,
    totalRating: roundRating(totalRating),
    averageRating: players.length ? roundRating(totalRating / players.length) : 0,
  };
}

function assignGoalkeepers(
  players: Player[],
  teamAPlayers: Player[],
  teamBPlayers: Player[],
): Player[] {
  const gkPool = shuffle(players.filter(canPlayGoalkeeper));
  const outfieldPool = players.filter((player) => !canPlayGoalkeeper(player));

  if (gkPool.length > 0) {
    teamAPlayers.push(gkPool.shift()!);
  }
  if (gkPool.length > 0) {
    teamBPlayers.push(gkPool.shift()!);
  }

  return [...outfieldPool, ...gkPool];
}

/** OVR band width when shuffling draft order — nearby ratings can swap for variety. */
const DRAFT_OVR_BAND = 3;

/** Highest OVR first; shuffle within bands so shuffle-again produces different valid lineups. */
function sortPlayersForDraft(players: Player[]): Player[] {
  const sorted = [...players].sort((a, b) => b.ovr - a.ovr);

  const bands: Player[][] = [];
  for (const player of sorted) {
    const lastBand = bands[bands.length - 1];
    if (!lastBand || lastBand[0].ovr - player.ovr > DRAFT_OVR_BAND) {
      bands.push([player]);
    } else {
      lastBand.push(player);
    }
  }

  return bands.flatMap((band) => shuffle(band));
}

/**
 * Bookend draft for equal sides only (6v6, 7v7, …).
 * Alternates strong pairs then weak pairs so low-rated players split early.
 */
function distributeByBookendDraft(
  players: Player[],
  teamAPlayers: Player[],
  teamBPlayers: Player[],
  teamASize: number,
  teamBSize: number,
): void {
  if (teamASize !== teamBSize) {
    throw new Error('Bookend draft requires equal team sizes');
  }

  const pool = sortPlayersForDraft(players);
  let pickFromTop = Math.random() < 0.5;
  const aFirstInPair = Math.random() < 0.5;

  function assignToTeam(player: Player, slot: number): void {
    const preferA = aFirstInPair ? slot === 0 : slot === 1;

    if (preferA && teamAPlayers.length < teamASize) {
      teamAPlayers.push(player);
    } else if (!preferA && teamBPlayers.length < teamBSize) {
      teamBPlayers.push(player);
    } else if (teamAPlayers.length < teamASize) {
      teamAPlayers.push(player);
    } else {
      teamBPlayers.push(player);
    }
  }

  function pushPair(fromTop: boolean): void {
    for (let slot = 0; slot < 2 && pool.length > 0; slot++) {
      const player = fromTop ? pool.shift()! : pool.pop()!;
      assignToTeam(player, slot);
    }
  }

  while (pool.length > 0) {
    pushPair(pickFromTop);
    pickFromTop = !pickFromTop;
  }
}

function teamAverage(team: Player[]): number {
  return team.reduce((sum, player) => sum + player.ovr, 0) / team.length;
}

function teamTotal(team: Player[]): number {
  return team.reduce((sum, player) => sum + player.ovr, 0);
}

function optimizeEvenBalance(teamAPlayers: Player[], teamBPlayers: Player[]): void {
  const maxIterations = teamAPlayers.length * teamBPlayers.length;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const diff = teamTotal(teamAPlayers) - teamTotal(teamBPlayers);
    const absDiff = Math.abs(diff);
    if (absDiff === 0) break;

    let best: { ai: number; bi: number; newAbsDiff: number } | null = null;

    for (let ai = 0; ai < teamAPlayers.length; ai++) {
      for (let bi = 0; bi < teamBPlayers.length; bi++) {
        const playerA = teamAPlayers[ai];
        const playerB = teamBPlayers[bi];
        if (!canSwapPlayers(playerA, playerB, teamAPlayers, teamBPlayers)) continue;

        const newDiff = diff - 2 * (playerA.ovr - playerB.ovr);
        const newAbsDiff = Math.abs(newDiff);

        if (newAbsDiff < absDiff && (!best || newAbsDiff < best.newAbsDiff)) {
          best = { ai, bi, newAbsDiff };
        }
      }
    }

    if (!best) break;

    const swappedA = teamAPlayers[best.ai];
    teamAPlayers[best.ai] = teamBPlayers[best.bi];
    teamBPlayers[best.bi] = swappedA;
  }
}

/** Random valid cross-team swap so shuffle-again can produce different but still balanced lineups. */
function injectLineupVariety(teamAPlayers: Player[], teamBPlayers: Player[]): void {
  const diff = teamTotal(teamAPlayers) - teamTotal(teamBPlayers);
  const absDiff = Math.abs(diff);
  const slack = 2;

  const options: { ai: number; bi: number }[] = [];
  for (let ai = 0; ai < teamAPlayers.length; ai++) {
    for (let bi = 0; bi < teamBPlayers.length; bi++) {
      const playerA = teamAPlayers[ai];
      const playerB = teamBPlayers[bi];
      if (!canSwapPlayers(playerA, playerB, teamAPlayers, teamBPlayers)) continue;

      const newDiff = diff - 2 * (playerA.ovr - playerB.ovr);
      if (Math.abs(newDiff) <= absDiff + slack) {
        options.push({ ai, bi });
      }
    }
  }

  if (options.length === 0) return;

  const pick = options[Math.floor(Math.random() * options.length)]!;
  const swappedA = teamAPlayers[pick.ai];
  teamAPlayers[pick.ai] = teamBPlayers[pick.bi];
  teamBPlayers[pick.bi] = swappedA;
}

function isSoleGoalkeeperOnTeam(player: Player, team: Player[]): boolean {
  if (!canPlayGoalkeeper(player)) return false;
  return team.filter(canPlayGoalkeeper).length === 1;
}

function canSwapPlayers(
  smallPlayer: Player,
  largePlayer: Player,
  smallTeam: Player[],
  largeTeam: Player[],
): boolean {
  if (isSoleGoalkeeperOnTeam(smallPlayer, smallTeam)) return false;
  if (isSoleGoalkeeperOnTeam(largePlayer, largeTeam)) return false;
  return true;
}

function draftUnevenAlternating(
  players: Player[],
  smallTeam: Player[],
  largeTeam: Player[],
  smallCap: number,
  largeCap: number,
): void {
  const pool = [...players].sort((a, b) => b.ovr - a.ovr);
  let pickSmall = true;

  for (const player of pool) {
    const smallFull = smallTeam.length >= smallCap;
    const largeFull = largeTeam.length >= largeCap;
    if (smallFull && largeFull) break;

    if (pickSmall && !smallFull) {
      smallTeam.push(player);
    } else if (!largeFull) {
      largeTeam.push(player);
    } else {
      smallTeam.push(player);
    }

    if (!smallFull && !largeFull) {
      pickSmall = !pickSmall;
    }
  }
}

function optimizeUnevenHandicap(
  smallTeam: Player[],
  largeTeam: Player[],
  targetGap: number,
): void {
  const maxIterations = smallTeam.length * largeTeam.length;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const gap = teamAverage(smallTeam) - teamAverage(largeTeam);
    if (gap >= targetGap) break;

    let best: { si: number; li: number; newGap: number } | null = null;

    for (let si = 0; si < smallTeam.length; si++) {
      for (let li = 0; li < largeTeam.length; li++) {
        const smallPlayer = smallTeam[si];
        const largePlayer = largeTeam[li];
        if (largePlayer.ovr <= smallPlayer.ovr) continue;
        if (!canSwapPlayers(smallPlayer, largePlayer, smallTeam, largeTeam)) continue;

        const newSmallAvg =
          teamAverage(smallTeam) + (largePlayer.ovr - smallPlayer.ovr) / smallTeam.length;
        const newLargeAvg =
          teamAverage(largeTeam) + (smallPlayer.ovr - largePlayer.ovr) / largeTeam.length;
        const newGap = newSmallAvg - newLargeAvg;

        if (newGap > gap && (!best || newGap > best.newGap)) {
          best = { si, li, newGap };
        }
      }
    }

    if (!best) break;

    const swappedSmall = smallTeam[best.si];
    smallTeam[best.si] = largeTeam[best.li];
    largeTeam[best.li] = swappedSmall;
  }
}

/** Equal sides (12 → 6v6, 14 → 7v7): bookend draft + total-balance swaps. */
function generateEvenTeams(
  players: Player[],
  teamASize: number,
  teamBSize: number,
): TeamGenerationResult {
  if (teamASize !== teamBSize) {
    throw new Error('Even team generation requires equal team sizes');
  }

  const teamAPlayers: Player[] = [];
  const teamBPlayers: Player[] = [];
  const remaining = assignGoalkeepers(players, teamAPlayers, teamBPlayers);
  distributeByBookendDraft(remaining, teamAPlayers, teamBPlayers, teamASize, teamBSize);
  optimizeEvenBalance(teamAPlayers, teamBPlayers);
  injectLineupVariety(teamAPlayers, teamBPlayers);

  const teamA = buildTeam('Team A', teamAPlayers);
  const teamB = buildTeam('Team B', teamBPlayers);
  const ratingDifference = roundRating(Math.abs(teamA.totalRating - teamB.totalRating));

  return { teamA, teamB, ratingDifference };
}

/** Uneven sides (11 → 6v5, 13 → 7v6): alternating draft + avg-OVR handicap for smaller team. */
function generateUnevenTeams(
  players: Player[],
  teamASize: number,
  teamBSize: number,
): TeamGenerationResult {
  if (teamASize === teamBSize) {
    throw new Error('Uneven team generation requires different team sizes');
  }

  const teamAPlayers: Player[] = [];
  const teamBPlayers: Player[] = [];
  const remaining = assignGoalkeepers(players, teamAPlayers, teamBPlayers);

  const smallIsA = teamASize < teamBSize;
  const smallTeam = smallIsA ? teamAPlayers : teamBPlayers;
  const largeTeam = smallIsA ? teamBPlayers : teamAPlayers;
  const smallCap = Math.min(teamASize, teamBSize);
  const largeCap = Math.max(teamASize, teamBSize);

  draftUnevenAlternating(remaining, smallTeam, largeTeam, smallCap, largeCap);
  optimizeUnevenHandicap(smallTeam, largeTeam, UNEVEN_AVG_HANDICAP);
  injectLineupVariety(teamAPlayers, teamBPlayers);

  const teamA = buildTeam('Team A', teamAPlayers);
  const teamB = buildTeam('Team B', teamBPlayers);
  const ratingDifference = roundRating(Math.abs(teamA.totalRating - teamB.totalRating));

  return { teamA, teamB, ratingDifference };
}

export interface TeamGenerationResult {
  teamA: GeneratedTeam;
  teamB: GeneratedTeam;
  ratingDifference: number;
}

export function generateBalancedTeams(
  players: Player[],
  teamASize: number,
  teamBSize: number,
): TeamGenerationResult {
  const total = teamASize + teamBSize;
  if (players.length !== total) {
    throw new Error(`Need exactly ${total} players for ${teamASize}v${teamBSize}`);
  }

  // Even player count → equal sides (bookend). Odd count → uneven sides (handicap).
  // e.g. 12 → 6v6, 14 → 7v7 | 11 → 6v5, 13 → 7v6
  if (teamASize === teamBSize) {
    return generateEvenTeams(players, teamASize, teamBSize);
  }

  return generateUnevenTeams(players, teamASize, teamBSize);
}

export function withRecalculatedOvr(player: Omit<Player, 'ovr'> & { ovr?: number }): Player {
  const ovr = calculateOvr(player);
  return { ...player, ovr };
}
