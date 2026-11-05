-- Cycle tracker: private period logs for the signed in patient.
--
-- Safe to run more than once. The app also keeps a local copy on the device so
-- the tracker still opens when the network is unavailable.

create table if not exists public.period_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  flow text not null default 'medium',
  symptoms jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint period_cycles_end_after_start
    check (end_date is null or end_date >= start_date)
);

create index if not exists period_cycles_user_start_idx
  on public.period_cycles (user_id, start_date desc);

alter table public.period_cycles enable row level security;

drop policy if exists "period_cycles: own read" on public.period_cycles;
create policy "period_cycles: own read"
  on public.period_cycles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "period_cycles: own insert" on public.period_cycles;
create policy "period_cycles: own insert"
  on public.period_cycles for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "period_cycles: own update" on public.period_cycles;
create policy "period_cycles: own update"
  on public.period_cycles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "period_cycles: own delete" on public.period_cycles;
create policy "period_cycles: own delete"
  on public.period_cycles for delete
  to authenticated
  using (user_id = auth.uid());
