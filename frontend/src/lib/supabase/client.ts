import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

const API_TIMEOUT_MS = 8000;
const UPLOAD_TIMEOUT_MS = 60000;

/**
 * Supabase requests can wait forever when the phone reports a connection but
 * the network is actually gone. That leaves pages stuck on their loading
 * skeleton. Fail fast when the browser is offline, and cap every request so a
 * cached page can render instead of hanging.
 */
async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('You are offline.');
  }

  const rawUrl =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const timeout = rawUrl.includes('/storage/v1/') ? UPLOAD_TIMEOUT_MS : API_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
    global: {
      fetch: fetchWithTimeout,
    },
  });

  return client;
}
