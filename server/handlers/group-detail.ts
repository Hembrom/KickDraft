import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroupMeta, getGroupPlayers, groupExists } from '../lib/storage.js';
import { error, json } from '../lib/auth.js';
import { slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }

  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');

  if (!(await groupExists(slug))) {
    return error(res, 404, 'Group not found');
  }

  const [meta, playersData] = await Promise.all([
    getGroupMeta(slug),
    getGroupPlayers(slug),
  ]);

  return json(res, 200, {
    ...meta,
    players: playersData.players,
  });
}
