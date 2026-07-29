import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [targets, setTargets] = useState<RateTarget[]>([]);
  const [claimedPlayerId, setClaimedPlayerId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats>(emptyStats());
  const [saving, setSaving] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [hasClaim, setHasClaim] = useState(false);

  async function loadPage() {
    setLoading(true);
    setError('');
    try {
      const group = await api.getGroup(slug);
      setPlayers(group.players);

      const session = await getGoogleSession();
      setSignedIn(Boolean(session));

      if (!session) {
        setHasClaim(false);
        setClaimedPlayerId(null);
        setTargets([]);
        return;
      }

      const me = await api.getMe();
      if (!me.claim || me.claim.groupSlug !== slug) {
        setHasClaim(false);
        setClaimedPlayerId(null);
        setTargets([]);
        return;
      }

      setHasClaim(true);
      setClaimedPlayerId(me.claim.playerId);
      const data = await api.getRatings(slug);
      setTargets(data.targets);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();

    if (!isGoogleAuthConfigured()) return;

    const { data } = getBrowserSupabase().auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      void loadPage();
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
      await loadPage();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save rating');
    } finally {
      setSaving(false);
    }
  }

  const listPlayers =
    hasClaim && targets.length > 0
      ? targets.map((t) => t.player)
      : players.filter((p) => p.id !== claimedPlayerId);

  const targetById = new Map(targets.map((t) => [t.player.id, t]));

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
            Browse the squad below. Sign in and claim your player to rate others (once every two
            weeks per teammate).
          </p>
        </div>
        {signedIn ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void signOutGoogle().then(loadPage)}
          >
            Sign out
          </button>
        ) : isGoogleAuthConfigured() ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => void signInWithGoogle(`/${slug}/rate`)}
          >
            <LogIn className="h-4 w-4" /> Continue with Google
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!signedIn && isGoogleAuthConfigured() ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-600">Sign in to claim your card and open the rating sliders.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => void signInWithGoogle(`/${slug}/rate`)}
          >
            <LogIn className="h-4 w-4" /> Continue with Google
          </button>
        </div>
      ) : null}

      {signedIn && !hasClaim ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-slate-600">Claim your player first, then you can rate teammates.</p>
          <Link to={`/${slug}/claim`} className="btn-primary inline-flex">
            Claim your player
          </Link>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading players…</p>
      ) : listPlayers.length === 0 ? (
        <p className="text-sm text-slate-500">No players in this group yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {listPlayers.map((player) => {
            const target = targetById.get(player.id);
            const isActive = activeId === player.id && hasClaim;

            return (
              <div key={player.id} className="space-y-2">
                <div className="card overflow-hidden p-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-elite-50 ring-1 ring-slate-200">
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{player.name}</p>
                      <p className="text-xs font-display font-bold text-elite-600">
                        OVR {roundRating(player.ovr)}
                      </p>
                      {hasClaim && target ? (
                        <p className="text-[11px] text-slate-500">
                          Peer {target.peerOvr != null ? roundRating(target.peerOvr) : '—'} ·{' '}
                          {target.ratingCount} rating{target.ratingCount === 1 ? '' : 's'}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {hasClaim && target ? (
                    <div className="mt-2">
                      {target.canRate ? (
                        <button
                          type="button"
                          className="btn-secondary w-full justify-center text-xs"
                          onClick={() => startRate(target)}
                        >
                          {isActive ? 'Rating…' : target.myRating ? 'Update' : 'Rate'}
                        </button>
                      ) : (
                        <p className="text-center text-[11px] font-medium text-amber-700">
                          Again in {formatCooldown(target.cooldownRemainingMs)}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                {isActive && target ? (
                  <form onSubmit={submit} className="card col-span-2 space-y-3 p-3 sm:col-span-1">
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
                      <button type="submit" className="btn-primary flex-1" disabled={saving}>
                        <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setActiveId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
