import { useCallback, useEffect, useState } from 'react';
import { Unlink, User } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatDate, isSuperAdmin } from '@/lib/utils';

type ClaimRow = {
  googleUserId: string;
  email: string;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  claimedAt: string;
};

export function AdminClaimsPanel({ slug }: { slug: string }) {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);
  const [isSuper, setIsSuper] = useState(isSuperAdmin());

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([api.adminGetClaims(slug), api.adminMe().catch(() => null)])
      .then(([data, me]) => {
        setClaims(data.claims);
        if (me?.role) setIsSuper(me.role === 'super');
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load claims');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnclaim(row: ClaimRow) {
    if (
      !confirm(
        `Unclaim ${row.playerName} from ${row.email}?\n\nThey can claim another player later. Past ratings they gave stay in the system.`,
      )
    ) {
      return;
    }

    setUnclaimingId(row.playerId);
    setError('');
    try {
      await api.adminUnclaimPlayer(slug, row.playerId);
      setClaims((prev) => prev.filter((c) => c.playerId !== row.playerId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to unclaim');
    } finally {
      setUnclaimingId(null);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading claims…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900">Player claims</h2>
        <p className="text-sm text-slate-500">
          Google account ↔ player link
          {isSuper
            ? ' · super admin can unclaim'
            : ' · view only (super admin can unclaim)'}
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {claims.length === 0 ? (
        <div className="card p-5 text-sm text-slate-600">No players claimed yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Player</th>
                <th className="px-3 py-2 font-semibold">Google email</th>
                <th className="px-3 py-2 font-semibold">Claimed</th>
                {isSuper ? <th className="px-3 py-2 font-semibold"> </th> : null}
              </tr>
            </thead>
            <tbody>
              {claims.map((row) => (
                <tr key={row.playerId} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-elite-50 ring-1 ring-slate-200">
                        {row.photoUrl ? (
                          <img
                            src={row.photoUrl}
                            alt=""
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{row.playerName}</p>
                        <p className="truncate text-[11px] text-slate-400">{row.playerId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-800">{row.email}</p>
                    <p className="truncate text-[11px] text-slate-400">{row.googleUserId}</p>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(row.claimedAt)}
                  </td>
                  {isSuper ? (
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        disabled={unclaimingId === row.playerId}
                        onClick={() => void handleUnclaim(row)}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        {unclaimingId === row.playerId ? 'Unclaiming…' : 'Unclaim'}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
