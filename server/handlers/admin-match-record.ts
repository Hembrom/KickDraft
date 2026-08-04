import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  buildAppearancesFromMatch,
  deleteAppearancesForMatch,
  listAppearancesByMatch,
  replaceAppearancesForMatch,
} from '../lib/appearances.js';
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

  const body = await readBody<{ recorded?: boolean }>(req);
  if (typeof body.recorded !== 'boolean') {
    return error(res, 400, 'recorded boolean is required');
  }

  try {
    const match = await getMatch(slug, matchId);
    if (!match) return error(res, 404, 'Match not found');

    if (body.recorded) {
      const recordedAt = new Date().toISOString();
      const rows = buildAppearancesFromMatch(match, recordedAt);
      if (rows.length === 0) {
        return error(res, 400, 'Match has no players to record');
      }
      await replaceAppearancesForMatch(match, rows);
      const updated = {
        ...match,
        recordedAsPlayed: true,
        recordedAt,
      };
      await updateMatch(updated);
      return json(res, 200, {
        match: updated,
        appearanceCount: rows.length,
      });
    }

    await deleteAppearancesForMatch(slug, matchId);
    const updated = {
      ...match,
      recordedAsPlayed: false,
      recordedAt: null,
    };
    await updateMatch(updated);
    return json(res, 200, {
      match: updated,
      appearanceCount: await listAppearancesByMatch(matchId).then((r) => r.length),
    });
  } catch (err) {
    return error(res, 500, getErrorMessage(err, 'Failed to update match record status'));
  }
}
