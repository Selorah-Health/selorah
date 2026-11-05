-- Emergency reports: private reports with optional photo or voice note.
--
-- The app saves a local copy when the network is unavailable and retries the
-- remote insert later. Attachments stay in a private storage bucket.
--
-- Safe to run more than once.

create table if not exists public.emergency_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reference text not null unique,
  emergency_type text not null default 'medical',
  description text,
  latitude double precision,
  longitude double precision,
  location_label text,
  nearest_hospital jsonb not null default '[]'::jsonb,
  photo_url text,
  voice_url text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create index if not exists emergency_reports_user_created_idx
  on public.emergency_reports (user_id, created_at desc);

alter table public.emergency_reports enable row level security;

drop policy if exists "emergency_reports: own read" on public.emergency_reports;
create policy "emergency_reports: own read"
  on public.emergency_reports for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "emergency_reports: own insert" on public.emergency_reports;
create policy "emergency_reports: own insert"
  on public.emergency_reports for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "emergency_reports: own update" on public.emergency_reports;
create policy "emergency_reports: own update"
  on public.emergency_reports for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "emergency_reports: own delete" on public.emergency_reports;
create policy "emergency_reports: own delete"
  on public.emergency_reports for delete
  to authenticated
  using (user_id = auth.uid());

-- Private bucket for emergency photos and voice notes.
insert into storage.buckets (id, name, public)
values ('emergency-attachments', 'emergency-attachments', false)
on conflict (id) do nothing;

drop policy if exists "emergency attachments: own read" on storage.objects;
create policy "emergency attachments: own read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'emergency-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "emergency attachments: own insert" on storage.objects;
create policy "emergency attachments: own insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'emergency-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "emergency attachments: own update" on storage.objects;
create policy "emergency attachments: own update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'emergency-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'emergency-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "emergency attachments: own delete" on storage.objects;
create policy "emergency attachments: own delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'emergency-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
