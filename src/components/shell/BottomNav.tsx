import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from './navItems';

/** Mobile-only fixed bottom tab bar (`lg:hidden`). */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md lg:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold tracking-wide transition',
                    isActive ? 'text-elite-700' : 'text-slate-500 active:text-slate-700',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-12 items-center justify-center rounded-2xl transition',
                        isActive ? 'bg-elite-50 text-elite-700' : 'text-slate-500',
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
