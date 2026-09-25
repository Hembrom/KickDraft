export const GROUP_LOGO_ID = 'logo';

export function groupLogoUrl(slug: string, version?: number | string): string {
  const path = `/api/groups/${slug}/images/logo.png`;
  if (version == null || version === '') return path;
  return `${path}?v=${encodeURIComponent(String(version))}`;
}

export function groupInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}
