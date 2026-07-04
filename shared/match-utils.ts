import { normalizePlayer, type MatchRecord, type Player, type PlayerPosition } from './types';

export function enrichMatchWithRoster(match: MatchRecord, roster: Player[]): MatchRecord {
  const byId = new Map(roster.map((player) => [player.id, normalizePlayer(player)]));

  const enrichPlayers = (snapshots: Player[]) =>
    snapshots.map((snapshot) => {
      const current = byId.get(snapshot.id);
      if (!current) return normalizePlayer(snapshot);
      return { ...normalizePlayer(snapshot), ...current };
    });

  return {
    ...match,
    teamA: { ...match.teamA, players: enrichPlayers(match.teamA.players) },
    teamB: { ...match.teamB, players: enrichPlayers(match.teamB.players) },
  };
}

export function getPitchDisplayPosition(
  player: Player,
  slotRole: PlayerPosition,
): PlayerPosition {
  if (slotRole === 'GK') {
    return player.positions.includes('GK') ? 'GK' : slotRole;
  }
  if (player.positions.includes(slotRole)) return slotRole;
  return player.positions[0] ?? slotRole;
}
