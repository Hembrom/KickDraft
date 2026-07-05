import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GroupMeta, GroupPlayers, GroupsIndex, MatchRecord } from '../../shared/types.js';

const ROOT = path.join(process.cwd(), '.local-data');
const PUBLIC_BASE = 'http://localhost:3000/api/local-files';

function toDiskPath(pathname: string) {
  return path.join(ROOT, pathname);
}

async function ensureDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function readJsonLocal<T>(pathname: string): Promise<T | null> {
  try {
    const raw = await readFile(toDiskPath(pathname), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonLocal(pathname: string, data: unknown) {
  const filePath = toDiskPath(pathname);
  await ensureDir(filePath);
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function uploadImageLocal(
  slug: string,
  playerId: string,
  buffer: Buffer,
  extension: string,
) {
  const pathname = `groups/${slug}/images/${playerId}.${extension}`;
  const filePath = toDiskPath(pathname);
  await ensureDir(filePath);
  await writeFile(filePath, buffer);
  return `${PUBLIC_BASE}/${pathname}`;
}

export async function listMatchesLocal(slug: string): Promise<MatchRecord[]> {
  const dir = toDiskPath(`groups/${slug}/matches`);
  try {
    const files = await readdir(dir);
    const matches = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          const raw = await readFile(path.join(dir, file), 'utf8');
          return JSON.parse(raw) as MatchRecord;
        }),
    );
    return matches.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch {
    return [];
  }
}

export async function purgeOldMatchesLocal(days = 30) {
  const index = await readJsonLocal<GroupsIndex>('groups/index.json');
  if (!index) return 0;

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const group of index.groups) {
    const dir = toDiskPath(`groups/${group.slug}/matches`);
    try {
      const files = await readdir(dir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(dir, file);
        const match = JSON.parse(await readFile(filePath, 'utf8')) as MatchRecord;
        if (new Date(match.date).getTime() < cutoff) {
          await unlink(filePath);
          deleted++;
        }
      }
    } catch {
      // no matches dir
    }
  }

  return deleted;
}

export function resolveLocalFilePath(relativePath: string) {
  const resolved = path.resolve(ROOT, relativePath);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

export async function listPlayerFilesLocal(slug: string): Promise<string[]> {
  const dir = toDiskPath(`groups/${slug}/players`);
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
}

export async function deleteJsonLocal(pathname: string) {
  try {
    await unlink(toDiskPath(pathname));
  } catch {
    // already gone
  }
}

export type { GroupMeta, GroupPlayers, GroupsIndex, MatchRecord };
