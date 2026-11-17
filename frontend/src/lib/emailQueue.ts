import { createClient } from './supabase/client';

let lastKickAt = 0;
const MIN_INTERVAL_MS = 15_000;

/**
 * Nudges the send-email Edge Function after a signup or waitlist join. The
 * database trigger has already queued the message, so this is best effort. A
 * scheduled job or cron remains the reliable drain path.
 */
export async function kickEmailQueue(limit = 10) {
  const now = Date.now();
  if (now - lastKickAt < MIN_INTERVAL_MS) return;
  lastKickAt = now;

  try {
    const supabase = createClient();
    await supabase.functions.invoke('send-email', { body: { limit } });
  } catch {
    // Email delivery is asynchronous. Never block the user's success state.
  }
}
