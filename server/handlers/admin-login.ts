import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createAdminToken,
  error,
  json,
  readBody,
  resolveAdminRoleFromPassword,
} from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return error(res, 405, 'Method not allowed');
  }

  if (!process.env.ADMIN_PASSWORD && !process.env.SUPER_ADMIN_PASSWORD) {
    return error(res, 500, 'Admin login is not configured');
  }

  const body = await readBody<{ password?: string }>(req);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) return error(res, 401, 'Invalid password');

  const role = resolveAdminRoleFromPassword(password);
  if (!role) return error(res, 401, 'Invalid password');

  const token = createAdminToken(role);
  return json(res, 200, { token, role });
}
