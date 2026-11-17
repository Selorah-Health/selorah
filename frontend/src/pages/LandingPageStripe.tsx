import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  GlobeAltIcon,
  LinkIcon,
  LockClosedIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOTitle from '../components/SEOTitle';
import CTAButton from '../components/CTAButton';
import WaitlistProof from '../components/WaitlistProof';
import WaitlistModal, { type WaitlistRole } from '../components/WaitlistModal';
import MotionProvider from '../components/MotionProvider';
import Reveal from '../components/landing/Reveal';
import HeroProductVideo from '../components/landing/HeroProductVideo';

const RECORD_ROWS = [
  {
    title: 'Complete blood count',
    meta: 'Lagos University Teaching Hospital',
    date: '12 Oct',
    icon: BeakerIcon,
    tone: 'bg-primary/10 text-primary',
  },
  {
    title: 'Obstetric ultrasound',
    meta: 'Reddington Hospital',
    date: '28 Sep',
    icon: DocumentTextIcon,
    tone: 'bg-[#E9FBF3] text-[#0F9F6E]',
  },
  {
    title: 'Prescription history',
    meta: 'Last updated by Dr. Okafor',
    date: '04 Sep',
    icon: ShieldCheckIcon,
    tone: 'bg-[#FFF5E8] text-[#B86A12]',
  },
];

const STATS = [
  { value: '1', label: 'record you own' },
  { value: '3', label: 'steps to share' },
  { value: '0', label: 'data ever sold' },
  { value: '100%', label: 'patient-controlled' },
];

const SECURITY_STATS = [
  { value: 'AES-256', label: 'encryption at rest' },
  { value: 'Time-limited', label: 'share links' },
  { value: 'Full audit', label: 'trail' },
  { value: 'NIN-ready', label: 'identity' },
];

const ACCESS_LOG = [
  { title: 'Clinic opened your record', meta: 'Dr. Okafor', time: '2 min ago', icon: EyeIcon },
  { title: 'Share link expired', meta: 'Time limit reached', time: '14:52', icon: ClockIcon },
  { title: 'Access revoked by you', meta: 'You took access back', time: 'Yesterday', icon: LockClosedIcon },
  { title: 'Record encrypted', meta: 'Saved on your device', time: 'On save', icon: ShieldCheckIcon },
];

const SHARE_CARDS = [
  {
    title: 'QR code',
    body: 'Open the record in any browser, without a new portal to install.',
    icon: QrCodeIcon,
    href: '/blog',
  },
  {
    title: 'Secure link',
    body: 'Send a time-limited link to a clinician or the wider care team.',
    icon: LinkIcon,
    href: '/blog',
  },
  {
    title: 'Clinic portal',
    body: 'Give partner hospitals a faster intake workflow and a clear audit trail.',
    icon: BuildingOffice2Icon,
    href: '/blog',
  },
];

const ROLE_CARDS = [
  { label: 'Patients', note: 'Own the record', icon: UserIcon },
  { label: 'Doctors', note: 'Open with consent', icon: UserGroupIcon },
  { label: 'Hospitals', note: 'Faster intake', icon: BuildingOffice2Icon },
];

const HAPPENING = [
  {
    title: 'Welcome to the Selorah blog',
    excerpt: 'Announcements, product updates, and practical notes on portable health records.',
    tag: 'Announcement',
    href: '/blog/welcome-to-selorah',
    icon: DocumentTextIcon,
    bg: 'bg-[linear-gradient(135deg,#6183FF,#5FFAB0)]',
  },
  {
    title: 'Why health records should move with you',
    excerpt: 'A record that stays in one hospital is not really yours. Here is what changes when it travels.',
    tag: 'Product',
    href: '/blog',
    icon: GlobeAltIcon,
    bg: 'bg-[linear-gradient(135deg,#020924,#6183FF)]',
  },
  {
    title: 'Building for the next billion patients',
    excerpt: 'What portable records mean for care across Africa, and why the patient has to own the key.',
    tag: 'Essay',
    href: '/blog',
    icon: UserGroupIcon,
    bg: 'bg-[linear-gradient(135deg,#6183FF,#B9C6FF)]',
  },
  {
    title: 'See all stories',
    excerpt: 'Browse every post from the Selorah team, from launch notes to practical guides.',
    tag: 'All posts',
    href: '/blog',
    icon: ArrowRightIcon,
    bg: 'bg-[linear-gradient(135deg,#020924,#5FFAB0)]',
  },
];

