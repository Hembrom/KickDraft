import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function json(res: VercelResponse, status: number, data: unknown) {
  res.status(status).json(data);
}

export function error(res: VercelResponse, status: number, message: string) {
  json(res, status, { error: message });
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

export function createAdminToken(): string {
  const secret = process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_SECRET or ADMIN_PASSWORD is not configured');

  const exp = Date.now() + TOKEN_TTL_MS;
  const sig = createHmac('sha256', secret).update(String(exp)).digest('hex');
  return Buffer.from(JSON.stringify({ exp, sig })).toString('base64url');
}

export function verifyAdminToken(req: VercelRequest): boolean {
  const secret = process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;

  try {
    const token = auth.slice(7);
    const { exp, sig } = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8'),
    ) as { exp: number; sig: string };

    if (Date.now() > exp) return false;

    const expected = createHmac('sha256', secret).update(String(exp)).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  if (verifyAdminToken(req)) return true;
  error(res, 401, 'Unauthorized');
  return false;
}

export function verifyCronSecret(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.authorization === `Bearer ${secret}`;
}
