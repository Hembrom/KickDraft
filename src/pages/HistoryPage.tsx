import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatRatingGap, getMatchSizeLabel, type MatchRecord } from '@shared/types';

export function HistoryPage() {
  const { slug = '' } = useParams();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMatches(slug)
      .then((matchData) => {
        setMatches(matchData.matches);
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
            <Link
              key={match.id}
              to={`/${slug}/match/${match.id}`}
              className="card flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-elite-50/60"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {match.name.trim() || getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length)}
                </p>
                <p className="text-xs text-slate-500">
                  {match.name.trim()
                    ? `${getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length)} · `
                    : ''}
                  {formatRatingGap(match.ratingDifference)} · {formatDate(match.date)}
                </p>
              </div>
              <span className="text-xs font-medium text-elite-600">View</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
