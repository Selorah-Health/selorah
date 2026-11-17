-- Selorah CMS, referrals, and waitlist email bundle.
--
-- Paste this entire file into the Supabase SQL editor and run it once.
-- It applies these migrations in dependency order:
--
--   20261112000001_blog_cms.sql
--   20261113000001_blog_storage.sql
--   20261114000001_cms_domain_access.sql
--   20261115000001_referrals.sql
--   20261115000002_site_cms.sql
--   20261115000003_site_admin_owner.sql
--   20261116000000_waitlist_email.sql
--   20261116000001_blog_linkedin_posts.sql
--
-- Every statement is idempotent, so it is safe to run again if a later step
-- failed. Do not paste the older migrations in supabase/migrations; they are
-- already applied to the live project.

begin;


-- ===========================================================================
-- 20261112000001_blog_cms.sql
-- ===========================================================================

-- Blog CMS for public announcements and product updates.
--
-- Writers and admins can create and publish posts. The public can only read
-- posts that are published and whose publish time has passed. Content is stored
-- as Markdown and rendered as React nodes in the frontend, never as raw HTML.

-- Add the writer role used by the CMS. The legacy users table is optional.
do $$
declare
  v_invalid integer;
begin
  -- public.users is optional and may be a view on some installs. Only alter a
  -- real table, and only when the role column is present.
  if exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = 'users'
       and c.relkind = 'r'
  ) and exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'users'
       and column_name = 'role'
  ) then
    -- Do not replace the existing constraint when live data already uses a
    -- role outside this list. That would make an otherwise safe CMS bundle
    -- fail on an unrelated legacy role.
    select count(*)
      into v_invalid
      from public.users
     where role is not null
       and role not in (
         'patient',
         'doctor',
         'hospital',
         'clinic',
         'provider',
         'researcher',
         'insurer',
         'writer',
         'admin',
         'qa',
         'developer',
         'partner'
       );

    if v_invalid = 0 then
      alter table public.users drop constraint if exists users_role_check;
      alter table public.users
        add constraint users_role_check
        check (role in (
          'patient',
          'doctor',
          'hospital',
          'clinic',
          'provider',
          'researcher',
          'insurer',
          'writer',
          'admin',
          'qa',
          'developer',
          'partner'
        ));
    end if;
  end if;
end $$;

-- Internal staff on @selorah.app can manage the CMS without a writer role.
create or replace function public.is_selorah_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like '%@selorah.app';
$$;

revoke all on function public.is_selorah_staff() from public;
grant execute on function public.is_selorah_staff() to authenticated;

-- Resolve the CMS role from public.profiles, with the domain rule as an override.
create or replace function public.blog_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.is_selorah_staff() then 'admin'
    else coalesce(
      (select role from public.profiles where id = auth.uid()),
      auth.jwt() -> 'app_metadata' ->> 'role',
      'patient'
    )
  end;
$$;

revoke all on function public.blog_role() from public;
grant execute on function public.blog_role() to authenticated;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  category text not null default 'Announcement',
  -- public.profiles is a read-only view on this project, so this stays a plain
  -- uuid instead of a foreign key.
  author_id uuid,
  author_name text not null default 'Selorah Health',
  author_avatar_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc);

create index if not exists blog_posts_category_idx
  on public.blog_posts (category);

create or replace function public.set_blog_post_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_blog_post_updated_at();

alter table public.blog_posts enable row level security;

-- Published posts are public. A future published_at stays hidden until its time.
drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts"
  on public.blog_posts for select
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

drop policy if exists "Writers can read all blog posts" on public.blog_posts;
create policy "Writers can read all blog posts"
  on public.blog_posts for select
  to authenticated
  using (public.blog_role() in ('writer', 'admin'));

drop policy if exists "Writers can insert blog posts" on public.blog_posts;
create policy "Writers can insert blog posts"
  on public.blog_posts for insert
  to authenticated
  with check (public.blog_role() in ('writer', 'admin'));

drop policy if exists "Writers can update blog posts" on public.blog_posts;
create policy "Writers can update blog posts"
  on public.blog_posts for update
  to authenticated
  using (public.blog_role() in ('writer', 'admin'))
  with check (public.blog_role() in ('writer', 'admin'));

