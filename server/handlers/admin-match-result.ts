import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyGoalDelta } from '../../shared/match-result.js';
import { error, getErrorMessage, json, readBody, requireAdmin } from '../lib/auth.js';
import { getMatch, groupExists, updateMatch } from '../lib/storage.js';
import { slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') {
    return error(res, 405, 'Method not allowed');
  }

  if (!requireAdmin(req, res)) return;

  const slug = slugify(String(req.query.slug ?? ''));
  const matchId = String(req.query.matchId ?? '').trim();
  if (!slug) return error(res, 400, 'Invalid group slug');
  if (!matchId) return error(res, 400, 'Invalid match id');
  if (!(await groupExists(slug))) return error(res, 404, 'Group not found');

  const body = await readBody<{ playerId?: string; delta?: number; external?: boolean }>(req);
  const hasExternal = typeof body.external === 'boolean';
  const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';
  const delta = Number(body.delta);
  const hasDelta = playerId && Number.isInteger(delta) && delta !== 0;

  if (!hasExternal && !hasDelta) {
    return error(res, 400, 'Set external or a player goal change');
  }

  try {
    const match = await getMatch(slug, matchId);
    if (!match) return error(res, 404, 'Match not found');

    let updated = match;
    if (hasExternal) {
      updated = { ...updated, external: body.external };
    }
    if (hasDelta) {
      updated = applyGoalDelta(updated, playerId, delta);
    }

    await updateMatch(updated);
    return json(res, 200, { match: updated });
  } catch (err) {
    return error(res, 400, getErrorMessage(err, 'Failed to update score'));
  }
}
