-- Blog posts based on Selorah Health LinkedIn updates.
--
-- These are seeded with the same copy used by the client fallback so the
-- production blog and a fresh environment tell the same story. Existing posts
-- are left alone, which means an admin edit is never overwritten by a deploy.

do $$
begin
  if to_regclass('public.blog_posts') is null then
    raise exception
      'public.blog_posts is missing. Run 20261112000001_blog_cms.sql first, or paste supabase/APPLY_CMS.sql.';
  end if;
end $$;

update public.blog_posts
set cover_image_url = '/blog/covers/welcome-to-selorah.svg'
where slug = 'welcome-to-selorah'
  and cover_image_url is null;

insert into public.blog_posts (
  slug,
  title,
  excerpt,
  content,
  cover_image_url,
  category,
  author_name,
  status,
  published_at
)
values
  (
    'know-your-numbers-on-world-diabetes-day',
    'Know your numbers on World Diabetes Day',
    'Diabetes often develops quietly. Checking your blood sugar and keeping your history close can help you act earlier.',
    $markdown$# Know your numbers on World Diabetes Day

World Diabetes Day is a reminder that many people live with diabetes for years before they know it. The early signs can feel ordinary: thirst, tiredness, blurry vision, slow healing, or weight change.

## Why the numbers matter

A blood sugar test gives you a fact you can act on. So does a record of that test. When your results, medicines, and visit notes live in one place, a new clinician can see the pattern instead of guessing.

## What to keep close

- Recent blood sugar and HbA1c results
- Medicines and doses
- Allergies and other conditions
- Emergency contacts
- Questions you want to ask at your next visit

## A record is part of care

Checking your numbers is the first step. Keeping the story around those numbers is how you make better decisions with your care team. Selorah is being built so that story stays with you, not in a folder you cannot find.

If you have symptoms that worry you, speak to a clinician. Early action is better than a late guess.$markdown$,
    '/blog/covers/know-your-numbers-on-world-diabetes-day.svg',
    'Health records',
    'Selorah Health',
    'published',
    '2026-11-14T00:00:00.000Z'
  ),
  (
    'built-for-people-who-move',
    'Built for people who move',
    'Moving to a new city should not mean leaving your health history behind. A portable record makes the first visit easier.',
    $markdown$# Built for people who move

For many people, the first real test of a health record is a move. A new job, a new city, or a new school can put you in front of a clinician who has never seen your history.

## The first visit problem

Most first visits start with the same questions. What are you allergic to? What medicines are you taking? When was your last test? Have you had surgery?

If the answers are spread across old folders, chat messages, and a hospital portal you can no longer open, the first visit becomes a memory test.

## What a portable record changes

A portable record keeps the important parts together and lets you decide who can see them.

- Your allergies and current medicines are easy to find
- Recent results travel with you
- You can share a summary before the appointment
- You can revoke access when it is no longer needed

## Made for real life

Selorah is being built for people who change cities, travel for work, study abroad, or simply want a second opinion without starting from zero. Your health history should move at the same speed as you do.$markdown$,
    '/blog/covers/built-for-people-who-move.svg',
    'Product',
    'Selorah Health',
    'published',
    '2026-11-08T00:00:00.000Z'
  ),
  (
    'the-first-60-seconds-of-an-emergency',
    'The first 60 seconds of an emergency',
    'In an emergency, the right information should be available before the paperwork starts. Here is what to keep ready.',
    $markdown$# The first 60 seconds of an emergency

In an emergency, the people helping you need a few facts quickly. Blood type, allergies, current medicines, and an emergency contact can change the first decision.

## The information that helps

- Allergies and reactions
- Current medicines and doses
- Blood type, if you know it
- Major conditions and past surgeries
- An emergency contact
- A clinician or hospital you trust

## Keep it available offline

A record is only useful if you can reach it when the network is down. Selorah is designed so the emergency parts of your record can be available on your device, even when you cannot load a website.

## A record is not a replacement for emergency care

If someone is in danger, call your local emergency number first. A health record supports the people treating you. It does not replace them.

The goal is simple. When every second counts, the important facts should not be locked in a folder at home.$markdown$,
    '/blog/covers/the-first-60-seconds-of-an-emergency.svg',
    'Health records',
    'Selorah Health',
    'published',
    '2026-11-01T00:00:00.000Z'
  ),
  (
    'one-patient-one-record-more-control',
    'One patient. One record. More control.',
    'A portable record gives patients a single source of truth and a clear way to share it with the people who provide care.',
    $markdown$# One patient. One record. More control.

Health care produces a lot of information. Test results, prescriptions, visit notes, scans, and discharge instructions. Too often, each one lives in a different place.

## One source of truth

A patient owned record brings the important pieces together. It does not replace the hospital system. It gives the patient a copy they can keep and a way to share it when needed.

## Control is more than storage

Keeping a record is not enough. You need to know who can see it, what they can see, and for how long.

- Share only the records a clinician needs
- Set an access window
- Revoke access when the visit is over
- See when your record was opened

## The patient stays at the center

Hospitals, doctors, and insurers all need access to information. The patient should decide how that access works. That is the principle behind Selorah.

One patient. One record. More control.$markdown$,
    '/blog/covers/one-patient-one-record-more-control.svg',
    'Company',
    'Selorah Health',
    'published',
    '2026-10-25T00:00:00.000Z'
  ),
  (
    'progress-report-moving-access-control-to-monad',
    'Progress report: moving access control to Monad',
    'We moved the access control layer for shared records to Monad for faster, cheaper, verifiable access grants.',
    $markdown$# Progress report: moving access control to Monad

We have moved the access control layer for shared records to Monad. This is a progress report on what changed and why it matters for patients and care teams.

## Why access control belongs onchain

When a patient shares a record, the permission should be easy to verify and hard to quietly change. An onchain access grant gives both sides a shared record of who was allowed to open what, and when.

## Why Monad

Monad gives us an EVM compatible environment with fast finality and low fees. That combination matters for a health record product.

- Access grants can be confirmed in seconds
- The cost of a grant stays low enough for everyday use
- Existing Ethereum tooling works with the contracts
- The audit trail is independent of a single hospital database

## What is live now

The access control contracts are deployed and the hospital portal can request a grant. A patient can approve or revoke access from the app. The record itself stays encrypted. The chain records the permission, not the medical content.

## What comes next

We are testing the flow with a small group of clinicians and adding clearer language around consent. The goal is not to make the technology visible. The goal is to make sharing safer and easier to verify.

We will share more as the pilot expands.$markdown$,
    '/blog/covers/progress-report-moving-access-control-to-monad.svg',
    'Product',
    'Selorah Health',
    'published',
    '2026-10-18T00:00:00.000Z'
  ),
  (
    'why-we-started-selorah-health',
    'Why we started Selorah Health',
    'Two experiences showed us what happens when medical records do not move with the patient. Selorah is our answer.',
    $markdown$# Why we started Selorah Health

Selorah started with a question that would not leave us alone. Why is it still so hard to get your own medical history when you need it?

## A friend in the hospital

A close friend was taken to the hospital after an accident. He was unconscious. His family knew he had a condition and took medicine for it, but nobody could find the details. The first hours were spent calling relatives and searching for a folder instead of treating him with the full picture.

He survived. The experience stayed with us.

## A colleague who was pregnant

A colleague was pregnant and had to travel for work. Her antenatal records were in a hospital in one city. The clinic in the other city wanted the history. She spent days trying to get copies while managing a pregnancy and a job.

The records existed. They just did not move with her.

## The question

If a record can follow a payment across the world, why can it not follow a person across a city?

## What we are building

Selorah is a patient owned health record. It keeps the important parts of your history together, encrypted, and ready to share when you choose. It is built for the way care actually happens in Nigeria and across Africa, where people move, networks fail, and records are often still on paper.

We are starting with the basics. A record you can carry. A way to share it safely. A clear trail of who opened it.

That is the work.$markdown$,
    '/blog/covers/why-we-started-selorah-health.svg',
    'Company',
    'Selorah Health',
    'published',
    '2026-10-11T00:00:00.000Z'
  ),
  (
    'what-we-are-building-and-why-it-matters',
    'What we are building and why it matters',
    'A waitlist update on the product, the city rollout, and the problems we are solving first.',
    $markdown$# What we are building and why it matters

We are building and shipping in public. Here is a short update on what the team is working on and what you can expect next.

## The product

Selorah is a patient owned health record with three core jobs.

- Keep your medical history in one place
- Let you share only what a clinician needs
- Show you who opened your record and when

## The rollout

We are starting with a small group of patients, clinicians, and hospitals. The waitlist helps us open each city in a controlled way so support and clinical review can keep up with demand.

## The problems we are solving first

- Emergency information that is available offline
- Records that move when a patient changes city
- Consent and access that are easy to understand
- A clean handover between hospitals and clinics

## Join the waitlist

If you want early access, join the waitlist and tell us your city. We will send launch updates and product notes as they happen. No spam.$markdown$,
    '/blog/covers/what-we-are-building-and-why-it-matters.svg',
    'Announcement',
    'Selorah Health',
    'published',
    '2026-10-04T00:00:00.000Z'
  )
on conflict (slug) do nothing;
