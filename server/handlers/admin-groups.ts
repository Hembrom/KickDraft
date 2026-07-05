import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getGroupsIndex,
  saveGroupMeta,
  groupExists,
} from '../lib/storage.js';
import { error, json, readBody, requireAdmin } from '../lib/auth.js';
import { slugify, type GroupMeta } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const index = await getGroupsIndex();
    return json(res, 200, index);
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;

    const body = await readBody<{ name?: string; slug?: string }>(req);
    const name = body.name?.trim();
    if (!name) return error(res, 400, 'Group name is required');

    const slug = body.slug?.trim() ? slugify(body.slug) : slugify(name);
    if (!slug) return error(res, 400, 'Invalid group slug');

    if (await groupExists(slug)) {
      return error(res, 409, 'A group with this slug already exists');
    }

    const meta: GroupMeta = {
      slug,
      name,
      createdAt: new Date().toISOString(),
    };

    await saveGroupMeta(meta);

    return json(res, 201, meta);
  }

  return error(res, 405, 'Method not allowed');
}
