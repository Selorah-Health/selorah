-- Selorah auth identifiers, Pro entitlements and payments.
-- Safe to run on an existing project: every change is additive.

-- ---------------------------------------------------------------------------
-- Login with phone number or NIN
-- ---------------------------------------------------------------------------
-- The app resolves a phone number or NIN to the account email, then calls
-- Supabase password auth. SECURITY DEFINER keeps patient identifiers private
-- while still allowing the anon role to look up a single exact match.
create or replace function public.resolve_login_email(identifier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned text;
  digits text;
  resolved text;
begin
  cleaned := btrim(coalesce(identifier, ''));
  digits := regexp_replace(cleaned, '\D', '', 'g');

  if cleaned = '' then
    return null;
  end if;

  -- NIN: exactly 11 digits.
  if length(digits) = 11 and cleaned ~ '^[0-9 ]+$' then
    select u.email
      into resolved
      from public.patient_profiles pp
      join auth.users u on u.id = pp.user_id
     where pp.nin = digits
     limit 1;
    if resolved is not null then
      return resolved;
    end if;
  end if;

  -- Phone: compare the last 10 digits so +234, 234 and 0 prefixes all match.
  if length(digits) >= 10 then
    select u.email
      into resolved
      from public.patient_profiles pp
      join auth.users u on u.id = pp.user_id
     where regexp_replace(coalesce(pp.phone, ''), '\D', '', 'g')
           like '%' || right(digits, 10)
     limit 1;
    if resolved is not null then
      return resolved;
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pro entitlement columns
-- ---------------------------------------------------------------------------
alter table public.patient_profiles add column if not exists gender text;
alter table public.patient_profiles add column if not exists height text;
alter table public.patient_profiles add column if not exists weight text;
alter table public.patient_profiles add column if not exists allergies jsonb default '[]'::jsonb;
alter table public.patient_profiles add column if not exists emergency_medical_info text;
alter table public.patient_profiles add column if not exists emergency_contacts jsonb default '[]'::jsonb;
alter table public.patient_profiles add column if not exists family_members jsonb default '[]'::jsonb;
alter table public.patient_profiles add column if not exists tier text default 'free';
alter table public.patient_profiles add column if not exists is_pro boolean default false;
alter table public.patient_profiles add column if not exists pro_reference text;
alter table public.patient_profiles add column if not exists pro_expires_at timestamptz;

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  reference text unique not null,
  amount integer not null,
  currency text not null default 'NGN',
  status text not null default 'pending',
  provider text not null default 'paystack',
  plan text not null default 'Selorah Pro',
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own payment records" on public.payments;
create policy "Users can create their own payment records"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Helpful indexes
-- ---------------------------------------------------------------------------
create index if not exists patient_profiles_nin_idx on public.patient_profiles (nin);
create index if not exists patient_profiles_phone_idx on public.patient_profiles (phone);
create index if not exists payments_user_id_idx on public.payments (user_id);

-- ---------------------------------------------------------------------------
-- Row level security for the patient workspace
-- ---------------------------------------------------------------------------
-- These policies are additive. Existing policies keep working, and these
-- guarantee that a signed-in patient can always read and update their own
-- profile and records even on projects where the original policies were lost.

alter table public.patient_profiles enable row level security;

drop policy if exists "Patients select own profile" on public.patient_profiles;
create policy "Patients select own profile"
  on public.patient_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Patients insert own profile" on public.patient_profiles;
create policy "Patients insert own profile"
  on public.patient_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Patients update own profile" on public.patient_profiles;
create policy "Patients update own profile"
  on public.patient_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.medical_records enable row level security;

drop policy if exists "Patients select own records" on public.medical_records;
create policy "Patients select own records"
  on public.medical_records for select
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medical_records.patient_id
        and pp.user_id = auth.uid()
    )
  );

drop policy if exists "Patients insert own records" on public.medical_records;
create policy "Patients insert own records"
  on public.medical_records for insert
  with check (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medical_records.patient_id
        and pp.user_id = auth.uid()
    )
  );

drop policy if exists "Patients update own records" on public.medical_records;
create policy "Patients update own records"
  on public.medical_records for update
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medical_records.patient_id
        and pp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medical_records.patient_id
        and pp.user_id = auth.uid()
    )
  );

drop policy if exists "Patients delete own records" on public.medical_records;
create policy "Patients delete own records"
  on public.medical_records for delete
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = medical_records.patient_id
        and pp.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- Merged from 20261027_shared_visit_report.sql. Both files shared the same
-- migration version, which Supabase records as a primary key.
-- ---------------------------------------------------------------------------
-- Shared visit reports.
-- A provider opening a share link is not a signed-in Selorah user, so the
-- report is written through a token checked function instead of a table
-- policy. The token has to be active and unexpired for the insert to happen.

create or replace function public.add_shared_visit_report(
  p_token text,
  p_facility text,
  p_doctor text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.shared_links;
  v_profile_id uuid;
  v_body text;
  v_row public.medical_records;
begin
  if p_token is null or btrim(p_token) = '' then
    return jsonb_build_object('ok', false, 'message', 'A share token is required.');
  end if;

  select *
    into v_link
    from public.shared_links
   where token::text = btrim(p_token)
   limit 1;

  if v_link.id is null then
    return jsonb_build_object('ok', false, 'message', 'This share link was not found.');
  end if;

  if not v_link.is_active then
    return jsonb_build_object('ok', false, 'message', 'This share link has been revoked.');
  end if;

  if v_link.expires_at is not null and v_link.expires_at <= now() then
    return jsonb_build_object('ok', false, 'message', 'This share link has expired.');
  end if;

  if p_notes is null or btrim(p_notes) = '' then
    return jsonb_build_object('ok', false, 'message', 'Add observations before submitting.');
  end if;

  select id
    into v_profile_id
    from public.patient_profiles
   where user_id = v_link.user_id
   limit 1;

  if v_profile_id is null then
    return jsonb_build_object('ok', false, 'message', 'Patient profile not found.');
  end if;

  v_body := concat_ws(
    E'\n',
    'Visit Report',
    'Facility: ' || coalesce(nullif(btrim(p_facility), ''), 'Clinic'),
    'Doctor: ' || coalesce(nullif(btrim(p_doctor), ''), 'Doctor'),
    'Date: ' || to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    '',
    btrim(p_notes)
  );

  insert into public.medical_records (
    patient_id,
    title,
    record_type,
    file_url,
    status,
    encrypted,
    notes,
    captured_via
  )
  values (
    v_profile_id,
    'Visit Report - '
      || coalesce(nullif(btrim(p_facility), ''), 'Clinic')
      || ' (' || to_char(now(), 'YYYY-MM-DD') || ')',
    'Visit Report',
    'data:text/plain;charset=utf-8,'
      || replace(replace(replace(v_body, '%', '%25'), E'\n', '%0A'), '#', '%23'),
    'active',
    true,
    btrim(p_notes),
    'shared_link'
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'record',
    jsonb_build_object(
      'id', v_row.id,
      'title', v_row.title,
      'record_type', v_row.record_type,
      'file_url', v_row.file_url,
      'notes', v_row.notes,
      'created_at', v_row.created_at
    )
  );
end;
$$;

revoke all on function public.add_shared_visit_report(text, text, text, text) from public;
grant execute on function public.add_shared_visit_report(text, text, text, text)
  to anon, authenticated;
