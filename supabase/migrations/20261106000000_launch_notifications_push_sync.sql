-- Selorah launch fixes: push delivery, cycle and task reminders, cross-device
-- appearance, survey reward repair, and a verified Paystack Pro repair.
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- 0. Repair the legacy patient tier constraint
-- ---------------------------------------------------------------------------
-- Older projects created a tier check that only allowed free and premium.
-- The app and paystack-verify write pro, so replace it before any update.
alter table public.patient_profiles
  drop constraint if exists patient_profiles_tier_check;

alter table public.patient_profiles
  add constraint patient_profiles_tier_check
  check (tier is null or tier in ('free', 'premium', 'pro')) not valid;

-- ---------------------------------------------------------------------------
-- 1. Cross-device appearance
-- ---------------------------------------------------------------------------
alter table public.patient_profiles add column if not exists theme text;
alter table public.patient_profiles add column if not exists accent text;

-- ---------------------------------------------------------------------------
-- 2. Web push subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id, updated_at desc);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions: own read" on public.push_subscriptions;
create policy "push_subscriptions: own read"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_subscriptions: own insert" on public.push_subscriptions;
create policy "push_subscriptions: own insert"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions: own update" on public.push_subscriptions;
create policy "push_subscriptions: own update"
  on public.push_subscriptions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions: own delete" on public.push_subscriptions;
