import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createAdminToken, error, json, readBody } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return error(res, 405, 'Method not allowed');
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return error(res, 500, 'Admin login is not configured');
  }

  const body = await readBody<{ password?: string }>(req);
  if (body.password !== password) {
    return error(res, 401, 'Invalid password');
  }

  const token = createAdminToken();
  return json(res, 200, { token });
}
