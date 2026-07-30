import type {
  GroupMeta,
  MatchRecord,
  Player,
  PlayerClaim,
  PlayerStats,
  PeerRating,
} from '@shared/types';
import { normalizePlayer } from '@shared/types';
import { getAdminToken } from './utils';
import { getGoogleAccessToken } from './supabase-auth';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? 'Request failed');
  }
  return data as T;
}

function adminHeaders(): Record<string, string> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function playerHeaders(): Promise<Record<string, string>> {
  const token = await getGoogleAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function withPlayers<T extends { players: Player[] }>(data: T): T {
  return { ...data, players: data.players.map((player) => normalizePlayer(player)) };
}

function withPlayer(player: Player): Player {
  return normalizePlayer(player);
}

export const api = {
  listGroups() {
    return request<{ groups: GroupMeta[] }>('/api/groups');
  },

  getGroup(slug: string) {
    return request<GroupMeta & { players: Player[] }>(`/api/groups/${slug}`).then(withPlayers);
  },

  getMatches(slug: string) {
    return request<{ matches: MatchRecord[] }>(`/api/groups/${slug}/matches`);
  },

  getMatch(slug: string, matchId: string) {
    return request<MatchRecord>(`/api/groups/${slug}/matches/${matchId}`);
  },

  generateMatch(slug: string, playerIds: string[], name: string, teamCount: 2 | 3 = 2) {
    return request<MatchRecord>(`/api/groups/${slug}/matches`, {
      method: 'POST',
      body: JSON.stringify({ playerIds, name, teamCount }),
    });
  },

  updateMatchTeamNames(
    slug: string,
    matchId: string,
    teamNames: { teamA?: string; teamB?: string; teamC?: string },
  ) {
    return request<MatchRecord>(`/api/groups/${slug}/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        namesOnly: true,
        teamAName: teamNames.teamA,
        teamBName: teamNames.teamB,
        teamCName: teamNames.teamC,
      }),
    });
  },

  updateMatch(
    slug: string,
    matchId: string,
    teamAPlayerIds: string[],
    teamBPlayerIds: string[],
    teamCPlayerIds?: string[],
    teamNames?: { teamA?: string; teamB?: string; teamC?: string },
  ) {
    return request<MatchRecord>(`/api/groups/${slug}/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        teamAPlayerIds,
        teamBPlayerIds,
        teamCPlayerIds,
        teamAName: teamNames?.teamA,
        teamBName: teamNames?.teamB,
        teamCName: teamNames?.teamC,
      }),
    });
  },

  async getMe() {
    return request<{
      user: { id: string; email: string } | null;
      claim: PlayerClaim | null;
      claimedPlayer: Player | null;
      usePeerRatings: boolean;
    }>('/api/me', { headers: await playerHeaders() });
  },

  async getClaimStatus(slug: string) {
    const data = await request<{
      group: GroupMeta;
      players: Player[];
      claim: PlayerClaim | null;
      alreadyClaimedElsewhere: boolean;
      unclaimedPlayers: Player[];
      claimedPlayerIds: string[];
      signedIn: boolean;
    }>(`/api/groups/${slug}/claim`, { headers: await playerHeaders() });
    return {
      ...data,
      players: data.players.map(normalizePlayer),
      unclaimedPlayers: data.unclaimedPlayers.map(normalizePlayer),
    };
  },

  async claimPlayer(slug: string, playerId: string) {
    const data = await request<{ claim: PlayerClaim; player: Player }>(
      `/api/groups/${slug}/claim`,
      {
        method: 'POST',
        headers: await playerHeaders(),
        body: JSON.stringify({ playerId }),
      },
    );
    return { ...data, player: normalizePlayer(data.player) };
  },

  async getRatings(slug: string) {
    const data = await request<{
      claimedPlayerId: string;
      targets: Array<{
        player: Player;
        myRating: PeerRating | null;
        canRate: boolean;
        cooldownRemainingMs: number;
        peerAverage: PlayerStats | null;
        peerOvr: number | null;
        ratingCount: number;
      }>;
    }>(`/api/groups/${slug}/ratings`, { headers: await playerHeaders() });
    return {
      ...data,
      targets: data.targets.map((t) => ({ ...t, player: normalizePlayer(t.player) })),
    };
  },

  async submitRating(slug: string, ratedPlayerId: string, stats: PlayerStats) {
    return request<{ rating: PeerRating }>(`/api/groups/${slug}/ratings`, {
      method: 'POST',
      headers: await playerHeaders(),
      body: JSON.stringify({ ratedPlayerId, stats }),
    });
  },

  getPublicPeerReviews(slug: string) {
    return request<{
      group: GroupMeta;
      windowDays: number;
      maxPerPair: number;
      ratings: Array<{
        id: string;
        raterPlayerId: string;
        ratedPlayerId: string;
        raterName: string;
        ratedName: string;
        pace: number;
        shooting: number;
        passing: number;
        dribbling: number;
        defending: number;
        physicality: number;
        stamina: number;
        ovr: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(`/api/groups/${slug}/peer-reviews`);
  },

  adminLogin(password: string) {
    return request<{ token: string; role: 'admin' | 'super' }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  adminMe() {
    return request<{ role: 'admin' | 'super' }>('/api/admin/me', {
      headers: adminHeaders(),
    });
  },

  adminListGroups() {
    return request<{ groups: GroupMeta[] }>('/api/admin/groups', {
      headers: adminHeaders(),
    });
  },

  adminGetSettings() {
    return request<{ usePeerRatings: boolean }>('/api/admin/settings', {
      headers: adminHeaders(),
    });
  },

  adminSetPeerRatings(usePeerRatings: boolean) {
    return request<{ usePeerRatings: boolean }>('/api/admin/settings', {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify({ usePeerRatings }),
    });
  },

  adminCreateGroup(name: string, slug?: string) {
    return request<GroupMeta>('/api/admin/groups', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ name, slug }),
    });
  },

  adminGetGroup(slug: string) {
    return request<GroupMeta & { players: Player[] }>(
      `/api/admin/groups/${slug}/players`,
      { headers: adminHeaders() },
    ).then(withPlayers);
  },

  adminGetPeerRatings(slug: string) {
    return request<{
      group: GroupMeta;
      cooldownDays: number;
      ratings: Array<{
        id: string;
        raterPlayerId: string;
        ratedPlayerId: string;
        raterName: string;
        ratedName: string;
        pace: number;
        shooting: number;
        passing: number;
        dribbling: number;
        defending: number;
        physicality: number;
        stamina: number;
        ovr: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(`/api/admin/groups/${slug}/ratings`, { headers: adminHeaders() });
  },

  adminDeletePeerRating(slug: string, ratingId: string) {
    return request<{ ok: boolean }>(
      `/api/admin/groups/${slug}/ratings?id=${encodeURIComponent(ratingId)}`,
      {
        method: 'DELETE',
        headers: adminHeaders(),
      },
    );
  },

  adminGetClaims(slug: string) {
    return request<{
      group: GroupMeta;
      claims: Array<{
        googleUserId: string;
        email: string;
        playerId: string;
        playerName: string;
        photoUrl: string | null;
        claimedAt: string;
      }>;
    }>(`/api/admin/groups/${slug}/claims`, { headers: adminHeaders() });
  },

  adminUnclaimPlayer(slug: string, playerId: string) {
    return request<{ ok: boolean }>(
      `/api/admin/groups/${slug}/claims?playerId=${encodeURIComponent(playerId)}`,
      {
        method: 'DELETE',
        headers: adminHeaders(),
      },
    );
  },

  adminCreatePlayer(slug: string, payload: Record<string, unknown>) {
    return request<Player>(`/api/admin/groups/${slug}/players`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    }).then(withPlayer);
  },

  adminUpdatePlayer(slug: string, payload: Record<string, unknown>) {
    return request<Player>(`/api/admin/groups/${slug}/players`, {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    }).then(withPlayer);
  },

  adminDeletePlayer(slug: string, id: string) {
    return request<{ ok: boolean }>(
      `/api/admin/groups/${slug}/players?id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: adminHeaders(),
      },
    );
  },

  adminUploadImage(slug: string, playerId: string, imageBase64: string, mimeType: string) {
    return request<{ url: string }>(`/api/admin/groups/${slug}/upload?playerId=${playerId}`, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ playerId, imageBase64, mimeType }),
    });
  },
};

export { ApiError };
