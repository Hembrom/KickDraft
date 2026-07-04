import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { clearAdminToken, getAdminToken } from '@/lib/utils';
import type { GroupMeta } from '@shared/types';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupMeta[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin');
      return;
    }

    api
      .adminListGroups()
      .then((data) => setGroups(data.groups))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          clearAdminToken();
          navigate('/admin');
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Failed to load groups');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const group = await api.adminCreateGroup(name, slug || undefined);
      setGroups((prev) => [...prev, group]);
      setName('');
      setSlug('');
      navigate(`/admin/groups/${group.slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create group');
    } finally {
      setCreating(false);
    }
  }

  function logout() {
    clearAdminToken();
    navigate('/admin');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Admin dashboard</h1>
          <p className="text-sm text-slate-500">Create squads and manage player rosters.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>

      <form onSubmit={createGroup} className="card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="group-name">
            Group name
          </label>
          <input
            id="group-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sunday League FC"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="group-slug">
            URL slug (optional)
          </label>
          <input
            id="group-slug"
            className="input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="sunday-league"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={creating}>
            <Plus className="h-4 w-4" /> {creating ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-slate-900">Your groups</h2>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No groups yet.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.slug}
                to={`/admin/groups/${group.slug}`}
                className="card flex items-center justify-between p-4 transition hover:border-elite-200 hover:bg-elite-50/50"
              >
                <div>
                  <p className="font-semibold text-slate-900">{group.name}</p>
                  <p className="text-xs text-slate-500">/{group.slug}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-elite-400" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
