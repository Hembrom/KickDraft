import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { clearAdminToken, getAdminRole, getAdminToken, setAdminSession, type AdminRole } from '@/lib/utils';
import type { GroupMeta } from '@shared/types';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupMeta[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [usePeerRatings, setUsePeerRatings] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(getAdminRole());

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin');
      return;
    }

    Promise.all([api.adminListGroups(), api.adminGetSettings(), api.adminMe()])
      .then(([groupsData, settings, me]) => {
        setGroups(groupsData.groups);
        setUsePeerRatings(settings.usePeerRatings);
        setRole(me.role);
        const token = getAdminToken();
        if (token) setAdminSession(token, me.role);
      })
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

  async function togglePeerRatings() {
    setToggling(true);
    setError('');
    try {
      const next = !usePeerRatings;
      const result = await api.adminSetPeerRatings(next);
      setUsePeerRatings(result.usePeerRatings);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update peer ratings toggle');
    } finally {
      setToggling(false);
    }
  }

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
          <p className="text-sm text-slate-500">
            Create squads and manage player rosters
            {role ? (
              <>
                {' '}
                · signed in as{' '}
                <span className="font-semibold text-elite-700">
                  {role === 'super' ? 'super admin' : 'admin'}
                </span>
              </>
            ) : null}
          </p>
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

      <section className="card space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Peer ratings</h2>
            <p className="text-sm text-slate-500">
              When on, squad OVR and team balance use the average of player-to-player ratings (admin
              stats still used until a player has at least one peer rating).
            </p>
          </div>
          <button
            type="button"
            className={usePeerRatings ? 'btn-primary' : 'btn-secondary'}
            disabled={toggling || loading}
            onClick={() => void togglePeerRatings()}
          >
            {toggling ? 'Saving…' : usePeerRatings ? 'Peer ratings ON' : 'Peer ratings OFF'}
          </button>
        </div>
      </section>

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
