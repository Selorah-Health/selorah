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
    data: { user },
  } = await supabase.auth.getUser();
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
    data: { user },
  } = await supabase.auth.getUser();
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
    data: { user },
  } = await supabase.auth.getUser();
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
  onChange: () => void
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
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
