-- Survey reward rule and profile avatars.
--
-- 1. Every survey question is worth one point. The server sets a survey's
--    points from its question count, so a client cannot award itself extra.
-- 2. A public avatars bucket lets a signed-in user upload one profile photo.

create or replace function public.sync_survey_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_survey_id uuid;
begin
  v_survey_id := coalesce(new.survey_id, old.survey_id);
  if v_survey_id is null then
    return coalesce(new, old);
  end if;

  update public.surveys s
     set points = greatest(
           (select count(*) from public.survey_questions q where q.survey_id = v_survey_id),
           1
         ),
         updated_at = now()
   where s.id = v_survey_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists survey_questions_sync_points on public.survey_questions;
create trigger survey_questions_sync_points
  after insert or update or delete on public.survey_questions
  for each row execute function public.sync_survey_points();

-- The survey row is inserted before its questions exist, so default it to one
-- point and let the question trigger raise it as questions are added.
create or replace function public.force_survey_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.points := greatest(
    coalesce(
      (select count(*) from public.survey_questions q where q.survey_id = new.id),
      0
    ),
    1
  );
  return new;
end;
$$;

drop trigger if exists surveys_force_points on public.surveys;
create trigger surveys_force_points
  before insert or update of points on public.surveys
  for each row execute function public.force_survey_points();

-- Bring the existing surveys in line with the one point per question rule and
-- remove the old fixed reward amounts from their descriptions.
update public.surveys s
   set points = greatest(
         (select count(*) from public.survey_questions q where q.survey_id = s.id),
         1
       ),
       description = case s.title
         when 'Blood pressure awareness and monitoring habits' then
           'This survey looks at blood pressure monitoring habits, awareness of high blood pressure, and the barriers people face. It takes about 4 minutes. Answers are stored without your name or contact details. Each question is worth 1 point, credited when you submit.'
         when 'Medication adherence and access' then
           'This survey explores medicine access, cost, and adherence. It takes about 3 minutes. No identifying information is collected. Each question is worth 1 point, credited when you submit.'
         when 'Preventive screening and family history' then
           'This survey looks at preventive screening uptake and family health history. It takes about 3 minutes. Answers are anonymized. Each question is worth 1 point, credited when you submit.'
         else s.description
       end,
       updated_at = now();

-- Profile photos. Public read keeps the shared record and portal avatars fast;
-- only the owner can write inside their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are public" on storage.objects;
create policy "Avatar images are public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
