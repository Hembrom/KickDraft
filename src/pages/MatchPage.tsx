import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Loader2, Share2 } from 'lucide-react';
import { PitchView } from '@/components/PitchView';
import { api, ApiError } from '@/lib/api';
import { shareMatchLineup } from '@/lib/share-match';
import { formatDate } from '@/lib/utils';
import { getMatchSizeLabel, type MatchRecord, type Player } from '@shared/types';

export function MatchPage() {
  const { slug = '', matchId = '' } = useParams();
  const [groupName, setGroupName] = useState('');
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pitchCaptureRef = useRef<HTMLDivElement>(null);

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

  async function handleShare() {
    if (!match || sharing) return;
    setSharing(true);
    setError('');
    try {
      const result = await shareMatchLineup({
        match,
        groupName,
        captureEl: pitchCaptureRef.current,
      });
      if (result === 'copied') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setError('Could not share — try copying the link from your browser bar.');
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading match…</p>;
  }

  if (error && !match) {
    return (
      <div className="card p-6">
        <p className="text-red-600">{error}</p>
        <Link to={`/${slug}`} className="btn-secondary mt-4 inline-flex">
          Back to squad
        </Link>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Match not found</p>
        <Link to={`/${slug}`} className="btn-secondary mt-4 inline-flex">
          Back to squad
        </Link>
      </div>
    );
  }

  const matchLabel = getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length);
  const displayTitle = (match.name ?? '').trim() || `${matchLabel} lineup`;

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
          <button
            type="button"
            className="btn-primary"
            disabled={sharing}
            onClick={handleShare}
          >
            {sharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {sharing ? 'Preparing…' : copied ? 'Copied' : 'Share match'}
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
        Share sends a pitch screenshot (teams on the ground) plus one link with the match name.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <PitchView pitchCaptureRef={pitchCaptureRef} match={match} roster={players} />
    </div>
  );
}
