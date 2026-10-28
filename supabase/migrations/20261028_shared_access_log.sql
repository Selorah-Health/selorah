-- Shared record access logging.
-- A patient shares a record with a token. The visitor may be a clinician who is
-- not signed in to Selorah, so the insert goes through a token checked function
-- instead of a row policy. The token must be active and unexpired.
--
-- This records the details the provider gives, so the patient can see who opened
-- their record. It is not a registry verification of the provider.

create or replace function public.log_shared_access(
  p_token text,
  p_name text,
  p_role text,
  p_license text default null,
  p_facility text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.shared_links;
  v_role text;
  v_name text;
  v_facility text;
  v_license text;
  v_action text;
  v_log_id uuid;
  v_patient_id uuid;
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
    return jsonb_build_object('ok', false, 'message', 'This share link is no longer active.');
  end if;

  if v_link.expires_at is not null and v_link.expires_at <= now() then
    return jsonb_build_object('ok', false, 'message', 'This share link has expired.');
  end if;

  v_role := lower(btrim(coalesce(p_role, 'guest')));
  v_name := nullif(btrim(coalesce(p_name, '')), '');
  v_facility := nullif(btrim(coalesce(p_facility, '')), '');
  v_license := nullif(btrim(coalesce(p_license, '')), '');

  -- Older share links were created before patient_id and record_id were
  -- stored on the link. Resolve the patient from the owning account so those
  -- links still write an access log the patient can read.
  v_patient_id := v_link.patient_id;
  if v_patient_id is null then
    select pp.id
      into v_patient_id
      from public.patient_profiles pp
     where pp.user_id = v_link.user_id
     limit 1;
  end if;

  if v_patient_id is null then
    return jsonb_build_object(
      'ok', false,
      'message', 'This share link is not attached to a patient record.'
    );
  end if;

  if v_role = 'guest' then
    v_action := 'Emergency preview opened by a guest visitor';
  else
    v_action := concat_ws(
      ' ',
      initcap(v_role),
      'record opened by',
      coalesce(v_name, 'an unnamed visitor'),
      case when v_facility is not null then 'at ' || v_facility end,
      case when v_license is not null then '(licence ' || v_license || ')' end
    );
  end if;

  insert into public.access_logs (
    patient_id,
    record_id,
    user_id,
    access_type,
    qr_token_used,
    hospital_name,
    action,
    accessed_at
  )
  values (
    v_patient_id,
    v_link.record_id,
    v_link.user_id,
    case when v_role = 'guest' then 'emergency_preview' else 'shared_link' end,
    v_link.token::text,
    coalesce(v_facility, v_name),
    v_action,
    now()
  )
  returning id into v_log_id;

  return jsonb_build_object('ok', true, 'log_id', v_log_id);
end;
$$;

revoke all on function public.log_shared_access(text, text, text, text, text) from public;
grant execute on function public.log_shared_access(text, text, text, text, text) to anon;
grant execute on function public.log_shared_access(text, text, text, text, text) to authenticated;
