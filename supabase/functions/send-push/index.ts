// Supabase Edge Function: deliver a Selorah web push notification.
//
// Deploy:
//   supabase functions deploy send-push --no-verify-jwt --yes
//
// Required function secrets:
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT        e.g. mailto:support@selorah.app
//
// The database trigger on public.notifications calls this function with the
// x-push-secret header. That secret lives in public.push_dispatch_config and is
// never exposed to the browser.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-push-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  href: string | null;
  kind: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Use POST.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server configuration is incomplete.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const suppliedSecret = request.headers.get('x-push-secret') || '';
  const { data: config, error: configError } = await admin
    .from('push_dispatch_config')
    .select('webhook_secret, enabled')
    .eq('id', 1)
    .maybeSingle();

  if (configError) {
    return json({ error: 'Push dispatch is not configured.' }, 500);
  }
  if (!config?.enabled || !config.webhook_secret || suppliedSecret !== config.webhook_secret) {
    return json({ error: 'Unauthorized.' }, 401);
  }

  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
  const subject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@selorah.app';

  if (!publicKey || !privateKey) {
    return json({
      configured: false,
      sent: 0,
      message: 'VAPID keys are not set on the send-push function.',
    });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  let payload: { notification_id?: string } = {};
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'A notification_id is required.' }, 400);
  }

  if (!payload.notification_id) {
    return json({ error: 'A notification_id is required.' }, 400);
  }

  const { data: notification, error: notificationError } = await admin
    .from('notifications')
    .select('id, user_id, title, body, href, kind')
    .eq('id', payload.notification_id)
    .maybeSingle<NotificationRow>();

  if (notificationError) {
    return json({ error: 'Could not read the notification.' }, 500);
  }
  if (!notification) {
    return json({ error: 'Notification not found.' }, 404);
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', notification.user_id);

  if (subscriptionError) {
    return json({ error: 'Could not read push subscriptions.' }, 500);
  }
  if (!subscriptions?.length) {
    return json({ sent: 0, skipped: 'no subscriptions' });
  }

  const message = JSON.stringify({
    title: notification.title,
    body: notification.body || '',
    url: notification.href || '/dashboard/notifications',
    tag: `selorah:${notification.id}`,
    kind: notification.kind,
    notification_id: notification.id,
  });

  let sent = 0;
  let failed = 0;
  let removed = 0;

  await Promise.all(
    (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          message,
          { TTL: 60 * 60 * 24, urgency: 'high' }
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number } | null)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', subscription.id);
          removed += 1;
        }
      }
    })
  );

  return json({ sent, failed, removed });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
