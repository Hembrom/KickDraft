import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getGroupMeta,
  getGroupPlayers,
  saveGroupPlayers,
  groupExists,
} from '../lib/blob-storage.js';
import { uploadPlayerImageFromBase64 } from '../lib/player-image.js';
import { error, json, readBody, requireAdmin } from '../lib/auth.js';
import {
  calculateOvr,
  slugify,
  STAT_KEYS,
  MAX_PLAYER_POSITIONS,
  normalizePositions,
  type Player,
  type PlayerPosition,
  type PlayerStats,
} from '../../shared/types.js';

function parseStats(input: Partial<PlayerStats>): PlayerStats | null {
  const stats = {} as PlayerStats;
  for (const key of STAT_KEYS) {
    const value = Number(input[key]);
    if (Number.isNaN(value) || value < 0 || value > 100) return null;
    stats[key] = Math.round(value);
  }
  return stats;
}

function validatePlayerInput(
  body: Record<string, unknown>,
  existing?: Player,
): { error: string } | { player: Player } {
  const name = typeof body.name === 'string' ? body.name.trim() : existing?.name;
  if (!name) return { error: 'Name is required' };

  const favouriteClub =
    typeof body.favouriteClub === 'string'
      ? body.favouriteClub.trim()
      : existing?.favouriteClub ?? '';

  const stats = body.stats
    ? parseStats(body.stats as Partial<PlayerStats>)
    : existing
      ? {
          pace: existing.pace,
          shooting: existing.shooting,
          passing: existing.passing,
          dribbling: existing.dribbling,
          defending: existing.defending,
          physicality: existing.physicality,
        }
      : null;

  if (!stats) return { error: 'All stats must be numbers between 0 and 100' };

  const legacy = existing as (Player & { position?: PlayerPosition }) | undefined;
  const positions = normalizePositions(
    body.positions ?? body.position,
    legacy?.position ?? legacy?.positions?.[0],
  );

  if (!existing && positions.length === 0) {
    return { error: 'Select at least one position' };
  }

  if (Array.isArray(body.positions) && body.positions.length > MAX_PLAYER_POSITIONS) {
    return { error: `Select at most ${MAX_PLAYER_POSITIONS} positions` };
  }

  const now = new Date().toISOString();
  const player: Player = {
    id: existing?.id ?? crypto.randomUUID(),
    name,
    positions,
    favouriteClub,
    photoUrl:
      typeof body.photoUrl === 'string' ? body.photoUrl : existing?.photoUrl ?? null,
    clubLogoUrl:
      typeof body.clubLogoUrl === 'string'
        ? body.clubLogoUrl
        : existing?.clubLogoUrl ?? null,
    ...stats,
    ovr: calculateOvr(stats),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return { player };
}

async function applyPlayerPhoto(
  slug: string,
  player: Player,
  body: Record<string, unknown>,
) {
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
  if (!imageBase64) return player;

  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg';
  const photoUrl = await uploadPlayerImageFromBase64(slug, player.id, imageBase64, mimeType);
  return { ...player, photoUrl };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');

  if (!(await groupExists(slug))) {
    return error(res, 404, 'Group not found');
  }

  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    const [meta, data] = await Promise.all([getGroupMeta(slug), getGroupPlayers(slug)]);
    return json(res, 200, { ...meta, players: data.players });
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    const body = await readBody<Record<string, unknown>>(req);
    const result = validatePlayerInput(body);
    if ('error' in result) return error(res, 400, result.error);

    const player = await applyPlayerPhoto(slug, result.player, body);
    const data = await getGroupPlayers(slug);
    data.players.push(player);
    await saveGroupPlayers(slug, data);
    return json(res, 201, player);
  }

  if (req.method === 'PUT') {
    if (!requireAdmin(req, res)) return;
    const body = await readBody<Record<string, unknown> & { id?: string }>(req);
    const id = body.id;
    if (!id) return error(res, 400, 'Player id is required');

    const data = await getGroupPlayers(slug);
    const index = data.players.findIndex((p: Player) => p.id === id);
    if (index === -1) return error(res, 404, 'Player not found');

    const existing = data.players[index]!;
    const result = validatePlayerInput(body, existing);
    if ('error' in result) return error(res, 400, result.error);

    data.players[index] = await applyPlayerPhoto(slug, result.player, body);
    await saveGroupPlayers(slug, data);
    return json(res, 200, data.players[index]);
  }

  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const id = typeof req.query.id === 'string' ? req.query.id : undefined;
    if (!id) return error(res, 400, 'Player id is required');

    const data = await getGroupPlayers(slug);
    const next = data.players.filter((p: Player) => p.id !== id);
    if (next.length === data.players.length) {
      return error(res, 404, 'Player not found');
    }

    await saveGroupPlayers(slug, { players: next });
    return json(res, 200, { ok: true });
  }

  return error(res, 405, 'Method not allowed');
}
