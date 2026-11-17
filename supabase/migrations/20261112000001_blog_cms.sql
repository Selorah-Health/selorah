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
