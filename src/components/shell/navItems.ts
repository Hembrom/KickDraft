import type { LucideIcon } from 'lucide-react';
import { Home, MapPin, Shield } from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Exact match for NavLink `end` */
  end?: boolean;
};

/** Shared navigation for AppShell (mobile bottom tabs + desktop sidebar). */
export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/grounds', label: 'Grounds', icon: MapPin },
  { to: '/admin', label: 'Admin', icon: Shield },
];
