import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMatch, groupExists } from '../lib/storage.js';
import { error, json } from '../lib/auth.js';
import { slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = slugify(String(req.query.slug ?? ''));
  const matchId = String(req.query.matchId ?? '').trim();

  if (!slug || !matchId) return error(res, 400, 'Invalid group or match');
  if (req.method !== 'GET') return error(res, 405, 'Method not allowed');

  if (!(await groupExists(slug))) {
    return error(res, 404, 'Group not found');
  }

  const match = await getMatch(slug, matchId);
  if (!match) {
    return error(res, 404, 'Match not found');
  }

  return json(res, 200, match);
}
