import { readFile } from 'node:fs/promises';
import {
  normalizePositions,
  type GeneratedTeam,
  type GroupMeta,
  type GroupPlayers,
  type GroupsIndex,
  type MatchRecord,
  type Player,
  type PlayerPosition,
} from '../../shared/types.js';
import { getSupabase, isSupabaseConfigured } from './supabase-client.js';
import {
  listMatchesLocal,
  listPlayerFilesLocal,
  purgeOldMatchesLocal,
  readJsonLocal,
  resolveLocalFilePath,
  deleteJsonLocal,
  uploadImageLocal,
  writeJsonLocal,
} from './local-storage.js';

const PLAYER_IMAGES_BUCKET = 'player-images';
const GROUPS_INDEX = 'groups/index.json';
const LEGACY_PLAYERS_FILE = 'players.json';

function useLocalStorage() {
  return !isSupabaseConfigured();
}

function groupPath(slug: string, ...parts: string[]) {
  return ['groups', slug, ...parts].join('/');
}

function playerFilePath(slug: string, playerId: string) {
  return groupPath(slug, 'players', `${playerId}.json`);
}

function playerImageApiPath(slug: string, playerId: string, extension: string) {
  return `/api/groups/${slug}/images/${playerId}.${extension}`;
}

function playerImageStoragePath(slug: string, playerId: string, extension: string) {
  return `${slug}/${playerId}.${extension}`;
}

function normalizePlayerRecord(player: Player): Player {
  const raw = player as Player & { position?: PlayerPosition };
  return {
    ...raw,
    positions: normalizePositions(raw.positions, raw.position),
  };
}

function sortPlayers(players: Player[]) {
  return [...players].sort((a, b) => a.name.localeCompare(b.name));
}

type PlayerRow = {
  id: string;
  group_slug: string;
  name: string;
  positions: string[];
  favourite_club: string;
  club_logo_url: string | null;
  photo_url: string | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
  ovr: number;
  created_at: string;
  updated_at: string;
};

type MatchRow = {
  id: string;
  group_slug: string;
  date: string;
  name?: string;
  format: number;
  selected_player_ids: string[];
  team_a: GeneratedTeam;
  team_b: GeneratedTeam;
  rating_difference: number;
};

