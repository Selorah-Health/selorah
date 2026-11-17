import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckIcon,
  UserIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { contactPathForRole } from '../../lib/contact';
import type { WaitlistRole } from '../../lib/waitlist';
import Reveal from './Reveal';

const ROLES: {
  id: WaitlistRole;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  icon: typeof UserIcon;
  source: string;
}[] = [
  {
    id: 'patient',
    eyebrow: 'For patients',
    title: 'Your history, finally in your hands.',
    body: 'Keep every result, scan, and prescription in one private record you can carry to any clinic.',
    points: [
      'One place for your full history',
      'Share with a time-limited QR code',
      'Revoke access whenever you want',
    ],
    icon: UserIcon,
    source: 'solutions-patient',
  },
  {
    id: 'doctor',
    eyebrow: 'For doctors',
    title: 'Treat with the full picture.',
    body: 'Open a patient shared record in the browser. See the context you need without repeating tests.',
    points: [
      'No new portal to install',
      'Only the records patients approve',
      'Clear access window and audit trail',
    ],
    icon: UserGroupIcon,
    source: 'solutions-doctor',
  },
  {
    id: 'hospital',
    eyebrow: 'For hospitals',
    title: 'Faster intake. Less missing paperwork.',
    body: 'Give your front desk a cleaner handover and reduce the time spent chasing records.',
    points: [
      'Patient shared records at intake',
      'NIN lookup for joined hospitals',
      'Audit visibility for every access',
    ],
    icon: BuildingOffice2Icon,
    source: 'solutions-hospital',
  },
];

export default function RoleSolutionsSection({
  onJoin,
}: {
  onJoin: (role: WaitlistRole, source: string) => void;
}) {
  return (
    <section
      id="solutions"
      className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Built for the whole visit</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101217] sm:text-4xl">
              One record. Three ways to use it.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4B5563]">
              Patients stay in control. Doctors get context. Hospitals get a cleaner intake. No
              side has to start from zero.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {ROLES.map((role, index) => {
            const Icon = role.icon;
            return (
              <Reveal key={role.id} delay={index * 70} className="h-full">
                <m.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full border-t border-[#E5E7EB] pt-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    <span className="text-sm font-medium text-[#101217]">{role.eyebrow}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em] text-[#101217]">
                    {role.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#6B7280]">{role.body}</p>

                  <ul className="mt-5 space-y-2.5">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-[#4B5563]">
                        <CheckIcon
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#0F9F6E]"
                          strokeWidth={2}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {role.id === 'hospital' ? (
                    <Link
                      to={contactPathForRole('hospital')}
                      className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      Talk to our team
                      <ArrowRightIcon
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={2}
                      />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onJoin(role.id, role.source)}
                      className="group mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      Join as {role.id === 'patient' ? 'a patient' : 'a doctor'}
                      <ArrowRightIcon
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={2}
                      />
                    </button>
                  )}
                </m.div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#E5E7EB] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-[#6B7280]">
            Research or insurance partnership? These teams need a conversation before onboarding.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to={contactPathForRole('researcher')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Research partnership
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              to={contactPathForRole('insurer')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Insurance partnership
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
