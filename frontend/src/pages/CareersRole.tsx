import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { Link, useParams } from 'react-router-dom';
import StaticPage from '../components/StaticPage';
import CareerApplicationForm from '../components/careers/CareerApplicationForm';
import { CAREERS_EMAIL, applyHref, getCareerRole } from '../lib/careers';

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-lg font-black tracking-tight text-[#101217] sm:text-xl">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm font-medium leading-relaxed text-gray-600">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function CareersRole() {
  const { slug } = useParams();
  const role = getCareerRole(slug);

  if (!role) {
    return (
      <StaticPage
        title="This role is not open."
        eyebrow="Careers"
        description="The role may have closed, or the link may be out of date. Browse the current openings and send us an application."
        heroTone="light"
      >
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 sm:p-8">
          <p className="text-sm font-medium leading-relaxed text-gray-500">
            We could not find that job. You can return to the careers page to see every open role.
          </p>
          <Link
            to="/careers"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-none bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to careers
          </Link>
        </div>
      </StaticPage>
    );
  }

  return (
    <StaticPage
      title={role.title}
      eyebrow={role.team}
      description={role.summary}
      heroTone="light"
    >
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPinIcon className="h-4 w-4 text-primary" />
          {role.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon className="h-4 w-4 text-primary" />
          {role.type}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BriefcaseIcon className="h-4 w-4 text-primary" />
          {role.team}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap gap-1.5">
        {role.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-gray-100 bg-[#FAFBFF] px-3 py-1.5 text-[10px] font-bold text-gray-500"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="space-y-10">
          <ListSection title="What you will do" items={role.responsibilities} />
          <ListSection title="What we are looking for" items={role.requirements} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black tracking-tight text-[#101217]">Nice to have</h2>
            <ul className="mt-4 space-y-3">
              {role.niceToHave.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-xs font-medium leading-relaxed text-gray-500">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-[#101217] text-white shadow-[0_30px_80px_-48px_rgba(2,9,36,0.7)]">
            <div className="border-b border-white/10 p-6 pb-5">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                Ready to apply?
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Join the {role.team} team
              </h2>
              <p className="mt-2 text-xs font-medium leading-relaxed text-white/55">
                Send us your work and a short note. Every application goes to a person, and you will
                hear back either way.
              </p>
            </div>

            <div className="px-6 pt-5">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                  <BriefcaseIcon className="h-3.5 w-3.5 text-primary" />
                  Team
                </span>
                <span className="text-right text-xs font-bold text-white">{role.team}</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                  <MapPinIcon className="h-3.5 w-3.5 text-primary" />
                  Location
                </span>
                <span className="text-right text-xs font-bold text-white">{role.location}</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">
                  <ClockIcon className="h-3.5 w-3.5 text-primary" />
                  Commitment
                </span>
                <span className="text-right text-xs font-bold text-white">{role.type}</span>
              </div>
            </div>

            <div className="p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40">
                Have these ready
              </p>
              <ul className="mt-3 space-y-2.5">
                {[
                  'Resume or CV in PDF or Word, up to 5 MB',
                  'Portfolio, GitHub, or LinkedIn link',
                  'A short note on why this role matters to you',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-[11px] font-medium leading-relaxed text-white/65">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#application"
                className="mt-5 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-none bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-hover"
              >
                Start your application
                <ArrowRightIcon className="h-4 w-4" />
              </a>
              <p className="mt-3 text-center text-[10px] font-semibold text-white/45">
                About 15 minutes. No account needed.
              </p>

              <a
                href={applyHref(role.title)}
                className="mt-4 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-[10px] font-bold text-white/50 transition-colors hover:text-white"
              >
                <EnvelopeIcon className="h-3.5 w-3.5" />
                Prefer email? {CAREERS_EMAIL}
              </a>
            </div>
          </div>
        </aside>
      </div>

      <CareerApplicationForm role={role} />

      <div className="mt-12 border-t border-gray-100 pt-6">
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to all roles
        </Link>
      </div>
    </StaticPage>
  );
}
