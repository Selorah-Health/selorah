export type BlogStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  author_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  status: BlogStatus;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const BLOG_CATEGORIES = [
  'Announcement',
  'Product',
  'Health records',
  'Company',
  'Research',
];

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function formatBlogDate(value?: string | null) {
  if (!value) return 'Not published';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not published';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function readingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function blogPostPath(slug: string) {
  return `/blog/${slug}`;
}

export function isBlogPreview() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('preview');
}

export function isMissingBlogTable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: string; message?: string; details?: string };
  const code = value.code || '';
  const message = `${value.message || ''} ${value.details || ''}`.toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (message.includes('relation') && message.includes('does not exist')) ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
}

/**
 * The migration seeds this post. Keeping the same copy in the client means the
 * public blog still has a useful first post while a new environment is waiting
 * for the migration to be applied.
 */
export const BLOG_FALLBACK_POST: BlogPost = {
  id: 'fallback-welcome-to-selorah',
  slug: 'welcome-to-selorah',
  title: 'Welcome to the Selorah blog',
  excerpt: 'Announcements, product updates, and practical notes on portable health records.',
  content: `# Welcome to the Selorah blog

This is where we will share launch news, product changes, and practical notes about health records that finally move with the person who owns them.

## What to expect

- City launches and early access windows
- Product updates and new record features
- Plain language notes on privacy, consent, and sharing
- Stories from the build

## Why a blog

Important updates should not disappear in a chat thread. If you joined the waitlist, this is the place to find the details you need.

Thanks for being here early.

The Selorah Health team`,
  cover_image_url: '/blog/covers/welcome-to-selorah.svg',
  category: 'Announcement',
  author_id: null,
  author_name: 'Selorah Health',
  author_avatar_url: null,
  status: 'published',
  seo_title: null,
  seo_description: null,
  published_at: '2026-11-15T00:00:00.000Z',
  created_at: '2026-11-15T00:00:00.000Z',
  updated_at: '2026-11-15T00:00:00.000Z',
};

const PREVIEW_POSTS: BlogPost[] = [
  BLOG_FALLBACK_POST,
  {
    ...BLOG_FALLBACK_POST,
    id: 'preview-know-your-numbers',
    slug: 'know-your-numbers-on-world-diabetes-day',
    title: 'Know your numbers on World Diabetes Day',
    excerpt:
      'Diabetes often develops quietly. Checking your blood sugar and keeping your history close can help you act earlier.',
    category: 'Health records',
    cover_image_url: '/blog/covers/know-your-numbers-on-world-diabetes-day.svg',
    published_at: '2026-11-14T00:00:00.000Z',
    created_at: '2026-11-14T00:00:00.000Z',
    updated_at: '2026-11-14T00:00:00.000Z',
    content: `# Know your numbers on World Diabetes Day

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

If you have symptoms that worry you, speak to a clinician. Early action is better than a late guess.`,
  },
  {
    ...BLOG_FALLBACK_POST,
    id: 'preview-built-for-people-who-move',
    slug: 'built-for-people-who-move',
    title: 'Built for people who move',
    excerpt:
      'Moving to a new city should not mean leaving your health history behind. A portable record makes the first visit easier.',
    category: 'Product',
    cover_image_url: '/blog/covers/built-for-people-who-move.svg',
    published_at: '2026-11-08T00:00:00.000Z',
    created_at: '2026-11-08T00:00:00.000Z',
    updated_at: '2026-11-08T00:00:00.000Z',
    content: `# Built for people who move

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

Selorah is being built for people who change cities, travel for work, study abroad, or simply want a second opinion without starting from zero. Your health history should move at the same speed as you do.`,
  },
  {
    ...BLOG_FALLBACK_POST,
    id: 'preview-first-60-seconds',
    slug: 'the-first-60-seconds-of-an-emergency',
    title: 'The first 60 seconds of an emergency',
    excerpt:
      'In an emergency, the right information should be available before the paperwork starts. Here is what to keep ready.',
    category: 'Health records',
    cover_image_url: '/blog/covers/the-first-60-seconds-of-an-emergency.svg',
    published_at: '2026-11-01T00:00:00.000Z',
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
    content: `# The first 60 seconds of an emergency

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

The goal is simple. When every second counts, the important facts should not be locked in a folder at home.`,
  },
  {
    ...BLOG_FALLBACK_POST,
    id: 'preview-one-patient-one-record',
    slug: 'one-patient-one-record-more-control',
    title: 'One patient. One record. More control.',
    excerpt:
      'A portable record gives patients a single source of truth and a clear way to share it with the people who provide care.',
    category: 'Company',
    cover_image_url: '/blog/covers/one-patient-one-record-more-control.svg',
    published_at: '2026-10-25T00:00:00.000Z',
    created_at: '2026-10-25T00:00:00.000Z',
    updated_at: '2026-10-25T00:00:00.000Z',
    content: `# One patient. One record. More control.

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

One patient. One record. More control.`,
  },
  {
    ...BLOG_FALLBACK_POST,
    id: 'preview-monad-access-control',
    slug: 'progress-report-moving-access-control-to-monad',
    title: 'Progress report: moving access control to Monad',
    excerpt:
      'We moved the access control layer for shared records to Monad for faster, cheaper, verifiable access grants.',
    category: 'Product',
    cover_image_url: '/blog/covers/progress-report-moving-access-control-to-monad.svg',
    published_at: '2026-10-18T00:00:00.000Z',
    created_at: '2026-10-18T00:00:00.000Z',
    updated_at: '2026-10-18T00:00:00.000Z',
    content: `# Progress report: moving access control to Monad

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

We will share more as the pilot expands.`,
  },
  {
    ...BLOG_FALLBACK_POST,
    id: 'preview-why-we-started',
    slug: 'why-we-started-selorah-health',
    title: 'Why we started Selorah Health',
    excerpt:
      'Two experiences showed us what happens when medical records do not move with the patient. Selorah is our answer.',
    category: 'Company',
    cover_image_url: '/blog/covers/why-we-started-selorah-health.svg',
    published_at: '2026-10-11T00:00:00.000Z',
    created_at: '2026-10-11T00:00:00.000Z',
    updated_at: '2026-10-11T00:00:00.000Z',
    content: `# Why we started Selorah Health

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

That is the work.`,
  },
  {
    ...BLOG_FALLBACK_POST,
    id: 'preview-what-we-are-building',
    slug: 'what-we-are-building-and-why-it-matters',
    title: 'What we are building and why it matters',
    excerpt:
      'A waitlist update on the product, the city rollout, and the problems we are solving first.',
    category: 'Announcement',
    cover_image_url: '/blog/covers/what-we-are-building-and-why-it-matters.svg',
    published_at: '2026-10-04T00:00:00.000Z',
    created_at: '2026-10-04T00:00:00.000Z',
    updated_at: '2026-10-04T00:00:00.000Z',
    content: `# What we are building and why it matters

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

If you want early access, join the waitlist and tell us your city. We will send launch updates and product notes as they happen. No spam.`,
  },
];

export function previewBlogPosts() {
  return PREVIEW_POSTS;
}

export function findPreviewBlogPost(slug?: string | null) {
  if (!slug) return null;
  return PREVIEW_POSTS.find((post) => post.slug === slug) || null;
}
