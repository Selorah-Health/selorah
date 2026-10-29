export const CURRENT_RELEASE = '2026.10.29';

export type ReleaseNote = {
  title: string;
  body: string;
  tag: string;
};

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    tag: 'Look and feel',
    title: 'Dark mode is here',
    body: 'Switch between light and dark from the theme button in your dashboard, portal, or shared record.',
  },
  {
    tag: 'Profile',
    title: 'Pick or upload your photo',
    body: 'Choose one of the new preset avatars, upload your own, or remove your photo at any time from settings.',
  },
  {
    tag: 'Health profile',
    title: 'More of your story in settings',
    body: 'Add your date of birth, age, gender, height, weight, blood group, genotype, allergies, medical conditions, and emergency contacts.',
  },
  {
    tag: 'Pro',
    title: 'Monthly and annual plans',
    body: 'Pro now starts at ₦2,000 a month. The annual plan is ₦20,000 and gives you two months free.',
  },
  {
    tag: 'Reliability',
    title: 'Updates without reinstalling',
    body: 'The installed app now updates itself in the background. A refresh prompt appears when a new version is ready.',
  },
  {
    tag: 'Privacy',
    title: 'You control privacy choices',
    body: 'Review and manage optional storage from settings or the privacy prompt. Selorah does not sell your data.',
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
