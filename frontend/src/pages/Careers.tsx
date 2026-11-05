import {
  AcademicCapIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BriefcaseIcon,
  ClockIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HeartIcon,
  MapPinIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import StaticPage from '../components/StaticPage';
import { CAREER_ROLES, applyHref } from '../lib/careers';

const PERKS = [
  {
    title: 'Remote first',
    body: 'Work from anywhere in Nigeria or across Africa. We optimise for deep work and clear written communication.',
    icon: GlobeAltIcon,
  },
  {
    title: 'Health cover',
    body: 'Comprehensive health insurance for you and your dependants, because we build for health and should live it.',
    icon: HeartIcon,
  },
  {
    title: 'Fair pay',
    body: 'Competitive salary, equity in the company, and transparent bands so you know where you stand.',
    icon: BanknotesIcon,
  },
  {
    title: 'Learning budget',
    body: 'A yearly budget for courses, books, conferences, and certifications that make you better at your craft.',
    icon: AcademicCapIcon,
  },
  {
    title: 'Flexible hours',
    body: 'Core overlap hours for collaboration, with the rest of your day shaped around your life and energy.',
    icon: ClockIcon,
  },
  {
    title: 'Real ownership',
    body: 'Small team, short decision paths, and meaningful scope. Your work ships to patients, not a backlog.',
    icon: SparklesIcon,
  },
];

export default function Careers() {
  return (
    <StaticPage
      title="Build the future of health data with us."
      eyebrow="Careers"
      description="We are a small team solving a large problem: making medical records portable, private, and useful for every patient in Africa. If that sounds like your kind of work, we would love to meet you."
      heroTone="light"
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { value: '6', label: 'open roles', icon: BriefcaseIcon },
          { value: '100%', label: 'remote friendly', icon: GlobeAltIcon },
          { value: '1', label: 'mission: patient ownership', icon: HeartIcon },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.45)]"
          >
            <stat.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-3xl font-black tracking-tight text-[#101217]">{stat.value}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Open roles
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#101217] sm:text-4xl">
              Find your next chapter.
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500">
              Every application goes to a human. Tell us what you have built and why this problem
              matters to you.
            </p>
          </div>
          <a
            href={applyHref('General application')}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-[#101217] transition-colors hover:border-primary/30"
          >
            <EnvelopeIcon className="h-4 w-4 text-primary" />
            Send a general application
          </a>
        </div>

        <div className="mt-8 grid gap-4">
          {CAREER_ROLES.map((role) => (
            <article
              key={role.slug}
              className="group rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-lg sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight text-[#101217] sm:text-xl">
                      <Link
                        to={`/careers/${role.slug}`}
                        className="transition-colors hover:text-primary"
                      >
                        {role.title}
                      </Link>
                    </h3>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-primary-hover">
                      {role.type}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="h-3.5 w-3.5 text-primary" />
                      {role.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5 text-primary" />
                      {role.type}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BriefcaseIcon className="h-3.5 w-3.5 text-primary" />
                      {role.team}
                    </span>
                  </div>

                  <p className="mt-3 max-w-3xl text-[12px] font-medium leading-relaxed text-gray-500">
                    {role.summary}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {role.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-gray-100 bg-[#FAFBFF] px-2.5 py-1 text-[9px] font-bold text-gray-500"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <Link
                    to={`/careers/${role.slug}`}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-[#101217] transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    View details
                  </Link>
                  <a
                    href={applyHref(role.title)}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
                  >
                    Apply now
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Why Selorah
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#101217] sm:text-4xl">
            Do work that compounds.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((perk) => (
            <article key={perk.title} className="rounded-[26px] border border-gray-100 bg-white p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <perk.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-black tracking-tight text-[#101217]">
                {perk.title}
              </h3>
              <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-gray-500">
                {perk.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[32px] bg-[#101217] px-6 py-10 text-white sm:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Culture
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Transparent, ownership driven, and kind.
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-white/55">
              We write things down, challenge ideas with evidence, and assume good intent. We are
              building for patients who cannot afford a broken handoff, so quality is not optional.
            </p>
          </div>
          <a
            href={applyHref('General application')}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#101217] transition-colors hover:bg-[#F4F7FF]"
          >
            <EnvelopeIcon className="h-4 w-4 text-primary" />
            Introduce yourself
          </a>
        </div>
      </section>

      <section className="mt-16 text-center">
        <h2 className="text-3xl font-black tracking-tight text-[#101217] sm:text-4xl">
          Do not see your role?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-gray-500">
          We are always open to exceptional people. Send us what you have built and the problem you
          want to spend your time on.
        </p>
        <a
          href={applyHref('Open application')}
          className="mt-6 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
        >
          Send your resume
          <ArrowRightIcon className="h-4 w-4" />
        </a>
      </section>
    </StaticPage>
  );
}
