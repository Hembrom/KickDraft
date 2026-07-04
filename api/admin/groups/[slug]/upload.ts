import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groupExists } from '../../../lib/blob-storage.js';
import { uploadPlayerImageFromBase64 } from '../../../lib/player-image.js';
import { error, json, readBody, requireAdmin } from '../../../lib/auth.js';
import { slugify } from '../../../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return error(res, 405, 'Method not allowed');
  }

  if (!requireAdmin(req, res)) return;

  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');

  if (!(await groupExists(slug))) {
    return error(res, 404, 'Group not found');
  }

  const body = await readBody<{
    playerId?: string;
    imageBase64?: string;
    mimeType?: string;
  }>(req);

  const playerId = body.playerId?.trim();
  const imageBase64 = body.imageBase64?.trim();
  if (!playerId || !imageBase64) {
    return error(res, 400, 'playerId and imageBase64 are required');
  }

  const mimeType = body.mimeType ?? 'image/jpeg';
  const url = await uploadPlayerImageFromBase64(slug, playerId, imageBase64, mimeType);

  return json(res, 200, { url });
}
