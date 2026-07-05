import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGroupsIndex } from '../lib/storage.js';
import { error, json } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }

  const index = await getGroupsIndex();
  return json(res, 200, index);
}
