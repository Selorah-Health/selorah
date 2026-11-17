export type FaqItem = {
  question: string;
  answer: string;
};

export type NextStep = {
  title: string;
  body: string;
};

export type SiteContent = {
  announcement: {
    text: string;
    linkLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
  };
  productPreview: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    body: string;
  };
  careTeams: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    body: string;
    doctorTitle: string;
    doctorBody: string;
    hospitalTitle: string;
    hospitalBody: string;
  };
  ownership: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    body: string;
  };
  trust: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    body: string;
  };
  next: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    steps: NextStep[];
  };
  faq: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    body: string;
    items: FaqItem[];
  };
  founder: {
    enabled: boolean;
    eyebrow: string;
    name: string;
    role: string;
    quote: string;
    bio: string[];
    linkedinUrl: string;
    xUrl: string;
    imageUrl: string;
  };
  finalCta: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    body: string;
    ctaLabel: string;
  };
  contact: {
    title: string;
    description: string;
    generalEmail: string;
    founderEmail: string;
    privacyEmail: string;
    securityEmail: string;
  };
};

export type AdSlotId = 'partner-band' | 'leaderboard' | 'native';

export type AdSlotContent = {
  id: AdSlotId;
  label: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  imageAlt: string;
  aspectRatio: string;
  isActive: boolean;
  sortOrder: number;
};

export type AdSlotRow = {
  id: string;
  label: string;
  headline: string;
  body: string;
  cta_label: string;
  cta_url: string;
  image_url: string | null;
  image_alt: string | null;
  aspect_ratio: string;
  is_active: boolean;
  sort_order: number;
};

export const AD_ASPECT_RATIOS = [
  { value: '16 / 3', label: '16:3 (1600 x 300)' },
  { value: '16 / 9', label: '16:9 (1600 x 900)' },
  { value: '4 / 1', label: '4:1 (1600 x 400)' },
  { value: '3 / 1', label: '3:1 (1500 x 500)' },
  { value: '1 / 1', label: '1:1 (800 x 800)' },
  { value: '4 / 3', label: '4:3 (1200 x 900)' },
  { value: '3 / 2', label: '3:2 (1200 x 800)' },
] as const;

