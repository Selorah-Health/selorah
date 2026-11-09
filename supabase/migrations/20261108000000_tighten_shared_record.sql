-- Tighten the public shared-record reader.
--
-- The shared record page only needs the clinical and emergency fields. The
-- previous version returned the whole patient_profiles row, so a share token
-- also exposed NIN, phone, email, and wallet material. Remove those keys from
-- the JSON payload while keeping the fields the page renders.
--
-- The device-aware wrapper calls this function, so it inherits the same
-- filtering automatically.

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
    select * into profile_row
      from public.patient_profiles
     where permanent_qr_token = share_token
     limit 1;

    if not found then
      return jsonb_build_object('status', 'not_found');
    end if;

    link_row.user_id := profile_row.user_id;
    link_row.patient_id := profile_row.id;
    link_row.token := share_token;
    link_row.is_active := true;
    link_row.expires_at := null;
    link_row.is_permanent := true;
    link_row.record_id := null;
  else
    if not link_row.is_active then
      return jsonb_build_object('status', 'revoked');
    end if;

    if link_row.expires_at is not null and link_row.expires_at <= now() then
      return jsonb_build_object('status', 'expired');
    end if;

    select * into profile_row
      from public.patient_profiles
     where user_id = link_row.user_id
     limit 1;
  end if;

  if profile_row.id is not null then
    select coalesce(
      jsonb_agg(to_jsonb(record_row) order by record_row.created_at desc),
      '[]'::jsonb
    )
    into records_json
    from (
      select * from public.medical_records
       where patient_id = profile_row.id
         and (link_row.record_id is null or id = link_row.record_id)
    ) as record_row;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'link', to_jsonb(link_row),
    'patient',
      to_jsonb(profile_row)
        - 'nin'
        - 'wallet_seed_encrypted'
        - 'phone'
        - 'email'
        - 'wallet_address',
    'records', records_json
  );
end;
$$;

revoke all on function public.get_shared_record(uuid) from public;
grant execute on function public.get_shared_record(uuid) to anon, authenticated;
