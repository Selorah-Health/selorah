import type { SupabaseClient } from '@supabase/supabase-js';

export type PushStatus = 'unsupported' | 'unconfigured' | 'default' | 'granted' | 'denied';

function vapidPublicKey() {
  const env = import.meta.env as Record<string, string | undefined>;
  return String(env.VITE_VAPID_PUBLIC_KEY || '').trim();
}

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushStatus(): PushStatus {
  if (!pushSupported()) return 'unsupported';
  if (!vapidPublicKey()) return 'unconfigured';
  return Notification.permission as Exclude<PushStatus, 'unsupported' | 'unconfigured'>;
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function platformLabel() {
  if (typeof navigator === 'undefined') return 'Unknown';
  const userAgent = navigator.userAgent;
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/Macintosh/i.test(userAgent)) return 'macOS';
  if (/Windows/i.test(userAgent)) return 'Windows';
  return 'Web';
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;

  const ready = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 5000)),
  ]);

  if (!ready) {
    throw new Error('Reload Selorah once, then turn on phone notifications.');
  }
  return ready;
}

async function saveSubscription(
  supabase: SupabaseClient,
  subscription: PushSubscription
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in again to turn on notifications.');

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const keys = json.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('This browser did not return a complete push subscription.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: navigator.userAgent,
      platform: platformLabel(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) throw error;
}

export async function enablePushNotifications(supabase: SupabaseClient) {
  if (!pushSupported()) {
    throw new Error('This browser does not support phone notifications.');
  }

  const publicKey = vapidPublicKey();
  if (!publicKey) {
    throw new Error(
      'Phone notifications are not configured yet. In-app notifications still work.'
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      'Notifications were not allowed. Open your browser settings for Selorah and allow notifications.'
    );
  }

  const registration = await getRegistration();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await saveSubscription(supabase, subscription);
  return subscription;
}

/**
 * Re-save an existing subscription after login or a browser refresh. Never
 * prompts, so it is safe to call from the dashboard bootstrap.
 */
export async function syncPushSubscription(supabase: SupabaseClient) {
  if (getPushStatus() !== 'granted') return false;

  try {
    const registration = await getRegistration();
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const publicKey = vapidPublicKey();
      if (!publicKey) return false;
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    await saveSubscription(supabase, subscription);
    return true;
  } catch {
    return false;
  }
}

export async function disablePushNotifications(supabase: SupabaseClient) {
  if (!pushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      try {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', endpoint);
      } catch {
        // The browser unsubscribe below still stops delivery on this device.
      }
      await subscription.unsubscribe();
    }
  } catch {
    // Turning notifications off must not throw in the settings screen.
  }
}

export async function sendTestPush(supabase: SupabaseClient) {
  const { error } = await supabase.rpc('create_self_notification', {
    p_kind: 'system',
    p_title: 'Phone notifications are on',
    p_body: 'This is a test from Selorah. Cycle and account reminders will arrive like this.',
    p_href: '/dashboard/notifications',
    p_metadata: { event: 'push-test' },
  });
  if (error) throw error;
}
