import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Trophy, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { GroupMeta } from '@shared/types';

export function HomePage() {
  const [groups, setGroups] = useState<GroupMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listGroups()
      .then((data) => setGroups(data.groups))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden px-6 py-10 shadow-elite sm:px-10 sm:py-14">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_62%)]" />
        <div className="relative max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-elite-200 bg-elite-50 px-3 py-1 text-xs font-semibold text-elite-700">
            <Sparkles className="h-3.5 w-3.5 text-elite-500" /> Casual football, fair teams
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Pick your squad. Generate balanced teams in seconds.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600">
            SquadBalance helps you split players into two fair sides using overall ratings —
            perfect for 5-a-side through 11-a-side kickabouts.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/newtown-sporting-club" className="btn-primary">
              Newtown Sporting Club <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/guide" className="btn-secondary">
              Captain&apos;s guide
            </Link>
            <Link to="/admin" className="btn-secondary">
              Admin setup
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            New to this? Read the{' '}
            <Link to="/guide" className="font-medium text-elite-600 underline-offset-2 hover:underline">
              captain&apos;s guide
            </Link>{' '}
            —{' '}
            <a
              href="https://kick-draft.vercel.app/guide"
              className="font-medium text-elite-600 underline-offset-2 hover:underline"
            >
              kick-draft.vercel.app/guide
            </a>
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Users,
            title: 'Player database',
            text: 'Store names, photos, clubs, and six football attributes per player.',
          },
          {
            icon: Trophy,
            title: 'Smart balancing',
            text: 'You choose who plays; teams are split fairly from your selected squad.',
          },
          {
            icon: Sparkles,
            title: 'Match day ready',
            text: 'Tick who is coming, balance teams, and share the lineup.',
          },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className="card p-5">
            <Icon className="mb-3 h-5 w-5 text-elite-500" />
            <h2 className="font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{text}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Squads</h2>
            <p className="text-sm text-slate-500">Open a group to view players and generate teams.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading groups…</p>
        ) : groups.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">
            No groups yet.{' '}
            <Link to="/admin" className="font-medium text-elite-600 underline-offset-2 hover:underline">
              Create one in Admin
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <Link
                key={group.slug}
                to={`/${group.slug}`}
                className="card flex items-center justify-between p-4 transition hover:border-elite-200 hover:bg-elite-50/50 hover:shadow-elite"
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