export function aspectRatioLabel(value: string) {
  return AD_ASPECT_RATIOS.find((item) => item.value === value)?.label || value;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  announcement: {
    text: 'Selorah is opening city by city.',
    linkLabel: 'Join the waitlist',
  },
  hero: {
    eyebrow: 'Health records for Africa',
    title: 'Tired of having to start from zero?',
    subtitle:
      'Repeating the same tests and buying new cards at every hospital? Selorah gives you complete ownership of your medical records.',
    ctaLabel: 'Join The Waitlist',
  },
  productPreview: {
    enabled: true,
    eyebrow: 'Product preview',
    title: 'See the record that travels with you.',
    body: 'A calm, clear view of the records you own, the access you grant, and the trail you keep.',
  },
  careTeams: {
    enabled: true,
    eyebrow: 'For hospitals and doctors',
    title: 'Built for the people who deliver care.',
    body: 'Give your team the context they need before treatment starts, without asking the patient to repeat their history.',
    doctorTitle: 'See the full picture before treatment.',
    doctorBody:
      'Open the records a patient approves, in the browser, with a clear access window and an audit trail.',
    hospitalTitle: 'Faster intake. Fewer missing records.',
    hospitalBody:
      'Give the front desk a cleaner handover and reduce the time spent chasing paper files and repeat tests.',
  },
  ownership: {
    enabled: true,
    eyebrow: 'Ownership',
    title: 'OWNERSHIP YOU CAN FEEL',
    body: 'Why Selorah exists, and why the timing matters for patients across Africa.',
  },
  trust: {
    enabled: true,
    eyebrow: 'Trust and security',
    title: 'Privacy is the product, not a setting.',
    body: 'Your record is sensitive by nature. Selorah is built so access is explicit, limited, and visible to you.',
  },
  next: {
    enabled: true,
    eyebrow: 'What happens next',
    title: 'From waitlist to your first record.',
    steps: [
      {
        title: 'Join the waitlist',
        body: 'Tell us whether you are a patient, doctor, or hospital.',
      },
      {
        title: 'Get your city opening',
        body: 'We email you when Selorah is ready in your area.',
      },
      {
        title: 'Add your first record',
        body: 'Upload a result or prescription and share it when you choose.',
      },
    ],
  },
  faq: {
    enabled: true,
    eyebrow: 'Questions',
    title: 'Frequently asked',
    body: 'Still unsure? Tell us what is on your mind when you join the waitlist and we will answer directly.',
    items: [
      {
        question: 'What exactly is Selorah Health?',
        answer:
          'Selorah is a patient-owned health record. You keep your lab results, scans, prescriptions, and visit history in one encrypted place, then share them with any clinic using a time-limited QR code.',
      },
      {
        question: 'Who can see my medical records?',
        answer:
          'Only you, until you choose to share. When you generate a code you pick the records and the duration. Every open is logged, and you can revoke access at any moment.',
      },
      {
        question: 'Do hospitals need to be on Selorah?',
        answer:
          'No. A clinician can open your shared link in any browser and see the records you allowed. Hospitals that join get faster intake, NIN lookup, and a full audit trail.',
      },
      {
        question: 'How is my data protected?',
        answer:
          'Records are encrypted in transit and at rest. Access links expire, are single purpose, and can be revoked instantly. We never sell your health information.',
      },
      {
        question: 'Can I log in with my phone number or NIN?',
        answer:
          'Yes. Once your phone number or 11-digit NIN is saved to your profile, you can use either to sign in instead of typing your email. You can still use email at any time.',
      },
      {
        question: 'What does Selorah Pro add?',
        answer:
          'Pro starts at N2,000 a month, or N20,000 a year with two months free. It unlocks up to 10 emergency contacts, priority record verification, family sharing, ad-free use, and early access to research rewards.',
      },
      {
        question: 'How do referral rewards work?',
        answer:
          'Share your username from the Referrals tab. When a friend signs up with it and completes 3 tasks in the Rewards tab, you get N1,000 and they get N800. The money lands in Earnings and can be withdrawn once you have at least N1,000.',
      },
      {
        question: 'Is Selorah available across Africa?',
        answer:
          'We are starting in Nigeria and building for the continent. Join the waitlist and we will tell you the moment your city is live.',
      },
    ],
  },
  founder: {
    enabled: true,
    eyebrow: 'The founder',
    name: 'Samuel Amanze',
    role: 'Founder and CEO, Selorah Health',
    quote:
      'No one should have to carry a folder of paper to prove their own medical history.',
    bio: [
      'Samuel is building Selorah Health so patients across Africa can own, carry, and share their health records on their own terms. Not time-bound cards, not duplicated tests, and not paper folders that never move with them.',
      'The vision is simple: your health story should follow you everywhere, and only you decide who gets to read it.',
    ],
    linkedinUrl: 'https://www.linkedin.com/in/thedesigngm',
    xUrl: 'https://x.com/thedesigngm',
    imageUrl: '/landing/team-samuel.png',
  },
  finalCta: {
    enabled: true,
    eyebrow: 'Waitlist',
    title: 'JOIN THE WAITLIST!',
    body: 'Get early access to health record ownership across Africa.',
    ctaLabel: 'Join The Waitlist',
  },
  contact: {
    title: 'Talk to a human who cares about your records.',
    description:
      'Questions about your vault, a hospital rollout, research, privacy, or a security report. Pick the path that fits and we will route it to the right person.',
    generalEmail: 'customer@selorah.app',
    founderEmail: 'samuelamanze@selorah.app',
    privacyEmail: 'customer@selorah.app',
    securityEmail: 'customer@selorah.app',
  },
};

export const DEFAULT_AD_SLOTS: AdSlotContent[] = [
  {
    id: 'partner-band',
    label: 'Partnership band',
    headline: 'Built with the people who deliver care.',
    body: 'Clinics, insurers, and research teams working on portable records across Africa.',
    ctaLabel: 'Partner with Selorah',
    ctaUrl: '/contact',
    imageUrl: '',
    imageAlt: '',
    aspectRatio: '16 / 3',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'leaderboard',
    label: 'Partner feature',
    headline: 'Put your brand in front of patients and clinicians.',
    body: 'Partner on a guide, a launch note, or a practical health tool. We keep health data out of advertising and review every partner for fit.',
    ctaLabel: 'Partner with Selorah',
    ctaUrl: '/contact',
    imageUrl: '',
    imageAlt: '',
    aspectRatio: '16 / 3',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'native',
    label: 'Paid partnership',
    headline: 'Your story belongs here.',
    body: 'Reach waitlist members and patient communities with a partner guide, launch note, or health tool. Every placement is reviewed for fit.',
    ctaLabel: 'Partner with Selorah',
    ctaUrl: '/contact',
    imageUrl: '',
    imageAlt: '',
    aspectRatio: '16 / 9',
    isActive: true,
    sortOrder: 2,
  },
];

