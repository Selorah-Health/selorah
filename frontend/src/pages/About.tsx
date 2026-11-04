import {
  ArrowRightIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  GlobeAltIcon,
  HeartIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import StaticPage from '../components/StaticPage';

const VALUES = [
  {
    title: 'Absolute privacy',
    body: 'Your records are encrypted in transit and at rest. We do not sell health information, and we do not build advertising profiles from it.',
    icon: ShieldCheckIcon,
    tone: 'bg-[#EEF2FF] text-[#6183FF]',
  },
  {
    title: 'Data sovereignty',
    body: 'You own your data. You choose who sees it, for how long, and you can revoke access at any time. The audit trail stays with you.',
    icon: GlobeAltIcon,
    tone: 'bg-[#EAFBF2] text-[#15955C]',
  },
  {
    title: 'Community first',
    body: 'Patients are rewarded for research participation, fairly and transparently. Every point has a clear naira value before you start.',
    icon: UserGroupIcon,
    tone: 'bg-[#FFF4E8] text-[#B45309]',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Build the record',
    body: 'Upload lab results, scans, prescriptions, and visit notes into one private vault that travels with the patient.',
    icon: LockClosedIcon,
  },
  {
    number: '02',
    title: 'Share with consent',
    body: 'A time limited QR code gives a clinician only the records the patient selected, for the window they chose.',
    icon: SparklesIcon,
  },
  {
    number: '03',
    title: 'Keep the trail',
    body: 'Every open is logged. Access can be revoked instantly, and the patient always knows who saw what.',
    icon: CheckCircleIcon,
  },
];

export default function About() {
  return (
    <StaticPage
      title="Health records that belong to the patient."
      eyebrow="About Selorah"
      description="We are building the sovereign infrastructure for African medical history. One record, owned by the patient, accepted in every care setting."
      heroImage="/assets/hero-bg-image-1.jpg"
      heroTone="dark"
    >
      <section className="-mt-24 mb-16 grid gap-3 sm:grid-cols-3">
        {[
          { value: '4', label: 'portals, one record', icon: BuildingOffice2Icon },
          { value: '1', label: 'permanent emergency card', icon: HeartIcon },
          { value: '0', label: 'health records sold', icon: ShieldCheckIcon },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.45)]"
          >
            <stat.icon className="h-5 w-5 text-[#6183FF]" />
            <p className="mt-3 text-3xl font-black tracking-tight text-[#101217]">{stat.value}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6183FF]">
            Our mission
          </p>
          <h2 className="mt-3 text-3xl font-black leading-[1.1] tracking-tight text-[#101217] sm:text-4xl">
            A world where your health history travels with you, securely.
          </h2>
          <div className="mt-5 space-y-4 text-sm font-medium leading-relaxed text-gray-500 sm:text-base">
            <p>
              In Africa today, medical records are fragmented, paper based, or locked inside
              hospital systems that do not speak to each other. When a patient moves, their history
              stays behind.
            </p>
            <p>
              Selorah changes that. We give patients a secure place to consolidate their records,
              share them instantly with any clinician, and earn rewards when they choose to
              contribute anonymised data to research.
            </p>
            <p>
              The result is better care at every handoff: fewer repeated tests, faster emergency
              decisions, and a patient who is never a stranger to their own history.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-6 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
            >
              Create your vault
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 text-sm font-bold text-[#101217] transition-colors hover:border-[#6183FF]/30"
            >
              Talk to the team
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[36px] border border-gray-100 bg-[#F4F7FF] shadow-[0_30px_90px_-56px_rgba(15,23,42,0.55)]">
            <img
              src="/assets/hero-bg-image-2.jpg"
              alt="A clinician reviewing a patient record"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="absolute -bottom-5 -left-4 hidden max-w-[230px] rounded-[22px] border border-gray-100 bg-white p-4 shadow-xl sm:block">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAFBF2] text-[#15955C]">
                <ShieldCheckIcon className="h-4 w-4" />
              </span>
              <p className="text-xs font-bold text-[#101217]">Patient controlled</p>
            </div>
            <p className="mt-2 text-[10px] font-medium leading-relaxed text-gray-500">
              Access expires on your schedule. Revoke it in one tap, any time.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6183FF]">
            What we stand on
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#101217] sm:text-4xl">
            Built on trust, not surveillance.
          </h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500">
            Our values are not a marketing page. They decide what we build and what we refuse to
            build.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {VALUES.map((value) => (
            <article
              key={value.title}
              className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${value.tone}`}
              >
                <value.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-black tracking-tight text-[#101217]">
                {value.title}
              </h3>
              <p className="mt-2 text-[12px] font-medium leading-relaxed text-gray-500">
                {value.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-[36px] bg-[#101217] px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8FA8FF]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              One record. Every care setting.
            </h2>
          </div>
          <Link
            to="/#how-it-works"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8FA8FF] transition-colors hover:text-white"
          >
            See the full journey
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6183FF]/15 text-[#8FA8FF]">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-black tracking-[0.18em] text-white/25">
                  {step.number}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold">{step.title}</h3>
              <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-white/50">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[28px] border border-gray-100 bg-[#F4F7FF] p-6">
          <BeakerIcon className="h-6 w-6 text-[#6183FF]" />
          <h3 className="mt-4 text-lg font-black tracking-tight text-[#101217]">
            Research with consent
          </h3>
          <p className="mt-2 text-[12px] font-medium leading-relaxed text-gray-500">
            Patients choose every study they join. Surveys pay a clear rate, and answers are only
            used for the study the patient approved.
          </p>
        </div>
        <div className="rounded-[28px] border border-gray-100 bg-[#F4F7FF] p-6">
          <ShieldCheckIcon className="h-6 w-6 text-[#6183FF]" />
          <h3 className="mt-4 text-lg font-black tracking-tight text-[#101217]">
            Built for African care
          </h3>
          <p className="mt-2 text-[12px] font-medium leading-relaxed text-gray-500">
            Low bandwidth, offline first, and designed for the way care actually happens across
            hospitals, pharmacies, and community clinics.
          </p>
        </div>
      </section>

      <section className="mt-16 text-center">
        <h2 className="text-3xl font-black tracking-tight text-[#101217] sm:text-4xl">
          Ready to take control of your medical records?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-gray-500">
          Join patients, hospitals, researchers, and insurers building a more portable health
          system.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#6183FF] px-7 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] sm:w-auto"
          >
            Get started now
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            to="/careers"
            className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-7 text-sm font-bold text-[#101217] transition-colors hover:border-[#6183FF]/30 sm:w-auto"
          >
            View openings
            <BeakerIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </StaticPage>
  );
}
