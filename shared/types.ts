export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
}

export interface Player extends PlayerStats {
  id: string;
  name: string;
  positions: PlayerPosition[];
  photoUrl: string | null;
  favouriteClub: string;
  clubLogoUrl: string | null;
  ovr: number;
  createdAt: string;
  updatedAt: string;
}

export const MAX_PLAYER_POSITIONS = 2;

export const PLAYER_POSITIONS = [
  { value: 'GK', label: 'Goalkeeper', short: 'GK' },
  { value: 'DEF', label: 'Defender', short: 'DEF' },
  { value: 'MID', label: 'Midfielder', short: 'MID' },
  { value: 'FWD', label: 'Forward', short: 'FWD' },
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number]['value'];

export function isPlayerPosition(value: string): value is PlayerPosition {
  return PLAYER_POSITIONS.some((p) => p.value === value);
}

export function getPositionLabel(position: string | undefined): string {
  const match = PLAYER_POSITIONS.find((p) => p.value === position);
  return match?.label ?? 'Midfielder';
}

export function normalizePositions(
  input: unknown,
  legacySingle?: string,
): PlayerPosition[] {
  const unique: PlayerPosition[] = [];

  const add = (value: string | undefined) => {
    if (value && isPlayerPosition(value) && !unique.includes(value)) {
      unique.push(value);
    }
  };

  if (Array.isArray(input)) {
    for (const value of input) {
      if (typeof value === 'string') add(value);
      if (unique.length >= MAX_PLAYER_POSITIONS) break;
    }
  } else if (typeof input === 'string') {
    add(input);
  }

  if (unique.length === 0) add(legacySingle);
  if (unique.length === 0) return ['MID'];

  return unique.slice(0, MAX_PLAYER_POSITIONS);
}

export function canPlayGoalkeeper(player: Player): boolean {
  return player.positions.includes('GK');
}

export function isGoalkeeperOnly(player: Player): boolean {
  return player.positions.length === 1 && player.positions[0] === 'GK';
}

export function getPositionsLabel(positions: PlayerPosition[]): string {
  return positions.map((position) => getPositionLabel(position)).join(' / ');
}

type LegacyPlayer = Partial<Player> & { position?: PlayerPosition };

export function normalizePlayer(player: LegacyPlayer): Player {
  const { position: legacyPosition, ...rest } = player;
  return {
    ...(rest as Player),
    positions: normalizePositions(player.positions, legacyPosition),
  };
}

export interface GroupMeta {
  slug: string;
  name: string;
  createdAt: string;
}

export interface GroupsIndex {
  groups: GroupMeta[];
}

export interface GroupPlayers {
  players: Player[];
}

export interface GeneratedTeam {
  name: string;
  players: Player[];
  totalRating: number;
  averageRating: number;
}

export interface MatchRecord {
  id: string;
  groupSlug: string;
  date: string;
  /** User label e.g. "July 7 - Suresh" */
  name: string;
  format: number;
  selectedPlayerIds: string[];
  teamA: GeneratedTeam;
  teamB: GeneratedTeam;
  ratingDifference: number;
}

export const STAT_KEYS: (keyof PlayerStats)[] = [
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physicality',
];

export const MATCH_FORMATS = [5, 6, 7, 8, 9, 10, 11] as const;
export type MatchFormat = (typeof MATCH_FORMATS)[number];

export function roundRating(value: number): number {
  return Math.round(value);
}

/** Human-readable label for how far apart the two teams' total OVR is. */
export function formatRatingGap(difference: number): string {
  return `${roundRating(difference)} OVR gap`;
}

export function calculateOvr(stats: PlayerStats): number {
  const sum =
    stats.pace +
    stats.shooting +
    stats.passing +
    stats.dribbling +
    stats.defending +
    stats.physicality;
  return roundRating(sum / 6);
}

export function resolveTeamSizes(
  format: number,
  playerCount: number,
): { teamASize: number; teamBSize: number } | null {
  if (format < MATCH_FORMATS[0] || format > MATCH_FORMATS[MATCH_FORMATS.length - 1]) {
    return null;
  }
  if (playerCount < format * 2 - 1 || playerCount > format * 2 + 1) {
    return null;
  }
  if (playerCount === format * 2) {
    return { teamASize: format, teamBSize: format };
  }
  if (playerCount > format * 2) {
    return { teamASize: format, teamBSize: format + 1 };
  }
  return { teamASize: format - 1, teamBSize: format };
}

export function getMatchSizeLabel(teamASize: number, teamBSize: number): string {
  return `${teamASize}v${teamBSize}`;
}

/** Derive sides from headcount — 11 players → 6v5, 12 → 6v6, etc. */
export function teamSizesFromPlayerCount(
  playerCount: number,
): { teamASize: number; teamBSize: number } | null {
  const minPlayers = 9;
  const maxPlayers = 22;
  if (playerCount < minPlayers || playerCount > maxPlayers) return null;
  const teamBSize = Math.floor(playerCount / 2);
  const teamASize = playerCount - teamBSize;
  return { teamASize, teamBSize };
}

export function formatFromPlayerCount(playerCount: number): number | null {
  const sizes = teamSizesFromPlayerCount(playerCount);
  if (!sizes) return null;
  return Math.max(sizes.teamASize, sizes.teamBSize);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
