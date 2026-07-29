import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogIn, Save, User } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  getBrowserSupabase,
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

function formatCooldown(ms: number) {
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? '' : 's'}`;
}

export function RatePlayersPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [targets, setTargets] = useState<RateTarget[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats>(emptyStats());
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  async function loadTargets() {
    setLoading(true);
    setError('');
    try {
      const session = await getGoogleSession();
      setSignedIn(Boolean(session));
      if (!session) {
        setTargets([]);
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
    if (!isGoogleAuthConfigured()) {
      setLoading(false);
      return;
    }

    void loadTargets();

    const { data } = getBrowserSupabase().auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      if (session) void loadTargets();
      else {
        setTargets([]);
        setLoading(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, [slug]);

  function startRate(target: RateTarget) {
    if (!target.canRate) return;
    setActiveId(target.player.id);
    if (target.myRating) {
      setStats({
        pace: clampStat(target.myRating.pace),
        shooting: clampStat(target.myRating.shooting),
        passing: clampStat(target.myRating.passing),
        dribbling: clampStat(target.myRating.dribbling),
        defending: clampStat(target.myRating.defending),
        physicality: clampStat(target.myRating.physicality),
        stamina: clampStat(target.myRating.stamina),
      });
    } else {
      setStats(emptyStats());
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setSaving(true);
    setError('');
    try {
      await api.submitRating(slug, activeId, stats);
      setActiveId(null);
      await loadTargets();
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to={`/${slug}`} className="text-elite-700 hover:underline">
              Back to group
            </Link>
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">Rate teammates</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Rate others only — not yourself. Tap <strong>Rate</strong> to open the sliders. You can
            update each teammate again after two weeks.
          </p>
        </div>
        {signedIn ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void signOutGoogle().then(loadTargets)}
          >
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

      {!loading && !signedIn ? (
        <div className="card space-y-3 p-5">
          <p className="text-sm text-slate-600">Sign in with Google to rate teammates.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void signInWithGoogle(`/${slug}/rate`)}
          >
            <LogIn className="h-4 w-4" /> Continue with Google
          </button>
        </div>
      ) : null}

      {!loading && signedIn ? (
        <div className="space-y-3">
          {targets.length === 0 ? (
            <p className="text-sm text-slate-500">No teammates to rate yet.</p>
          ) : null}

          {targets.map((target) => (
            <div key={target.player.id} className="card space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-elite-50 ring-1 ring-slate-200">
                    {target.player.photoUrl ? (
                      <img
                        src={target.player.photoUrl}
                        alt={target.player.name}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{target.player.name}</p>
                    <p className="text-xs text-slate-500">
                      Peer avg OVR{' '}
                      {target.peerOvr != null ? roundRating(target.peerOvr) : '—'} ·{' '}
                      {target.ratingCount} rating{target.ratingCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                {target.canRate ? (
                  <button type="button" className="btn-secondary" onClick={() => startRate(target)}>
                    {activeId === target.player.id
                      ? 'Rating…'
                      : target.myRating
                        ? 'Update rating'
                        : 'Rate'}
                  </button>
                ) : (
                  <p className="text-xs font-medium text-amber-700">
                    Available again in {formatCooldown(target.cooldownRemainingMs)}
                  </p>
                )}
              </div>

              {activeId === target.player.id ? (
                <form onSubmit={submit} className="space-y-3 border-t border-slate-100 pt-3">
                  <p className="text-sm font-display font-bold text-elite-600">
                    Your rating OVR {roundRating(calculateOvr(stats))}
                  </p>
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
                        className="h-6 w-full accent-elite-600"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save rating'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setActiveId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
