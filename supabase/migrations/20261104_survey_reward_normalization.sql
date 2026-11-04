-- Keep every survey reward on the current N20 per point rate.
--
-- Older responses and earnings were written before the rate changed. This
-- migration only raises values; a study with a deliberate bonus above the
-- standard rate keeps that bonus.

update public.survey_responses
   set reward_naira = points_awarded * 20
 where reward_naira < points_awarded * 20;

-- The earnings row does not store the survey id, so match it to the closest
-- survey response for the same patient. The response and its earning row are
-- written in the same transaction, which keeps the timestamps seconds apart.
with matches as (
  select
    e.id as earning_id,
    (
      select greatest(r.reward_naira, r.points_awarded * 20)
        from public.survey_responses r
        join public.patient_profiles pp on pp.user_id = r.user_id
       where pp.id = e.patient_id
         and abs(extract(epoch from (r.created_at - e.created_at))) <= 600
       order by abs(extract(epoch from (r.created_at - e.created_at)))
       limit 1
    ) as normalized_reward
  from public.earnings e
  where coalesce(e.source, 'survey') = 'survey'
)
update public.earnings e
   set amount_local = m.normalized_reward
  from matches m
 where e.id = m.earning_id
   and m.normalized_reward is not null
   and e.amount_local < m.normalized_reward;

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
    greatest(
      coalesce(sum(r.reward_naira), 0),
      coalesce(sum(r.points_awarded), 0) * 20
    )::numeric as reward_naira
  from public.surveys s
  left join public.survey_responses r on r.survey_id = s.id
  where s.researcher_id = auth.uid()
  group by s.id;
$$;

revoke all on function public.survey_stats() from public;
grant execute on function public.survey_stats() to authenticated;