type Segment = {
  role: WaitlistRole;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  initials: string;
  storyTitle: string;
  story: string;
};

const SEGMENTS: Segment[] = [
  {
    role: 'patient',
    eyebrow: 'For patients',
    title: 'Carry your history without carrying a folder.',
    body: 'Keep your labs, scans, prescriptions, and visit notes on your phone. Share only what a clinician needs, then take access back.',
    cta: 'Join the waitlist',
    initials: 'AO',
    storyTitle: 'Amara, Lagos',
    story: 'I used to carry a folder to every appointment. Now I share a code and the doctor sees the same results.',
  },
  {
    role: 'doctor',
    eyebrow: 'For doctors and clinics',
    title: 'Open a patient record in any browser, with consent.',
    body: 'No new portal to install. A patient shares a time-limited code, and you see the records they allowed, with an audit trail.',
    cta: 'See clinic tools',
    initials: 'DO',
    storyTitle: 'Dr. Okafor, Abuja',
    story: 'The record is already there when the patient arrives. No calls, no missing films, no repeated tests.',
  },
  {
    role: 'hospital',
    eyebrow: 'For hospitals and health systems',
    title: 'Faster intake, NIN lookup, and a full audit trail.',
    body: 'Give the front desk a clearer view of each patient without replacing the systems your clinicians already use.',
    cta: 'Talk to us',
    initials: 'RH',
    storyTitle: 'Reddington Hospital',
    story: 'Intake is faster, and we can see exactly who accessed a record and when.',
  },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-sm font-medium text-primary">{children}</p>;
}

