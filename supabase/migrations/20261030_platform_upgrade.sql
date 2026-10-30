-- Selorah platform upgrade: notifications, permanent QR, withdrawals,
-- engagement points, resilience anchors, email queue, QA tooling, and the
-- 15-question / N20 survey rules.
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'system',
  title text not null,
  body text,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications: own read" on public.notifications;
create policy "notifications: own read"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications: own update" on public.notifications;
create policy "notifications: own update"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications: own delete" on public.notifications;
create policy "notifications: own delete"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Permanent QR code on every patient profile
-- ---------------------------------------------------------------------------
alter table public.patient_profiles
  add column if not exists permanent_qr_token uuid;

update public.patient_profiles
   set permanent_qr_token = gen_random_uuid()
 where permanent_qr_token is null;

alter table public.patient_profiles
  alter column permanent_qr_token set default gen_random_uuid();

create unique index if not exists patient_profiles_permanent_qr_idx
  on public.patient_profiles (permanent_qr_token);

alter table public.patient_profiles
  add column if not exists card_status text not null default 'none';

-- ---------------------------------------------------------------------------
-- 3. Share links and access logs
-- ---------------------------------------------------------------------------
alter table public.shared_links
  add column if not exists label text,
  add column if not exists is_permanent boolean not null default false,
  add column if not exists scans integer not null default 0,
  add column if not exists last_scanned_at timestamptz,
  add column if not exists revoked_at timestamptz;

alter table public.access_logs
  add column if not exists device_label text,
  add column if not exists device_id text,
  add column if not exists link_kind text default 'temporary',
  add column if not exists status text default 'active',
  add column if not exists revoked_at timestamptz;

create table if not exists public.qr_device_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patient_profiles (id) on delete cascade,
  token text not null,
  device_id text not null,
  device_label text,
  permanent boolean not null default false,
  granted_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, token, device_id)
);

create index if not exists qr_device_grants_user_idx
  on public.qr_device_grants (user_id, last_seen_at desc);

alter table public.qr_device_grants enable row level security;

drop policy if exists "qr_device_grants: own read" on public.qr_device_grants;
create policy "qr_device_grants: own read"
  on public.qr_device_grants for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "qr_device_grants: own update" on public.qr_device_grants;
create policy "qr_device_grants: own update"
  on public.qr_device_grants for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "qr_device_grants: own delete" on public.qr_device_grants;
create policy "qr_device_grants: own delete"
  on public.qr_device_grants for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Earnings, withdrawals and payout review
-- ---------------------------------------------------------------------------
alter table public.earnings
  add column if not exists source text not null default 'survey',
  add column if not exists description text;

alter table public.withdrawals
  add column if not exists bank_name text,
  add column if not exists admin_note text,
  add column if not exists processed_at timestamptz,
  add column if not exists reference text;

drop policy if exists "earnings: qa read" on public.earnings;
create policy "earnings: qa read"
  on public.earnings for select
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'));

drop policy if exists "withdrawals: qa read" on public.withdrawals;
create policy "withdrawals: qa read"
  on public.withdrawals for select
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'));

drop policy if exists "withdrawals: qa update" on public.withdrawals;
create policy "withdrawals: qa update"
  on public.withdrawals for update
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'))
  with check (public.current_user_role() in ('qa', 'admin', 'developer'));

