import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, getErrorMessage, json, readBody, requireAdmin } from '../lib/auth.js';
import { getUsePeerRatings, setUsePeerRatings } from '../lib/peer-ratings.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    try {
      const usePeerRatings = await getUsePeerRatings();
      return json(res, 200, { usePeerRatings });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to load settings'));
    }
  }

  if (req.method === 'PUT') {
    const body = await readBody<{ usePeerRatings?: boolean }>(req);
    if (typeof body.usePeerRatings !== 'boolean') {
      return error(res, 400, 'usePeerRatings boolean is required');
    }
    try {
      const usePeerRatings = await setUsePeerRatings(body.usePeerRatings);
      return json(res, 200, { usePeerRatings });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to update setting'));
    }
  }

  return error(res, 405, 'Method not allowed');
}
