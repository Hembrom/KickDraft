import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogIn, Save, User, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  getGoogleSession,
  isGoogleAuthConfigured,
  signInWithGoogle,
  signOutGoogle,
} from '@/lib/supabase-auth';
import {
  STAT_KEYS,
  STAT_MAX,
  STAT_MIN,
  calculateOvr,
  roundRating,
  type Player,
  type PlayerStats,
  type PeerRating,
} from '@shared/types';

type RateTarget = {
  player: Player;
  myRating: PeerRating | null;
  canRate: boolean;
  cooldownRemainingMs: number;
  peerAverage: PlayerStats | null;
  peerOvr: number | null;
  ratingCount: number;
};

function emptyStats(): PlayerStats {
  return {
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physicality: 50,
    stamina: 50,
  };
}

function clampStat(value: number) {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(value)));
}

function statsFromRating(rating: PeerRating): PlayerStats {
  return {
    pace: clampStat(rating.pace),
    shooting: clampStat(rating.shooting),
    passing: clampStat(rating.passing),
    dribbling: clampStat(rating.dribbling),
    defending: clampStat(rating.defending),
    physicality: clampStat(rating.physicality),
    stamina: clampStat(rating.stamina),
  };
}

function formatCooldown(ms: number) {
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? '' : 's'}`;
}

export function RatePlayersPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [targets, setTargets] = useState<RateTarget[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats>(emptyStats());
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const activeTarget = useMemo(
    () => targets.find((t) => t.player.id === activeId) ?? null,
    [targets, activeId],
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const session = await getGoogleSession();
      setSignedIn(Boolean(session));
      if (!session) {
        setLoading(false);
        return;
      }

      const me = await api.getMe();
      if (!me.claim) {
        navigate(`/${slug}/claim`, { replace: true });
        return;
      }
      if (me.claim.groupSlug !== slug) {
        navigate(`/${me.claim.groupSlug}/rate`, { replace: true });
        return;
      }

      const data = await api.getRatings(slug);
      setTargets(data.targets);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        navigate(`/${slug}/claim`, { replace: true });
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  useEffect(() => {
    if (!activeTarget) return;
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeTarget]);

  function startRate(target: RateTarget) {
    if (!target.canRate) return;
    setActiveId(target.player.id);
    setStats(target.myRating ? statsFromRating(target.myRating) : emptyStats());
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setSaving(true);
    setError('');
    try {
      await api.submitRating(slug, activeId, stats);
      setActiveId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save rating');
    } finally {
      setSaving(false);
    }
  }

  if (!isGoogleAuthConfigured()) {
    return (
      <div className="card p-5 text-sm text-slate-600">Google login is not configured.</div>
    );
  }

  return (
    <div className={cn('space-y-6', activeTarget && 'pb-72')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to={`/${slug}`} className="text-elite-700 hover:underline">
              Back to group
            </Link>
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">Rate teammates</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Tap a player card to open the rating sliders. You can update each teammate again after
            two weeks.
          </p>
        </div>
        {signedIn ? (
          <button type="button" className="btn-secondary" onClick={() => void signOutGoogle().then(load)}>
            Sign out
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={() => void signInWithGoogle(`/${slug}/rate`)}
          >
            <LogIn className="h-4 w-4" /> Continue with Google
          </button>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {!loading && signedIn ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {targets.map((target) => {
            const selected = activeId === target.player.id;
            return (
              <button
                key={target.player.id}
                type="button"
                disabled={!target.canRate}
                onClick={() => startRate(target)}
                className={cn(
                  'card flex flex-col overflow-hidden p-0 text-left transition',
                  selected && 'border-elite-400 ring-2 ring-elite-200',
                  target.canRate
                    ? 'hover:border-elite-300 hover:shadow-md'
                    : 'cursor-not-allowed opacity-60',
                )}
              >
                <div className="relative aspect-square w-full bg-elite-50">
                  {target.player.photoUrl ? (
                    <img
                      src={target.player.photoUrl}
                      alt={target.player.name}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <User className="h-12 w-12" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="truncate font-semibold text-slate-900">{target.player.name}</p>
                  <p className="text-xs text-slate-500">
                    Peer OVR {target.peerOvr != null ? roundRating(target.peerOvr) : '—'} ·{' '}
                    {target.ratingCount} rating{target.ratingCount === 1 ? '' : 's'}
                  </p>
                  {target.canRate ? (
                    <span className="mt-auto text-xs font-semibold text-elite-700">
                      {selected ? 'Rating…' : target.myRating ? 'Update rating' : 'Tap to rate'}
                    </span>
                  ) : (
                    <span className="mt-auto text-[11px] font-medium text-amber-700">
                      Again in {formatCooldown(target.cooldownRemainingMs)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {activeTarget ? (
        <form
          ref={panelRef}
          onSubmit={submit}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:p-5"
        >
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-elite-50 ring-1 ring-slate-200">
                  {activeTarget.player.photoUrl ? (
                    <img
                      src={activeTarget.player.photoUrl}
                      alt=""
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    Rating {activeTarget.player.name}
                  </p>
                  <p className="text-sm font-display font-bold text-elite-600">
                    Your rating OVR {roundRating(calculateOvr(stats))}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setActiveId(null)}
                aria-label="Close rating panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[40vh] gap-3 overflow-y-auto sm:grid-cols-2">
              {STAT_KEYS.map((key) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-xs capitalize text-slate-500">
                    <span>{key}</span>
                    <span className="font-semibold text-slate-800">{stats[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={STAT_MIN}
                    max={STAT_MAX}
                    value={stats[key]}
                    onChange={(e) =>
                      setStats((current) => ({ ...current, [key]: Number(e.target.value) }))
                    }
                    className="w-full accent-elite-600"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save rating'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setActiveId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
