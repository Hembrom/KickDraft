import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { roundRating, type Player } from '@shared/types';

type ReviewRow = {
  raterPlayerId: string;
  ratedPlayerId: string;
  raterName: string;
  ratedName: string;
  ovr: number;
  updatedAt: string;
};

export function SessionWhoRatesWhom({
  slug,
  players,
}: {
  slug: string;
  players: Player[];
}) {
  const [ratings, setRatings] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const idKey = useMemo(
    () =>
      [...players.map((player) => player.id)]
        .sort()
        .join(','),
    [players],
  );

  useEffect(() => {
    const sessionIds = new Set(idKey.split(',').filter(Boolean));
    setLoading(true);
    setError('');
    api
      .getPublicPeerReviews(slug)
      .then((data) => {
        setRatings(
          data.ratings.filter(
            (row) => sessionIds.has(row.raterPlayerId) && sessionIds.has(row.ratedPlayerId),
          ),
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load who rated whom');
      })
      .finally(() => setLoading(false));
  }, [slug, idKey]);

  const byId = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);

  const ratedBy = useMemo(() => {
    const map = new Map<string, ReviewRow[]>();
    for (const row of ratings) {
      const list = map.get(row.raterPlayerId) ?? [];
      list.push(row);
      map.set(row.raterPlayerId, list);
    }
    return map;
  }, [ratings]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );

  return (
    <section className="card space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Who to rate with whom</h2>
          <p className="text-sm text-slate-600">
            Among today&apos;s players — who has already rated a teammate, and who still needs to.
          </p>
        </div>
        <Link to={`/${slug}/rate`} className="btn-secondary text-sm">
          Open rating page
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading ratings…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : sortedPlayers.length < 2 ? (
        <p className="text-sm text-slate-500">Need at least two players in this session.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {sortedPlayers.map((player) => {
            const given = ratedBy.get(player.id) ?? [];
            const givenIds = new Set(given.map((row) => row.ratedPlayerId));
            const stillToRate = sortedPlayers.filter(
              (other) => other.id !== player.id && !givenIds.has(other.id),
            );

            return (
              <article key={player.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="font-semibold text-slate-900">{player.name}</p>
                {given.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-600">
                    Rated:{' '}
                    {given
                      .map((row) => {
                        const name = byId.get(row.ratedPlayerId)?.name ?? row.ratedName;
                        return `${name} (${roundRating(row.ovr)})`;
                      })
                      .join(', ')}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Has not rated anyone here yet.</p>
                )}
                {stillToRate.length > 0 ? (
                  <p className="mt-1 text-xs text-amber-800">
                    Still to rate: {stillToRate.map((other) => other.name).join(', ')}
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-medium text-emerald-700">Caught up with this session.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
