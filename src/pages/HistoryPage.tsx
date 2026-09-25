import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { formatMatchScore } from '@shared/match-result';
import { formatRatingGap, getMatchLabel, isRotationMatch, type MatchRecord } from '@shared/types';

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
        <div className="flex flex-wrap gap-2">
          <Link to={`/${slug}/league`} className="btn-secondary">
            League status
          </Link>
          <Link to={`/${slug}/games-played`} className="btn-secondary">
            Games played
          </Link>
          <Link to={`/${slug}`} className="btn-secondary">
            Back to squad
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : matches.length === 0 ? (
        <div className="card p-6 text-sm text-slate-600">No matches yet for this squad.</div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const score = formatMatchScore(match);
            return (
            <Link
              key={match.id}
              to={`/${slug}/match/${match.id}`}
              className="card flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-elite-50/60"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {match.name.trim() || getMatchLabel(match)}
                  {match.external ? (
                    <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                      External
                    </span>
                  ) : null}
                  {match.recordedAsPlayed ? (
                    <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Played
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {score ? (
                    <span className="mr-2 font-semibold text-slate-700">{score}</span>
                  ) : null}
                  {match.name.trim() ? `${getMatchLabel(match)} · ` : ''}
                  {isRotationMatch(match) ? '' : `${formatRatingGap(match.ratingDifference)} · `}
                  {formatDate(match.date)}
                </p>
              </div>
              <span className="text-xs font-medium text-elite-600">View</span>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
