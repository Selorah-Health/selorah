-- Waitlist confirmation email.
--
-- The waitlist insert is public, but the email queue is service-role only.
-- A security definer trigger keeps the public RPC from needing access to the
-- queue while still confirming every new signup.

create or replace function public.enqueue_waitlist_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_first_name text;
  v_city text;
  v_role text;
begin
  v_first_name := coalesce(
    nullif(split_part(btrim(new.full_name), ' ', 1), ''),
    'there'
  );
  v_city := coalesce(nullif(btrim(new.details ->> 'city'), ''), '');
  v_role := coalesce(nullif(btrim(new.role), ''), 'patient');

  perform public.enqueue_email(
    new.email,
    'waitlist_confirmation',
    'You are on the Selorah waitlist',
    jsonb_build_object(
      'first_name', v_first_name,
      'city', v_city,
      'role', v_role
    )
  );

  return new;
exception
  when others then
    -- A confirmation email must never block a waitlist signup.
    return new;
end;
$$;

revoke all on function public.enqueue_waitlist_email() from public;

drop trigger if exists on_waitlist_created_email on public.waitlist;
create trigger on_waitlist_created_email
  after insert on public.waitlist
  for each row execute function public.enqueue_waitlist_email();
