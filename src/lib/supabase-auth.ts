import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export function isGoogleAuthConfigured() {
  return Boolean(url && anonKey);
}

export function getBrowserSupabase() {
  if (!isGoogleAuthConfigured()) {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for Google login');
  }
  if (!client) {
    client = createClient(url!, anonKey!);
  }
  return client;
}

export async function getGoogleAccessToken(): Promise<string | null> {
  if (!isGoogleAuthConfigured()) return null;
  const { data } = await getBrowserSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getGoogleSession(): Promise<Session | null> {
  if (!isGoogleAuthConfigured()) return null;
  const { data } = await getBrowserSupabase().auth.getSession();
  return data.session;
}

export async function signInWithGoogle(nextPath: string) {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const { error } = await getBrowserSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOutGoogle() {
  if (!isGoogleAuthConfigured()) return;
  await getBrowserSupabase().auth.signOut();
}
