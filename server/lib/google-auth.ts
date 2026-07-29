import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error } from './auth.js';
import { getSupabase, isSupabaseConfigured } from './supabase-client.js';

export type GoogleUser = {
  id: string;
  email: string;
};

export async function requireGoogleUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<GoogleUser | null> {
  if (!isSupabaseConfigured()) {
    error(res, 503, 'Google login requires Supabase auth to be configured');
    return null;
  }

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    error(res, 401, 'Sign in with Google to continue');
    return null;
  }

  const token = auth.slice(7);
  const { data, error: authError } = await getSupabase().auth.getUser(token);
  if (authError || !data.user) {
    error(res, 401, 'Session expired — sign in with Google again');
    return null;
  }

  const email = data.user.email?.trim();
  if (!email) {
    error(res, 400, 'Google account email is required');
    return null;
  }

  return { id: data.user.id, email };
}
