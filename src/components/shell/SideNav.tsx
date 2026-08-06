import { Link, NavLink } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from './navItems';

/** Desktop left sidebar (`hidden lg:flex`). */
export function SideNav() {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200/90 bg-white/95 backdrop-blur-md lg:flex"
      aria-label="Primary"
    >
      <div className="border-b border-slate-100 px-4 py-5">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-elite-500 to-elite-600 shadow-elite ring-1 ring-white/60">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display text-base font-bold tracking-tight text-slate-900">
              SquadBalance
            </p>
            <p className="text-[11px] text-slate-500">Fair teams. Fast kickoff.</p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-gradient-to-r from-elite-600 to-elite-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-elite-50 hover:text-elite-700',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-4 py-4 text-[11px] leading-relaxed text-slate-400">
        Responsive app shell
        <br />
        sidebar · lg+
      </div>
    </aside>
  );
}
