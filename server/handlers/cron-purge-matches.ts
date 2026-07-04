import type { VercelRequest, VercelResponse } from '@vercel/node';
import { purgeOldMatches } from '../lib/blob-storage.js';
import { error, json, verifyCronSecret } from '../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }

  if (!verifyCronSecret(req)) {
    return error(res, 401, 'Unauthorized');
  }

  const deleted = await purgeOldMatches(30);
  return json(res, 200, { deleted });
}
