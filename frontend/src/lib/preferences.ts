import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ACCENT_PRESETS,
  applyAccent,
  applyTheme,
  listenForAccent,
  listenForTheme,
  readAccent,
  readTheme,
  type AccentId,
  type Theme,
} from './theme';

type AppearanceRow = {
  theme?: string | null;
  accent?: string | null;
};

function validTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null;
}

function validAccent(value: unknown): AccentId | null {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ACCENT_PRESETS, value)
    ? (value as AccentId)
    : null;
}

/**
 * Pull the saved appearance for this account. The separate select keeps older
 * projects working while the theme and accent columns are being migrated.
 */
export async function hydrateAppearance(supabase: SupabaseClient) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('patient_profiles')
      .select('theme, accent')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return;

    const row = data as AppearanceRow;
    const theme = validTheme(row.theme);
    const accent = validAccent(row.accent);

    if (theme && theme !== readTheme()) applyTheme(theme);
    if (accent && accent !== readAccent()) applyAccent(accent);
  } catch {
    // Appearance sync is an enhancement. Local settings still work.
  }
}

/**
 * Save theme and accent changes to the account so another device picks them
 * up on its next load. Writes are debounced because the theme toggle can fire
 * several events while a person is choosing.
 */
export function startAppearanceSync(supabase: SupabaseClient) {
  let timer: number | undefined;
  let stopped = false;

  const save = () => {
    if (stopped) return;
    if (timer) window.clearTimeout(timer);

    timer = window.setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || stopped) return;

        await supabase
          .from('patient_profiles')
          .update({ theme: readTheme(), accent: readAccent() })
          .eq('user_id', user.id);
      } catch {
        // Keep the local value. The next change retries the write.
      }
    }, 700);
  };

  const stopTheme = listenForTheme(save);
  const stopAccent = listenForAccent(save);

  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
    stopTheme();
    stopAccent();
  };
}