function HeroShareCard() {
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-[520px] lg:block">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full bg-[conic-gradient(from_140deg,#6183FF,#5FFAB0,#B9C6FF,#6183FF)] opacity-80 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute inset-[13%] rounded-full border border-white/50 bg-white/30 backdrop-blur-3xl"
      />

      <m.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-[3%] top-[14%] w-[74%] border border-white/70 bg-white/95 p-4 shadow-[0_28px_80px_-28px_rgba(2,9,36,0.45)] backdrop-blur"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center bg-[#E9FBF3]">
            <ShieldCheckIcon className="h-4 w-4 text-[#0F9F6E]" strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#101217]">Record protected</p>
            <p className="text-[10px] text-[#8A94A6]">Encrypted before it is saved</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {RECORD_ROWS.slice(0, 2).map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.title}
                className="flex items-center gap-2.5 border border-[#EFF2F7] bg-[#FBFCFE] px-2.5 py-2"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center ${row.tone}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold text-[#101217]">{row.title}</p>
                  <p className="truncate text-[9px] text-[#8A94A6]">{row.meta}</p>
                </div>
                <span className="shrink-0 text-[9px] font-semibold text-[#0F9F6E]">Verified</span>
              </div>
            );
          })}
        </div>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-[6%] right-[1%] w-[64%] border border-white/70 bg-white/95 p-4 shadow-[0_28px_80px_-28px_rgba(2,9,36,0.45)] backdrop-blur"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A94A6]">
            Share access
          </p>
          <span className="bg-[#E9FBF3] px-2 py-0.5 text-[9px] font-bold text-[#0F9F6E]">Active</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#EFF2F7] bg-[#FBFCFE]">
            <QrCodeIcon className="h-12 w-12 text-[#101217]" strokeWidth={1.1} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#101217]">Dr. Okafor can view</p>
            <p className="mt-0.5 text-[10px] text-[#8A94A6]">3 records, expires in 14:52</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5 bg-[#020924] px-3 py-1.5 text-[10px] font-semibold text-white">
          <LockClosedIcon className="h-3 w-3" strokeWidth={2} /> Time-limited access
        </div>
      </m.div>

      <div className="absolute -left-[1%] bottom-[32%] border border-white/70 bg-white/95 px-3 py-2 shadow-[0_18px_50px_-24px_rgba(2,9,36,0.4)] backdrop-blur">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-primary" strokeWidth={1.8} />
          <div>
            <p className="text-[10px] font-semibold text-[#101217]">Access expires</p>
            <p className="text-[9px] text-[#8A94A6]">You can revoke sooner</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  heroRef,
  onJoin,
  onSeeProduct,
}: {
  heroRef: RefObject<HTMLElement | null>;
  onJoin: () => void;
  onSeeProduct: () => void;
}) {
  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-white px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40 lg:px-10"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-18%] top-[-18%] h-[760px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(97,131,255,0.35),rgba(95,250,176,0.18),transparent)] blur-3xl" />
        <div className="absolute left-[-10%] top-[40%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(185,198,255,0.28),transparent)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Health records for Africa
            </p>

            <h1 className="mt-6 text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[#101217] sm:text-5xl lg:text-[3.6rem] xl:text-[4.4rem]">
              Your health record should follow you.{' '}
              <span className="text-primary italic">Own it, share it, take access back.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-[#4B5563] sm:text-lg">
              Selorah is one encrypted record for your labs, scans, prescriptions, and visits. Share
              it with any clinic using a time-limited code, then revoke it when the visit is over.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton size="lg" onClick={onJoin}>
                Join the waitlist
              </CTAButton>
              <button
                type="button"
                onClick={onSeeProduct}
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-none border border-[#D5DCE8] bg-white px-5 py-3 text-base font-semibold text-[#101217] transition-colors hover:bg-[#F6F8FA]"
              >
                See how it works
                <ArrowRightIcon
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
            </div>

            <div className="mt-7">
              <WaitlistProof />
            </div>
          </div>

          <HeroShareCard />
        </div>

        <HeroProductVideo />
      </div>
    </section>
  );
}

function RecordVisual() {
  return (
    <div className="mx-auto w-full max-w-[360px] border border-[#EFF2F7] bg-white p-4 shadow-[0_18px_50px_-24px_rgba(2,9,36,0.25)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A94A6]">Your record</p>
        <span className="bg-[#E9FBF3] px-2 py-0.5 text-[9px] font-bold text-[#0F9F6E]">Private</span>
      </div>
      <div className="mt-4 space-y-2">
        {RECORD_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.title}
              className="flex items-center gap-3 border border-[#EFF2F7] bg-[#FBFCFE] px-3 py-2.5"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center ${row.tone}`}>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-[#101217]">{row.title}</p>
                <p className="truncate text-[9px] text-[#8A94A6]">{row.meta}</p>
              </div>
              <span className="shrink-0 text-[9px] font-semibold text-[#8A94A6]">{row.date}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border border-[#EFF2F7] bg-[#FBFCFE] px-3 py-2.5">
        <span className="text-[10px] font-semibold text-[#101217]">3 records ready to share</span>
        <QrCodeIcon className="h-4 w-4 text-primary" strokeWidth={1.8} />
      </div>
    </div>
  );
}

function ShareVisual() {
  return (
    <div className="mx-auto w-full max-w-[360px] border border-[#EFF2F7] bg-white p-5 text-center shadow-[0_18px_50px_-24px_rgba(2,9,36,0.25)]">
      <div className="mx-auto flex h-32 w-32 items-center justify-center border border-[#EFF2F7] bg-[#FBFCFE]">
        <QrCodeIcon className="h-24 w-24 text-[#101217]" strokeWidth={1.1} />
      </div>
      <p className="mt-4 text-sm font-semibold text-[#101217]">Share code SEL-8F2K</p>
      <p className="mt-1 text-xs text-[#8A94A6]">Expires in 14:52</p>
      <div className="mt-4 flex items-center justify-center gap-2 bg-[#020924] px-3 py-2 text-xs font-semibold text-white">
        <LockClosedIcon className="h-3.5 w-3.5" strokeWidth={2} /> Time-limited access
      </div>
    </div>
  );
}

function ControlVisual() {
  return (
    <div className="mx-auto w-full max-w-[360px] border border-[#EFF2F7] bg-white p-4 shadow-[0_18px_50px_-24px_rgba(2,9,36,0.25)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A94A6]">
          Access control
        </p>
        <span className="bg-[#FFF1F0] px-2 py-0.5 text-[9px] font-bold text-[#D92D20]">Revoked</span>
      </div>
      <div className="mt-4 space-y-2">
        {[
          { label: 'Lab results', on: true },
          { label: 'Scans', on: true },
          { label: 'Prescriptions', on: false },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border border-[#EFF2F7] bg-[#FBFCFE] px-3 py-2.5"
          >
            <span className="text-[11px] font-semibold text-[#101217]">{item.label}</span>
            <span className={`flex h-5 w-9 items-center p-0.5 ${item.on ? 'bg-primary' : 'bg-[#E5E7EB]'}`}>
              <span className={`block h-4 w-4 bg-white ${item.on ? 'ml-auto' : ''}`} />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 border border-[#FFD5D2] bg-[#FFF8F7] px-3 py-2 text-xs font-semibold text-[#D92D20]">
        <LockClosedIcon className="h-3.5 w-3.5" strokeWidth={2} /> Access revoked
      </div>
    </div>
  );
}

function RolesVisual() {
  return (
    <div className="grid w-full max-w-[440px] gap-2 sm:grid-cols-3">
      {ROLE_CARDS.map((role) => {
        const Icon = role.icon;
        return (
          <div
            key={role.label}
            className="border border-[#EFF2F7] bg-white p-4 text-center shadow-[0_12px_30px_-22px_rgba(2,9,36,0.3)]"
          >
            <span className="mx-auto flex h-10 w-10 items-center justify-center bg-[#EEF2FF] text-primary">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="mt-2 text-xs font-semibold text-[#101217]">{role.label}</p>
            <p className="mt-1 text-[10px] text-[#8A94A6]">{role.note}</p>
          </div>
        );
      })}
    </div>
  );
}

function BentoCard({
  title,
  body,
  visual,
  href,
  delay,
}: {
  title: string;
  body: string;
  visual: ReactNode;
  href: string;
  delay: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <m.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="group flex h-full flex-col border border-[#E5E7EB] bg-[#F6F9FC] p-6 transition-colors hover:border-[#D5DCE8] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="max-w-md text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#101217]">
              {title}
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#4B5563]">{body}</p>
          </div>
          <Link
            to={href}
            aria-label={title}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#D5DCE8] bg-white text-[#4B5563] transition-colors group-hover:border-primary group-hover:text-primary"
          >
            <ArrowUpRightIcon className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <div className="mt-8 flex flex-1 items-center justify-center">{visual}</div>

        <Link
          to={href}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          Learn more <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </m.div>
    </Reveal>
  );
}

function BentoSection() {
  return (
    <section id="product" className="scroll-mt-28 bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-3xl">
            <SectionLabel>The product</SectionLabel>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#101217] sm:text-4xl lg:text-5xl">
              Flexible records for every kind of care.{' '}
              <span className="text-[#6B7280]">
                Keep your history, share it on your terms, and stay in control at every step.
              </span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <BentoCard
            title="Own your full history"
            body="Labs, scans, prescriptions, and visit notes in one private place on your phone."
            visual={<RecordVisual />}
            href="/blog"
            delay={0}
          />
          <BentoCard
            title="Share in seconds"
            body="Create a time-limited code a clinician can open in any browser, without a new portal."
            visual={<ShareVisual />}
            href="/blog"
            delay={60}
          />
          <BentoCard
            title="Take access back"
            body="Every share expires. Revoke it sooner and keep the audit trail, so you always know who saw what."
            visual={<ControlVisual />}
            href="/blog"
            delay={0}
          />
          <BentoCard
            title="One record for every role"
            body="Patients, doctors, and hospitals work from the same source of truth, with consent at the centre."
            visual={<RolesVisual />}
            href="/blog"
            delay={60}
          />
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="marketing-dark relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(97,131,255,0.25),transparent_55%)]"
      />
      <div className="relative mx-auto max-w-5xl text-center">
        <Reveal>
          <h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-[var(--md-fg)] sm:text-5xl">
            The backbone of your care.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--md-muted)]">
            One record that works for every visit, every clinic, and every role.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-px border border-[var(--md-border)] bg-[var(--md-border)] sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-[var(--md-bg)] px-4 py-8 sm:px-6 sm:py-10">
              <p className="text-4xl font-semibold tracking-[-0.04em] text-[var(--md-accent)] sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--md-subtle)] sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SegmentsSection({ onJoin }: { onJoin: (role: WaitlistRole, source: string) => void }) {
  return (
    <section className="bg-white">
      <div
        aria-hidden
        className="relative h-36 overflow-hidden bg-[linear-gradient(110deg,#6183FF_0%,#8FA8FF_35%,#5FFAB0_70%,#B9C6FF_100%)] sm:h-44"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.2),transparent_60%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <Reveal>
          <h2 className="max-w-4xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#101217] sm:text-4xl lg:text-5xl">
            Built for every side of care.{' '}
            <span className="text-[#6B7280]">
              One record that works for patients, clinicians, and hospitals.
            </span>
          </h2>
        </Reveal>
      </div>

      <div className="mx-auto max-w-6xl border-t border-[#E5E7EB]">
        {SEGMENTS.map((segment, index) => (
          <div
            key={segment.eyebrow}
            className="grid gap-8 border-b border-[#E5E7EB] px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10"
          >
            <Reveal>
              <div>
                <p className="text-sm font-medium text-primary">{segment.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#101217] sm:text-3xl">
                  {segment.title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-[#4B5563]">
                  {segment.body}
                </p>
                <CTAButton
                  className="mt-6"
                  onClick={() => onJoin(segment.role, `segment-${index}`)}
                >
                  {segment.cta}
                </CTAButton>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="flex h-full flex-col justify-between gap-6 border-t border-[#E5E7EB] pt-6 lg:border-t-0 lg:pt-0">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#020924] text-sm font-bold text-white">
                    {segment.initials}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#101217]">{segment.storyTitle}</p>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-[#4B5563]">
                      {segment.story}
                    </p>
                  </div>
                </div>
                <Link
                  to="/blog"
                  className="inline-flex min-h-[44px] w-fit items-center gap-2 border border-[#D5DCE8] bg-white px-4 text-sm font-semibold text-[#101217] transition-colors hover:bg-[#F6F8FA]"
                >
                  Read the story <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccessLogCard() {
  return (
    <div className="relative h-full overflow-hidden border border-[var(--md-border)] bg-[var(--md-card)] p-5 sm:p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(120deg,rgba(97,131,255,0.18),transparent_40%,rgba(95,250,176,0.12))]"
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--md-subtle)]">
            Access log
          </p>
          <span className="flex items-center gap-1.5 bg-[var(--md-accent-soft)] px-2 py-1 text-[10px] font-bold text-[var(--md-accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--md-accent)]" /> Live
          </span>
        </div>

        <div className="mt-5 space-y-2">
          {ACCESS_LOG.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-3 border border-[var(--md-border)] bg-[var(--md-bg)] px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--md-border)] bg-[var(--md-card)] text-[var(--md-accent)]">
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[var(--md-fg)]">{item.title}</p>
                  <p className="truncate text-[10px] text-[var(--md-subtle)]">{item.meta}</p>
                </div>
                <span className="shrink-0 text-[10px] text-[var(--md-subtle)]">{item.time}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3 border border-[var(--md-border)] bg-[var(--md-bg)] p-3">
          <ShieldCheckIcon className="h-5 w-5 text-[var(--md-accent)]" strokeWidth={1.8} />
          <div>
            <p className="text-xs font-semibold text-[var(--md-fg)]">
              Encrypted before it is saved
            </p>
            <p className="text-[10px] text-[var(--md-subtle)]">Only you hold the key</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <section
      id="security"
      className="marketing-dark relative scroll-mt-28 overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(97,131,255,0.22),transparent_45%),radial-gradient(circle_at_85%_100%,rgba(95,250,176,0.14),transparent_45%)]"
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[var(--md-accent)]">Security and control</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--md-fg)] sm:text-4xl lg:text-5xl">
              Private by design. Reliable at every step.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--md-muted)]">
              Your records are encrypted in transit and at rest. Every share is time-limited, single
              purpose, and logged.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <AccessLogCard />
          </Reveal>
          <Reveal delay={80}>
            <div className="grid grid-cols-2 gap-px border border-[var(--md-border)] bg-[var(--md-border)]">
              {SECURITY_STATS.map((stat) => (
                <div key={stat.label} className="bg-[var(--md-bg)] p-5 sm:p-6">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--md-accent)] sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--md-subtle)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {SHARE_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <Reveal key={card.title} delay={index * 60}>
                <m.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex h-full flex-col border border-[var(--md-border)] bg-[var(--md-card)] p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center border border-[var(--md-border)] bg-[var(--md-bg)] text-[var(--md-accent)]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-[var(--md-fg)]">{card.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--md-muted)]">
                    {card.body}
                  </p>
                  <Link
                    to={card.href}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--md-accent)]"
                  >
                    Read the guide <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                </m.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhatsHappeningSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: number) => {
    scrollerRef.current?.scrollBy({ left: direction * 380, behavior: 'smooth' });
  };

  return (
    <section className="bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6">
          <Reveal>
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#101217] sm:text-4xl">
                What's happening
              </h2>
              <p className="mt-2 text-base text-[#6B7280]">See the latest from Selorah.</p>
            </div>
          </Reveal>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous stories"
              className="flex h-10 w-10 items-center justify-center border border-[#E5E7EB] bg-white text-[#4B5563] transition-colors hover:bg-[#F6F8FA]"
            >
              <ArrowLeftIcon className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next stories"
              className="flex h-10 w-10 items-center justify-center border border-[#E5E7EB] bg-white text-[#4B5563] transition-colors hover:bg-[#F6F8FA]"
            >
              <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex snap-x gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {HAPPENING.map((post) => {
            const Icon = post.icon;
            return (
              <Link
                key={post.title}
                to={post.href}
                className="group flex h-full w-[280px] shrink-0 snap-start flex-col sm:w-[calc((100%-2rem)/3)]"
              >
                <div className={`relative aspect-[4/3] overflow-hidden ${post.bg}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      className="h-16 w-16 text-white/85 transition-transform duration-300 group-hover:scale-105"
                      strokeWidth={1.1}
                    />
                  </div>
                  <span className="absolute left-4 top-4 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#101217]">
                    {post.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-snug tracking-[-0.02em] text-[#101217] group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{post.excerpt}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-primary">
                  Read more <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StandardSection() {
  return (
    <section className="bg-[#F6F9FC] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <Reveal>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden bg-[#020924] p-6 text-white">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(97,131,255,0.35),transparent_50%)]"
            />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5FFAB0]">
                  The Selorah standard
                </p>
                <p className="mt-8 text-2xl font-semibold leading-tight">
                  Health records should be owned by the people they describe.
                </p>
              </div>
              <img src="/blog-author-logo.webp" alt="" className="h-12 w-12" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div>
            <p className="text-sm font-medium text-primary">Why we built Selorah</p>
            <blockquote className="mt-4 max-w-2xl text-2xl font-medium leading-relaxed tracking-[-0.02em] text-[#101217] sm:text-3xl">
              &ldquo;No one should have to carry a folder of paper to prove their own medical
              history.&rdquo;
            </blockquote>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#4B5563]">
              Samuel is building Selorah Health so patients across Africa can own, carry, and share
              their health records on their own terms.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Read our story <ArrowRightIcon className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCtaSection({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="marketing-dark relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(97,131,255,0.25),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(95,250,176,0.12),transparent_45%)]"
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="text-sm font-medium text-[var(--md-accent)]">Waitlist</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[var(--md-fg)] sm:text-4xl lg:text-5xl">
          Ready to own your health record?
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--md-muted)]">
          Join the waitlist and be first in line when Selorah opens in your city. No spam, just the
          updates that matter.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <m.button
            type="button"
            onClick={onJoin}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="group inline-flex min-h-[48px] items-center justify-center gap-2 bg-[var(--md-fg)] px-5 py-3 text-base font-semibold text-[var(--md-bg)] transition-opacity hover:opacity-90"
          >
            Join the waitlist
            <ArrowRightIcon
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </m.button>
          <Link
            to="/contact"
            className="inline-flex min-h-[48px] items-center justify-center border border-[var(--md-border)] px-5 py-3 text-base font-semibold text-[var(--md-fg)] transition-colors hover:bg-[var(--md-card)]"
          >
            Talk to us
          </Link>
        </div>

        <div className="mt-6">
          <WaitlistProof tone="inherit" />
        </div>
      </div>
    </section>
  );
}

export default function LandingPageStripe() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<WaitlistRole>('patient');
  const [modalSource, setModalSource] = useState('hero');
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const footerSentinelRef = useRef<HTMLDivElement | null>(null);

  const openWaitlist = (role: WaitlistRole = 'patient', source = 'unknown') => {
    setModalRole(role);
    setModalSource(source);
    setIsModalOpen(true);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      const nearFooter =
        (footerSentinelRef.current?.getBoundingClientRect().top ?? 9999) < window.innerHeight + 80;
      setShowStickyCta(heroBottom < 0 && !nearFooter);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <MotionProvider>
      <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#101217] selection:bg-primary/30 selection:text-primary">
        <SEOTitle
          title="Health records for Africa | Selorah"
          description="Selorah is one encrypted health record for labs, scans, prescriptions, and visits. Share it with any clinic using a time-limited code and take access back."
        />

        <Header
          theme="light"
          basePath="/stripe"
          announcementTone="dark"
          announcement={
            showAnnouncement ? (
              <span className="relative flex w-full items-center justify-center gap-2 pr-6">
                <span>Selorah is opening city by city.</span>
                <button
                  type="button"
                  onClick={() => openWaitlist('patient', 'announcement')}
                  className="inline-flex items-center gap-1 font-medium text-[#8FA8FF] transition-colors hover:text-white"
                >
                  Join the waitlist
                  <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnouncement(false)}
                  aria-label="Dismiss announcement"
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
                >
                  <XMarkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </span>
            ) : undefined
          }
        />

        <main>
          <HeroSection
            heroRef={heroRef}
            onJoin={() => openWaitlist('patient', 'hero')}
            onSeeProduct={() => scrollToSection('product')}
          />
          <BentoSection />
          <StatsSection />
          <SegmentsSection onJoin={openWaitlist} />
          <SecuritySection />
          <WhatsHappeningSection />
          <StandardSection />
          <FinalCtaSection onJoin={() => openWaitlist('patient', 'final-cta')} />
        </main>

        <div ref={footerSentinelRef} aria-hidden className="h-px" />
        <Footer />

        {showStickyCta && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E7EBF3] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:hidden">
            <CTAButton
              className="w-full justify-center"
              onClick={() => openWaitlist('patient', 'sticky-mobile')}
            >
              Join the waitlist
            </CTAButton>
          </div>
        )}

        <WaitlistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialRole={modalRole}
          source={modalSource}
        />
      </div>
    </MotionProvider>
  );
}
