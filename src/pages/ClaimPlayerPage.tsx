import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, LogIn } from 'lucide-react';
import { PlayerCard } from '@/components/PlayerCard';
import { api, ApiError } from '@/lib/api';
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
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [unclaimed, setUnclaimed] = useState<Player[]>([]);
  const [claim, setClaim] = useState<PlayerClaim | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [elsewhere, setElsewhere] = useState(false);

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

      const data = await api.getClaimStatus(slug);
      setGroupName(data.group.name);
      setUnclaimed(data.unclaimedPlayers);
      setClaim(data.claim);
      setElsewhere(data.alreadyClaimedElsewhere);

      if (data.claim && data.claim.groupSlug === slug) {
        navigate(`/${slug}/rate`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load claim page');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  async function handleSignIn() {
    try {
      await signInWithGoogle(`/${slug}/claim`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }

  async function handleClaim(playerId: string) {
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

  if (!isGoogleAuthConfigured()) {
    return (
      <div className="card space-y-2 p-5">
        <h1 className="font-display text-2xl font-bold">Claim player</h1>
        <p className="text-sm text-slate-600">
          Google login is not configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>, and enable the Google provider in Supabase Auth.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to={`/${slug}`} className="text-elite-700 hover:underline">
              {groupName || slug}
            </Link>
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">Claim your player</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Sign in with Google, then pick your card once. After that you can rate teammates (once per
            player every two weeks).
          </p>
        </div>
        {signedIn ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={async () => {
              await signOutGoogle();
              setSignedIn(false);
              setClaim(null);
            }}
          >
            Sign out
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!signedIn ? (
        <div className="card space-y-4 p-5">
          <p className="text-sm text-slate-600">Use the same Google account you play with.</p>
          <button type="button" className="btn-primary" onClick={handleSignIn}>
            <LogIn className="h-4 w-4" /> Continue with Google
          </button>
        </div>
      ) : loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
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
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Unclaimed players — tap to claim (permanent)
          </p>
          {unclaimed.length === 0 ? (
            <p className="text-sm text-slate-500">No unclaimed players left in this group.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {unclaimed.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  disabled={claimingId === player.id}
                  onClick={() => handleClaim(player.id)}
                  className="text-left transition hover:opacity-90 disabled:opacity-60"
                >
                  <PlayerCard player={player} />
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-elite-700">
                    <Check className="h-3.5 w-3.5" />
                    {claimingId === player.id ? 'Claiming…' : 'Claim this player'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
