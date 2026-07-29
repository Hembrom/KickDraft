import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, getErrorMessage, json, requireAdmin } from '../lib/auth.js';
import { deleteClaim, listClaimsByGroup } from '../lib/peer-ratings.js';
import { getGroupMeta, getGroupPlayers, groupExists } from '../lib/storage.js';
import { slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return;

  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');
  if (!(await groupExists(slug))) return error(res, 404, 'Group not found');

  if (req.method === 'GET') {
    try {
      const [meta, playersData, claims] = await Promise.all([
        getGroupMeta(slug),
        getGroupPlayers(slug),
        listClaimsByGroup(slug),
      ]);

      const byId = new Map(playersData.players.map((p) => [p.id, p]));
      const rows = claims.map((claim) => {
        const player = byId.get(claim.playerId);
        return {
          googleUserId: claim.googleUserId,
          email: claim.email,
          playerId: claim.playerId,
          playerName: player?.name ?? 'Unknown player',
          photoUrl: player?.photoUrl ?? null,
          claimedAt: claim.claimedAt,
        };
      });

      return json(res, 200, { group: meta, claims: rows });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to load claims'));
    }
  }

  if (req.method === 'DELETE') {
    const playerId = typeof req.query.playerId === 'string' ? req.query.playerId.trim() : '';
    if (!playerId) return error(res, 400, 'playerId is required');

    try {
      const deleted = await deleteClaim(slug, playerId);
      if (!deleted) return error(res, 404, 'Claim not found');
      return json(res, 200, { ok: true });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to unclaim player'));
    }
  }

  return error(res, 405, 'Method not allowed');
}
