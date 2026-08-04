import type { MatchRecord, PlayerAppearance, TeamCount } from '../../shared/types.js';
import { getSupabase, isSupabaseConfigured } from './supabase-client.js';
import { readJsonLocal, writeJsonLocal } from './local-storage.js';

type AppearanceRow = {
  id: string;
  group_slug: string;
  match_id: string;
  player_id: string;
  player_name: string;
  team_key: string;
  team_name: string;
  match_name: string;
  match_date: string;
  format: number;
  team_count: number;
  recorded_at: string;
};

const LOCAL_FILE = 'player-appearances.json';

function useLocal() {
  return !isSupabaseConfigured();
}

function rowToAppearance(row: AppearanceRow): PlayerAppearance {
  const teamKey = row.team_key === 'B' || row.team_key === 'C' ? row.team_key : 'A';
  return {
    id: row.id,
    groupSlug: row.group_slug,
    matchId: row.match_id,
    playerId: row.player_id,
    playerName: row.player_name,
    teamKey,
    teamName: row.team_name,
    matchName: row.match_name ?? '',
    matchDate: row.match_date,
    format: row.format,
    teamCount: row.team_count === 3 ? 3 : 2,
    recordedAt: row.recorded_at,
  };
}

function appearanceToRow(a: PlayerAppearance): AppearanceRow {
  return {
    id: a.id,
    group_slug: a.groupSlug,
    match_id: a.matchId,
    player_id: a.playerId,
    player_name: a.playerName,
    team_key: a.teamKey,
    team_name: a.teamName,
    match_name: a.matchName,
    match_date: a.matchDate,
    format: a.format,
    team_count: a.teamCount,
    recorded_at: a.recordedAt,
  };
}

async function readLocal(): Promise<PlayerAppearance[]> {
  const data = await readJsonLocal<{ appearances: PlayerAppearance[] }>(LOCAL_FILE);
  return data?.appearances ?? [];
}

async function writeLocal(appearances: PlayerAppearance[]) {
  await writeJsonLocal(LOCAL_FILE, { appearances });
}

export function buildAppearancesFromMatch(match: MatchRecord, recordedAt: string): PlayerAppearance[] {
  const teamCount: TeamCount = match.teamCount === 3 || match.teamC ? 3 : 2;
  const sides: Array<{ key: 'A' | 'B' | 'C'; team: MatchRecord['teamA'] }> = [
    { key: 'A', team: match.teamA },
    { key: 'B', team: match.teamB },
  ];
  if (teamCount === 3 && match.teamC) {
    sides.push({ key: 'C', team: match.teamC });
  }

  const rows: PlayerAppearance[] = [];
  for (const side of sides) {
    for (const player of side.team.players) {
      rows.push({
        id: crypto.randomUUID(),
        groupSlug: match.groupSlug,
        matchId: match.id,
        playerId: player.id,
        playerName: player.name,
        teamKey: side.key,
        teamName: side.team.name,
        matchName: match.name ?? '',
        matchDate: match.date,
        format: match.format,
        teamCount,
        recordedAt,
      });
    }
  }
  return rows;
}

export async function listAppearancesByGroup(groupSlug: string): Promise<PlayerAppearance[]> {
  if (useLocal()) {
    const all = await readLocal();
    return all
      .filter((a) => a.groupSlug === groupSlug)
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
  }

  const { data, error } = await getSupabase()
    .from('player_appearances')
    .select('*')
    .eq('group_slug', groupSlug)
    .order('match_date', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToAppearance(row as AppearanceRow));
}

export async function listAppearancesByMatch(matchId: string): Promise<PlayerAppearance[]> {
  if (useLocal()) {
    const all = await readLocal();
    return all.filter((a) => a.matchId === matchId);
  }

  const { data, error } = await getSupabase()
    .from('player_appearances')
    .select('*')
    .eq('match_id', matchId);

  if (error) throw error;
  return (data ?? []).map((row) => rowToAppearance(row as AppearanceRow));
}

export async function deleteAppearancesForMatch(groupSlug: string, matchId: string): Promise<void> {
  if (useLocal()) {
    const all = await readLocal();
    await writeLocal(all.filter((a) => !(a.groupSlug === groupSlug && a.matchId === matchId)));
    return;
  }

  const { error } = await getSupabase()
    .from('player_appearances')
    .delete()
    .eq('group_slug', groupSlug)
    .eq('match_id', matchId);

  if (error) throw error;
}

export async function replaceAppearancesForMatch(
  match: MatchRecord,
  rows: PlayerAppearance[],
): Promise<void> {
  await deleteAppearancesForMatch(match.groupSlug, match.id);

  if (rows.length === 0) return;

  if (useLocal()) {
    const all = await readLocal();
    await writeLocal([...all, ...rows]);
    return;
  }

  const { error } = await getSupabase()
    .from('player_appearances')
    .insert(rows.map(appearanceToRow));

  if (error) throw error;
}
