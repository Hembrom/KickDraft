import type { GeneratedTeam, Player } from './types.js';
import { calculateOvr, canPlayGoalkeeper, roundRating } from './types.js';

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

function distributeByRatingTiers(
  players: Player[],
  teamAPlayers: Player[],
  teamBPlayers: Player[],
  teamASize: number,
  teamBSize: number,
): void {
  const sorted = [...players].sort((a, b) => b.ovr - a.ovr);

  const tiers: Player[][] = [];
  for (const player of sorted) {
    const lastTier = tiers[tiers.length - 1];
    if (!lastTier || lastTier[0].ovr !== player.ovr) {
      tiers.push([player]);
    } else {
      lastTier.push(player);
    }
  }

  const shuffledTiers = tiers.map((tier) => shuffle(tier));

  shuffledTiers.forEach((tier, tierIndex) => {
    tier.forEach((player, i) => {
      const pickA =
        tierIndex % 2 === 0
          ? i % 2 === 0
          : i % 2 === 1;

      if (pickA && teamAPlayers.length < teamASize) {
        teamAPlayers.push(player);
      } else if (!pickA && teamBPlayers.length < teamBSize) {
        teamBPlayers.push(player);
      } else if (teamAPlayers.length < teamASize) {
        teamAPlayers.push(player);
      } else {
        teamBPlayers.push(player);
      }
    });
  });
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

  const teamAPlayers: Player[] = [];
  const teamBPlayers: Player[] = [];

  const gkPool = shuffle(players.filter(canPlayGoalkeeper));
  const outfieldPool = players.filter((player) => !canPlayGoalkeeper(player));

  if (gkPool.length > 0 && teamASize > 0) {
    teamAPlayers.push(gkPool.shift()!);
  }
  if (gkPool.length > 0 && teamBSize > 0) {
    teamBPlayers.push(gkPool.shift()!);
  }

  const remaining = [...outfieldPool, ...gkPool];
  distributeByRatingTiers(remaining, teamAPlayers, teamBPlayers, teamASize, teamBSize);

  const teamA = buildTeam('Team A', teamAPlayers);
  const teamB = buildTeam('Team B', teamBPlayers);
  const ratingDifference = roundRating(Math.abs(teamA.totalRating - teamB.totalRating));

  return { teamA, teamB, ratingDifference };
}

export function withRecalculatedOvr(player: Omit<Player, 'ovr'> & { ovr?: number }): Player {
  const ovr = calculateOvr(player);
  return { ...player, ovr };
}
