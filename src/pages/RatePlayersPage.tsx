import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogIn, Save } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  getGoogleSession,
  isGoogleAuthConfigured,
  signInWithGoogle,
  signOutGoogle,
} from '@/lib/supabase-auth';
import {
  STAT_KEYS,
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

  function startRate(target: RateTarget) {
    if (!target.canRate) return;
    setActiveId(target.player.id);
    setStats(
      target.myRating
        ? {
            pace: target.myRating.pace,
            shooting: target.myRating.shooting,
            passing: target.myRating.passing,
            dribbling: target.myRating.dribbling,
            defending: target.myRating.defending,
            physicality: target.myRating.physicality,
            stamina: target.myRating.stamina,
          }
        : emptyStats(),
    );
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
            Rate others only — not yourself. You can update a player again after two weeks. When the
            admin turns peer ratings on, squad OVR uses the average of these ratings.
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
        <div className="space-y-3">
          {targets.map((target) => (
            <div key={target.player.id} className="card space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{target.player.name}</p>
                  <p className="text-xs text-slate-500">
                    Peer avg OVR{' '}
                    {target.peerOvr != null ? roundRating(target.peerOvr) : '—'} ·{' '}
                    {target.ratingCount} rating{target.ratingCount === 1 ? '' : 's'}
                  </p>
                </div>
                {target.canRate ? (
                  <button type="button" className="btn-secondary" onClick={() => startRate(target)}>
                    {target.myRating ? 'Update rating' : 'Rate'}
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
                        min={0}
                        max={100}
                        value={stats[key]}
                        onChange={(e) =>
                          setStats((current) => ({ ...current, [key]: Number(e.target.value) }))
                        }
                        className="w-full accent-elite-600"
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
