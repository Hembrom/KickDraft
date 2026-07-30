import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, getErrorMessage, json, requireAdmin, requireSuperAdmin } from '../lib/auth.js';
import { deletePeerRating, listRatingsByGroup } from '../lib/peer-ratings.js';
import { getGroupMeta, getGroupPlayers, groupExists } from '../lib/storage.js';
import { calculateOvr, slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdmin(req, res)) return;

  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');
  if (!(await groupExists(slug))) return error(res, 404, 'Group not found');

  if (req.method === 'GET') {
    try {
      const [meta, playersData, ratings] = await Promise.all([
        getGroupMeta(slug),
        getGroupPlayers(slug),
        listRatingsByGroup(slug),
      ]);

      const byId = new Map(playersData.players.map((p) => [p.id, p]));
      const rows = ratings.map((rating) => {
        const rater = byId.get(rating.raterPlayerId);
        const rated = byId.get(rating.ratedPlayerId);
        return {
          id: rating.id,
          raterPlayerId: rating.raterPlayerId,
          ratedPlayerId: rating.ratedPlayerId,
          raterName: rater?.name ?? 'Unknown',
          ratedName: rated?.name ?? 'Unknown',
          pace: rating.pace,
          shooting: rating.shooting,
          passing: rating.passing,
          dribbling: rating.dribbling,
          defending: rating.defending,
          physicality: rating.physicality,
          stamina: rating.stamina,
          ovr: calculateOvr(rating),
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
        };
      });

      return json(res, 200, {
        group: meta,
        ratings: rows,
        cooldownDays: 14,
      });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to load peer ratings'));
    }
  }

  if (req.method === 'DELETE') {
    if (!requireSuperAdmin(req, res)) return;

    const ratingId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
    if (!ratingId) return error(res, 400, 'Rating id is required');

    try {
      const deleted = await deletePeerRating(slug, ratingId);
      if (!deleted) return error(res, 404, 'Rating not found');
      return json(res, 200, { ok: true });
    } catch (err) {
      return error(res, 500, getErrorMessage(err, 'Failed to delete rating'));
    }
  }

  return error(res, 405, 'Method not allowed');
}
