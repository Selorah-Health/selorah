import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../contexts/SiteContentContext';
import { contactPathForRole } from '../../lib/contact';
import type { WaitlistRole } from '../../lib/waitlist';
import Reveal from './Reveal';

const TEAM_POINTS = {
  doctor: [
    'No new portal to install',
    'Only the records a patient approves',
    'Clear access window and audit trail',
  ],
  hospital: [
    'Patient shared records at intake',
    'NIN lookup for joined hospitals',
    'Audit visibility for every access',
  ],
};

export default function CareTeamsSection({
  onJoin,
}: {
  onJoin: (role: WaitlistRole, source: string) => void;
}) {
  const { content } = useSiteContent();
  const section = content.careTeams;

  if (!section.enabled) return null;

  const cards = [
    {
      role: 'doctor' as const,
      eyebrow: 'For doctors',
      title: section.doctorTitle,
      body: section.doctorBody,
      points: TEAM_POINTS.doctor,
      icon: UserGroupIcon,
      source: 'care-teams-doctor',
    },
    {
      role: 'hospital' as const,
      eyebrow: 'For hospitals',
      title: section.hospitalTitle,
      body: section.hospitalBody,
      points: TEAM_POINTS.hospital,
      icon: BuildingOffice2Icon,
      source: 'care-teams-hospital',
    },
  ];

  return (
    <section
      id="care-teams"
      aria-labelledby="care-teams-heading"
      className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">{section.eyebrow}</p>
            <h2
              id="care-teams-heading"
              className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#101217] sm:text-4xl"
            >
              {section.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4B5563]">{section.body}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Reveal key={card.role} delay={index * 70} className="h-full">
                <m.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex h-full flex-col border border-[#E5E7EB] bg-[#F8FAFC] p-6 sm:p-8"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    <span className="text-sm font-medium text-[#101217]">{card.eyebrow}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold leading-snug tracking-[-0.02em] text-[#101217]">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#6B7280]">{card.body}</p>

                  <ul className="mt-5 space-y-2.5">
                    {card.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-[#4B5563]">
                        <CheckIcon
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#0F9F6E]"
                          strokeWidth={2}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {card.role === 'hospital' ? (
                    <Link
                      to={contactPathForRole('hospital')}
                      className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
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
                      onClick={() => onJoin(card.role, card.source)}
                      className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      Join as a doctor
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
      </div>
    </section>
  );
}
