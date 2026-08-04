import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listAppearancesByGroup } from '../lib/appearances.js';
import { error, getErrorMessage, json } from '../lib/auth.js';
import { getGroupMeta, getGroupPlayers, groupExists } from '../lib/storage.js';
import { slugify, type PlayerGamesPlayed } from '../../shared/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed');
  }

  const slug = slugify(String(req.query.slug ?? ''));
  if (!slug) return error(res, 400, 'Invalid group slug');
  if (!(await groupExists(slug))) return error(res, 404, 'Group not found');

  try {
    const [meta, playersData, appearances] = await Promise.all([
      getGroupMeta(slug),
      getGroupPlayers(slug),
      listAppearancesByGroup(slug),
    ]);

    const byPlayer = new Map<string, PlayerGamesPlayed>();
    for (const player of playersData.players) {
      byPlayer.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        photoUrl: player.photoUrl,
        gamesPlayed: 0,
      });
    }

    for (const row of appearances) {
      const existing = byPlayer.get(row.playerId);
      if (existing) {
        existing.gamesPlayed += 1;
      } else {
        byPlayer.set(row.playerId, {
          playerId: row.playerId,
          playerName: row.playerName,
          photoUrl: null,
          gamesPlayed: 1,
        });
      }
    }

    const players = [...byPlayer.values()]
      .filter((p) => p.gamesPlayed > 0)
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed || a.playerName.localeCompare(b.playerName));

    // Distinct recorded matches for this group
    const matchMap = new Map<
      string,
      {
        matchId: string;
        matchName: string;
        matchDate: string;
        format: number;
        teamCount: number;
        playerCount: number;
      }
    >();
    for (const row of appearances) {
      const cur = matchMap.get(row.matchId);
      if (cur) {
        cur.playerCount += 1;
      } else {
        matchMap.set(row.matchId, {
          matchId: row.matchId,
          matchName: row.matchName,
          matchDate: row.matchDate,
          format: row.format,
          teamCount: row.teamCount,
          playerCount: 1,
        });
      }
    }

    const recordedMatches = [...matchMap.values()].sort(
      (a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime(),
    );

    return json(res, 200, {
      group: meta,
      players,
      recordedMatches,
      totalAppearances: appearances.length,
    });
  } catch (err) {
    return error(res, 500, getErrorMessage(err, 'Failed to load games played'));
  }
}