function rowToPlayer(row: PlayerRow): Player {
  return normalizePlayerRecord({
    id: row.id,
    name: row.name,
    positions: row.positions as PlayerPosition[],
    favouriteClub: row.favourite_club,
    clubLogoUrl: row.club_logo_url,
    photoUrl: row.photo_url,
    pace: row.pace,
    shooting: row.shooting,
    passing: row.passing,
    dribbling: row.dribbling,
    defending: row.defending,
    physicality: row.physicality,
    ovr: row.ovr,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function playerToRow(slug: string, player: Player): PlayerRow {
  const record = normalizePlayerRecord(player);
  return {
    id: record.id,
    group_slug: slug,
    name: record.name,
    positions: record.positions,
    favourite_club: record.favouriteClub,
    club_logo_url: record.clubLogoUrl,
    photo_url: record.photoUrl,
    pace: record.pace,
    shooting: record.shooting,
    passing: record.passing,
    dribbling: record.dribbling,
    defending: record.defending,
    physicality: record.physicality,
    ovr: record.ovr,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

function rowToMatch(row: MatchRow): MatchRecord {
  return {
    id: row.id,
    groupSlug: row.group_slug,
    date: row.date,
    name: row.name ?? '',
    format: row.format,
    selectedPlayerIds: row.selected_player_ids,
    teamA: row.team_a,
    teamB: row.team_b,
    ratingDifference: Number(row.rating_difference),
  };
}

function matchToRow(record: MatchRecord) {
  return {
    id: record.id,
    group_slug: record.groupSlug,
    date: record.date,
    name: record.name,
    format: record.format,
    selected_player_ids: record.selectedPlayerIds,
    team_a: record.teamA,
    team_b: record.teamB,
    rating_difference: record.ratingDifference,
  };
}

// --- Local JSON fallback (dev without Supabase) ---

async function listPlayerRecordsLocal(slug: string): Promise<Player[]> {
  const files = await listPlayerFilesLocal(slug);
  const players = await Promise.all(
    files.map(async (file) => {
      const data = await readJsonLocal<Player>(`groups/${slug}/players/${file}`);
      return data ? normalizePlayerRecord(data) : null;
    }),
  );
  return players.filter((p): p is Player => p !== null);
}

async function getGroupPlayersLocal(slug: string): Promise<GroupPlayers> {
  const fromFiles = await listPlayerRecordsLocal(slug);
  if (fromFiles.length > 0) {
    return { players: sortPlayers(fromFiles) };
  }

  const legacy = await readJsonLocal<GroupPlayers>(groupPath(slug, LEGACY_PLAYERS_FILE));
  return { players: sortPlayers((legacy?.players ?? []).map(normalizePlayerRecord)) };
}

// --- Public API ---

export async function getGroupsIndex(): Promise<GroupsIndex> {
  if (useLocalStorage()) {
    const index = await readJsonLocal<GroupsIndex>(GROUPS_INDEX);
    return index ?? { groups: [] };
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('groups')
    .select('slug, name, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return {
    groups: (data ?? []).map((row) => ({
      slug: row.slug,
      name: row.name,
      createdAt: row.created_at,
    })),
  };
}

export async function saveGroupMeta(meta: GroupMeta) {
  if (useLocalStorage()) {
    await writeJsonLocal(groupPath(meta.slug, 'meta.json'), meta);
    const index = (await readJsonLocal<GroupsIndex>(GROUPS_INDEX)) ?? { groups: [] };
    if (!index.groups.some((g) => g.slug === meta.slug)) {
      index.groups.push(meta);
      await writeJsonLocal(GROUPS_INDEX, index);
    }
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('groups').insert({
    slug: meta.slug,
    name: meta.name,
    created_at: meta.createdAt,
  });

  if (error) throw error;
}

export async function getGroupMeta(slug: string): Promise<GroupMeta | null> {
  if (useLocalStorage()) {
    return readJsonLocal<GroupMeta>(groupPath(slug, 'meta.json'));
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('groups')
    .select('slug, name, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    slug: data.slug,
    name: data.name,
    createdAt: data.created_at,
  };
}

export async function getGroupPlayers(slug: string): Promise<GroupPlayers> {
  if (useLocalStorage()) {
    return getGroupPlayersLocal(slug);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('group_slug', slug)
    .order('name', { ascending: true });

  if (error) throw error;
  return { players: (data ?? []).map((row) => rowToPlayer(row as PlayerRow)) };
}

export async function savePlayerRecord(slug: string, player: Player) {
  const record = normalizePlayerRecord(player);

  if (useLocalStorage()) {
    await writeJsonLocal(playerFilePath(slug, record.id), record);
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('players').upsert(playerToRow(slug, record));
  if (error) throw error;
}

export async function deletePlayerRecord(slug: string, playerId: string) {
  if (useLocalStorage()) {
    await deleteJsonLocal(playerFilePath(slug, playerId));
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('group_slug', slug)
    .eq('id', playerId);

  if (error) throw error;
}

export async function saveGroupPlayers(_slug: string, _data: GroupPlayers) {
  void _slug;
  void _data;
}

export async function uploadPlayerImage(
  slug: string,
  playerId: string,
  file: File | Blob,
  extension: string,
) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (useLocalStorage()) {
    return uploadImageLocal(slug, playerId, buffer, extension);
  }

  const supabase = getSupabase();
  const path = playerImageStoragePath(slug, playerId, extension);
  const contentType =
    extension === 'jpg' || extension === 'jpeg'
      ? 'image/jpeg'
      : extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : extension === 'gif'
            ? 'image/gif'
            : 'application/octet-stream';

  const { error } = await supabase.storage.from(PLAYER_IMAGES_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) throw error;
  return playerImageApiPath(slug, playerId, extension);
}

export async function serveGroupImage(
  slug: string,
  filename: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  if (filename.includes('..') || filename.includes('/')) return null;

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  const contentType = types[ext] ?? 'application/octet-stream';

  if (useLocalStorage()) {
    const filePath = resolveLocalFilePath(groupPath(slug, 'images', filename));
    if (!filePath) return null;
    try {
      const body = await readFile(filePath);
      return { body, contentType };
    } catch {
      return null;
    }
  }

  const supabase = getSupabase();
  const path = `${slug}/${filename}`;
  const { data, error } = await supabase.storage.from(PLAYER_IMAGES_BUCKET).download(path);
  if (error || !data) return null;

  const body = Buffer.from(await data.arrayBuffer());
  return { body, contentType };
}

export async function saveMatch(record: MatchRecord) {
  if (useLocalStorage()) {
    await writeJsonLocal(
      groupPath(record.groupSlug, 'matches', `${record.id}.json`),
      record,
    );
    return;
  }

  const supabase = getSupabase();
  const { error } = await supabase.from('matches').insert(matchToRow(record));
  if (error) throw error;
}

export async function listMatches(slug: string): Promise<MatchRecord[]> {
  if (useLocalStorage()) return listMatchesLocal(slug);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('group_slug', slug)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToMatch(row as MatchRow));
}

export async function getMatch(slug: string, matchId: string): Promise<MatchRecord | null> {
  if (useLocalStorage()) {
    return readJsonLocal<MatchRecord>(groupPath(slug, 'matches', `${matchId}.json`));
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('group_slug', slug)
    .eq('id', matchId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToMatch(data as MatchRow) : null;
}

export async function purgeOldMatches(days = 30) {
  if (useLocalStorage()) return purgeOldMatchesLocal(days);

  const supabase = getSupabase();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('matches')
    .delete()
    .lt('date', cutoff)
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}

export async function groupExists(slug: string): Promise<boolean> {
  const meta = await getGroupMeta(slug);
  return meta !== null;
}
