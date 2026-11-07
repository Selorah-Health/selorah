import type { SupabaseClient } from '@supabase/supabase-js';

export type NotificationKind = 'access' | 'system' | 'billing' | 'card' | 'security';

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

const FALLBACK_LIMIT = 40;

export async function fetchNotifications(
  supabase: SupabaseClient,
  limit = FALLBACK_LIMIT
): Promise<NotificationRow[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, title, body, href, is_read, created_at, metadata')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as NotificationRow[];
}

export async function markAllNotificationsRead(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
}

export async function markNotificationRead(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function countUnreadNotifications(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

export function subscribeNotifications(
  supabase: SupabaseClient,
  userId: string,
  onChange: (notification?: NotificationRow) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onChange((payload.new as NotificationRow) || undefined)
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function recordLogin(supabase: SupabaseClient, deviceLabel: string) {
  await supabase.rpc('record_login', {
    p_device: deviceLabel || 'a new device',
  });
}

export async function createSelfNotification(
  supabase: SupabaseClient,
  input: {
    kind?: NotificationKind;
    title: string;
    body?: string;
    href?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.rpc('create_self_notification', {
    p_kind: input.kind || 'system',
    p_title: input.title,
    p_body: input.body || null,
    p_href: input.href || null,
    p_metadata: input.metadata || {},
  });
}