drop policy if exists "Writers can delete blog posts" on public.blog_posts;
create policy "Writers can delete blog posts"
  on public.blog_posts for delete
  to authenticated
  using (public.blog_role() in ('writer', 'admin'));

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

-- A first post so the public blog and the landing page teaser are never empty.
insert into public.blog_posts (
  slug,
  title,
  excerpt,
  content,
  category,
  author_name,
  status,
  published_at
)
values (
  'welcome-to-selorah',
  'Welcome to the Selorah blog',
  'Announcements, product updates, and practical notes on portable health records.',
  $markdown$# Welcome to the Selorah blog

This is where we will share launch news, product changes, and practical notes about health records that finally move with the person who owns them.

## What to expect

- City launches and early access windows
- Product updates and new record features
- Plain language notes on privacy, consent, and sharing
- Stories from the build

## Why a blog

Important updates should not disappear in a chat thread. If you joined the waitlist, this is the place to find the details you need.

Thanks for being here early.

The Selorah Health team
$markdown$,
  'Announcement',
  'Selorah Health',
  'published',
  now()
)
on conflict (slug) do nothing;


-- ===========================================================================
-- 20261113000001_blog_storage.sql
-- ===========================================================================

-- Public bucket for blog cover images.
-- Writers and admins upload covers from the CMS. Public visitors only read.

-- Keep the role helpers here too so this file can be applied on its own.
create or replace function public.is_selorah_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like '%@selorah.app';
$$;

revoke all on function public.is_selorah_staff() from public;
grant execute on function public.is_selorah_staff() to authenticated;

create or replace function public.blog_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.is_selorah_staff() then 'admin'
    else coalesce(
      (select role from public.profiles where id = auth.uid()),
      auth.jwt() -> 'app_metadata' ->> 'role',
      'patient'
    )
  end;
$$;

revoke all on function public.blog_role() from public;
grant execute on function public.blog_role() to authenticated;

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'blog',
    'blog',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
  on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
exception
  when insufficient_privilege then
    raise notice 'Skipping blog bucket update: %', sqlerrm;
end $$;

