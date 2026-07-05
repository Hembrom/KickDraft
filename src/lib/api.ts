import type { GroupMeta, MatchRecord, Player } from '@shared/types';
import { normalizePlayer } from '@shared/types';
import { getAdminToken } from './utils';

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

  generateMatch(slug: string, format: number) {
    return request<MatchRecord>(`/api/groups/${slug}/matches`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  },

  adminLogin(password: string) {
    return request<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  adminListGroups() {
    return request<{ groups: GroupMeta[] }>('/api/admin/groups', {
      headers: adminHeaders(),
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
