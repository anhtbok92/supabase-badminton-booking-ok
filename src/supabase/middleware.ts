import { createClient } from '@supabase/supabase-js';

/**
 * Lightweight Supabase client for use in Next.js middleware.
 * No auth/cookies needed — only used for public club lookups by subdomain.
 */
export function createMiddlewareSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    );
  }

  return createClient(url, anonKey);
}