-- Storage policies can fail when the SQL editor account does not own
-- storage.objects. Catch that case so the database tables still apply; the
-- dashboard steps in docs/APPLY_CMS.md cover the storage policies.
do $$
begin
  execute $policy$drop policy if exists "Public can read blog covers" on storage.objects$policy$;
  execute $policy$create policy "Public can read blog covers" on storage.objects for select to public using (bucket_id = 'blog')$policy$;

  execute $policy$drop policy if exists "Writers can upload blog covers" on storage.objects$policy$;
  execute $policy$create policy "Writers can upload blog covers" on storage.objects for insert to authenticated with check (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin'))$policy$;

  execute $policy$drop policy if exists "Writers can update blog covers" on storage.objects$policy$;
  execute $policy$create policy "Writers can update blog covers" on storage.objects for update to authenticated using (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin')) with check (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin'))$policy$;

  execute $policy$drop policy if exists "Writers can delete blog covers" on storage.objects$policy$;
  execute $policy$create policy "Writers can delete blog covers" on storage.objects for delete to authenticated using (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin'))$policy$;
exception
  when insufficient_privilege then
    raise notice 'Skipping blog storage policies: %', sqlerrm;
end $$;


-- ===========================================================================
-- 20261114000001_cms_domain_access.sql
-- ===========================================================================

-- Internal CMS access for @selorah.app staff.
--
-- Any authenticated user whose JWT email ends in @selorah.app is treated as a
-- CMS admin. This applies to both the UI guard and the database policies, so a
-- new staff account can publish without a manual role change.

do $$
begin
  if to_regclass('public.blog_posts') is null then
    raise exception
      'public.blog_posts is missing. Run 20261112000001_blog_cms.sql first, or paste supabase/APPLY_CMS.sql.';
  end if;
end $$;

create or replace function public.is_selorah_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like '%@selorah.app';
$$;

revoke all on function public.is_selorah_staff() from public;
grant execute on function public.is_selorah_staff() to authenticated;

create or replace function public.blog_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.is_selorah_staff() then 'admin'
    else coalesce(
      (select role from public.profiles where id = auth.uid()),
      auth.jwt() -> 'app_metadata' ->> 'role',
      'patient'
    )
  end;
$$;

revoke all on function public.blog_role() from public;
grant execute on function public.blog_role() to authenticated;

-- public.profiles is a read-only compatibility view on this project, so
-- author_id stays a plain uuid. Drop any older foreign key that points at a
-- table or view that cannot be referenced.
do $$
begin
  if to_regclass('public.blog_posts') is not null then
    alter table public.blog_posts drop constraint if exists blog_posts_author_id_fkey;
  end if;
end $$;

-- Blog post policies.
drop policy if exists "Writers can read all blog posts" on public.blog_posts;
create policy "Writers can read all blog posts"
  on public.blog_posts for select
  to authenticated
  using (public.blog_role() in ('writer', 'admin'));

drop policy if exists "Writers can insert blog posts" on public.blog_posts;
create policy "Writers can insert blog posts"
  on public.blog_posts for insert
  to authenticated
  with check (public.blog_role() in ('writer', 'admin'));

drop policy if exists "Writers can update blog posts" on public.blog_posts;
create policy "Writers can update blog posts"
  on public.blog_posts for update
  to authenticated
  using (public.blog_role() in ('writer', 'admin'))
  with check (public.blog_role() in ('writer', 'admin'));

drop policy if exists "Writers can delete blog posts" on public.blog_posts;
create policy "Writers can delete blog posts"
  on public.blog_posts for delete
  to authenticated
  using (public.blog_role() in ('writer', 'admin'));

-- Cover image policies. Skip them when the SQL editor account does not own
-- storage.objects; docs/APPLY_CMS.md has the dashboard steps.
do $$
begin
  execute $policy$drop policy if exists "Writers can upload blog covers" on storage.objects$policy$;
  execute $policy$create policy "Writers can upload blog covers" on storage.objects for insert to authenticated with check (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin'))$policy$;

  execute $policy$drop policy if exists "Writers can update blog covers" on storage.objects$policy$;
  execute $policy$create policy "Writers can update blog covers" on storage.objects for update to authenticated using (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin')) with check (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin'))$policy$;

  execute $policy$drop policy if exists "Writers can delete blog covers" on storage.objects$policy$;
  execute $policy$create policy "Writers can delete blog covers" on storage.objects for delete to authenticated using (bucket_id = 'blog' and public.blog_role() in ('writer', 'admin'))$policy$;
exception
  when insufficient_privilege then
    raise notice 'Skipping blog storage policies: %', sqlerrm;
end $$;


-- ===========================================================================
-- 20261115000001_referrals.sql
-- ===========================================================================

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


-- ===========================================================================
-- 20261115000002_site_cms.sql
-- ===========================================================================

-- Website CMS content and partnership ad slots.
--
-- Public visitors read published content and active ad slots. Only CMS admins
-- can write. Ad images live in a public Supabase Storage bucket called "site".

-- Keep the staff helper here too so this file can be applied on its own.
create or replace function public.is_selorah_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like '%@selorah.app';
$$;

revoke all on function public.is_selorah_staff() from public;
grant execute on function public.is_selorah_staff() to authenticated;

-- Bootstrap site admins. The owner address is also allowlisted in the browser
-- so the admin route opens before a profile role is set. The table is the source
-- of truth for database writes and can be extended without a code deploy.
create table if not exists public.site_admins (
  email text primary key,
  label text,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
revoke all on public.site_admins from anon, authenticated;

insert into public.site_admins (email, label)
values
  ('officialsammy61@gmail.com', 'Owner'),
  ('officalsammy61@gmail.com', 'Owner (legacy spelling)'),
  ('samuelamanze@selorah.app', 'Founder')
on conflict (email) do nothing;

create or replace function public.is_selorah_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_selorah_staff()
    or exists (
      select 1
      from public.site_admins
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_selorah_site_admin() from public;
grant execute on function public.is_selorah_site_admin() to authenticated;

create or replace function public.blog_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.is_selorah_site_admin() then 'admin'
    else coalesce(
      (select role from public.profiles where id = auth.uid()),
      auth.jwt() -> 'app_metadata' ->> 'role',
      'patient'
    )
  end;
$$;

revoke all on function public.blog_role() from public;
grant execute on function public.blog_role() to authenticated;

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_at timestamptz not null default now(),
  -- public.profiles is a read-only view, so this stays a plain uuid.
  updated_by uuid
);

alter table public.site_content enable row level security;

grant select on public.site_content to anon, authenticated;
grant select, insert, update, delete on public.site_content to authenticated;

drop policy if exists "Public can read published site content" on public.site_content;
create policy "Public can read published site content"
on public.site_content for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
on public.site_content for all
to authenticated
using (public.blog_role() = 'admin')
with check (public.blog_role() = 'admin');

create table if not exists public.ad_slots (
  id text primary key,
  label text not null default '',
  headline text not null default '',
  body text not null default '',
  cta_label text not null default '',
  cta_url text not null default '/contact',
  image_url text,
  image_alt text,
  aspect_ratio text not null default '16 / 3',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  -- public.profiles is a read-only view, so this stays a plain uuid.
  updated_by uuid
);

alter table public.ad_slots enable row level security;

grant select on public.ad_slots to anon, authenticated;
grant select, insert, update, delete on public.ad_slots to authenticated;

drop policy if exists "Public can read active ad slots" on public.ad_slots;
create policy "Public can read active ad slots"
on public.ad_slots for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage ad slots" on public.ad_slots;
create policy "Admins can manage ad slots"
on public.ad_slots for all
to authenticated
using (public.blog_role() = 'admin')
with check (public.blog_role() = 'admin');

insert into public.site_content (key, value, is_published)
values ('site', '{}'::jsonb, true)
on conflict (key) do nothing;

insert into public.ad_slots (
  id,
  label,
  headline,
  body,
  cta_label,
  cta_url,
  aspect_ratio,
  is_active,
  sort_order
)
values
  (
    'partner-band',
    'Partnership band',
    'Built with the people who deliver care.',
    'Clinics, insurers, and research teams working on portable records across Africa.',
    'Partner with Selorah',
    '/contact',
    '16 / 3',
    true,
    0
  ),
  (
    'leaderboard',
    'Partner feature',
    'Put your brand in front of patients and clinicians.',
    'Partner on a guide, a launch note, or a practical health tool. We keep health data out of advertising and review every partner for fit.',
    'Partner with Selorah',
    '/contact',
    '16 / 3',
    true,
    1
  ),
  (
    'native',
    'Paid partnership',
    'Your story belongs here.',
    'Reach waitlist members and patient communities with a partner guide, launch note, or health tool. Every placement is reviewed for fit.',
    'Partner with Selorah',
    '/contact',
    '16 / 9',
    true,
    2
  )
on conflict (id) do nothing;

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'site',
    'site',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  )
  on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
exception
  when insufficient_privilege then
    raise notice 'Skipping site bucket update: %', sqlerrm;
end $$;

-- Storage policies can fail when the SQL editor account does not own
-- storage.objects. Catch that case so the database tables still apply; the
-- dashboard steps in docs/APPLY_CMS.md cover the storage policies.
do $$
begin
  execute $policy$drop policy if exists "Public can read site images" on storage.objects$policy$;
  execute $policy$create policy "Public can read site images" on storage.objects for select to public using (bucket_id = 'site')$policy$;

  execute $policy$drop policy if exists "Admins can upload site images" on storage.objects$policy$;
  execute $policy$create policy "Admins can upload site images" on storage.objects for insert to authenticated with check (bucket_id = 'site' and public.blog_role() = 'admin')$policy$;

  execute $policy$drop policy if exists "Admins can update site images" on storage.objects$policy$;
  execute $policy$create policy "Admins can update site images" on storage.objects for update to authenticated using (bucket_id = 'site' and public.blog_role() = 'admin') with check (bucket_id = 'site' and public.blog_role() = 'admin')$policy$;

  execute $policy$drop policy if exists "Admins can delete site images" on storage.objects$policy$;
  execute $policy$create policy "Admins can delete site images" on storage.objects for delete to authenticated using (bucket_id = 'site' and public.blog_role() = 'admin')$policy$;
exception
  when insufficient_privilege then
    raise notice 'Skipping site storage policies: %', sqlerrm;
end $$;


-- ===========================================================================
-- 20261115000003_site_admin_owner.sql
-- ===========================================================================

-- Bootstrap owner access for the website admin.
--
-- The frontend allows the owner address through the route guard so the admin
-- can open before a profile role is set. Database writes still use RLS, so the
-- same address must be in public.site_admins. Keep this migration separate from
-- the site CMS migration so existing installs can apply it on its own.

-- Keep the staff helper here too so this file can be applied on its own.
create or replace function public.is_selorah_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like '%@selorah.app';
$$;

revoke all on function public.is_selorah_staff() from public;
grant execute on function public.is_selorah_staff() to authenticated;

create table if not exists public.site_admins (
  email text primary key,
  label text,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;
revoke all on public.site_admins from anon, authenticated;

insert into public.site_admins (email, label)
values
  ('officialsammy61@gmail.com', 'Owner'),
  ('officalsammy61@gmail.com', 'Owner (legacy spelling)'),
  ('samuelamanze@selorah.app', 'Founder')
on conflict (email) do nothing;

create or replace function public.is_selorah_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_selorah_staff()
    or exists (
      select 1
      from public.site_admins
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_selorah_site_admin() from public;
grant execute on function public.is_selorah_site_admin() to authenticated;

create or replace function public.blog_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when public.is_selorah_site_admin() then 'admin'
    else coalesce(
      (select role from public.profiles where id = auth.uid()),
      auth.jwt() -> 'app_metadata' ->> 'role',
      'patient'
    )
  end;
$$;

revoke all on function public.blog_role() from public;
grant execute on function public.blog_role() to authenticated;


-- ===========================================================================
-- 20261116000000_waitlist_email.sql
-- ===========================================================================

-- Waitlist confirmation email.
--
-- The waitlist insert is public, but the email queue is service-role only.
-- A security definer trigger keeps the public RPC from needing access to the
-- queue while still confirming every new signup.

create or replace function public.enqueue_waitlist_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_first_name text;
  v_city text;
  v_role text;
begin
  v_first_name := coalesce(
    nullif(split_part(btrim(new.full_name), ' ', 1), ''),
    'there'
  );
  v_city := coalesce(nullif(btrim(new.details ->> 'city'), ''), '');
  v_role := coalesce(nullif(btrim(new.role), ''), 'patient');

  perform public.enqueue_email(
    new.email,
    'waitlist_confirmation',
    'You are on the Selorah waitlist',
    jsonb_build_object(
      'first_name', v_first_name,
      'city', v_city,
      'role', v_role
    )
  );

  return new;
exception
  when others then
    -- A confirmation email must never block a waitlist signup.
    return new;
end;
$$;

revoke all on function public.enqueue_waitlist_email() from public;

drop trigger if exists on_waitlist_created_email on public.waitlist;
create trigger on_waitlist_created_email
  after insert on public.waitlist
  for each row execute function public.enqueue_waitlist_email();


-- ===========================================================================
-- 20261116000001_blog_linkedin_posts.sql
-- ===========================================================================

-- Blog posts based on Selorah Health LinkedIn updates.
--
-- These are seeded with the same copy used by the client fallback so the
-- production blog and a fresh environment tell the same story. Existing posts
-- are left alone, which means an admin edit is never overwritten by a deploy.

do $$
begin
  if to_regclass('public.blog_posts') is null then
    raise exception
      'public.blog_posts is missing. Run 20261112000001_blog_cms.sql first, or paste supabase/APPLY_CMS.sql.';
  end if;
end $$;

update public.blog_posts
set cover_image_url = '/blog/covers/welcome-to-selorah.svg'
where slug = 'welcome-to-selorah'
  and cover_image_url is null;

insert into public.blog_posts (
  slug,
  title,
  excerpt,
  content,
  cover_image_url,
  category,
  author_name,
  status,
  published_at
)
values
  (
    'know-your-numbers-on-world-diabetes-day',
    'Know your numbers on World Diabetes Day',
    'Diabetes often develops quietly. Checking your blood sugar and keeping your history close can help you act earlier.',
    $markdown$# Know your numbers on World Diabetes Day

World Diabetes Day is a reminder that many people live with diabetes for years before they know it. The early signs can feel ordinary: thirst, tiredness, blurry vision, slow healing, or weight change.

## Why the numbers matter

A blood sugar test gives you a fact you can act on. So does a record of that test. When your results, medicines, and visit notes live in one place, a new clinician can see the pattern instead of guessing.

## What to keep close

- Recent blood sugar and HbA1c results
- Medicines and doses
- Allergies and other conditions
- Emergency contacts
- Questions you want to ask at your next visit

## A record is part of care

Checking your numbers is the first step. Keeping the story around those numbers is how you make better decisions with your care team. Selorah is being built so that story stays with you, not in a folder you cannot find.

If you have symptoms that worry you, speak to a clinician. Early action is better than a late guess.$markdown$,
    '/blog/covers/know-your-numbers-on-world-diabetes-day.svg',
    'Health records',
    'Selorah Health',
    'published',
    '2026-11-14T00:00:00.000Z'
  ),
  (
    'built-for-people-who-move',
    'Built for people who move',
    'Moving to a new city should not mean leaving your health history behind. A portable record makes the first visit easier.',
    $markdown$# Built for people who move

For many people, the first real test of a health record is a move. A new job, a new city, or a new school can put you in front of a clinician who has never seen your history.

## The first visit problem

Most first visits start with the same questions. What are you allergic to? What medicines are you taking? When was your last test? Have you had surgery?

If the answers are spread across old folders, chat messages, and a hospital portal you can no longer open, the first visit becomes a memory test.

## What a portable record changes

A portable record keeps the important parts together and lets you decide who can see them.

- Your allergies and current medicines are easy to find
- Recent results travel with you
- You can share a summary before the appointment
- You can revoke access when it is no longer needed

## Made for real life

Selorah is being built for people who change cities, travel for work, study abroad, or simply want a second opinion without starting from zero. Your health history should move at the same speed as you do.$markdown$,
    '/blog/covers/built-for-people-who-move.svg',
    'Product',
    'Selorah Health',
    'published',
    '2026-11-08T00:00:00.000Z'
  ),
  (
    'the-first-60-seconds-of-an-emergency',
    'The first 60 seconds of an emergency',
    'In an emergency, the right information should be available before the paperwork starts. Here is what to keep ready.',
    $markdown$# The first 60 seconds of an emergency

In an emergency, the people helping you need a few facts quickly. Blood type, allergies, current medicines, and an emergency contact can change the first decision.

## The information that helps

- Allergies and reactions
- Current medicines and doses
- Blood type, if you know it
- Major conditions and past surgeries
- An emergency contact
- A clinician or hospital you trust

## Keep it available offline

A record is only useful if you can reach it when the network is down. Selorah is designed so the emergency parts of your record can be available on your device, even when you cannot load a website.

## A record is not a replacement for emergency care

If someone is in danger, call your local emergency number first. A health record supports the people treating you. It does not replace them.

The goal is simple. When every second counts, the important facts should not be locked in a folder at home.$markdown$,
    '/blog/covers/the-first-60-seconds-of-an-emergency.svg',
    'Health records',
    'Selorah Health',
    'published',
    '2026-11-01T00:00:00.000Z'
  ),
  (
    'one-patient-one-record-more-control',
    'One patient. One record. More control.',
    'A portable record gives patients a single source of truth and a clear way to share it with the people who provide care.',
    $markdown$# One patient. One record. More control.

Health care produces a lot of information. Test results, prescriptions, visit notes, scans, and discharge instructions. Too often, each one lives in a different place.

## One source of truth

A patient owned record brings the important pieces together. It does not replace the hospital system. It gives the patient a copy they can keep and a way to share it when needed.

## Control is more than storage

Keeping a record is not enough. You need to know who can see it, what they can see, and for how long.

- Share only the records a clinician needs
- Set an access window
- Revoke access when the visit is over
- See when your record was opened

## The patient stays at the center

Hospitals, doctors, and insurers all need access to information. The patient should decide how that access works. That is the principle behind Selorah.

One patient. One record. More control.$markdown$,
    '/blog/covers/one-patient-one-record-more-control.svg',
    'Company',
    'Selorah Health',
    'published',
    '2026-10-25T00:00:00.000Z'
  ),
  (
    'progress-report-moving-access-control-to-monad',
    'Progress report: moving access control to Monad',
    'We moved the access control layer for shared records to Monad for faster, cheaper, verifiable access grants.',
    $markdown$# Progress report: moving access control to Monad

We have moved the access control layer for shared records to Monad. This is a progress report on what changed and why it matters for patients and care teams.

## Why access control belongs onchain

When a patient shares a record, the permission should be easy to verify and hard to quietly change. An onchain access grant gives both sides a shared record of who was allowed to open what, and when.

## Why Monad

Monad gives us an EVM compatible environment with fast finality and low fees. That combination matters for a health record product.

- Access grants can be confirmed in seconds
- The cost of a grant stays low enough for everyday use
- Existing Ethereum tooling works with the contracts
- The audit trail is independent of a single hospital database

## What is live now

The access control contracts are deployed and the hospital portal can request a grant. A patient can approve or revoke access from the app. The record itself stays encrypted. The chain records the permission, not the medical content.

## What comes next

We are testing the flow with a small group of clinicians and adding clearer language around consent. The goal is not to make the technology visible. The goal is to make sharing safer and easier to verify.

We will share more as the pilot expands.$markdown$,
    '/blog/covers/progress-report-moving-access-control-to-monad.svg',
    'Product',
    'Selorah Health',
    'published',
    '2026-10-18T00:00:00.000Z'
  ),
  (
    'why-we-started-selorah-health',
    'Why we started Selorah Health',
    'Two experiences showed us what happens when medical records do not move with the patient. Selorah is our answer.',
    $markdown$# Why we started Selorah Health

Selorah started with a question that would not leave us alone. Why is it still so hard to get your own medical history when you need it?

## A friend in the hospital

A close friend was taken to the hospital after an accident. He was unconscious. His family knew he had a condition and took medicine for it, but nobody could find the details. The first hours were spent calling relatives and searching for a folder instead of treating him with the full picture.

He survived. The experience stayed with us.

## A colleague who was pregnant

A colleague was pregnant and had to travel for work. Her antenatal records were in a hospital in one city. The clinic in the other city wanted the history. She spent days trying to get copies while managing a pregnancy and a job.

The records existed. They just did not move with her.

## The question

If a record can follow a payment across the world, why can it not follow a person across a city?

## What we are building

Selorah is a patient owned health record. It keeps the important parts of your history together, encrypted, and ready to share when you choose. It is built for the way care actually happens in Nigeria and across Africa, where people move, networks fail, and records are often still on paper.

We are starting with the basics. A record you can carry. A way to share it safely. A clear trail of who opened it.

That is the work.$markdown$,
    '/blog/covers/why-we-started-selorah-health.svg',
    'Company',
    'Selorah Health',
    'published',
    '2026-10-11T00:00:00.000Z'
  ),
  (
    'what-we-are-building-and-why-it-matters',
    'What we are building and why it matters',
    'A waitlist update on the product, the city rollout, and the problems we are solving first.',
    $markdown$# What we are building and why it matters

We are building and shipping in public. Here is a short update on what the team is working on and what you can expect next.

## The product

Selorah is a patient owned health record with three core jobs.

- Keep your medical history in one place
- Let you share only what a clinician needs
- Show you who opened your record and when

## The rollout

We are starting with a small group of patients, clinicians, and hospitals. The waitlist helps us open each city in a controlled way so support and clinical review can keep up with demand.

## The problems we are solving first

- Emergency information that is available offline
- Records that move when a patient changes city
- Consent and access that are easy to understand
- A clean handover between hospitals and clinics

## Join the waitlist

If you want early access, join the waitlist and tell us your city. We will send launch updates and product notes as they happen. No spam.$markdown$,
    '/blog/covers/what-we-are-building-and-why-it-matters.svg',
    'Announcement',
    'Selorah Health',
    'published',
    '2026-10-04T00:00:00.000Z'
  )
on conflict (slug) do nothing;


commit;
