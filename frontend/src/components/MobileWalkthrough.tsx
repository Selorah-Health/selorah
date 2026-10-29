import { useEffect, useState } from 'react';
import {
  BeakerIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const PENDING_KEY = 'selorah_walkthrough_pending';
const DONE_KEY = 'selorah_walkthrough_done';

const STEPS = [
  {
    icon: DocumentDuplicateIcon,
    title: 'Your records, in one place',
    body: 'Upload a lab result, a prescription, or a visit note and keep it with everything else. Tap the Selorah mark at the top to open the menu.',
  },
  {
    icon: QrCodeIcon,
    title: 'Share only when you choose',
    body: 'Create a QR code or link for a clinic. You set the expiry, and you can revoke access at any time.',
  },
  {
    icon: BeakerIcon,
    title: 'Earn from research surveys',
    body: 'Answer short, approved surveys. Each question earns 1 point, and every point is worth ₦2 in your research balance.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Emergency details ready',
    body: 'Your blood group, allergies, and emergency contacts stay on your emergency card, even when you cannot speak for yourself.',
  },
  {
    icon: UserCircleIcon,
    title: 'Make the profile yours',
    body: 'Add a profile photo, confirm your NIN, and manage Pro from the profile tab.',
  },
];

export default function MobileWalkthrough() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    try {
      if (
        localStorage.getItem(PENDING_KEY) === '1' &&
        localStorage.getItem(DONE_KEY) !== '1'
      ) {
        setOpen(true);
      }
    } catch {
      // The tour is optional when storage is blocked.
    }
  }, []);

  if (!open) return null;

  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const finish = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      // Storage is optional.
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#050038]/80 p-3 backdrop-blur-sm md:hidden">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkthrough-title"
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6183FF]">
            Step {index + 1} of {STEPS.length}
          </span>
          <button
            type="button"
            onClick={finish}
            className="min-h-[34px] rounded-full px-3 text-[11px] font-bold text-gray-400 transition-colors hover:text-gray-600"
          >
            Skip
          </button>
        </div>

        <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
          <step.icon className="h-7 w-7" />
        </div>

        <h2
          id="walkthrough-title"
          className="mt-4 text-xl font-black tracking-tight text-[#101217]"
        >
          {step.title}
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">{step.body}</p>

        <div className="mt-5 flex items-center gap-1.5">
          {STEPS.map((item, stepIndex) => (
            <span
              key={item.title}
              className={`h-1.5 rounded-full transition-all ${
                stepIndex === index
                  ? 'w-6 bg-[#6183FF]'
                  : stepIndex < index
                    ? 'w-1.5 bg-[#6183FF]/50'
                    : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (last ? finish() : setIndex((current) => current + 1))}
          className="mt-5 min-h-[50px] w-full rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-colors hover:bg-[#4D6ED6]"
        >
          {last ? 'Start using Selorah' : 'Next'}
        </button>
      </div>
    </div>
  );
}