create or replace function public.request_withdrawal(
  p_amount numeric,
  p_bank_code text,
  p_account_number text,
  p_account_name text,
  p_bank_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_patient uuid;
  v_available numeric(12, 2);
  v_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'message', 'Sign in to withdraw.');
  end if;

  select pp.id into v_patient
    from public.patient_profiles pp
   where pp.user_id = v_user
   limit 1;

  if v_patient is null then
    return jsonb_build_object('ok', false, 'message', 'Complete your profile first.');
  end if;

  if p_amount is null or p_amount < 1000 then
    return jsonb_build_object('ok', false, 'message', 'The minimum withdrawal is N1,000.');
  end if;

  if p_account_number is null
     or length(regexp_replace(p_account_number, '\D', '', 'g')) < 10 then
    return jsonb_build_object('ok', false, 'message', 'Enter a valid 10-digit account number.');
  end if;

  if p_account_name is null or btrim(p_account_name) = '' then
    return jsonb_build_object('ok', false, 'message', 'Enter the account name.');
  end if;

  select coalesce(sum(e.amount_local), 0)
    into v_available
    from public.earnings e
   where e.patient_id = v_patient
     and e.status in ('available', 'cleared');

  v_available := v_available - coalesce((
    select sum(w.amount_local)
      from public.withdrawals w
     where w.patient_id = v_patient
       and w.status in ('pending', 'processing')
  ), 0);

  if p_amount > v_available then
    return jsonb_build_object(
      'ok', false,
      'message', 'That is more than your available balance.',
      'available', v_available
    );
  end if;

  insert into public.withdrawals (
    patient_id,
    amount_local,
    currency,
    bank_code,
    bank_name,
    account_number,
    account_name,
    status,
    reference
  )
  values (
    v_patient,
    p_amount,
    'NGN',
    nullif(btrim(coalesce(p_bank_code, '')), ''),
    nullif(btrim(coalesce(p_bank_name, '')), ''),
    regexp_replace(p_account_number, '\D', '', 'g'),
    btrim(p_account_name),
    'pending',
    'wd_' || replace(gen_random_uuid()::text, '-', '')
  )
  returning id into v_id;

  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values (
    v_user,
    'billing',
    'Withdrawal requested',
    'Your withdrawal is queued for review. We will update you when it is processed.',
    '/dashboard/earnings',
    jsonb_build_object('withdrawal_id', v_id, 'amount', p_amount)
  );

  return jsonb_build_object(
    'ok', true,
    'withdrawal_id', v_id,
    'available', v_available - p_amount
  );
end;
$$;

create or replace function public.review_withdrawal(
  p_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.withdrawals%rowtype;
  v_user uuid;
  v_status text := lower(btrim(coalesce(p_status, '')));
begin
  if public.current_user_role() not in ('qa', 'admin', 'developer') then
    return jsonb_build_object('ok', false, 'message', 'Not allowed.');
  end if;

  if v_status not in ('pending', 'processing', 'paid', 'rejected') then
    return jsonb_build_object('ok', false, 'message', 'Unknown withdrawal status.');
  end if;

  select * into v_row from public.withdrawals where id = p_id;
  if v_row.id is null then
    return jsonb_build_object('ok', false, 'message', 'Withdrawal not found.');
  end if;

  update public.withdrawals
     set status = v_status,
         admin_note = nullif(btrim(coalesce(p_note, '')), ''),
         processed_at = case when v_status in ('paid', 'rejected') then now() else processed_at end,
         updated_at = now()
   where id = p_id;

  if v_status = 'paid' then
    update public.earnings
       set status = 'withdrawn'
     where patient_id = v_row.patient_id
       and status in ('available', 'cleared');
  end if;

  select pp.user_id into v_user
    from public.patient_profiles pp
   where pp.id = v_row.patient_id;

  if v_user is not null then
    insert into public.notifications (user_id, kind, title, body, href, metadata)
    values (
      v_user,
      'billing',
      case
        when v_status = 'paid' then 'Withdrawal paid'
        when v_status = 'rejected' then 'Withdrawal needs attention'
        else 'Withdrawal update'
      end,
      case
        when v_status = 'paid' then 'Your withdrawal has been marked as paid.'
        when v_status = 'rejected' then coalesce(p_note, 'Your withdrawal was not approved. Please check your bank details.')
        else 'Your withdrawal is being processed.'
      end,
      '/dashboard/earnings',
      jsonb_build_object('withdrawal_id', p_id, 'status', v_status)
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.request_withdrawal(numeric, text, text, text, text) from public;
revoke all on function public.review_withdrawal(uuid, text, text) from public;
grant execute on function public.request_withdrawal(numeric, text, text, text, text) to authenticated;
grant execute on function public.review_withdrawal(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Engagement points (gamified data collection)
-- ---------------------------------------------------------------------------
create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'task',
  label text not null,
  points integer not null check (points between 1 and 500),
  reference text not null,
  created_at timestamptz not null default now(),
  unique (user_id, reference)
);

create index if not exists point_events_user_idx
  on public.point_events (user_id, created_at desc);

alter table public.point_events enable row level security;

drop policy if exists "point_events: own read" on public.point_events;
create policy "point_events: own read"
  on public.point_events for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.award_points(
  p_source text,
  p_label text,
  p_points integer,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'message', 'Sign in first.');
  end if;

  if p_points is null or p_points < 1 or p_points > 500 then
    return jsonb_build_object('ok', false, 'message', 'Invalid point value.');
  end if;

  if p_reference is null or btrim(p_reference) = '' then
    return jsonb_build_object('ok', false, 'message', 'A reference is required.');
  end if;

  insert into public.point_events (user_id, source, label, points, reference)
  values (
    v_user,
    coalesce(nullif(btrim(p_source), ''), 'task'),
    coalesce(nullif(btrim(p_label), ''), 'Task complete'),
    p_points,
    btrim(p_reference)
  )
  on conflict (user_id, reference) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('ok', false, 'duplicate', true, 'message', 'Already earned.');
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'points', p_points);
end;
$$;

revoke all on function public.award_points(text, text, integer, text) from public;
grant execute on function public.award_points(text, text, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Resilience: encrypted emergency vault and hash anchors
-- ---------------------------------------------------------------------------
create table if not exists public.record_anchors (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles (id) on delete cascade,
  record_id uuid references public.medical_records (id) on delete cascade,
  content_hash text not null,
  algorithm text not null default 'sha256',
  anchor_network text not null default 'pending',
  anchor_tx text,
  anchored_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (record_id)
);

create index if not exists record_anchors_patient_idx
  on public.record_anchors (patient_id, created_at desc);

alter table public.record_anchors enable row level security;

drop policy if exists "record_anchors: own" on public.record_anchors;
create policy "record_anchors: own"
  on public.record_anchors for all
  to authenticated
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = record_anchors.patient_id and pp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = record_anchors.patient_id and pp.user_id = auth.uid()
    )
  );

