export const CURRENT_RELEASE = '2026.11.04.1';

export type ReleaseNote = {
  title: string;
  body: string;
  tag: string;
};

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    tag: 'Emergency card',
    title: 'Download the real card design',
    body: 'Your front and back card images now download at full size with your QR code and health details. The layout, colours, and card finish stay exactly the same.',
  },
  {
    tag: 'Offline',
    title: 'Your last values stay visible',
    body: 'When you lose connection, the dashboard keeps showing your last known records, health score, survey balance, cash earned, rewards, and level instead of empty screens.',
  },
  {
    tag: 'Research',
    title: 'Survey rewards corrected to ₦20 per point',
    body: 'Every survey point is worth ₦20. Older responses that were saved at a lower rate are corrected automatically, and any genuine bonus already on an account is kept.',
  },
  {
    tag: 'Pro',
    title: 'Upgrade recovery after a reload',
    body: 'If Paystack returns a pending bank transfer or you close the tab, Selorah now restores the pending payment, checks it again, and repairs Pro access without charging you twice.',
  },
  {
    tag: 'Rewards',
    title: 'Health points and cash are clearly separate',
    body: 'Health points track your progress and level. They are not cash. Survey points remain the only cash reward and are paid at ₦20 per point in Earnings.',
  },
  {
    tag: 'Support',
    title: 'A contact page that works',
    body: 'Reach the Selorah team from the new Contact page, copy a ready-to-send message, or use the monitored support inbox for privacy and security requests.',
  },
  {
    tag: 'Account',
    title: 'Sign in with Google',
    body: 'Use Google to log in or create a patient account. New accounts go straight to onboarding once Google confirms your email, and existing accounts land in the right portal.',
  },
];

const SEEN_KEY = 'selorah_release_seen';

export function readSeenRelease() {
  try {
    return localStorage.getItem(SEEN_KEY) === CURRENT_RELEASE;
  } catch {
    return false;
  }
}

export function markReleaseSeen() {
  try {
    localStorage.setItem(SEEN_KEY, CURRENT_RELEASE);
  } catch {
    // Storage may be unavailable in private mode.
  }
}
