import { del, head, list, put } from '@vercel/blob';
import { normalizePositions, type Player, type PlayerPosition } from '../../shared/types.js';
import {
  listMatchesLocal,
  purgeOldMatchesLocal,
  readJsonLocal,
  uploadImageLocal,
  writeJsonLocal,
} from './local-storage.js';

const GROUPS_INDEX = 'groups/index.json';

function useLocalStorage() {
  // Local disk is only for offline dev. Vercel Blob uses BLOB_READ_WRITE_TOKEN
  // locally, or BLOB_STORE_ID + OIDC on deployed Vercel functions.
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    return false;
  }
  if (process.env.VERCEL) {
    return false;
  }
  return true;
}

function groupPath(slug: string, ...parts: string[]) {
  return ['groups', slug, ...parts].join('/');
}

export async function readJsonBlob<T>(pathname: string): Promise<T | null> {
  if (useLocalStorage()) return readJsonLocal<T>(pathname);

  try {
    const meta = await head(pathname);
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function writeJsonBlob(pathname: string, data: unknown) {
  if (useLocalStorage()) {
    await writeJsonLocal(pathname, data);
    return;
  }

  await put(pathname, JSON.stringify(data, null, 2), {
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}

export async function getGroupsIndex(): Promise<GroupsIndex> {
  const index = await readJsonBlob<GroupsIndex>(GROUPS_INDEX);
  return index ?? { groups: [] };
}

export async function saveGroupsIndex(index: GroupsIndex) {
  await writeJsonBlob(GROUPS_INDEX, index);
}

export async function getGroupMeta(slug: string): Promise<GroupMeta | null> {
  return readJsonBlob<GroupMeta>(groupPath(slug, 'meta.json'));
}

export async function saveGroupMeta(meta: GroupMeta) {
  await writeJsonBlob(groupPath(meta.slug, 'meta.json'), meta);
}

export async function getGroupPlayers(slug: string): Promise<GroupPlayers> {
  const data = await readJsonBlob<GroupPlayers>(groupPath(slug, 'players.json'));
  const players = (data?.players ?? []).map((player) => {
    const raw = player as Player & { position?: PlayerPosition };
    return {
      ...raw,
      positions: normalizePositions(raw.positions, raw.position),
    };
  });
  return { players };
}

export async function saveGroupPlayers(slug: string, data: GroupPlayers) {
  await writeJsonBlob(groupPath(slug, 'players.json'), data);
}

export async function uploadPlayerImage(
  slug: string,
  playerId: string,
  file: File | Blob,
  extension: string,
) {
  const pathname = groupPath(slug, 'images', `${playerId}.${extension}`);

  if (useLocalStorage()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return uploadImageLocal(slug, playerId, buffer, extension);
  }

  const blob = await put(pathname, file, {
    access: 'public',
    allowOverwrite: true,
  });
  return blob.url;
}

export async function saveMatch(record: MatchRecord) {
  await writeJsonBlob(
    groupPath(record.groupSlug, 'matches', `${record.id}.json`),
    record,
  );
}

export async function listMatches(slug: string): Promise<MatchRecord[]> {
  if (useLocalStorage()) return listMatchesLocal(slug);

  const prefix = groupPath(slug, 'matches');
  const { blobs } = await list({ prefix });

  const matches = await Promise.all(
    blobs.map(async (blob) => {
      const res = await fetch(blob.url);
      if (!res.ok) return null;
      return (await res.json()) as MatchRecord;
    }),
  );

  return matches
    .filter((m): m is MatchRecord => m !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function purgeOldMatches(days = 30) {
  if (useLocalStorage()) return purgeOldMatchesLocal(days);

  const index = await getGroupsIndex();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const group of index.groups) {
    const prefix = groupPath(group.slug, 'matches');
    const { blobs } = await list({ prefix });

    for (const blob of blobs) {
      const res = await fetch(blob.url);
      if (!res.ok) continue;
      const match = (await res.json()) as MatchRecord;
      if (new Date(match.date).getTime() < cutoff) {
        await del(blob.url);
        deleted++;
      }
    }
  }

  return deleted;
}

export async function groupExists(slug: string): Promise<boolean> {
  const meta = await getGroupMeta(slug);
  return meta !== null;
}
