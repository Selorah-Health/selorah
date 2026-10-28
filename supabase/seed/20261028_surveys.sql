-- Seed surveys for the Selorah Health research account.
-- Run after the researcher account exists and has the researcher role.
-- Each survey is inserted once. Re-running this file is safe.

do $$
declare
  v_researcher uuid;
  v_survey uuid;
begin
  select u.id
    into v_researcher
    from public.users u
   where lower(u.email) = 'selorahealth@gmail.com'
   limit 1;

  if v_researcher is null then
    raise notice 'Researcher account not found. Skipping survey seed.';
    return;
  end if;

  -- 1. Blood pressure awareness and monitoring habits
  if not exists (
    select 1 from public.surveys
     where researcher_id = v_researcher
       and title = 'Blood pressure awareness and monitoring habits'
  ) then
    insert into public.surveys (
      researcher_id, title, summary, description, category, points,
      estimated_minutes, is_active, closes_at
    )
    values (
      v_researcher,
      'Blood pressure awareness and monitoring habits',
      'Help us understand how often adults check their blood pressure and what gets in the way.',
      'This survey looks at blood pressure monitoring habits, awareness of high blood pressure, and the barriers people face. It takes about 4 minutes. Answers are stored without your name or contact details. You receive 80 points, worth N160, once you submit.',
      'Cardiovascular health',
      80,
      4,
      true,
      now() + interval '90 days'
    )
    returning id into v_survey;

    insert into public.survey_questions (survey_id, position, prompt, question_type, options, required)
    values
      (
        v_survey, 1,
        'When was your blood pressure last checked by a clinician or at a pharmacy?',
        'single_choice',
        '["Within the last month","1 to 6 months ago","More than 6 months ago","Never"]'::jsonb,
        true
      ),
      (
        v_survey, 2,
        'Has a clinician ever told you that your blood pressure was high?',
        'single_choice',
        '["Yes","No","Not sure"]'::jsonb,
        true
      ),
      (
        v_survey, 3,
        'Which of these do you currently do to manage your blood pressure?',
        'multi_choice',
        '["Reduce salt","Exercise regularly","Take prescribed medicine","Monitor at home","None of these"]'::jsonb,
        true
      ),
      (
        v_survey, 4,
        'How confident are you that you can keep your blood pressure in a healthy range?',
        'scale',
        '["1","2","3","4","5"]'::jsonb,
        true
      ),
      (
        v_survey, 5,
        'What makes it hard to check your blood pressure regularly, if anything?',
        'short_text',
        '[]'::jsonb,
        false
      );
  end if;

  -- 2. Medication adherence and access
  if not exists (
    select 1 from public.surveys
     where researcher_id = v_researcher
       and title = 'Medication adherence and access'
  ) then
    insert into public.surveys (
      researcher_id, title, summary, description, category, points,
      estimated_minutes, is_active, closes_at
    )
    values (
      v_researcher,
      'Medication adherence and access',
      'Share how easy it is to fill prescriptions and take medicine as prescribed.',
      'This survey explores medicine access, cost, and adherence. It takes about 3 minutes. No identifying information is collected. You receive 70 points, worth N140, once you submit.',
      'Medication access',
      70,
      3,
      true,
      now() + interval '90 days'
    )
    returning id into v_survey;

    insert into public.survey_questions (survey_id, position, prompt, question_type, options, required)
    values
      (
        v_survey, 1,
        'In the last month, how often did you miss a dose of a prescribed medicine?',
        'single_choice',
        '["Never","Once or twice","About once a week","Most days","I do not take prescribed medicine"]'::jsonb,
        true
      ),
      (
        v_survey, 2,
        'What gets in the way of taking your medicine as prescribed?',
        'multi_choice',
        '["Cost","Forgetfulness","Side effects","Travel or distance","No regular prescription","Nothing"]'::jsonb,
        true
      ),
      (
        v_survey, 3,
        'Do you know what each of your current medicines is for?',
        'single_choice',
        '["All of them","Some of them","None of them","I do not take any medicine"]'::jsonb,
        true
      ),
      (
        v_survey, 4,
        'How easy is it to refill your prescription when you need it?',
        'scale',
        '["1","2","3","4","5"]'::jsonb,
        true
      );
  end if;

  -- 3. Preventive screening and family history
  if not exists (
    select 1 from public.surveys
     where researcher_id = v_researcher
       and title = 'Preventive screening and family history'
  ) then
    insert into public.surveys (
      researcher_id, title, summary, description, category, points,
      estimated_minutes, is_active, closes_at
    )
    values (
      v_researcher,
      'Preventive screening and family history',
      'Tell us which preventive checks you have had and what would make screening easier.',
      'This survey looks at preventive screening uptake and family health history. It takes about 3 minutes. Answers are anonymized. You receive 60 points, worth N120, once you submit.',
      'Preventive care',
      60,
      3,
      true,
      now() + interval '90 days'
    )
    returning id into v_survey;

    insert into public.survey_questions (survey_id, position, prompt, question_type, options, required)
    values
      (
        v_survey, 1,
        'Which screening checks have you had in the last two years?',
        'multi_choice',
        '["Blood pressure","Blood sugar","Cholesterol","Cervical or breast screening","Prostate screening","None of these"]'::jsonb,
        true
      ),
      (
        v_survey, 2,
        'Do you have a close relative with diabetes, heart disease, or certain cancers?',
        'single_choice',
        '["Yes","No","Not sure"]'::jsonb,
        true
      ),
      (
        v_survey, 3,
        'What usually stops you from booking a screening?',
        'single_choice',
        '["Cost","No time","Fear or worry","I do not know where to go","Nothing stops me"]'::jsonb,
        true
      ),
      (
        v_survey, 4,
        'What would make preventive screening easier for you?',
        'short_text',
        '[]'::jsonb,
        false
      );
  end if;
end;
$$;
