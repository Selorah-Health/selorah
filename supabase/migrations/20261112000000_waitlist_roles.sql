-- Keep the waitlist taxonomy to Patient, Doctor, and Hospital, make duplicate
-- signups explicit, and add a single atomic join function for the frontend.

alter table public.waitlist add column if not exists role text;
alter table public.waitlist add column if not exists source text;
alter table public.waitlist add column if not exists frustration text;
alter table public.waitlist add column if not exists details jsonb not null default '{}'::jsonb;

update public.waitlist set details = '{}'::jsonb where details is null;
alter table public.waitlist alter column details set default '{}'::jsonb;
alter table public.waitlist alter column details set not null;

-- Normalize existing values. Unknown values become Patient so the public
-- count never shows a second patient category or an "Other" bucket.
update public.waitlist
set role = case
  when lower(btrim(coalesce(role, ''))) = 'doctor' then 'doctor'
  when lower(btrim(coalesce(role, ''))) in ('hospital', 'provider', 'clinic') then 'hospital'
  else 'patient'
end;

alter table public.waitlist alter column role set default 'patient';
alter table public.waitlist alter column role set not null;

alter table public.waitlist drop constraint if exists waitlist_role_check;
alter table public.waitlist
  add constraint waitlist_role_check
  check (role in ('patient', 'doctor', 'hospital'));

-- Keep the earliest row for each email, but preserve the most specific role
-- and the latest contact details from duplicates before deleting them.
with ranked as (
  select
    id,
    row_number() over (
      partition by lower(btrim(email))
      order by created_at asc nulls last, id asc
    ) as rn,
    max(
      case role
        when 'hospital' then 3
        when 'doctor' then 2
        else 1
      end
    ) over (partition by lower(btrim(email))) as role_rank,
    first_value(full_name) over (
      partition by lower(btrim(email))
      order by created_at desc nulls last, id desc
    ) as latest_name,
    first_value(source) over (
      partition by lower(btrim(email))
      order by created_at desc nulls last, id desc
    ) as latest_source,
    first_value(frustration) over (
      partition by lower(btrim(email))
      order by created_at desc nulls last, id desc
    ) as latest_frustration
  from public.waitlist
)
update public.waitlist w
set
  role = case r.role_rank
    when 3 then 'hospital'
    when 2 then 'doctor'
    else 'patient'
  end,
  full_name = coalesce(nullif(r.latest_name, ''), w.full_name),
  source = coalesce(r.latest_source, w.source),
  frustration = coalesce(r.latest_frustration, w.frustration)
from ranked r
where w.id = r.id and r.rn = 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by lower(btrim(email))
      order by created_at asc nulls last, id asc
    ) as rn
  from public.waitlist
)
delete from public.waitlist w
using ranked r
where w.id = r.id and r.rn > 1;

create unique index if not exists waitlist_email_lower_key
  on public.waitlist (lower(btrim(email)));

-- Replace the old stats function so it always returns exactly three roles.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'waitlist_stats'
  loop
    execute format('drop function %s', fn.signature);
  end loop;
end $$;

create function public.waitlist_stats()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with normalized as (
    select case
      when lower(btrim(coalesce(role, ''))) = 'doctor' then 'doctor'
      when lower(btrim(coalesce(role, ''))) in ('hospital', 'provider', 'clinic') then 'hospital'
      else 'patient'
    end as role
    from public.waitlist
  )
  select jsonb_build_object(
    'total', count(*),
    'by_role', jsonb_build_object(
      'patient', count(*) filter (where role = 'patient'),
      'doctor', count(*) filter (where role = 'doctor'),
      'hospital', count(*) filter (where role = 'hospital')
    )
  )
  from normalized;
$$;

revoke all on function public.waitlist_stats() from public;
grant execute on function public.waitlist_stats() to anon, authenticated;

create or replace function public.join_waitlist(
  p_email text,
  p_full_name text,
  p_role text default 'patient',
  p_source text default 'unknown',
  p_details jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := btrim(coalesce(p_full_name, ''));
  v_role text;
  v_details jsonb := coalesce(p_details, '{}'::jsonb);
  v_existing_id uuid;
begin
  if v_email = '' or v_name = '' then
    raise exception 'Email and name are required';
  end if;

  v_role := case
    when lower(btrim(coalesce(p_role, ''))) = 'doctor' then 'doctor'
    when lower(btrim(coalesce(p_role, ''))) in ('hospital', 'provider', 'clinic') then 'hospital'
    else 'patient'
  end;

  select id into v_existing_id
  from public.waitlist
  where lower(btrim(email)) = v_email
  limit 1;

  if v_existing_id is not null then
    update public.waitlist
    set
      full_name = coalesce(nullif(v_name, ''), full_name),
      role = case
        when v_role = 'hospital' then 'hospital'
        when v_role = 'doctor' and role <> 'hospital' then 'doctor'
        else role
      end,
      source = coalesce(nullif(p_source, ''), source),
      details = coalesce(details, '{}'::jsonb) || v_details
    where id = v_existing_id;

    return jsonb_build_object('already_on_list', true, 'role', v_role);
  end if;

  insert into public.waitlist (email, full_name, role, source, details)
  values (v_email, v_name, v_role, coalesce(nullif(p_source, ''), 'unknown'), v_details);

  return jsonb_build_object('already_on_list', false, 'role', v_role);
exception
  when unique_violation then
    return jsonb_build_object('already_on_list', true, 'role', v_role);
end;
$$;

revoke all on function public.join_waitlist(text, text, text, text, jsonb) from public;
grant execute on function public.join_waitlist(text, text, text, text, jsonb) to anon, authenticated;
