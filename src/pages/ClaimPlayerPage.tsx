import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, LogIn, User } from 'lucide-react';
import { PublicPeerReviewsPanel } from '@/components/PublicPeerReviewsPanel';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  getGoogleSession,
  isGoogleAuthConfigured,
  signInWithGoogle,
  signOutGoogle,
} from '@/lib/supabase-auth';
import type { Player, PlayerClaim } from '@shared/types';

export function ClaimPlayerPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'claim' | 'reviews'>('claim');
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [claim, setClaim] = useState<PlayerClaim | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [elsewhere, setElsewhere] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const session = await getGoogleSession();
      setSignedIn(Boolean(session));

      const data = await api.getClaimStatus(slug);
      setGroupName(data.group.name);
      setPlayers(data.players);
      setClaimedIds(new Set(data.claimedPlayerIds));
      setClaim(data.claim);
      setElsewhere(data.alreadyClaimedElsewhere);
      setSignedIn(Boolean(session) || data.signedIn);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load claim page');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  const sortedPlayers = useMemo(
    () =>
      [...players].sort((a, b) => {
        const aClaimed = claimedIds.has(a.id) ? 1 : 0;
        const bClaimed = claimedIds.has(b.id) ? 1 : 0;
        if (aClaimed !== bClaimed) return aClaimed - bClaimed;
        return a.name.localeCompare(b.name);
      }),
    [players, claimedIds],
  );

  async function handleSignIn() {
    try {
      await signInWithGoogle(`/${slug}/claim`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }

  async function handleClaim(playerId: string) {
    if (!signedIn) {
      await handleSignIn();
      return;
    }
    if (claimedIds.has(playerId)) return;
    if (!confirm('Claim this player? You can only claim once and cannot change later.')) return;
    setClaimingId(playerId);
    setError('');
    try {
      await api.claimPlayer(slug, playerId);
      navigate(`/${slug}/rate`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Claim failed');
    } finally {
      setClaimingId(null);
    }
  }

  const alreadyClaimedHere = Boolean(claim && claim.groupSlug === slug);
  const claimLocked = elsewhere || alreadyClaimedHere;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to={`/${slug}`} className="text-elite-700 hover:underline">
              {groupName || slug}
            </Link>
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">
            {tab === 'claim' ? 'Claim your player' : 'Peer reviews'}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            {tab === 'claim'
              ? 'Browse the squad below. Sign in with Google to claim your card once — then you can rate teammates every two weeks.'
              : 'See who rated whom — public, no login required.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium transition',
                tab === 'claim'
                  ? 'bg-elite-600 text-white'
                  : 'text-slate-600 hover:bg-elite-50 hover:text-elite-700',
              )}
              onClick={() => setTab('claim')}
            >
              Claim
            </button>
            <button
              type="button"
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium transition',
                tab === 'reviews'
                  ? 'bg-elite-600 text-white'
                  : 'text-slate-600 hover:bg-elite-50 hover:text-elite-700',
              )}
              onClick={() => setTab('reviews')}
            >
              Who rated whom
            </button>
          </div>
          {tab === 'claim' ? (
            signedIn ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  await signOutGoogle();
                  setSignedIn(false);
                  setClaim(null);
                  await load();
                }}
              >
                Sign out
              </button>
            ) : isGoogleAuthConfigured() ? (
              <button type="button" className="btn-primary" onClick={handleSignIn}>
                <LogIn className="h-4 w-4" /> Continue with Google
              </button>
            ) : null
          ) : null}
        </div>
      </div>

      {error && tab === 'claim' ? <p className="text-sm text-red-600">{error}</p> : null}

      {tab === 'reviews' ? (
        <PublicPeerReviewsPanel slug={slug} />
      ) : (
        <>
          {claim && claim.groupSlug === slug ? (
            <div className="card space-y-2 p-5">
              <p className="text-sm text-slate-700">
                You already claimed a player in this group. Claiming is once only.
              </p>
              <Link to={`/${slug}/rate`} className="btn-primary inline-flex">
                Go rate teammates
              </Link>
            </div>
          ) : elsewhere && claim ? (
            <div className="card space-y-2 p-5">
              <p className="text-sm text-slate-700">
                You already claimed a player in <strong>/{claim.groupSlug}</strong>. Claiming is once
                only.
              </p>
              <Link to={`/${claim.groupSlug}/rate`} className="btn-primary inline-flex">
                Go rate teammates
              </Link>
            </div>
          ) : null}

          {loading ? (
            <p className="text-sm text-slate-500">Loading players…</p>
          ) : players.length === 0 ? (
            <p className="text-sm text-slate-500">No players in this group yet.</p>
          ) : (
            <div className="space-y-3">
              {!signedIn ? (
                <p className="text-sm text-slate-600">
                  Tap a free card after signing in with Google to claim it.
                </p>
              ) : (
                <p className="text-sm font-medium text-slate-700">
                  Tap an available card to claim (permanent)
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {sortedPlayers.map((player) => {
                  const isClaimed = claimedIds.has(player.id);
                  const busy = claimingId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      disabled={isClaimed || busy || claimLocked}
                      onClick={() => void handleClaim(player.id)}
                      className={cn(
                        'card flex items-center gap-2.5 p-2.5 text-left transition',
                        isClaimed || claimLocked
                          ? 'cursor-not-allowed opacity-55'
                          : 'hover:border-elite-300 hover:shadow-md',
                      )}
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-elite-50 ring-1 ring-slate-200">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <User className="h-5 w-5" strokeWidth={1.25} />
                          </div>
                        )}
                        {isClaimed ? (
                          <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 py-px text-center text-[8px] font-bold uppercase tracking-wide text-white">
                            Taken
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{player.name}</p>
                        {!isClaimed && !claimLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-elite-700">
                            <Check className="h-3 w-3" />
                            {busy ? 'Claiming…' : signedIn ? 'Claim' : 'Sign in to claim'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Unavailable</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