create table if not exists public.emergency_vaults (
  patient_id uuid primary key references public.patient_profiles (id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  salt text not null,
  iterations integer not null default 210000,
  summary text,
  updated_at timestamptz not null default now()
);

alter table public.emergency_vaults enable row level security;

drop policy if exists "emergency_vaults: own" on public.emergency_vaults;
create policy "emergency_vaults: own"
  on public.emergency_vaults for all
  to authenticated
  using (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = emergency_vaults.patient_id and pp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patient_profiles pp
      where pp.id = emergency_vaults.patient_id and pp.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 7. Selorah card orders
-- ---------------------------------------------------------------------------
create table if not exists public.card_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patient_profiles (id) on delete cascade,
  full_name text not null,
  phone text not null,
  delivery_address text not null,
  city text,
  state text,
  tier text not null default 'classic',
  status text not null default 'requested',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists card_orders_user_idx
  on public.card_orders (user_id, created_at desc);

alter table public.card_orders enable row level security;

drop policy if exists "card_orders: own" on public.card_orders;
create policy "card_orders: own"
  on public.card_orders for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "card_orders: qa read" on public.card_orders;
create policy "card_orders: qa read"
  on public.card_orders for select
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'));

drop policy if exists "card_orders: qa update" on public.card_orders;
create policy "card_orders: qa update"
  on public.card_orders for update
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'))
  with check (public.current_user_role() in ('qa', 'admin', 'developer'));

-- ---------------------------------------------------------------------------
-- 8. Email queue and survey notifications
-- ---------------------------------------------------------------------------
create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  template text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_queue_status_idx
  on public.email_queue (status, created_at);

alter table public.email_queue enable row level security;

create or replace function public.enqueue_email(
  p_to text,
  p_template text,
  p_subject text,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_to is null or btrim(p_to) = '' then
    return null;
  end if;

  insert into public.email_queue (to_email, template, subject, payload)
  values (btrim(p_to), p_template, p_subject, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;

  return v_id;
exception
  when others then
    return null;
end;
$$;

revoke all on function public.enqueue_email(text, text, text, jsonb) from public;

-- Welcome email when a new auth user is created.
create or replace function public.enqueue_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  perform public.enqueue_email(
    new.email,
    'welcome',
    'Welcome to Selorah',
    jsonb_build_object('first_name', v_name)
  );

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_welcome on auth.users;
create trigger on_auth_user_created_welcome
  after insert on auth.users
  for each row execute function public.enqueue_welcome_email();

-- Publish a survey: activates it, notifies patients, and emails Pro users.
create or replace function public.publish_survey(p_survey_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_survey public.surveys%rowtype;
  v_questions integer;
  v_user record;
begin
  select * into v_survey from public.surveys where id = p_survey_id;
  if v_survey.id is null then
    return jsonb_build_object('ok', false, 'message', 'Survey not found.');
  end if;
  if v_survey.researcher_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'message', 'Not allowed.');
  end if;

  select count(*) into v_questions
    from public.survey_questions where survey_id = p_survey_id;

  if v_questions < 15 then
    return jsonb_build_object(
      'ok', false,
      'message', 'A survey needs at least 15 questions before it can be published.',
      'questions', v_questions
    );
  end if;

  update public.surveys
     set is_active = true,
         points = v_questions,
         updated_at = now()
   where id = p_survey_id;

  insert into public.notifications (user_id, kind, title, body, href, metadata)
  select u.id,
         'system',
         'New survey available',
         v_survey.title || ' is open. Each question is worth 1 point (N20).',
         '/dashboard/research',
         jsonb_build_object('survey_id', p_survey_id)
    from public.users u
   where u.role = 'patient';

  for v_user in
    select u.email, coalesce(pp.full_name, split_part(u.email, '@', 1)) as name
      from public.users u
      left join public.patient_profiles pp on pp.user_id = u.id
     where u.role = 'patient'
       and coalesce(pp.is_pro, false) = true
       and u.email is not null
  loop
    perform public.enqueue_email(
      v_user.email,
      'new_survey',
      'A new paid survey is waiting for you',
      jsonb_build_object('first_name', v_user.name, 'survey_title', v_survey.title)
    );
  end loop;

  return jsonb_build_object('ok', true, 'questions', v_questions);
end;
$$;

revoke all on function public.publish_survey(uuid) from public;
grant execute on function public.publish_survey(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Survey rules: 15 questions minimum, N20 per point
-- ---------------------------------------------------------------------------
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

-- Bring existing surveys up to 15 questions so the activation rule can apply.
do $$
declare
  v_survey record;
  v_count integer;
  v_next integer;
  v_prompts text[] := array[
    'How would you rate your overall health today?',
    'Do you have a regular source of healthcare?',
    'Have you skipped or delayed care in the last 12 months?',
    'How often do you exercise for at least 30 minutes?',
    'Do you smoke or use tobacco products?',
    'How many hours of sleep do you usually get?',
    'Do you have a family history of chronic illness?',
    'How easy is it to afford your medications?',
    'Have you had a health check-up in the last year?',
    'How would you rate your current stress levels?',
    'Do you have health insurance?',
    'How often do you monitor your blood pressure?',
    'Do you know your blood group and genotype?',
    'What is the biggest barrier to your healthcare?',
    'Is there anything else you want researchers to know?'
  ];
  v_types text[] := array[
    'scale', 'single_choice', 'single_choice', 'single_choice', 'single_choice',
    'single_choice', 'single_choice', 'single_choice', 'single_choice', 'scale',
    'single_choice', 'single_choice', 'single_choice', 'short_text', 'short_text'
  ];
  v_options jsonb[] := array[
    '["1","2","3","4","5"]'::jsonb,
    '["Yes","No","Sometimes"]'::jsonb,
    '["Yes","No","Not sure"]'::jsonb,
    '["Never","1-2 days","3-4 days","5+ days"]'::jsonb,
    '["Never","Occasionally","Daily"]'::jsonb,
    '["Less than 5","5-6","7-8","More than 8"]'::jsonb,
    '["Yes","No","Not sure"]'::jsonb,
    '["Very easy","Easy","Difficult","Very difficult"]'::jsonb,
    '["Yes","No"]'::jsonb,
    '["1","2","3","4","5"]'::jsonb,
    '["Yes","No","Not sure"]'::jsonb,
    '["Never","Monthly","Weekly","Daily"]'::jsonb,
    '["Yes","No","Only one"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb
  ];
begin
  for v_survey in select id from public.surveys loop
    select count(*) into v_count
      from public.survey_questions where survey_id = v_survey.id;

    if v_count < 15 then
      select coalesce(max(position), 0) into v_next
        from public.survey_questions where survey_id = v_survey.id;

      for i in 1..(15 - v_count) loop
        insert into public.survey_questions (
          survey_id, position, prompt, question_type, options, required
        )
        values (
          v_survey.id,
          v_next + i,
          v_prompts[((v_count + i - 1) % 15) + 1],
          v_types[((v_count + i - 1) % 15) + 1],
          v_options[((v_count + i - 1) % 15) + 1],
          true
        );
      end loop;
    end if;
  end loop;
end $$;

create or replace function public.validate_survey_activation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if new.is_active then
    select count(*) into v_count
      from public.survey_questions where survey_id = new.id;

    if v_count < 15 then
      raise exception 'A survey needs at least 15 questions before it can be published.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists surveys_validate_activation on public.surveys;
create trigger surveys_validate_activation
  before insert or update of is_active on public.surveys
  for each row execute function public.validate_survey_activation();

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

  select * into v_survey from public.surveys where id = p_survey_id;

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
    select 1 from public.survey_responses
     where survey_id = p_survey_id and user_id = v_user
  ) then
    return jsonb_build_object('ok', false, 'message', 'You have already completed this survey.');
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    return jsonb_build_object('ok', false, 'message', 'Answers are missing.');
  end if;

  if exists (
    select 1 from public.survey_questions q
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

  v_points := greatest(v_survey.points, 1);
  v_reward := v_points * 20;

  insert into public.survey_responses (
    survey_id, user_id, answers, points_awarded, reward_naira
  )
  values (p_survey_id, v_user, p_answers, v_points, v_reward)
  returning id into v_response_id;

  insert into public.earnings (patient_id, study_id, amount_local, currency, status, source, description)
  select pp.id, null, v_reward, 'NGN', 'available', 'survey', v_survey.title
    from public.patient_profiles pp
   where pp.user_id = v_user
   limit 1;

  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values (
    v_user,
    'system',
    'Survey reward added',
    'You earned ' || v_points || ' points (N' || v_reward || ') for ' || v_survey.title || '.',
    '/dashboard/earnings',
    jsonb_build_object('survey_id', p_survey_id, 'reward', v_reward)
  );

  return jsonb_build_object(
    'ok', true,
    'response_id', v_response_id,
    'points', v_points,
    'reward_naira', v_reward
  );
end;
$$;

revoke all on function public.submit_survey_response(uuid, jsonb) from public;
grant execute on function public.submit_survey_response(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. Permanent QR support in the public readers
-- ---------------------------------------------------------------------------
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
    'patient', to_jsonb(profile_row),
    'records', records_json
  );
end;
$$;

revoke all on function public.get_shared_record(uuid) from public;
grant execute on function public.get_shared_record(uuid) to anon, authenticated;

-- Device-aware reader: a revoked device cannot reopen the record.
create or replace function public.get_shared_record(share_token uuid, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revoked boolean;
  v_result jsonb;
begin
  if p_device_id is not null and btrim(p_device_id) <> '' then
    select exists (
      select 1 from public.qr_device_grants g
       where g.token = share_token::text
         and g.device_id = btrim(p_device_id)
         and g.revoked_at is not null
    ) into v_revoked;

    if v_revoked then
      return jsonb_build_object('status', 'revoked', 'message', 'Access was revoked by the record owner.');
    end if;
  end if;

  v_result := public.get_shared_record(share_token);
  return v_result;
end;
$$;

revoke all on function public.get_shared_record(uuid, text) from public;
grant execute on function public.get_shared_record(uuid, text) to anon, authenticated;

create or replace function public.log_shared_access(
  p_token text,
  p_name text,
  p_role text,
  p_license text,
  p_facility text,
  p_device_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.shared_links;
  v_profile public.patient_profiles;
  v_role text;
  v_name text;
  v_facility text;
  v_license text;
  v_action text;
  v_log_id uuid;
  v_patient_id uuid;
  v_user_id uuid;
  v_device text;
  v_device_label text;
  v_permanent boolean := false;
begin
  if p_token is null or btrim(p_token) = '' then
    return jsonb_build_object('ok', false, 'message', 'A share token is required.');
  end if;

  select * into v_link
    from public.shared_links
   where token::text = btrim(p_token)
   limit 1;

  if v_link.id is null then
    select * into v_profile
      from public.patient_profiles
     where permanent_qr_token::text = btrim(p_token)
     limit 1;

    if v_profile.id is null then
      return jsonb_build_object('ok', false, 'message', 'This share link was not found.');
    end if;

    v_permanent := true;
    v_user_id := v_profile.user_id;
    v_patient_id := v_profile.id;
  else
    if not v_link.is_active then
      return jsonb_build_object('ok', false, 'message', 'This share link is no longer active.');
    end if;

    if v_link.expires_at is not null and v_link.expires_at <= now() then
      return jsonb_build_object('ok', false, 'message', 'This share link has expired.');
    end if;

    v_user_id := v_link.user_id;
    v_patient_id := v_link.patient_id;
    if v_patient_id is null then
      select pp.id into v_patient_id
        from public.patient_profiles pp
       where pp.user_id = v_link.user_id
       limit 1;
    end if;
  end if;

  if v_patient_id is null then
    return jsonb_build_object(
      'ok', false,
      'message', 'This share link is not attached to a patient record.'
    );
  end if;

  v_device := nullif(btrim(coalesce(p_device_id, '')), '');
  if v_device is not null then
    if exists (
      select 1 from public.qr_device_grants g
       where g.user_id = v_user_id
         and g.token = btrim(p_token)
         and g.device_id = v_device
         and g.revoked_at is not null
    ) then
      return jsonb_build_object('ok', false, 'revoked', true, 'message', 'Access was revoked by the record owner.');
    end if;
  end if;

  v_role := lower(btrim(coalesce(p_role, 'guest')));
  v_name := nullif(btrim(coalesce(p_name, '')), '');
  v_facility := nullif(btrim(coalesce(p_facility, '')), '');
  v_license := nullif(btrim(coalesce(p_license, '')), '');
  v_device_label := coalesce(v_facility, v_name, 'QR scanner');

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
    accessed_at,
    device_label,
    device_id,
    link_kind,
    status
  )
  values (
    v_patient_id,
    v_link.record_id,
    v_user_id,
    case when v_role = 'guest' then 'emergency_preview' else 'shared_link' end,
    btrim(p_token),
    coalesce(v_facility, v_name),
    v_action,
    now(),
    v_device_label,
    v_device,
    case when v_permanent then 'permanent' else 'temporary' end,
    'active'
  )
  returning id into v_log_id;

  if v_device is not null then
    insert into public.qr_device_grants (
      user_id, patient_id, token, device_id, device_label, permanent, last_seen_at
    )
    values (
      v_user_id, v_patient_id, btrim(p_token), v_device, v_device_label, v_permanent, now()
    )
    on conflict (user_id, token, device_id) do update
      set last_seen_at = now(),
          device_label = excluded.device_label
    where qr_device_grants.revoked_at is null;
  end if;

  insert into public.notifications (user_id, kind, title, body, href, metadata)
  values (
    v_user_id,
    'access',
    case when v_permanent then 'Your Selorah card was scanned' else 'Your QR code was scanned' end,
    v_action,
    '/dashboard/access-log/' || v_log_id::text,
    jsonb_build_object(
      'log_id', v_log_id,
      'token', btrim(p_token),
      'permanent', v_permanent,
      'device_id', v_device
    )
  );

  return jsonb_build_object(
    'ok', true,
    'log_id', v_log_id,
    'permanent', v_permanent
  );
end;
$$;

revoke all on function public.log_shared_access(text, text, text, text, text, text) from public;
grant execute on function public.log_shared_access(text, text, text, text, text, text) to anon, authenticated;

-- Keep the five-argument call working for older clients.
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
begin
  return public.log_shared_access(p_token, p_name, p_role, p_license, p_facility, null);
end;
$$;

revoke all on function public.log_shared_access(text, text, text, text, text) from public;
grant execute on function public.log_shared_access(text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11. QA lab: plans, cases, runs and defects
-- ---------------------------------------------------------------------------
create table if not exists public.qa_test_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text not null default 'General',
  owner text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qa_test_cases (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.qa_test_plans (id) on delete cascade,
  title text not null,
  steps text,
  expected text,
  priority text not null default 'medium',
  status text not null default 'not_run',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qa_test_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.qa_test_cases (id) on delete cascade,
  status text not null,
  notes text,
  run_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.qa_defects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text not null default 'General',
  severity text not null default 'medium',
  status text not null default 'open',
  steps text,
  expected text,
  actual text,
  reported_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qa_test_plans enable row level security;
alter table public.qa_test_cases enable row level security;
alter table public.qa_test_runs enable row level security;
alter table public.qa_defects enable row level security;

drop policy if exists "qa_test_plans: qa" on public.qa_test_plans;
create policy "qa_test_plans: qa" on public.qa_test_plans for all
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'))
  with check (public.current_user_role() in ('qa', 'admin', 'developer'));

drop policy if exists "qa_test_cases: qa" on public.qa_test_cases;
create policy "qa_test_cases: qa" on public.qa_test_cases for all
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'))
  with check (public.current_user_role() in ('qa', 'admin', 'developer'));

drop policy if exists "qa_test_runs: qa" on public.qa_test_runs;
create policy "qa_test_runs: qa" on public.qa_test_runs for all
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'))
  with check (public.current_user_role() in ('qa', 'admin', 'developer'));

drop policy if exists "qa_defects: qa" on public.qa_defects;
create policy "qa_defects: qa" on public.qa_defects for all
  to authenticated
  using (public.current_user_role() in ('qa', 'admin', 'developer'))
  with check (public.current_user_role() in ('qa', 'admin', 'developer'));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'earnings'
  ) then
    execute 'alter publication supabase_realtime add table public.earnings';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'withdrawals'
  ) then
    execute 'alter publication supabase_realtime add table public.withdrawals';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'point_events'
  ) then
    execute 'alter publication supabase_realtime add table public.point_events';
  end if;
end $$;

-- Seed the QA workspace with a starter plan so testers land on real rows.
do $$
declare
  v_plan uuid;
begin
  if not exists (select 1 from public.qa_test_plans) then
    insert into public.qa_test_plans (title, area, owner, status)
    values ('Patient core journey', 'Patient app', 'QA', 'active')
    returning id into v_plan;

    insert into public.qa_test_cases (plan_id, title, steps, expected, priority)
    values
      (v_plan, 'Sign up and complete onboarding',
       'Create an account, confirm the email, then finish onboarding with NIN.',
       'The patient lands on the dashboard with a completed profile.', 'high'),
      (v_plan, 'Add a record offline',
       'Turn off the network, add a record from the dashboard, then reconnect.',
       'The record appears immediately and syncs when the network returns.', 'high'),
      (v_plan, 'Scan a permanent QR code',
       'Open the Selorah card QR as a guest, enter a reason, and view the record.',
       'The owner gets a scan notification and an access log entry.', 'high'),
      (v_plan, 'Request a withdrawal',
       'Complete a survey, open Earnings, and request a payout.',
       'The request is queued and the available balance drops.', 'medium'),
      (v_plan, 'Complete a 15-question survey',
       'Open Research and submit every required answer.',
       'The reward is N20 per question and appears across the dashboard.', 'high');
  end if;
end $$;
