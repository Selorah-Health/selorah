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
