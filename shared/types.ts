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

export function suggestFormat(playerCount: number): number | null {
  if (playerCount < 4 || playerCount % 2 !== 0) return null;
  return playerCount / 2;
}

/** Largest supported format that fits the full squad (e.g. 11 players → 5v5). */
export function suggestFormatFromRoster(playerCount: number): number | null {
  if (playerCount < MATCH_FORMATS[0] * 2) return null;
  const maxTeamSize = Math.floor(playerCount / 2);
  for (let i = MATCH_FORMATS.length - 1; i >= 0; i--) {
    const format = MATCH_FORMATS[i];
    if (format <= maxTeamSize) return format;
  }
  return null;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
