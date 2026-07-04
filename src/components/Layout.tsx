import { Link, NavLink } from 'react-router-dom';
import { Shield, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/admin', label: 'Admin' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6">
      <header className="mb-8 flex items-center justify-between gap-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-elite-500 to-elite-600 shadow-elite ring-1 ring-white/60">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-slate-900">
              SquadBalance
            </p>
            <p className="text-xs text-slate-500">Fair teams. Fast kickoff.</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-gradient-to-r from-elite-600 to-elite-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-elite-50 hover:text-elite-700',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500">
        <p>Built for casual football — no accounts, no fuss.</p>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-elite-500" /> Player squads
          </span>
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-elite-500" /> Balanced teams
          </span>
        </div>
      </footer>
    </div>
  );
}
