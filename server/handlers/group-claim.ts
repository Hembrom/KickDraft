import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, getErrorMessage, json, readBody } from '../lib/auth.js';
import { requireGoogleUser, type GoogleUser } from '../lib/google-auth.js';
import {
  createClaim,
  getClaimByGoogleUserId,
  listClaimedPlayerIds,
} from '../lib/peer-ratings.js';
import { getGroupMeta, getGroupPlayers, groupExists } from '../lib/storage.js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase-client.js';
import { slugify } from '../../shared/types.js';

async function optionalGoogleUser(req: Parameters<typeof requireGoogleUser>[0]): Promise<GoogleUser | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ') || !isSupabaseConfigured()) return null;

  const token = auth.slice(7);
  const { data, error: authError } = await getSupabase().auth.getUser(token);
  if (authError || !data.user?.email) return null;
  return { id: data.user.id, email: data.user.email.trim() };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');
  if (!(await groupExists(slug))) return error(res, 404, 'Group not found');

  if (req.method === 'GET') {
    try {
      const user = await optionalGoogleUser(req);
      const [meta, playersData, claimedIds] = await Promise.all([
        getGroupMeta(slug),
        getGroupPlayers(slug),
        listClaimedPlayerIds(slug),
      ]);

      const claim = user ? await getClaimByGoogleUserId(user.id) : null;
      const unclaimedPlayers = playersData.players.filter((p) => !claimedIds.has(p.id));

      return json(res, 200, {
        group: meta,
        players: playersData.players,
        claim,
        alreadyClaimedElsewhere: Boolean(claim && claim.groupSlug !== slug),
        unclaimedPlayers,
        claimedPlayerIds: [...claimedIds],
        signedIn: Boolean(user),
      });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to load claim status'));
    }
  }

  if (req.method === 'POST') {
    const user = await requireGoogleUser(req, res);
    if (!user) return;

    const body = await readBody<{ playerId?: string }>(req);
    const playerId = typeof body.playerId === 'string' ? body.playerId : '';
    if (!playerId) return error(res, 400, 'playerId is required');

    try {
      const { players } = await getGroupPlayers(slug);
      const player = players.find((p) => p.id === playerId);
      if (!player) return error(res, 404, 'Player not found in this group');

      const claim = await createClaim({
        googleUserId: user.id,
        email: user.email,
        playerId,
        groupSlug: slug,
      });

      return json(res, 201, { claim, player });
    } catch (err) {
      return error(res, 400, getErrorMessage(err, 'Could not claim player'));
    }
  }

  return error(res, 405, 'Method not allowed');
}
