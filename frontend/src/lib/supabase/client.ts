import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase URL or Anon Key is missing. Some features may not work.');
    // Return a mock or a client that won't crash the UI
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder'
    );
  }

  return createBrowserClient(url, key);
}
