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
