import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { roundRating } from '@shared/types';

type RatingRow = {
  id: string;
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
};

function dayKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date(y, m - 1, d));
}

export function AdminPeerRatingsPanel({ slug }: { slug: string }) {
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .adminGetPeerRatings(slug)
      .then((data) => setRatings(data.ratings))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load ratings');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(row: RatingRow) {
    if (
      !confirm(
        `Remove ${row.raterName}'s rating of ${row.ratedName}? They can rate this player again immediately.`,
      )
    ) {
      return;
    }

    setDeletingId(row.id);
    setError('');
    try {
      await api.adminDeletePeerRating(slug, row.id);
      setRatings((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete rating');
    } finally {
      setDeletingId(null);
    }
  }

  const dayOptions = useMemo(() => {
    const keys = [...new Set(ratings.map((r) => dayKey(r.updatedAt)))].sort((a, b) =>
      b.localeCompare(a),
    );
    return keys;
  }, [ratings]);

  const filtered = useMemo(() => {
    if (!dayFilter) return ratings;
    return ratings.filter((r) => dayKey(r.updatedAt) === dayFilter);
  }, [ratings, dayFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, RatingRow[]>();
    for (const row of filtered) {
      const key = dayKey(row.updatedAt);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  if (loading) return <p className="text-sm text-slate-500">Loading peer ratings…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Peer ratings</h2>
          <p className="text-sm text-slate-500">
            Who rated whom · remove a rating anytime · player can re-rate after removal
          </p>
        </div>
        <div>
          <label className="label" htmlFor="rating-day">
            Day slice
          </label>
          <select
            id="rating-day"
            className="input min-w-[220px]"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="">All days</option>
            {dayOptions.map((key) => (
              <option key={key} value={key}>
                {formatDayLabel(key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {ratings.length === 0 ? (
        <div className="card p-5 text-sm text-slate-600">No peer ratings yet for this group.</div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-sm text-slate-600">No ratings on that day.</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, rows]) => (
            <section key={day} className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">
                {formatDayLabel(day)}
                <span className="ml-2 font-normal text-slate-400">
                  · {rows.length} rating{rows.length === 1 ? '' : 's'}
                </span>
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Rater</th>
                      <th className="px-3 py-2 font-semibold">Rated</th>
                      <th className="px-3 py-2 font-semibold">OVR</th>
                      <th className="px-3 py-2 font-semibold">PAC</th>
                      <th className="px-3 py-2 font-semibold">SHO</th>
                      <th className="px-3 py-2 font-semibold">PAS</th>
                      <th className="px-3 py-2 font-semibold">DRI</th>
                      <th className="px-3 py-2 font-semibold">DEF</th>
                      <th className="px-3 py-2 font-semibold">PHY</th>
                      <th className="px-3 py-2 font-semibold">STA</th>
                      <th className="px-3 py-2 font-semibold">Modified</th>
                      <th className="px-3 py-2 font-semibold"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 font-medium text-slate-900">{row.raterName}</td>
                        <td className="px-3 py-2 text-slate-800">{row.ratedName}</td>
                        <td className="px-3 py-2 font-semibold text-elite-700">
                          {roundRating(row.ovr)}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{row.pace}</td>
                        <td className="px-3 py-2 tabular-nums">{row.shooting}</td>
                        <td className="px-3 py-2 tabular-nums">{row.passing}</td>
                        <td className="px-3 py-2 tabular-nums">{row.dribbling}</td>
                        <td className="px-3 py-2 tabular-nums">{row.defending}</td>
                        <td className="px-3 py-2 tabular-nums">{row.physicality}</td>
                        <td className="px-3 py-2 tabular-nums">{row.stamina}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">
                          {formatDate(row.updatedAt)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            disabled={deletingId === row.id}
                            onClick={() => void handleDelete(row)}
                            aria-label={`Remove rating from ${row.raterName} of ${row.ratedName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === row.id ? 'Removing…' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
