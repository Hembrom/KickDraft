import {
  calculateOvr,
  PEER_RATING_COOLDOWN_MS,
  PUBLIC_PEER_REVIEW_MAX_PER_PAIR,
  PUBLIC_PEER_REVIEW_WINDOW_MS,
  STAT_KEYS,
  STAT_MAX,
  STAT_MIN,
  USE_PEER_RATINGS_SETTING_KEY,
  type Player,
  type PlayerClaim,
  type PlayerStats,
  type PeerRating,
  type PeerRatingSummary,
  roundRating,
} from '../../shared/types.js';
import { getSupabase, isSupabaseConfigured } from './supabase-client.js';
import { readJsonLocal, writeJsonLocal } from './local-storage.js';

type ClaimRow = {
  google_user_id: string;
  email: string;
  player_id: string;
  group_slug: string;
  claimed_at: string;
};

type RatingRow = {
  id: string;
  group_slug: string;
  rater_player_id: string;
  rated_player_id: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
  stamina: number;
  created_at: string;
  updated_at: string;
};

type LocalStore = {
  settings: Record<string, unknown>;
  claims: PlayerClaim[];
  ratings: PeerRating[];
};

const LOCAL_PEER_FILE = 'peer-ratings.json';

function useLocal() {
  return !isSupabaseConfigured();
}

function rowToClaim(row: ClaimRow): PlayerClaim {
  return {
    googleUserId: row.google_user_id,
    email: row.email,
    playerId: row.player_id,
    groupSlug: row.group_slug,
    claimedAt: row.claimed_at,
  };
}

