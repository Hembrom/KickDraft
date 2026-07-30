import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ADMIN_TOKEN_KEY = 'squadbalance_admin_token';
const ADMIN_ROLE_KEY = 'squadbalance_admin_role';

export type AdminRole = 'admin' | 'super';

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminRole(): AdminRole | null {
  const role = localStorage.getItem(ADMIN_ROLE_KEY);
  return role === 'super' || role === 'admin' ? role : null;
}

export function isSuperAdmin() {
  return getAdminRole() === 'super';
}

export function setAdminSession(token: string, role: AdminRole) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_ROLE_KEY, role);
}

/** @deprecated Prefer setAdminSession(token, role) */
export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_ROLE_KEY);
}
