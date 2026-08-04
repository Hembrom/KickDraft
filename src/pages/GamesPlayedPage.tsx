import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { PlayerGamesPlayed } from '@shared/types';

export function GamesPlayedPage() {
  const { slug = '' } = useParams();
  const [groupName, setGroupName] = useState('');
  const [players, setPlayers] = useState<PlayerGamesPlayed[]>([]);
  const [matches, setMatches] = useState<
    Array<{
      matchId: string;
      matchName: string;
      matchDate: string;
      format: number;
      teamCount: number;
      playerCount: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getAppearances(slug)
      .then((data) => {
        setGroupName(data.group.name);
        setPlayers(data.players);
        setMatches(data.recordedMatches);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load games played');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to={`/${slug}`} className="text-elite-700 hover:underline">
              {groupName || slug}
            </Link>
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">Games played</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Counts only matches an admin marked as officially played.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/${slug}/history`} className="btn-secondary">
            Match history
          </Link>
          <Link to={`/${slug}`} className="btn-secondary">
            Squad
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">By player</h2>
            {players.length === 0 ? (
              <div className="card p-5 text-sm text-slate-600">
                No recorded games yet. On a match page, an admin can check “Count as played”.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Player</th>
                      <th className="px-3 py-2 font-semibold">Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((row, index) => (
                      <tr key={row.playerId} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 tabular-nums text-slate-400">{index + 1}</td>
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
                            <span className="font-medium text-slate-900">{row.playerName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-display text-base font-bold text-elite-700 tabular-nums">
                          {row.gamesPlayed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Recorded matches</h2>
            {matches.length === 0 ? (
              <div className="card p-5 text-sm text-slate-600">None yet.</div>
            ) : (
              <div className="space-y-2">
                {matches.map((m) => (
                  <div key={m.matchId} className="card flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {m.matchName.trim() || `${m.format}-a-side`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {m.teamCount === 3 ? '3 teams' : '2 teams'} · {m.playerCount} players ·{' '}
                        {formatDate(m.matchDate)}
                      </p>
                    </div>
                    <Link
                      to={`/${slug}/match/${m.matchId}`}
                      className="text-xs font-medium text-elite-600 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
