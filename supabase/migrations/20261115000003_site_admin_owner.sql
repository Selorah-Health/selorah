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
