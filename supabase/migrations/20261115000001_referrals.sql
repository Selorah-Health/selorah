-- Referral usernames, referral attribution, and gated referral rewards.
--
-- The referral code is the user's username. A referrer gets N1,000 and the
-- referee gets N800 once the referee has claimed 3 distinct tasks in the
-- Rewards tab. Both rewards are written to public.earnings with source
-- 'referral', so the existing earnings and withdrawal flows pick them up.
--
-- public.profiles is a read-only compatibility view on this project. Usernames
-- therefore live in public.usernames, keyed by public.users.id. Do not add
-- columns, triggers, or foreign keys to public.profiles.
--
-- Safe to run on an existing project: every change is additive, and every
-- function or policy is replaced instead of duplicated.

-- ---------------------------------------------------------------------------
-- 1. Usernames
-- ---------------------------------------------------------------------------
create table if not exists public.usernames (
  user_id uuid primary key references public.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists usernames_username_key
  on public.usernames (lower(username));

alter table public.usernames drop constraint if exists usernames_format;

alter table public.usernames
  add constraint usernames_format
  check (username ~ '^[a-z0-9][a-z0-9_-]{2,19}$');

alter table public.usernames enable row level security;

grant select on public.usernames to authenticated;

drop policy if exists "usernames: own read" on public.usernames;
create policy "usernames: own read"
  on public.usernames for select
  to authenticated
  using (user_id = auth.uid());

-- Generate a readable username from the profile name or email. The id suffix
-- keeps the value unique without exposing a sequential number.
create or replace function public.generate_username(p_seed text, p_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base text;
  suffix text;
  candidate text;
  attempt integer := 0;
begin
  base := lower(coalesce(p_seed, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '^-+|-+$', '', 'g');
  base := left(base, 13);

  if base = '' then
    base := 'selorah';
  end if;

  suffix := substr(replace(coalesce(p_id::text, gen_random_uuid()::text), '-', ''), 1, 6);

  loop
    candidate := base || '-' || suffix;
    exit when not exists (
      select 1 from public.usernames where lower(username) = candidate
    );
    attempt := attempt + 1;
    suffix := substr(md5(random()::text), 1, 6);
    exit when attempt > 20;
  end loop;

  return candidate;
end;
$$;

revoke all on function public.generate_username(text, uuid) from public;

-- Backfill every user that does not have a username yet. The loop keeps the
-- generator's collision check honest.
do $$
declare
  row_record record;
begin
  for row_record in
    select u.id,
           coalesce(
             nullif(pp.full_name, ''),
             split_part(coalesce(u.email, ''), '@', 1)
           ) as seed
      from public.users u
      left join public.patient_profiles pp on pp.user_id = u.id
     where not exists (
       select 1 from public.usernames un where un.user_id = u.id
     )
  loop
    insert into public.usernames (user_id, username)
    values (
      row_record.id,
      public.generate_username(row_record.seed, row_record.id)
    )
    on conflict (user_id) do nothing;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Referral links
-- ---------------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users (id) on delete cascade,
  referee_id uuid not null unique references public.users (id) on delete cascade,
  code text not null,
  status text not null default 'pending'
    check (status in ('pending', 'qualified', 'rewarded', 'cancelled')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  rewarded_at timestamptz,
  constraint referrals_no_self check (referrer_id <> referee_id)
);

create index if not exists referrals_referrer_idx
  on public.referrals (referrer_id, created_at desc);

alter table public.referrals enable row level security;

grant select on public.referrals to authenticated;

drop policy if exists "referrals: own read" on public.referrals;
create policy "referrals: own read"
  on public.referrals for select
  to authenticated
  using (referrer_id = auth.uid() or referee_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. Referral API
-- ---------------------------------------------------------------------------
create or replace function public.check_referral_code(p_code text)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select case
    when p_code is null or btrim(p_code) = '' then
      jsonb_build_object('ok', false, 'message', 'Enter a referral code.')
    when exists (
      select 1
        from public.usernames un
        join public.patient_profiles pp on pp.user_id = un.user_id
       where lower(un.username) = lower(btrim(p_code))
    ) then
      jsonb_build_object('ok', true)
    else
      jsonb_build_object('ok', false, 'message', 'That referral code was not found.')
  end;
$$;

revoke all on function public.check_referral_code(text) from public;
grant execute on function public.check_referral_code(text) to anon, authenticated;

create or replace function public.claim_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_code text := lower(btrim(coalesce(p_code, '')));
  v_referrer uuid;
  v_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'message', 'Sign in first.');
  end if;

  if v_code = '' then
    return jsonb_build_object('ok', false, 'message', 'Enter a referral code.');
  end if;

  if not exists (select 1 from public.users where id = v_user) then
    return jsonb_build_object('ok', false, 'message', 'Finish setting up your account first.');
  end if;

  if not exists (select 1 from public.patient_profiles where user_id = v_user) then
    return jsonb_build_object('ok', false, 'message', 'Complete your patient profile first.');
  end if;

  select un.user_id
    into v_referrer
    from public.usernames un
    join public.patient_profiles pp on pp.user_id = un.user_id
   where lower(un.username) = v_code
   limit 1;

  if v_referrer is null then
    return jsonb_build_object('ok', false, 'message', 'That referral code was not found.');
  end if;

  if v_referrer = v_user then
    return jsonb_build_object('ok', false, 'message', 'You cannot refer yourself.');
  end if;

  insert into public.referrals (referrer_id, referee_id, code)
  values (v_referrer, v_user, v_code)
  on conflict (referee_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object(
      'ok', false,
      'duplicate', true,
      'message', 'A referral is already linked to this account.'
    );
  end if;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.claim_referral(text) from public;
grant execute on function public.claim_referral(text) to authenticated;

create or replace function public.set_referral_code(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_code text := lower(btrim(coalesce(p_username, '')));
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'message', 'Sign in first.');
  end if;

  if not exists (select 1 from public.users where id = v_user) then
    return jsonb_build_object('ok', false, 'message', 'Finish setting up your account first.');
  end if;

  if v_code !~ '^[a-z0-9][a-z0-9_-]{2,19}$' then
    return jsonb_build_object(
      'ok', false,
      'message', 'Use 3 to 20 lowercase letters, numbers, hyphens, or underscores.'
    );
  end if;

  if exists (
    select 1 from public.usernames
     where lower(username) = v_code
       and user_id <> v_user
  ) then
    return jsonb_build_object('ok', false, 'message', 'That username is already taken.');
  end if;

  insert into public.usernames (user_id, username)
  values (v_user, v_code)
  on conflict (user_id) do update
    set username = excluded.username,
        updated_at = now();

  return jsonb_build_object('ok', true, 'username', v_code);
end;
$$;

revoke all on function public.set_referral_code(text) from public;
grant execute on function public.set_referral_code(text) to authenticated;

create or replace function public.my_referrals()
returns table (
  id uuid,
  referee_username text,
  referee_name text,
  status text,
  created_at timestamptz,
  qualified_at timestamptz,
  rewarded_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select r.id,
         un.username as referee_username,
         coalesce(nullif(pp.full_name, ''), 'A friend') as referee_name,
         r.status,
         r.created_at,
         r.qualified_at,
         r.rewarded_at
    from public.referrals r
    left join public.usernames un on un.user_id = r.referee_id
    left join public.patient_profiles pp on pp.user_id = r.referee_id
   where r.referrer_id = auth.uid()
   order by r.created_at desc;
$$;

revoke all on function public.my_referrals() from public;
grant execute on function public.my_referrals() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Reward gate
-- ---------------------------------------------------------------------------
create or replace function public.qualify_referral()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_task_count integer;
  v_referral public.referrals%rowtype;
  v_referee_name text;
  v_referrer_patient uuid;
  v_referee_patient uuid;
begin
  if new.source <> 'task' then
    return new;
  end if;

  select count(distinct reference)
    into v_task_count
    from public.point_events
   where user_id = new.user_id
     and source = 'task';

  if v_task_count < 3 then
    return new;
  end if;

  select *
    into v_referral
    from public.referrals
   where referee_id = new.user_id
     and status = 'pending'
   for update;

  if v_referral.id is null then
    return new;
  end if;

  select id
    into v_referrer_patient
    from public.patient_profiles
   where user_id = v_referral.referrer_id
   limit 1;

  select id
    into v_referee_patient
    from public.patient_profiles
   where user_id = v_referral.referee_id
   limit 1;

  if v_referrer_patient is null or v_referee_patient is null then
    update public.referrals
       set status = 'qualified',
           qualified_at = now()
     where id = v_referral.id;

    return new;
  end if;

  select coalesce(nullif(pp.full_name, ''), 'A friend')
    into v_referee_name
    from public.patient_profiles pp
   where pp.user_id = v_referral.referee_id;

  v_referee_name := coalesce(v_referee_name, 'A friend');

  update public.referrals
     set status = 'rewarded',
         qualified_at = now(),
         rewarded_at = now()
   where id = v_referral.id;

  insert into public.earnings (
    patient_id,
    amount_local,
    currency,
    status,
    source,
    description
  )
  values (
    v_referrer_patient,
    1000,
    'NGN',
    'available',
    'referral',
    'Referral reward: ' || v_referee_name || ' completed 3 tasks'
  );

  insert into public.earnings (
    patient_id,
    amount_local,
    currency,
    status,
    source,
    description
  )
  values (
    v_referee_patient,
    800,
    'NGN',
    'available',
    'referral',
    'Welcome referral reward: 3 tasks completed'
  );

  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values
    (
      v_referral.referrer_id,
      'billing',
      'Referral reward unlocked',
      'You earned N1,000 because ' || v_referee_name || ' completed 3 tasks.',
      '/dashboard/referrals',
      jsonb_build_object('referral_id', v_referral.id)
    ),
    (
      v_referral.referee_id,
      'billing',
      'Welcome reward unlocked',
      'You earned N800 for completing 3 tasks.',
      '/dashboard/earnings',
      jsonb_build_object('referral_id', v_referral.id)
    );

  return new;
end;
$$;

drop trigger if exists point_events_qualify_referral on public.point_events;
create trigger point_events_qualify_referral
  after insert on public.point_events
  for each row execute function public.qualify_referral();
