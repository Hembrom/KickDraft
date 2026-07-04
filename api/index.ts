import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchApiRequest } from '../server/router.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await dispatchApiRequest(req, res);
}
