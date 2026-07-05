import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Share2 } from 'lucide-react';
import { PitchView } from '@/components/PitchView';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { getMatchSizeLabel, type MatchRecord, type Player } from '@shared/types';

function buildShareText(match: MatchRecord, url: string): string {
  const sizeLabel = getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length);
  const title = match.name.trim() || `${sizeLabel} lineup`;
  return `${title}\n${sizeLabel} · ${formatDate(match.date)}\n${url}`;
}

export function MatchPage() {
  const { slug = '', matchId = '' } = useParams();
  const [groupName, setGroupName] = useState('');
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([api.getMatch(slug, matchId), api.getGroup(slug)])
      .then(([matchData, groupData]) => {
        setMatch(matchData);
        setGroupName(groupData.name);
        setPlayers(groupData.players);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load match');
      })
      .finally(() => setLoading(false));
  }, [slug, matchId]);

  async function copyShareLink() {
    if (!match) return;
    const text = buildShareText(match, window.location.href);
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({
          title: match.name.trim() || groupName,
          text,
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setError('Could not copy — copy the URL from your browser bar.');
      }
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading match…</p>;
  }

  if (error || !match) {
    return (
      <div className="card p-6">
        <p className="text-red-600">{error || 'Match not found'}</p>
        <Link to={`/${slug}`} className="btn-secondary mt-4 inline-flex">
          Back to squad
        </Link>
      </div>
    );
  }

  const matchLabel = getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length);
  const displayTitle = match.name.trim() || `${matchLabel} lineup`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{groupName}</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{displayTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {matchLabel} · {formatDate(match.date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={copyShareLink}>
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied' : 'Share match'}
          </button>
          <Link to={`/${slug}`} className="btn-secondary">
            New match
          </Link>
          <Link to={`/${slug}/history`} className="btn-secondary">
            History
          </Link>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Share includes the match name and link — anyone can view this lineup for 30 days.
      </p>

      <PitchView match={match} roster={players} />
    </div>
  );
}