create policy "push_subscriptions: own delete"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Account, login, and record notifications
-- ---------------------------------------------------------------------------
create or replace function public.create_self_notification(
  p_kind text,
  p_title text,
  p_body text default null,
  p_href text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    return null;
  end if;

  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values (
    v_user,
    coalesce(nullif(btrim(p_kind), ''), 'system'),
    coalesce(nullif(btrim(p_title), ''), 'Selorah update'),
    p_body,
    p_href,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_self_notification(text, text, text, text, jsonb) from public;
grant execute on function public.create_self_notification(text, text, text, text, jsonb) to authenticated;

create or replace function public.record_login(p_device text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device text := coalesce(nullif(btrim(p_device), ''), 'a new device');
begin
  return public.create_self_notification(
    'security',
    'New sign in',
    'You signed in on ' || v_device || '. If this was not you, change your password.',
    '/dashboard/security',
    jsonb_build_object('event', 'login', 'device', v_device)
  );
end;
$$;

revoke all on function public.record_login(text) from public;
grant execute on function public.record_login(text) to authenticated;

create or replace function public.notify_medical_record_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_title text;
begin
  -- Profile fields are saved as records too. They should not create one alert
  -- per field when a patient updates height, weight, allergies, and so on.
  if lower(coalesce(new.record_type, '')) in
       ('vital', 'allergy', 'history', 'emergency contact', 'note') then
    return new;
  end if;

  if lower(coalesce(new.title, '')) in
       ('height', 'weight', 'blood group', 'genotype', 'allergies',
        'family history', 'medication history', 'emergency contact') then
    return new;
  end if;

  select user_id into v_user
    from public.patient_profiles
   where id = new.patient_id
   limit 1;

  if v_user is null then
    return new;
  end if;

  v_title := coalesce(nullif(btrim(new.title), ''), 'A new health record');

  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values (
    v_user,
    'system',
    'New health record added',
    v_title || ' was added to your health record.',
    '/dashboard/records',
    jsonb_build_object('event', 'record-upload', 'record_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists medical_records_notify_insert on public.medical_records;
create trigger medical_records_notify_insert
  after insert on public.medical_records
  for each row execute function public.notify_medical_record_insert();

create or replace function public.notify_emergency_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values (
    new.user_id,
    'security',
    'Emergency report saved',
    'Reference ' || new.reference || ' was saved. If this was not you, contact support immediately.',
    '/dashboard/emergency',
    jsonb_build_object('event', 'emergency-report', 'reference', new.reference)
  );

  return new;
end;
$$;

drop trigger if exists emergency_reports_notify_insert on public.emergency_reports;
create trigger emergency_reports_notify_insert
  after insert on public.emergency_reports
  for each row execute function public.notify_emergency_report_insert();

create or replace function public.notify_profile_security_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(old.phone, '') is distinct from coalesce(new.phone, '')
     or coalesce(old.nin, '') is distinct from coalesce(new.nin, '')
     or old.emergency_contacts is distinct from new.emergency_contacts then
    insert into public.notifications (user_id, kind, title, body, href, metadata)
    values (
      new.user_id,
      'security',
      'Account details updated',
      'Your contact or emergency details were changed. If this was not you, secure your account.',
      '/dashboard/security',
      jsonb_build_object('event', 'profile-security-update')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists patient_profiles_notify_security on public.patient_profiles;
create trigger patient_profiles_notify_security
  after update on public.patient_profiles
  for each row execute function public.notify_profile_security_update();

create or replace function public.notify_point_event_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values (
    new.user_id,
    'system',
    'Health points added',
    'You earned ' || new.points || ' health points for ' || coalesce(new.label, 'a health task') ||
      '. Health points track progress and are not cash.',
    '/dashboard/rewards',
    jsonb_build_object('event', 'task-points', 'points', new.points)
  );

  return new;
end;
$$;

drop trigger if exists point_events_notify_insert on public.point_events;
create trigger point_events_notify_insert
  after insert on public.point_events
  for each row execute function public.notify_point_event_insert();

-- ---------------------------------------------------------------------------
-- 4. Cycle and task reminders
-- ---------------------------------------------------------------------------
create table if not exists public.cycle_reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_start date not null,
  reminder_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, cycle_start, reminder_on)
);

create index if not exists cycle_reminder_log_user_idx
  on public.cycle_reminder_log (user_id, reminder_on desc);

alter table public.cycle_reminder_log enable row level security;

create or replace function public.enqueue_cycle_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  v_cycle record;
  v_length integer;
  v_next date;
  v_days integer;
  v_count integer := 0;
begin
  for v_cycle in
    select
      user_id,
      max(start_date) as last_start,
      coalesce(
        round(avg(cycle_length) filter (where cycle_length between 21 and 45))::integer,
        28
      ) as average_length
    from (
      select
        user_id,
        start_date,
        start_date - lag(start_date) over (partition by user_id order by start_date) as cycle_length
      from public.period_cycles
    ) cycles
    where not exists (
      select 1
        from public.patient_profiles pp
       where pp.user_id = cycles.user_id
         and lower(coalesce(pp.gender, '')) = 'male'
    )
    group by user_id
    having max(start_date) > v_today - 120
  loop
    v_length := greatest(21, least(45, v_cycle.average_length));
    v_next := v_cycle.last_start + v_length;

    while v_next < v_today loop
      v_next := v_next + v_length;
    end loop;

    v_days := v_next - v_today;

    if v_days in (0, 2) then
      if not exists (
        select 1
          from public.cycle_reminder_log
         where user_id = v_cycle.user_id
           and cycle_start = v_cycle.last_start
           and reminder_on = v_today
      ) then
        insert into public.notifications (user_id, kind, title, body, href, metadata)
        values (
          v_cycle.user_id,
          'system',
          case when v_days = 0
            then 'Your period is expected today'
            else 'Your period is expected in 2 days'
          end,
          case when v_days = 0
            then 'Log your cycle when it starts so your predictions stay accurate.'
            else 'A gentle reminder to prepare. Log your cycle when it starts so your predictions stay accurate.'
          end,
          '/dashboard/cycle',
          jsonb_build_object('event', 'cycle-reminder', 'next_date', v_next, 'days', v_days)
        );

        insert into public.cycle_reminder_log (user_id, cycle_start, reminder_on)
        values (v_cycle.user_id, v_cycle.last_start, v_today)
        on conflict (user_id, cycle_start, reminder_on) do nothing;

        v_count := v_count + 1;
      end if;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.enqueue_cycle_reminders() from public;

create or replace function public.enqueue_task_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  insert into public.notifications (user_id, kind, title, body, href, metadata)
  select
    pp.user_id,
    'system',
    'A health task is waiting for you',
    'Complete a task in Rewards to keep your health profile active. Health points track progress and are not cash.',
    '/dashboard/rewards',
    jsonb_build_object('event', 'task-reminder')
  from public.patient_profiles pp
  where not exists (
      select 1
        from public.point_events pe
       where pe.user_id = pp.user_id
         and pe.created_at > now() - interval '7 days'
    )
    and not exists (
      select 1
        from public.notifications n
       where n.user_id = pp.user_id
         and n.metadata ->> 'event' = 'task-reminder'
         and n.created_at > now() - interval '7 days'
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.enqueue_task_reminders() from public;

-- ---------------------------------------------------------------------------
-- 5. Push dispatch trigger
-- ---------------------------------------------------------------------------
create table if not exists public.push_dispatch_config (
  id integer primary key default 1 check (id = 1),
  project_url text not null,
  webhook_secret text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.push_dispatch_config enable row level security;

insert into public.push_dispatch_config (id, project_url, webhook_secret, enabled)
values (
  1,
  'https://dbpyyhrbekamyejizson.supabase.co',
  replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  true
)
on conflict (id) do nothing;

do $$
begin
  create extension if not exists pg_net;
exception when others then
  null;
end $$;

create or replace function public.dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_config record;
begin
  select project_url, webhook_secret, enabled
    into v_config
    from public.push_dispatch_config
   where id = 1;

  if v_config.project_url is null or not v_config.enabled then
    return new;
  end if;

  perform net.http_post(
    url := rtrim(v_config.project_url, '/') || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_config.webhook_secret
    ),
    body := jsonb_build_object('notification_id', new.id),
    timeout_milliseconds := 5000
  );

  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists notifications_dispatch_push on public.notifications;
create trigger notifications_dispatch_push
  after insert on public.notifications
  for each row execute function public.dispatch_push_for_notification();

do $$
begin
  create extension if not exists pg_cron;
exception when others then
  null;
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
      from cron.job
     where jobname in ('selorah-cycle-reminders', 'selorah-task-reminders');

    perform cron.schedule(
      'selorah-cycle-reminders',
      '0 7 * * *',
      'select public.enqueue_cycle_reminders();'
    );

    perform cron.schedule(
      'selorah-task-reminders',
      '0 7 * * 1',
      'select public.enqueue_task_reminders();'
    );
  end if;
exception when others then
  null;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Survey reward normalization
-- ---------------------------------------------------------------------------
create or replace function public.normalize_survey_response_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_survey_points integer;
begin
  select points into v_survey_points
    from public.surveys
   where id = new.survey_id;

  new.points_awarded := greatest(
    coalesce(new.points_awarded, 0),
    coalesce(v_survey_points, 0)
  );
  new.reward_naira := greatest(
    coalesce(new.reward_naira, 0),
    new.points_awarded * 20
  );

  return new;
end;
$$;

drop trigger if exists survey_responses_normalize_reward on public.survey_responses;
create trigger survey_responses_normalize_reward
  before insert or update of points_awarded, reward_naira on public.survey_responses
  for each row execute function public.normalize_survey_response_reward();

update public.survey_responses r
   set points_awarded = greatest(
         coalesce(r.points_awarded, 0),
         coalesce(s.points, 0)
       ),
       reward_naira = greatest(
         coalesce(r.reward_naira, 0),
         greatest(coalesce(r.points_awarded, 0), coalesce(s.points, 0)) * 20
       )
  from public.surveys s
 where s.id = r.survey_id;

update public.survey_responses
   set reward_naira = greatest(coalesce(reward_naira, 0), coalesce(points_awarded, 0) * 20)
 where coalesce(reward_naira, 0) < coalesce(points_awarded, 0) * 20;

with matches as (
  select
    e.id as earning_id,
    (
      select greatest(r.reward_naira, r.points_awarded * 20)
        from public.survey_responses r
        join public.patient_profiles pp on pp.user_id = r.user_id
       where pp.id = e.patient_id
         and abs(extract(epoch from (r.created_at - e.created_at))) <= 600
       order by abs(extract(epoch from (r.created_at - e.created_at)))
       limit 1
    ) as normalized_reward
  from public.earnings e
  where coalesce(e.source, 'survey') = 'survey'
)
update public.earnings e
   set amount_local = m.normalized_reward
  from matches m
 where e.id = m.earning_id
   and m.normalized_reward is not null
   and e.amount_local < m.normalized_reward;

-- ---------------------------------------------------------------------------
-- 7. Verified Paystack Pro repair
-- ---------------------------------------------------------------------------
-- Paystack charge SEL-1793366434228-6DPWUW was successful on 2026-10-30.
-- The account stayed on Basic because the verification callback never
-- repaired the profile. Re-apply the monthly entitlement once, idempotently.
do $$
declare
  v_user uuid;
  v_reference text := 'SEL-1793366434228-6DPWUW';
  v_paid_at timestamptz := '2026-10-30 13:22:07+00';
  v_expiry timestamptz;
  v_profile_id uuid;
begin
  select id into v_user
    from auth.users
   where lower(email) = 'officialsammy61@gmail.com'
   limit 1;

  if v_user is null then
    return;
  end if;

  v_expiry := v_paid_at + interval '1 month';

  insert into public.payments (
    user_id, reference, amount, currency, status, provider, plan, created_at
  )
  values (
    v_user, v_reference, 200000, 'NGN', 'paid', 'paystack', 'Selorah Pro Monthly', v_paid_at
  )
  on conflict (reference) do update
    set status = 'paid',
        amount = excluded.amount,
        currency = excluded.currency,
        provider = excluded.provider,
        plan = excluded.plan;

  update public.patient_profiles
     set tier = 'pro',
         is_pro = true,
         pro_reference = v_reference,
         pro_expires_at = greatest(coalesce(pro_expires_at, v_expiry), v_expiry)
   where user_id = v_user
   returning id into v_profile_id;

  if v_profile_id is null then
    insert into public.patient_profiles (
      user_id, full_name, tier, is_pro, pro_reference, pro_expires_at
    )
    values (
      v_user, 'Selorah patient', 'pro', true, v_reference, v_expiry
    );
  end if;

  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) ||
       jsonb_build_object(
         'is_pro', true,
         'pro_reference', v_reference,
         'pro_expires_at', v_expiry
       )
   where id = v_user;

  if not exists (
    select 1
      from public.notifications
     where user_id = v_user
       and metadata ->> 'event' = 'pro-restored'
       and metadata ->> 'reference' = v_reference
  ) then
    insert into public.notifications (user_id, kind, title, body, href, metadata)
    values (
      v_user,
      'billing',
      'Selorah Pro is active',
      'Your payment was verified and your Pro features are now unlocked.',
      '/dashboard/billing',
      jsonb_build_object('event', 'pro-restored', 'reference', v_reference)
    );
  end if;
end $$;