function rowToRating(row: RatingRow): PeerRating {
  return {
    id: row.id,
    groupSlug: row.group_slug,
    raterPlayerId: row.rater_player_id,
    ratedPlayerId: row.rated_player_id,
    pace: row.pace,
    shooting: row.shooting,
    passing: row.passing,
    dribbling: row.dribbling,
    defending: row.defending,
    physicality: row.physicality,
    stamina: row.stamina,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readLocalStore(): Promise<LocalStore> {
  const data = await readJsonLocal<LocalStore>(LOCAL_PEER_FILE);
  return {
    settings: data?.settings ?? { [USE_PEER_RATINGS_SETTING_KEY]: false },
    claims: data?.claims ?? [],
    ratings: data?.ratings ?? [],
  };
}

async function writeLocalStore(store: LocalStore) {
  await writeJsonLocal(LOCAL_PEER_FILE, store);
}

export async function getUsePeerRatings(): Promise<boolean> {
  // Peer ratings are always used for squad OVR / team balance when available.
  return true;
}

export async function setUsePeerRatings(enabled: boolean): Promise<boolean> {
  if (useLocal()) {
    const store = await readLocalStore();
    store.settings[USE_PEER_RATINGS_SETTING_KEY] = enabled;
    await writeLocalStore(store);
    return enabled;
  }

  const { error } = await getSupabase().from('app_settings').upsert({
    key: USE_PEER_RATINGS_SETTING_KEY,
    value: enabled,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return enabled;
}

export async function getClaimByGoogleUserId(googleUserId: string): Promise<PlayerClaim | null> {
  if (useLocal()) {
    const store = await readLocalStore();
    return store.claims.find((c) => c.googleUserId === googleUserId) ?? null;
  }

  const { data, error } = await getSupabase()
    .from('player_claims')
    .select('*')
    .eq('google_user_id', googleUserId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToClaim(data as ClaimRow) : null;
}

export async function getClaimByPlayerId(playerId: string): Promise<PlayerClaim | null> {
  if (useLocal()) {
    const store = await readLocalStore();
    return store.claims.find((c) => c.playerId === playerId) ?? null;
  }

  const { data, error } = await getSupabase()
    .from('player_claims')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToClaim(data as ClaimRow) : null;
}

export async function listClaimedPlayerIds(groupSlug: string): Promise<Set<string>> {
  if (useLocal()) {
    const store = await readLocalStore();
    return new Set(store.claims.filter((c) => c.groupSlug === groupSlug).map((c) => c.playerId));
  }

  const { data, error } = await getSupabase()
    .from('player_claims')
    .select('player_id')
    .eq('group_slug', groupSlug);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.player_id as string));
}

export async function listClaimsByGroup(groupSlug: string): Promise<PlayerClaim[]> {
  if (useLocal()) {
    const store = await readLocalStore();
    return store.claims
      .filter((c) => c.groupSlug === groupSlug)
      .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  const { data, error } = await getSupabase()
    .from('player_claims')
    .select('*')
    .eq('group_slug', groupSlug)
    .order('claimed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToClaim(row as ClaimRow));
}

export async function deleteClaim(groupSlug: string, playerId: string): Promise<boolean> {
  if (useLocal()) {
    const store = await readLocalStore();
    const before = store.claims.length;
    store.claims = store.claims.filter(
      (c) => !(c.groupSlug === groupSlug && c.playerId === playerId),
    );
    if (store.claims.length === before) return false;
    await writeLocalStore(store);
    return true;
  }

  const { data, error } = await getSupabase()
    .from('player_claims')
    .delete()
    .eq('group_slug', groupSlug)
    .eq('player_id', playerId)
    .select('player_id');

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function createClaim(input: {
  googleUserId: string;
  email: string;
  playerId: string;
  groupSlug: string;
}): Promise<PlayerClaim> {
  const existingUser = await getClaimByGoogleUserId(input.googleUserId);
  if (existingUser) {
    throw new Error('You already claimed a player — claiming is once only');
  }

  const existingPlayer = await getClaimByPlayerId(input.playerId);
  if (existingPlayer) {
    throw new Error('That player is already claimed');
  }

  const claim: PlayerClaim = {
    googleUserId: input.googleUserId,
    email: input.email,
    playerId: input.playerId,
    groupSlug: input.groupSlug,
    claimedAt: new Date().toISOString(),
  };

  if (useLocal()) {
    const store = await readLocalStore();
    store.claims.push(claim);
    await writeLocalStore(store);
    return claim;
  }

  const { data, error } = await getSupabase()
    .from('player_claims')
    .insert({
      google_user_id: claim.googleUserId,
      email: claim.email,
      player_id: claim.playerId,
      group_slug: claim.groupSlug,
      claimed_at: claim.claimedAt,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('That claim is no longer available');
    }
    throw error;
  }

  return rowToClaim(data as ClaimRow);
}

export function parseStats(input: Partial<PlayerStats>): PlayerStats | null {
  const stats = {} as PlayerStats;
  for (const key of STAT_KEYS) {
    const value = Number(input[key]);
    if (Number.isNaN(value) || value < STAT_MIN || value > STAT_MAX) return null;
    stats[key] = Math.round(value);
  }
  return stats;
}

export async function getRatingForPair(
  raterPlayerId: string,
  ratedPlayerId: string,
): Promise<PeerRating | null> {
  if (useLocal()) {
    const store = await readLocalStore();
    return (
      store.ratings.find(
        (r) => r.raterPlayerId === raterPlayerId && r.ratedPlayerId === ratedPlayerId,
      ) ?? null
    );
  }

  const { data, error } = await getSupabase()
    .from('peer_ratings')
    .select('*')
    .eq('rater_player_id', raterPlayerId)
    .eq('rated_player_id', ratedPlayerId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToRating(data as RatingRow) : null;
}

export function cooldownRemainingMs(rating: PeerRating | null, now = Date.now()): number {
  if (!rating) return 0;
  const elapsed = now - new Date(rating.updatedAt).getTime();
  return Math.max(0, PEER_RATING_COOLDOWN_MS - elapsed);
}

export async function upsertPeerRating(input: {
  groupSlug: string;
  raterPlayerId: string;
  ratedPlayerId: string;
  stats: PlayerStats;
}): Promise<PeerRating> {
  if (input.raterPlayerId === input.ratedPlayerId) {
    throw new Error('You cannot rate yourself');
  }

  const existing = await getRatingForPair(input.raterPlayerId, input.ratedPlayerId);
  const remaining = cooldownRemainingMs(existing);
  if (remaining > 0) {
    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    throw new Error(`You can rate this player again in ${days} day${days === 1 ? '' : 's'}`);
  }

  const now = new Date().toISOString();
  const rating: PeerRating = {
    id: existing?.id ?? crypto.randomUUID(),
    groupSlug: input.groupSlug,
    raterPlayerId: input.raterPlayerId,
    ratedPlayerId: input.ratedPlayerId,
    ...input.stats,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (useLocal()) {
    const store = await readLocalStore();
    const idx = store.ratings.findIndex(
      (r) =>
        r.raterPlayerId === input.raterPlayerId && r.ratedPlayerId === input.ratedPlayerId,
    );
    if (idx >= 0) store.ratings[idx] = rating;
    else store.ratings.push(rating);
    await writeLocalStore(store);
    return rating;
  }

  const row = {
    id: rating.id,
    group_slug: rating.groupSlug,
    rater_player_id: rating.raterPlayerId,
    rated_player_id: rating.ratedPlayerId,
    pace: rating.pace,
    shooting: rating.shooting,
    passing: rating.passing,
    dribbling: rating.dribbling,
    defending: rating.defending,
    physicality: rating.physicality,
    stamina: rating.stamina,
    created_at: rating.createdAt,
    updated_at: rating.updatedAt,
  };

  const { data, error } = await getSupabase()
    .from('peer_ratings')
    .upsert(row, { onConflict: 'rater_player_id,rated_player_id' })
    .select('*')
    .single();

  if (error) throw error;
  return rowToRating(data as RatingRow);
}

export async function listRatingsByGroup(groupSlug: string): Promise<PeerRating[]> {
  if (useLocal()) {
    const store = await readLocalStore();
    return store.ratings
      .filter((r) => r.groupSlug === groupSlug)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  const { data, error } = await getSupabase()
    .from('peer_ratings')
    .select('*')
    .eq('group_slug', groupSlug)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToRating(row as RatingRow));
}

/** Public feed: last 30 days, at most 2 rows per rater→rated pair. */
export function filterPublicPeerReviews(ratings: PeerRating[], now = Date.now()): PeerRating[] {
  const cutoff = now - PUBLIC_PEER_REVIEW_WINDOW_MS;
  const recent = ratings
    .filter((r) => new Date(r.updatedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const counts = new Map<string, number>();
  const out: PeerRating[] = [];
  for (const rating of recent) {
    const key = `${rating.raterPlayerId}:${rating.ratedPlayerId}`;
    const n = counts.get(key) ?? 0;
    if (n >= PUBLIC_PEER_REVIEW_MAX_PER_PAIR) continue;
    counts.set(key, n + 1);
    out.push(rating);
  }
  return out;
}

export async function listPublicPeerReviews(groupSlug: string): Promise<PeerRating[]> {
  const all = await listRatingsByGroup(groupSlug);
  return filterPublicPeerReviews(all);
}

export async function deletePeerRating(groupSlug: string, ratingId: string): Promise<boolean> {
  if (useLocal()) {
    const store = await readLocalStore();
    const before = store.ratings.length;
    store.ratings = store.ratings.filter(
      (r) => !(r.id === ratingId && r.groupSlug === groupSlug),
    );
    if (store.ratings.length === before) return false;
    await writeLocalStore(store);
    return true;
  }

  const { data, error } = await getSupabase()
    .from('peer_ratings')
    .delete()
    .eq('id', ratingId)
    .eq('group_slug', groupSlug)
    .select('id');

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function listRatingsByRater(raterPlayerId: string): Promise<PeerRating[]> {
  if (useLocal()) {
    const store = await readLocalStore();
    return store.ratings.filter((r) => r.raterPlayerId === raterPlayerId);
  }

  const { data, error } = await getSupabase()
    .from('peer_ratings')
    .select('*')
    .eq('rater_player_id', raterPlayerId);

  if (error) throw error;
  return (data ?? []).map((row) => rowToRating(row as RatingRow));
}

export async function getPeerRatingSummaries(groupSlug: string): Promise<Map<string, PeerRatingSummary>> {
  let ratings: PeerRating[];

  if (useLocal()) {
    const store = await readLocalStore();
    ratings = store.ratings.filter((r) => r.groupSlug === groupSlug);
  } else {
    const { data, error } = await getSupabase()
      .from('peer_ratings')
      .select('*')
      .eq('group_slug', groupSlug);
    if (error) throw error;
    ratings = (data ?? []).map((row) => rowToRating(row as RatingRow));
  }

  const byPlayer = new Map<string, PeerRating[]>();
  for (const rating of ratings) {
    const list = byPlayer.get(rating.ratedPlayerId) ?? [];
    list.push(rating);
    byPlayer.set(rating.ratedPlayerId, list);
  }

  const summaries = new Map<string, PeerRatingSummary>();
  for (const [playerId, list] of byPlayer) {
    const stats = {} as PlayerStats;
    for (const key of STAT_KEYS) {
      const sum = list.reduce((acc, r) => acc + r[key], 0);
      stats[key] = roundRating(sum / list.length);
    }
    summaries.set(playerId, {
      playerId,
      ratingCount: list.length,
      stats,
      ovr: calculateOvr(stats),
    });
  }

  return summaries;
}

/** When peer ratings toggle is on, replace admin stats with peer averages (if any). */
export async function applyEffectiveRatingsForGroup(
  groupSlug: string,
  players: Player[],
): Promise<Player[]> {
  try {
    const enabled = await getUsePeerRatings();
    if (!enabled) return players;

    const summaries = await getPeerRatingSummaries(groupSlug);
    return players.map((player) => {
      const summary = summaries.get(player.id);
      if (!summary?.stats || summary.ratingCount === 0) return player;
      return {
        ...player,
        ...summary.stats,
        ovr: summary.ovr ?? player.ovr,
      };
    });
  } catch {
    return players;
  }
}
