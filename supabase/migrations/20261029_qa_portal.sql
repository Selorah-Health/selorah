-- QA portal: read-only visibility into waitlist and registered portal users.
-- The QA role is stored in public.users.role. Access is enforced with a
-- security definer helper so the policies do not recurse into users.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.users where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "qa read users" on public.users;
create policy "qa read users"
  on public.users for select
  to authenticated
  using (public.current_user_role() = 'qa');

drop policy if exists "qa read waitlist" on public.waitlist;
create policy "qa read waitlist"
  on public.waitlist for select
  to authenticated
  using (public.current_user_role() = 'qa');

drop policy if exists "qa read patient profiles" on public.patient_profiles;
create policy "qa read patient profiles"
  on public.patient_profiles for select
  to authenticated
  using (public.current_user_role() = 'qa');

drop policy if exists "qa read hospital profiles" on public.hospital_profiles;
create policy "qa read hospital profiles"
  on public.hospital_profiles for select
  to authenticated
  using (public.current_user_role() = 'qa');

drop policy if exists "qa read researcher profiles" on public.researcher_profiles;
create policy "qa read researcher profiles"
  on public.researcher_profiles for select
  to authenticated
  using (public.current_user_role() = 'qa');

-- Realtime powers the live counters. Add each table once.
do $$
declare
  target text;
begin
  foreach target in array array['users', 'waitlist', 'patient_profiles', 'hospital_profiles', 'researcher_profiles']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = target
    ) then
      execute format('alter publication supabase_realtime add table public.%I', target);
    end if;
  end loop;
end
$$;
