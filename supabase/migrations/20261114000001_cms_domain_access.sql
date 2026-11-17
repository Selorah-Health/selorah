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
