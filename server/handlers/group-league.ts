import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildLeagueSeasons } from '../../shared/league.js';
import { error, getErrorMessage, json } from '../lib/auth.js';
import { listAppearancesByGroup } from '../lib/appearances.js';
import { getGroupMeta, getGroupPlayers, groupExists, listMatches } from '../lib/storage.js';
import { slugify } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }

  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');
  if (!(await groupExists(slug))) return error(res, 404, 'Group not found');

  try {
    const [meta, playersData, appearances, matches] = await Promise.all([
      getGroupMeta(slug),
      getGroupPlayers(slug),
      listAppearancesByGroup(slug),
      listMatches(slug),
    ]);

    return json(res, 200, {
      group: meta,
      seasons: buildLeagueSeasons(matches, appearances, playersData.players),
    });
  } catch (err) {
    return error(res, 500, getErrorMessage(err, 'Failed to load league status'));
  }
}
