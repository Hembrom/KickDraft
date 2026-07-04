import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { getAdminToken, setAdminToken } from '@/lib/utils';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminToken()) navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await api.adminLogin(password);
      setAdminToken(token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 shadow-elite sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-elite-500 to-elite-600 shadow-sm">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Admin</h1>
            <p className="text-sm text-slate-500">Manage groups and players</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          <Link to="/" className="font-medium text-elite-600 hover:text-elite-700">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
