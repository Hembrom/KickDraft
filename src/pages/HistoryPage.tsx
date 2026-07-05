import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PitchView } from '@/components/PitchView';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { getMatchSizeLabel, roundRating, type MatchRecord, type Player } from '@shared/types';

export function HistoryPage() {
  const { slug = '' } = useParams();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getMatches(slug), api.getGroup(slug)])
      .then(([matchData, groupData]) => {
        setMatches(matchData.matches);
        setPlayers(groupData.players);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load history');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last 30 days</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">Match history</h1>
        </div>
        <Link to={`/${slug}`} className="btn-secondary">
          Back to squad
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : matches.length === 0 ? (
        <div className="card p-6 text-sm text-slate-600">No matches yet for this squad.</div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <article key={match.id} className="card overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-elite-50/60"
                onClick={() => setExpanded(expanded === match.id ? null : match.id)}
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length)} · diff{' '}
                    {roundRating(match.ratingDifference)}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(match.date)}</p>
                </div>
                <span className="text-xs font-medium text-elite-600">
                  {expanded === match.id ? 'Hide' : 'View'}
                </span>
              </button>

              {expanded === match.id ? (
                <div className="border-t border-slate-200 p-4">
                  <PitchView match={match} roster={players} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