const SITE_CACHE_KEY = 'selorah_site_content_v1';
const ADS_CACHE_KEY = 'selorah_ad_slots_v1';

export const SITE_CONTENT_CACHE_KEYS = [SITE_CACHE_KEY, ADS_CACHE_KEY] as const;

function mergeValue<T>(defaults: T, value: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(value) ? value : defaults) as T;
  }

  if (defaults && typeof defaults === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
    const output: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    for (const key of Object.keys(defaults as Record<string, unknown>)) {
      output[key] = mergeValue(
        (defaults as Record<string, unknown>)[key],
        (value as Record<string, unknown>)[key]
      );
    }
    return output as T;
  }

  if (typeof defaults === 'string') {
    return (typeof value === 'string' ? value : defaults) as T;
  }
  if (typeof defaults === 'boolean') {
    return (typeof value === 'boolean' ? value : defaults) as T;
  }
  if (typeof defaults === 'number') {
    return (typeof value === 'number' ? value : defaults) as T;
  }

  return (value === undefined || value === null ? defaults : value) as T;
}

export function mergeSiteContent(value: unknown): SiteContent {
  return mergeValue(DEFAULT_SITE_CONTENT, value);
}

export function mergeAdSlots(rows: Partial<AdSlotRow>[] | null | undefined): AdSlotContent[] {
  if (!rows || rows.length === 0) return DEFAULT_AD_SLOTS;

  return DEFAULT_AD_SLOTS.map((fallback) => {
    const row = rows.find((item) => item.id === fallback.id);
    if (!row) return fallback;

    return {
      id: fallback.id,
      label: typeof row.label === 'string' ? row.label : fallback.label,
      headline: typeof row.headline === 'string' ? row.headline : fallback.headline,
      body: typeof row.body === 'string' ? row.body : fallback.body,
      ctaLabel: typeof row.cta_label === 'string' ? row.cta_label : fallback.ctaLabel,
      ctaUrl: typeof row.cta_url === 'string' ? row.cta_url : fallback.ctaUrl,
      imageUrl: typeof row.image_url === 'string' ? row.image_url : fallback.imageUrl,
      imageAlt: typeof row.image_alt === 'string' ? row.image_alt : fallback.imageAlt,
      aspectRatio:
        typeof row.aspect_ratio === 'string' ? row.aspect_ratio : fallback.aspectRatio,
      isActive: typeof row.is_active === 'boolean' ? row.is_active : fallback.isActive,
      sortOrder: typeof row.sort_order === 'number' ? row.sort_order : fallback.sortOrder,
    };
  }).sort((left, right) => left.sortOrder - right.sortOrder);
}

export function adSlotToRow(slot: AdSlotContent, userId?: string | null) {
  return {
    id: slot.id,
    label: slot.label,
    headline: slot.headline,
    body: slot.body,
    cta_label: slot.ctaLabel,
    cta_url: slot.ctaUrl,
    image_url: slot.imageUrl || null,
    image_alt: slot.imageAlt || null,
    aspect_ratio: slot.aspectRatio,
    is_active: slot.isActive,
    sort_order: slot.sortOrder,
    updated_at: new Date().toISOString(),
    updated_by: userId || null,
  };
}

export function readCachedSiteContent(): SiteContent | null {
  try {
    const raw = localStorage.getItem(SITE_CACHE_KEY);
    if (!raw) return null;
    return mergeSiteContent(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeCachedSiteContent(content: SiteContent) {
  try {
    localStorage.setItem(SITE_CACHE_KEY, JSON.stringify(content));
  } catch {
    // Caching is optional.
  }
}

export function readCachedAdSlots(): AdSlotContent[] | null {
  try {
    const raw = localStorage.getItem(ADS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return mergeAdSlots(
      parsed.map((item) => ({
        id: item?.id,
        label: item?.label,
        headline: item?.headline,
        body: item?.body,
        cta_label: item?.ctaLabel,
        cta_url: item?.ctaUrl,
        image_url: item?.imageUrl,
        image_alt: item?.imageAlt,
        aspect_ratio: item?.aspectRatio,
        is_active: item?.isActive,
        sort_order: item?.sortOrder,
      }))
    );
  } catch {
    return null;
  }
}

export function writeCachedAdSlots(slots: AdSlotContent[]) {
  try {
    localStorage.setItem(ADS_CACHE_KEY, JSON.stringify(slots));
  } catch {
    // Caching is optional.
  }
}
