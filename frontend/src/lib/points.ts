import type { SupabaseClient } from '@supabase/supabase-js';

export const POINTS_EVENT = 'selorah:points-updated';

export type PointEvent = {
  id: string;
  source: string;
  label: string;
  points: number;
  reference: string;
  created_at: string;
};

export type TaskDefinition = {
  id: string;
  title: string;
  description: string;
  points: number;
  href?: string;
  actionLabel?: string;
};

export const TASKS: TaskDefinition[] = [
  {
    id: 'profile-complete',
    title: 'Complete your health profile',
    description: 'Add your date of birth, blood group, genotype, allergies, and phone number.',
    points: 120,
    href: '/dashboard/profile',
    actionLabel: 'Open profile',
  },
  {
    id: 'first-record',
    title: 'Add your first medical record',
    description: 'Scan, upload, or type one clinical document into your vault.',
    points: 80,
    href: '/dashboard/records',
    actionLabel: 'Add a record',
  },
  {
    id: 'three-records',
    title: 'Build a three-record history',
    description: 'Three records give researchers enough context to match you to studies.',
    points: 150,
    href: '/dashboard/records',
    actionLabel: 'View records',
  },
  {
    id: 'five-records',
    title: 'Reach five records',
    description: 'A richer history unlocks more research categories and a stronger emergency card.',
    points: 250,
    href: '/dashboard/records',
    actionLabel: 'View records',
  },
  {
    id: 'emergency-contact',
    title: 'Add an emergency contact',
    description: 'Give clinicians someone to call if you cannot speak for yourself.',
    points: 90,
    href: '/dashboard/profile',
    actionLabel: 'Add contact',
  },
  {
    id: 'emergency-card',
    title: 'Activate your Selorah card QR',
    description: 'Carry a permanent QR code that works when your phone is locked or offline.',
    points: 100,
    href: '/dashboard/card',
    actionLabel: 'Open card',
  },
  {
    id: 'resilience-vault',
    title: 'Create an encrypted emergency backup',
    description: 'Store an encrypted snapshot of your records that can survive a server outage.',
    points: 180,
    href: '/dashboard/resilience',
    actionLabel: 'Set up backup',
  },
  {
    id: 'first-survey',
    title: 'Complete a research survey',
    description: 'Answer a 15-question survey and earn N20 for every question.',
    points: 100,
    href: '/dashboard/research',
    actionLabel: 'Browse surveys',
  },
  {
    id: 'family-member',
    title: 'Invite a family member',
    description: 'Add someone you trust to your family vault.',
    points: 70,
    href: '/dashboard/family',
    actionLabel: 'Add family',
  },
];

export const LEVELS = [
  { name: 'Seedling', min: 0 },
  { name: 'Explorer', min: 200 },
  { name: 'Guardian', min: 500 },
  { name: 'Advocate', min: 900 },
  { name: 'Pioneer', min: 1500 },
];

export function levelFor(points: number) {
  let current = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = null;
  for (let index = 0; index < LEVELS.length; index += 1) {
    if (points >= LEVELS[index].min) {
      current = LEVELS[index];
      next = LEVELS[index + 1] || null;
    }
  }
  const span = next ? next.min - current.min : 1;
  const progress = next
    ? Math.min(100, Math.round(((points - current.min) / span) * 100))
    : 100;
  return { current, next, progress };
}

export async function fetchPointEvents(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, events: [] as PointEvent[], total: 0 };

  const { data, error } = await supabase
    .from('point_events')
    .select('id, source, label, points, reference, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const events = (data || []) as PointEvent[];
  return {
    userId: user.id,
    events,
    total: events.reduce((sum, event) => sum + Number(event.points || 0), 0),
  };
}

export async function awardTaskPoints(
  supabase: SupabaseClient,
  task: TaskDefinition,
  reference?: string
) {
  const { data, error } = await supabase.rpc('award_points', {
    p_source: 'task',
    p_label: task.title,
    p_points: task.points,
    p_reference: reference || `task:${task.id}`,
  });

  if (error) throw error;
  const result = data as { ok?: boolean; duplicate?: boolean; message?: string } | null;
  if (!result?.ok && !result?.duplicate) {
    throw new Error(result?.message || 'Points could not be awarded.');
  }
  if (result?.ok) notifyPointsChanged();
  return Boolean(result?.ok);
}

export function notifyPointsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(POINTS_EVENT));
}

export function subscribePoints(
  supabase: SupabaseClient,
  userId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`points:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'point_events',
        filter: `user_id=eq.${userId}`,
      },
      onChange
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
