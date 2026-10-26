-- Selorah sharing, OCR and access log support.
-- Run this in the Supabase SQL editor (or with the Supabase CLI) once.
-- It is safe to run more than once.

-- 1) Optional columns used by scan, upload and manual record entry.
alter table public.medical_records add column if not exists ocr_text text;
alter table public.medical_records add column if not exists notes text;
alter table public.medical_records add column if not exists captured_via text;

-- 2) Public, security-definer reader for shared QR links.
-- Anonymous visitors cannot read patient_profiles or medical_records directly
-- because of RLS. This function validates the token, expiry and revoke state,
-- then returns only what the owner chose to share.
create or replace function public.get_shared_record(share_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  link_row public.shared_links%rowtype;
  profile_row public.patient_profiles%rowtype;
  records_json jsonb := '[]'::jsonb;
begin
  select * into link_row
  from public.shared_links
  where token = share_token;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if not link_row.is_active then
    return jsonb_build_object('status', 'revoked');
  end if;

  if link_row.expires_at <= now() then
    return jsonb_build_object('status', 'expired');
  end if;

  select * into profile_row
  from public.patient_profiles
  where user_id = link_row.user_id
  limit 1;

  if profile_row.id is not null then
    select coalesce(
      jsonb_agg(to_jsonb(record_row) order by record_row.created_at desc),
      '[]'::jsonb
    )
    into records_json
    from (
      select *
      from public.medical_records
      where patient_id = profile_row.id
        and (link_row.record_id is null or id = link_row.record_id)
    ) as record_row;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'link', to_jsonb(link_row),
    'patient', to_jsonb(profile_row),
    'records', records_json
  );
end;
$$;

revoke all on function public.get_shared_record(uuid) from public;
grant execute on function public.get_shared_record(uuid) to anon, authenticated;

-- 3) Best-effort access log entry when a shared record is opened.
-- Failure here never blocks the record from loading.
create or replace function public.log_shared_access(share_token uuid, device_label text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  link_row public.shared_links%rowtype;
begin
  select * into link_row
  from public.shared_links
  where token = share_token;

  if not found then
    return;
  end if;

  insert into public.access_logs (user_id, organization_name, action, color, created_at)
  values (
    link_row.user_id,
    'Shared QR Access',
    'viewed medical history via shared link',
    'bg-[#3B82F6]',
    now()
  );
exception
  when others then
    -- Logging is optional and must never break the shared view.
    null;
end;
$$;

revoke all on function public.log_shared_access(uuid, text) from public;
grant execute on function public.log_shared_access(uuid, text) to anon, authenticated;

-- 4) Helpful indexes for token lookups and active link restore.
create index if not exists shared_links_token_idx on public.shared_links (token);
create index if not exists shared_links_user_active_idx
  on public.shared_links (user_id, is_active, expires_at desc);

-- 5) Make sure the records bucket exists for scanned document images.
insert into storage.buckets (id, name, public)
values ('records', 'records', true)
on conflict (id) do nothing;

-- Existing projects may have created the bucket as private. Public read is
-- required because records store a stable public URL for shared views.
update storage.buckets set public = true where id = 'records';
