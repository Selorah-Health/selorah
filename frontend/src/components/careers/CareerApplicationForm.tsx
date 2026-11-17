import { useMemo, useRef, useState } from 'react';
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { CAREERS_EMAIL, type CareerRole } from '../../lib/careers';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const HEARD_FROM_OPTIONS = [
  'Selorah website',
  'LinkedIn',
  'X or Twitter',
  'Instagram',
  'A friend or colleague',
  'Job board',
  'Other',
];

type ApplicationForm = {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  startDate: string;
  heardFrom: string;
  note: string;
};

const EMPTY_FORM: ApplicationForm = {
  name: '',
  email: '',
  phone: '',
  location: '',
  links: '',
  startDate: '',
  heardFrom: 'Selorah website',
  note: '',
};

const fieldClass =
  'min-h-[48px] w-full rounded-2xl border border-gray-200 bg-[#FAFBFF] px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-primary focus:bg-white';

const labelClass =
  'mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-gray-400';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidResume(file: File) {
  const lower = file.name.toLowerCase();
  return RESUME_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export default function CareerApplicationForm({ role }: { role: CareerRole }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [resume, setResume] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof ApplicationForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const chooseResume = (file: File | null) => {
    if (!file) {
      setResume(null);
      return;
    }
    if (!isValidResume(file)) {
      toastError('Choose a PDF, DOC, or DOCX file.', 'Check the file type');
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      toastError('Choose a resume smaller than 5 MB.', 'File is too large');
      return;
    }
    setResume(file);
    setSent(false);
  };

  const applicationBody = useMemo(() => {
    return [
      `Role: ${role.title}`,
      `Team: ${role.team}`,
      '',
      'About me',
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim() || 'Not provided'}`,
      `Location: ${form.location.trim()}`,
      `Portfolio, LinkedIn, or GitHub: ${form.links.trim() || 'Not provided'}`,
      `Earliest start date: ${form.startDate.trim() || 'Flexible'}`,
      `Heard about Selorah through: ${form.heardFrom}`,
      '',
      'Why this role',
      form.note.trim(),
      '',
      `Resume: ${resume?.name ?? 'Attach resume before sending'}`,
      '',
      'Sent through the Selorah careers page.',
    ].join('\n');
  }, [form, resume, role]);

  const mailtoHref = useMemo(() => {
    const subject = `Application: ${role.title} (${form.name.trim() || 'Applicant'})`;
    return `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(applicationBody)}`;
  }, [applicationBody, form.name, role.title]);

  const validate = () => {
    if (form.name.trim().length < 2) {
      toastError('Enter your full name.', 'Check your name');
      return false;
    }
    if (!isValidEmail(form.email.trim())) {
      toastError('Enter an email address we can reply to.', 'Check your email');
      return false;
    }
    if (form.location.trim().length < 2) {
      toastError('Tell us where you are based.', 'Check your location');
      return false;
    }
    if (form.note.trim().length < 30) {
      toastError('Write at least a short paragraph about why this role interests you.', 'Add a note');
      return false;
    }
    if (!resume) {
      toastError('Choose your resume so you remember to attach it.', 'Add your resume');
      return false;
    }
    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSent(false);
    if (!validate()) return;

    window.location.href = mailtoHref;
    setSent(true);
    success('Your email app is opening with the application ready to send.', 'Almost done');
  };

  const copyApplication = async () => {
    try {
      await navigator.clipboard.writeText(applicationBody);
      success('Application copied. Paste it into an email to Selorah.', 'Copied');
    } catch {
      toastError(`Copy your details into an email to ${CAREERS_EMAIL}.`, 'Copy failed');
    }
  };

  return (
    <section
      id="application"
      className="mt-16 scroll-mt-24 rounded-[32px] border border-gray-100 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] sm:p-8 lg:p-10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DocumentTextIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
              Application
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#101217] sm:text-3xl">
              Apply for {role.title}
            </h2>
            <p className="mt-2 max-w-2xl text-xs font-medium leading-relaxed text-gray-500">
              This opens your email app with your answers filled in. Attach your resume before you
              press send. Every application is read by a person.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 border border-primary/15 bg-primary/5 px-3 py-2 text-[10px] font-bold text-primary">
          About 15 minutes. No account needed.
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
            About you
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <input
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                autoComplete="name"
                placeholder="Ada Okafor"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Phone number</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                autoComplete="tel"
                placeholder="+234 800 000 0000"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Where are you based?</span>
              <input
                value={form.location}
                onChange={(event) => update('location', event.target.value)}
                autoComplete="address-level2"
                placeholder="Lagos, Nigeria"
                className={fieldClass}
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
            Your work
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Portfolio, LinkedIn, or GitHub</span>
              <input
                type="url"
                value={form.links}
                onChange={(event) => update('links', event.target.value)}
                placeholder="https://"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Earliest start date</span>
              <input
                value={form.startDate}
                onChange={(event) => update('startDate', event.target.value)}
                placeholder="e.g. 2 weeks from offer"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>How did you hear about us?</span>
              <select
                value={form.heardFrom}
                onChange={(event) => update('heardFrom', event.target.value)}
                className={fieldClass}
              >
                {HEARD_FROM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Why this role?</span>
              <textarea
                value={form.note}
                onChange={(event) => update('note', event.target.value)}
                rows={5}
                placeholder="Tell us what you have built, what you want to learn, and why this problem matters to you."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-[#FAFBFF] px-4 py-3 text-sm font-medium leading-relaxed text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-primary focus:bg-white"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
            Resume
          </p>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              chooseResume(event.dataTransfer.files?.[0] ?? null);
            }}
            className={`mt-3 flex flex-col items-center justify-center border border-dashed px-5 py-8 text-center transition-colors ${
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-[#FAFBFF] hover:border-primary/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => chooseResume(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
            {resume ? (
              <>
                <CheckCircleIcon className="h-7 w-7 text-primary" />
                <p className="mt-3 text-sm font-bold text-[#101217]">{resume.name}</p>
                <p className="mt-1 text-[10px] font-semibold text-gray-400">
                  {(resume.size / 1024 / 1024).toFixed(2)} MB selected
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[38px] items-center justify-center rounded-none border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.1em] text-[#101217] transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    Replace file
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResume(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-none px-2 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 transition-colors hover:text-red-500"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-7 w-7 text-primary" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-sm font-bold text-primary underline-offset-4 hover:underline"
                >
                  Choose a file
                </button>
                <p className="mt-1 text-xs font-medium text-gray-500">or drop it here</p>
                <p className="mt-3 text-[10px] font-semibold text-gray-400">
                  PDF or Word, up to 5 MB
                </p>
              </>
            )}
          </div>
          <p className="mt-2 text-[10px] font-medium leading-relaxed text-gray-400">
            Your email app cannot attach the file for you. After it opens, attach your resume before
            sending.
          </p>
        </div>

        {sent && (
          <div
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3"
          >
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <p className="text-[11px] font-semibold leading-relaxed text-green-700">
              Your email app should be open. Attach your resume, then send. If it did not open, use
              Copy application and email{' '}
              <a href={`mailto:${CAREERS_EMAIL}`} className="underline">
                {CAREERS_EMAIL}
              </a>
              .
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-none bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            Open email with application
          </button>
          <button
            type="button"
            onClick={copyApplication}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-none border border-gray-200 bg-white px-5 text-sm font-bold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            Copy application
          </button>
        </div>

        <p className="text-[10px] font-medium leading-relaxed text-gray-400">
          We use your application only to assess this role. Do not include medical records or other
          sensitive personal data.
        </p>
      </form>
    </section>
  );
}
