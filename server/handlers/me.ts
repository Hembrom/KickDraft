import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, json } from '../lib/auth.js';
import { requireGoogleUser } from '../lib/google-auth.js';
import { getClaimByGoogleUserId, getUsePeerRatings } from '../lib/peer-ratings.js';
import { getGroupPlayers } from '../lib/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }

  const usePeerRatings = await getUsePeerRatings().catch(() => false);

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return json(res, 200, { user: null, claim: null, claimedPlayer: null, usePeerRatings });
  }

  const user = await requireGoogleUser(req, res);
  if (!user) return;

  const claim = await getClaimByGoogleUserId(user.id);
  let claimedPlayer = null;
  if (claim) {
    const { players } = await getGroupPlayers(claim.groupSlug);
    claimedPlayer = players.find((p) => p.id === claim.playerId) ?? null;
  }

  return json(res, 200, {
    user: { id: user.id, email: user.email },
    claim,
    claimedPlayer,
    usePeerRatings,
  });
}
