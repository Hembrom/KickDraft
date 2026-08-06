import { Link } from 'react-router-dom';
import { MapPin, Shield, Users, Zap } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SideNav } from './SideNav';

/**
 * Responsive app shell:
 * - Mobile / tablet: bottom tab bar
 * - Desktop (lg+): left sidebar
 *
 * Reuse this shell elsewhere by swapping `navItems` and children.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-elite-50/80 via-slate-50 to-slate-100">
      <SideNav />

      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Compact brand header — mobile only (desktop brand lives in SideNav) */}
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-elite-500 to-elite-600 shadow-elite ring-1 ring-white/60">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-display text-base font-bold leading-tight tracking-tight text-slate-900">
                SquadBalance
              </p>
              <p className="text-[11px] text-slate-500">Fair teams. Fast kickoff.</p>
            </div>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:py-8">
          {/* Space above bottom nav on small screens */}
          <div className="pb-20 lg:pb-0">{children}</div>
        </main>

        <footer className="mx-auto hidden w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 px-4 pb-6 pt-6 text-xs text-slate-500 sm:px-6 lg:flex">
          <p>Built for casual football — no accounts, no fuss.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-elite-500" /> Player squads
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-elite-500" /> Balanced teams
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-elite-500" /> Ground booking
            </span>
          </div>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
}
