import { BlobPreconditionFailedError, del, get, list, put } from '@vercel/blob';
import { readFile } from 'node:fs/promises';
import {
  normalizePositions,
  type GroupMeta,
  type GroupPlayers,
  type GroupsIndex,
  type MatchRecord,
  type Player,
  type PlayerPosition,
} from '../../shared/types.js';
import {
  listMatchesLocal,
  purgeOldMatchesLocal,
  readJsonLocal,
  resolveLocalFilePath,
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

function blobAccess(): 'public' | 'private' {
  return process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
}

function groupPath(slug: string, ...parts: string[]) {
  return ['groups', slug, ...parts].join('/');
}

function playerImageApiPath(slug: string, playerId: string, extension: string) {
  return `/api/groups/${slug}/images/${playerId}.${extension}`;
}

function normalizePlayersData(data: GroupPlayers | null): GroupPlayers {
  const players = (data?.players ?? []).map((player) => {
    const raw = player as Player & { position?: PlayerPosition };
    return {
      ...raw,
      positions: normalizePositions(raw.positions, raw.position),
    };
  });
  return { players };
}

async function readBlobText(pathname: string): Promise<string | null> {
  const result = await get(pathname, { access: blobAccess() });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return new Response(result.stream).text();
}

export async function readJsonBlob<T>(pathname: string): Promise<T | null> {
  if (useLocalStorage()) return readJsonLocal<T>(pathname);

  try {
    const text = await readBlobText(pathname);
    if (!text) return null;
    return JSON.parse(text) as T;
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
    access: blobAccess(),
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
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
  return normalizePlayersData(data);
}

export async function saveGroupPlayers(slug: string, data: GroupPlayers) {
  await writeJsonBlob(groupPath(slug, 'players.json'), data);
}

export async function mutateGroupPlayers(
  slug: string,
  mutate: (players: Player[]) => Player[],
): Promise<GroupPlayers> {
  const pathname = groupPath(slug, 'players.json');

  if (useLocalStorage()) {
    const current = normalizePlayersData(await readJsonLocal<GroupPlayers>(pathname));
    const next = { players: mutate([...current.players]) };
    await writeJsonLocal(pathname, next);
    return next;
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await get(pathname, { access: blobAccess() });
    const current =
      result?.statusCode === 200 && result.stream
        ? normalizePlayersData(
            JSON.parse(await new Response(result.stream).text()) as GroupPlayers,
          )
        : { players: [] };

    const next = { players: mutate([...current.players]) };

    try {
      await put(pathname, JSON.stringify(next, null, 2), {
        access: blobAccess(),
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0,
        ...(result?.blob.etag ? { ifMatch: result.blob.etag } : {}),
      });
      return next;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError && attempt < 4) continue;
      throw err;
    }
  }

  throw new Error('Failed to update group players');
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
    access: blobAccess(),
    allowOverwrite: true,
  });

  if (blobAccess() === 'private') {
    return playerImageApiPath(slug, playerId, extension);
  }

  return blob.url;
}

export async function serveGroupImage(
  slug: string,
  filename: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  if (filename.includes('..') || filename.includes('/')) return null;

  const pathname = groupPath(slug, 'images', filename);

  if (useLocalStorage()) {
    const filePath = resolveLocalFilePath(pathname);
    if (!filePath) return null;
    try {
      const body = await readFile(filePath);
      const ext = filename.split('.').pop()?.toLowerCase() ?? '';
      const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      };
      return { body, contentType: types[ext] ?? 'application/octet-stream' };
    } catch {
      return null;
    }
  }

  const result = await get(pathname, { access: blobAccess() });
  if (!result || result.statusCode !== 200 || !result.stream) return null;

  const body = Buffer.from(await new Response(result.stream).arrayBuffer());
  return {
    body,
    contentType: result.blob.contentType ?? 'application/octet-stream',
  };
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
      try {
        const text = await readBlobText(blob.pathname);
        if (!text) return null;
        return JSON.parse(text) as MatchRecord;
      } catch {
        return null;
      }
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
      try {
        const text = await readBlobText(blob.pathname);
        if (!text) continue;
        const match = JSON.parse(text) as MatchRecord;
        if (new Date(match.date).getTime() < cutoff) {
          await del(blob.url);
          deleted++;
        }
      } catch {
        // skip unreadable match blobs
      }
    }
  }

  return deleted;
}

export async function groupExists(slug: string): Promise<boolean> {
  const meta = await getGroupMeta(slug);
  return meta !== null;
}
