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
