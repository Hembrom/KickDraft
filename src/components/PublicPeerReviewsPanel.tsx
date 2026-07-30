import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { roundRating } from '@shared/types';

type ReviewRow = {
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

export function PublicPeerReviewsPanel({ slug }: { slug: string }) {
  const [ratings, setRatings] = useState<ReviewRow[]>([]);
  const [windowDays, setWindowDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [raterFilter, setRaterFilter] = useState('');
  const [ratedFilter, setRatedFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getPublicPeerReviews(slug)
      .then((data) => {
        setRatings(data.ratings);
        setWindowDays(data.windowDays);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load peer reviews');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const raterOptions = useMemo(() => {
    const names = [...new Set(ratings.map((r) => r.raterName))].sort((a, b) =>
      a.localeCompare(b),
    );
    return names;
  }, [ratings]);

  const ratedOptions = useMemo(() => {
    const names = [...new Set(ratings.map((r) => r.ratedName))].sort((a, b) =>
      a.localeCompare(b),
    );
    return names;
  }, [ratings]);

  const filtered = useMemo(() => {
    return ratings.filter((r) => {
      if (raterFilter && r.raterName !== raterFilter) return false;
      if (ratedFilter && r.ratedName !== ratedFilter) return false;
      return true;
    });
  }, [ratings, raterFilter, ratedFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ReviewRow[]>();
    for (const row of filtered) {
      const key = dayKey(row.updatedAt);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  if (loading) return <p className="text-sm text-slate-500">Loading peer reviews…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Public peer reviews from the last {windowDays} days (up to 2 per rater → rated pair).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div>
            <label className="label" htmlFor="public-rater">
              Rater
            </label>
            <select
              id="public-rater"
              className="input min-w-[160px]"
              value={raterFilter}
              onChange={(e) => setRaterFilter(e.target.value)}
            >
              <option value="">All raters</option>
              {raterOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="public-rated">
              Rated
            </label>
            <select
              id="public-rated"
              className="input min-w-[160px]"
              value={ratedFilter}
              onChange={(e) => setRatedFilter(e.target.value)}
            >
              <option value="">All rated</option>
              {ratedOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {ratings.length === 0 ? (
        <div className="card p-5 text-sm text-slate-600">
          No peer reviews in the last {windowDays} days yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-sm text-slate-600">No reviews match those filters.</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, rows]) => (
            <section key={day} className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">
                {formatDayLabel(day)}
                <span className="ml-2 font-normal text-slate-400">
                  · {rows.length} review{rows.length === 1 ? '' : 's'}
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
