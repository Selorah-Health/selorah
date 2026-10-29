-- Allow the internal QA role (and the portal role names the app already uses).
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('patient', 'hospital', 'provider', 'researcher', 'insurer', 'admin', 'qa', 'developer', 'partner'));
