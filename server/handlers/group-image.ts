import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groupExists, serveGroupImage } from '../lib/blob-storage.js';
import { error } from '../lib/auth.js';
import { slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }

  const slug = slugify(String(req.query.slug ?? ''));
  const file = String(req.query.file ?? '').trim();
  if (!slug || !file) return error(res, 400, 'Invalid image path');

  if (!(await groupExists(slug))) {
    return error(res, 404, 'Group not found');
  }

  const image = await serveGroupImage(slug, file);
  if (!image) return error(res, 404, 'Image not found');

  res.setHeader('Content-Type', image.contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).end(image.body);
}
