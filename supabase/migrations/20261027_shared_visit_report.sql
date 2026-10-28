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
