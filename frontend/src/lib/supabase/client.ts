import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client with localStorage session persistence.
 * Prefer this over @supabase/ssr's createBrowserClient in a Vite SPA
 * so auth.uid() is present for RLS.
 */
export function createClient(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !key) {
    console.error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check Vercel env vars and redeploy.'
    );
    client = createSupabaseClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return client;
  }

  client = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });

  return client;
}
