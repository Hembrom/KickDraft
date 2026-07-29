import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, getErrorMessage, json, readBody } from '../lib/auth.js';
import { requireGoogleUser } from '../lib/google-auth.js';
import {
  cooldownRemainingMs,
  getClaimByGoogleUserId,
  getPeerRatingSummaries,
  getRatingForPair,
  listRatingsByRater,
  parseStats,
  upsertPeerRating,
} from '../lib/peer-ratings.js';
import { getGroupPlayers, groupExists } from '../lib/storage.js';
import { slugify, type PlayerStats } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');
  if (!(await groupExists(slug))) return error(res, 404, 'Group not found');

  const user = await requireGoogleUser(req, res);
  if (!user) return;

  const claim = await getClaimByGoogleUserId(user.id);
  if (!claim) {
    return error(res, 403, 'Claim a player first before rating others');
  }
  if (claim.groupSlug !== slug) {
    return error(res, 403, `You claimed a player in /${claim.groupSlug}`);
  }

  if (req.method === 'GET') {
    try {
      const [{ players }, myRatings, summaries] = await Promise.all([
        getGroupPlayers(slug),
        listRatingsByRater(claim.playerId),
        getPeerRatingSummaries(slug),
      ]);

      const rateable = players
        .filter((p) => p.id !== claim.playerId)
        .map((player) => {
          const existing = myRatings.find((r) => r.ratedPlayerId === player.id) ?? null;
          const remainingMs = cooldownRemainingMs(existing);
          const summary = summaries.get(player.id);
          return {
            player,
            myRating: existing,
            canRate: remainingMs === 0,
            cooldownRemainingMs: remainingMs,
            peerAverage: summary?.stats ?? null,
            peerOvr: summary?.ovr ?? null,
            ratingCount: summary?.ratingCount ?? 0,
          };
        });

      return json(res, 200, {
        claimedPlayerId: claim.playerId,
        targets: rateable,
      });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to load ratings'));
    }
  }

  if (req.method === 'POST') {
    const body = await readBody<{ ratedPlayerId?: string; stats?: Partial<PlayerStats> }>(req);
    const ratedPlayerId = typeof body.ratedPlayerId === 'string' ? body.ratedPlayerId : '';
    if (!ratedPlayerId) return error(res, 400, 'ratedPlayerId is required');
    if (ratedPlayerId === claim.playerId) {
      return error(res, 400, 'You cannot rate yourself');
    }

    const stats = body.stats ? parseStats(body.stats) : null;
    if (!stats) return error(res, 400, 'All stats must be numbers between 0 and 100');

    try {
      const { players } = await getGroupPlayers(slug);
      if (!players.some((p) => p.id === ratedPlayerId)) {
        return error(res, 404, 'Player not found in this group');
      }

      // Re-check cooldown explicitly for clearer errors
      const existing = await getRatingForPair(claim.playerId, ratedPlayerId);
      if (cooldownRemainingMs(existing) > 0) {
        const days = Math.ceil(cooldownRemainingMs(existing) / (24 * 60 * 60 * 1000));
        return error(res, 429, `You can rate this player again in ${days} day${days === 1 ? '' : 's'}`);
      }

      const rating = await upsertPeerRating({
        groupSlug: slug,
        raterPlayerId: claim.playerId,
        ratedPlayerId,
        stats,
      });

      return json(res, 201, { rating });
    } catch (err) {
      return error(res, 400, getErrorMessage(err, 'Failed to save rating'));
    }
  }

  return error(res, 405, 'Method not allowed');
}
