import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export type AdminRole = 'admin' | 'super';

export function json(res: VercelResponse, status: number, data: unknown) {
  res.status(status).json(data);
}

export function error(res: VercelResponse, status: number, message: string) {
  json(res, status, { error: message });
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

export async function readBody<T>(req: VercelRequest): Promise<T> {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T;
  }
  return {} as T;
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function signingSecret(): string | null {
  return process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD ?? null;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function resolveAdminRoleFromPassword(password: string): AdminRole | null {
  const superPassword = process.env.SUPER_ADMIN_PASSWORD;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (superPassword && safeEqual(password, superPassword)) return 'super';
  if (adminPassword && safeEqual(password, adminPassword)) return 'admin';
  return null;
}

export function createAdminToken(role: AdminRole = 'admin'): string {
  const secret = signingSecret();
  if (!secret) throw new Error('ADMIN_SECRET or ADMIN_PASSWORD is not configured');

  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${exp}:${role}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ exp, role, sig })).toString('base64url');
}

export function getAdminRole(req: VercelRequest): AdminRole | null {
  const secret = signingSecret();
  if (!secret) return null;

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;

  try {
    const token = auth.slice(7);
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      exp?: number;
      role?: string;
      sig?: string;
    };

    if (typeof parsed.exp !== 'number' || typeof parsed.sig !== 'string') return null;
    if (Date.now() > parsed.exp) return null;

    if (parsed.role === 'super' || parsed.role === 'admin') {
      const expected = createHmac('sha256', secret)
        .update(`${parsed.exp}:${parsed.role}`)
        .digest('hex');
      if (!safeEqual(parsed.sig, expected)) return null;
      return parsed.role;
    }

    // Legacy tokens signed only with expiry → regular admin
    const legacyExpected = createHmac('sha256', secret).update(String(parsed.exp)).digest('hex');
    if (!safeEqual(parsed.sig, legacyExpected)) return null;
    return 'admin';
  } catch {
    return null;
  }
}

export function verifyAdminToken(req: VercelRequest): boolean {
  return getAdminRole(req) !== null;
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  if (verifyAdminToken(req)) return true;
  error(res, 401, 'Unauthorized');
  return false;
}

export function requireSuperAdmin(req: VercelRequest, res: VercelResponse): boolean {
  const role = getAdminRole(req);
  if (role === 'super') return true;
  if (role === 'admin') {
    error(res, 403, 'Super admin required');
    return false;
  }
  error(res, 401, 'Unauthorized');
  return false;
}

export function verifyCronSecret(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.authorization === `Bearer ${secret}`;
}
