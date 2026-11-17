import { useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { hydrateAppearance, startAppearanceSync } from '../lib/preferences';

/**
 * Applies the account appearance once for the whole app, not only inside the
 * dashboard. The local theme still works for signed out visitors.
 */
export default function AppearanceSync() {
  useEffect(() => {
    const supabase = createClient();
    let stopSync: (() => void) | undefined;
    let cancelled = false;

    void hydrateAppearance(supabase).finally(() => {
      if (!cancelled) stopSync = startAppearanceSync(supabase);
    });

    return () => {
      cancelled = true;
      stopSync?.();
    };
  }, []);

  return null;
}
