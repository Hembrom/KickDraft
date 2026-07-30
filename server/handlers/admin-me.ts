import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, getAdminRole, json, requireAdmin } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }
  if (!requireAdmin(req, res)) return;

  const role = getAdminRole(req);
  return json(res, 200, { role });
}
