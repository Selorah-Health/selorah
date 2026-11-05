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
import { applyHref, getCareerRole } from '../lib/careers';

function ListSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
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
            className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
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

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-10">
          <ListSection title="What you will do" items={role.responsibilities} />
          <ListSection title="What we are looking for" items={role.requirements} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black tracking-tight text-[#101217]">
              Nice to have
            </h2>
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

          <div className="rounded-[28px] bg-[#101217] p-6 text-white">
            <h2 className="text-lg font-black tracking-tight">Ready to apply?</h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-white/60">
              Send your resume, portfolio, and a short note about why this problem matters to you.
              Every application goes to a human.
            </p>
            <a
              href={applyHref(role.title)}
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
            >
              Apply for this role
              <ArrowRightIcon className="h-4 w-4" />
            </a>
            <a
              href={applyHref(role.title)}
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-white/60 transition-colors hover:text-white"
            >
              <EnvelopeIcon className="h-4 w-4" />
              Or email support@selorah.app
            </a>
          </div>
        </aside>
      </div>

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
