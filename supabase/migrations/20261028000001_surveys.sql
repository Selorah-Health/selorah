-- Research surveys and point rewards.
-- Patients answer a short survey, the server awards points, and every point is
-- worth N2. Responses are written through a security definer function so a
-- client cannot choose its own reward or submit twice.

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  researcher_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  summary text not null,
  description text,
  category text not null default 'General health',
  points integer not null check (points between 1 and 1000),
  estimated_minutes integer not null default 5 check (estimated_minutes between 1 and 60),
  is_active boolean not null default true,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  position integer not null default 0,
  prompt text not null,
  question_type text not null check (
    question_type in ('single_choice', 'multi_choice', 'short_text', 'scale')
  ),
  options jsonb not null default '[]'::jsonb,
  required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  points_awarded integer not null check (points_awarded > 0),
  reward_naira numeric(12, 2) not null check (reward_naira >= 0),
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  unique (survey_id, user_id)
);

create index if not exists surveys_researcher_idx on public.surveys (researcher_id);
create index if not exists survey_questions_survey_idx on public.survey_questions (survey_id, position);
create index if not exists survey_responses_survey_idx on public.survey_responses (survey_id);
create index if not exists survey_responses_user_idx on public.survey_responses (user_id);

alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;

drop policy if exists "Surveys are readable" on public.surveys;
create policy "Surveys are readable"
  on public.surveys for select
  to authenticated
  using (is_active = true or researcher_id = auth.uid());

drop policy if exists "Researchers create surveys" on public.surveys;
create policy "Researchers create surveys"
  on public.surveys for insert
  to authenticated
  with check (
    researcher_id = auth.uid()
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'researcher'
    )
  );

drop policy if exists "Researchers update surveys" on public.surveys;
create policy "Researchers update surveys"
  on public.surveys for update
  to authenticated
  using (researcher_id = auth.uid())
  with check (researcher_id = auth.uid());

drop policy if exists "Researchers delete surveys" on public.surveys;
create policy "Researchers delete surveys"
  on public.surveys for delete
  to authenticated
  using (researcher_id = auth.uid());

drop policy if exists "Survey questions are readable" on public.survey_questions;
create policy "Survey questions are readable"
  on public.survey_questions for select
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id
        and (s.is_active = true or s.researcher_id = auth.uid())
    )
  );

drop policy if exists "Researchers manage survey questions" on public.survey_questions;
create policy "Researchers manage survey questions"
  on public.survey_questions for all
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and s.researcher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.surveys s
      where s.id = survey_id and s.researcher_id = auth.uid()
    )
  );

-- Responses are written only through submit_survey_response(). A participant
-- can read their own response history. Researchers get aggregates through
-- survey_stats(), never raw answers tied to an identity.
drop policy if exists "Participants read own survey responses" on public.survey_responses;
create policy "Participants read own survey responses"
  on public.survey_responses for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.submit_survey_response(
  p_survey_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_survey public.surveys;
  v_points integer;
  v_reward numeric(12, 2);
  v_response_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'message', 'Sign in to take part in a survey.');
  end if;

  select *
    into v_survey
    from public.surveys
   where id = p_survey_id;

  if v_survey.id is null then
    return jsonb_build_object('ok', false, 'message', 'This survey was not found.');
  end if;

  if not v_survey.is_active then
    return jsonb_build_object('ok', false, 'message', 'This survey is closed.');
  end if;

  if v_survey.closes_at is not null and v_survey.closes_at <= now() then
    return jsonb_build_object('ok', false, 'message', 'This survey has closed.');
  end if;

  if exists (
    select 1
      from public.survey_responses
     where survey_id = p_survey_id and user_id = v_user
  ) then
    return jsonb_build_object('ok', false, 'message', 'You have already completed this survey.');
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    return jsonb_build_object('ok', false, 'message', 'Answers are missing.');
  end if;

  if exists (
    select 1
      from public.survey_questions q
     where q.survey_id = p_survey_id
       and q.required
       and (
         p_answers -> q.id::text is null
         or p_answers -> q.id::text = 'null'::jsonb
         or p_answers -> q.id::text = '""'::jsonb
         or (
           jsonb_typeof(p_answers -> q.id::text) = 'array'
           and jsonb_array_length(p_answers -> q.id::text) = 0
         )
       )
  ) then
    return jsonb_build_object('ok', false, 'message', 'Answer every required question before submitting.');
  end if;

  v_points := v_survey.points;
  v_reward := v_points * 2;

  insert into public.survey_responses (
    survey_id,
    user_id,
    answers,
    points_awarded,
    reward_naira
  )
  values (
    p_survey_id,
    v_user,
    p_answers,
    v_points,
    v_reward
  )
  returning id into v_response_id;

  -- The earnings table references patient_profiles, which researchers and
  -- staff may not have. Points still live on the response row either way.
  insert into public.earnings (patient_id, study_id, amount_local, currency, status)
  select pp.id, null, v_reward, 'NGN', 'available'
    from public.patient_profiles pp
   where pp.user_id = v_user
   limit 1;

  return jsonb_build_object(
    'ok', true,
    'response_id', v_response_id,
    'points', v_points,
    'reward_naira', v_reward
  );
end;
$$;

-- Aggregates for the researcher who owns the survey. No respondent identity
-- and no raw answers are returned.
create or replace function public.survey_stats()
returns table (
  survey_id uuid,
  responses bigint,
  points_awarded bigint,
  reward_naira numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.id as survey_id,
    count(r.id) as responses,
    coalesce(sum(r.points_awarded), 0)::bigint as points_awarded,
    coalesce(sum(r.reward_naira), 0)::numeric as reward_naira
  from public.surveys s
  left join public.survey_responses r on r.survey_id = s.id
  where s.researcher_id = auth.uid()
  group by s.id;
$$;

revoke all on function public.submit_survey_response(uuid, jsonb) from public;
revoke all on function public.survey_stats() from public;
grant execute on function public.submit_survey_response(uuid, jsonb) to authenticated;
grant execute on function public.survey_stats() to authenticated;
