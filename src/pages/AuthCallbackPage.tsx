import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getBrowserSupabase, isGoogleAuthConfigured } from '@/lib/supabase-auth';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const next = searchParams.get('next') || '/';

    if (!isGoogleAuthConfigured()) {
      setError('Google login is not configured');
      return;
    }

    getBrowserSupabase()
      .auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) throw sessionError;
        if (!data.session) {
          setError('Could not complete Google sign-in');
          return;
        }
        navigate(next, { replace: true });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      });
  }, [navigate, searchParams]);

  return (
    <div className="mx-auto max-w-md space-y-3 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-slate-900">Signing you in…</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : <p className="text-sm text-slate-500">One moment.</p>}
    </div>
  );
}
