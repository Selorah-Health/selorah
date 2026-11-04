import { useMemo, useState } from 'react';
import {
  ArrowUpRightIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import StaticPage from '../components/StaticPage';
import { useToast } from '../contexts/ToastContext';

// Use the monitored support inbox for every channel. The topic in the subject
// keeps privacy and security requests easy to route.
const CONTACT_EMAIL = 'selorahealth@gmail.com';
const PRIVACY_EMAIL = CONTACT_EMAIL;
const SECURITY_EMAIL = CONTACT_EMAIL;
const WHATSAPP_URL = 'https://chat.whatsapp.com/JI2LK41IF8yHiJjEuWKk2M?mode=gi_t';

const TOPICS = [
  'General question',
  'Patient support',
  'Hospital or clinic',
  'Research partnership',
  'Insurance partnership',
  'Privacy or data request',
  'Security report',
  'Press or media',
];

export default function Contact() {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: TOPICS[0],
    message: '',
  });
  const [sent, setSent] = useState(false);

  const mailto = useMemo(() => {
    const subject = `[${form.topic}] Message from ${form.name.trim() || 'Selorah visitor'}`;
    const body = [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Topic: ${form.topic}`,
      '',
      form.message.trim(),
    ].join('\n');
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [form]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSent(false);

    if (form.name.trim().length < 2) {
      toastError('Enter your name so we know who we are replying to.', 'Check your name');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toastError('Enter an email address we can reply to.', 'Check your email');
      return;
    }
    if (form.message.trim().length < 12) {
      toastError('Add a little more detail so we can route your message.', 'Add a message');
      return;
    }

    window.location.href = mailto;
    setSent(true);
    success('Your email app is opening with the message ready to send.', 'Ready to send');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      success(`${CONTACT_EMAIL} is copied to your clipboard.`, 'Email copied');
    } catch {
      toastError(`Copy ${CONTACT_EMAIL} from the page.`, 'Copy failed');
    }
  };

  const copyMessage = async () => {
    const text = [
      `To: ${CONTACT_EMAIL}`,
      `Subject: [${form.topic}] Message from ${form.name.trim() || 'Selorah visitor'}`,
      '',
      `Name: ${form.name.trim() || 'Not provided'}`,
      `Email: ${form.email.trim() || 'Not provided'}`,
      `Topic: ${form.topic}`,
      '',
      form.message.trim() || 'No message yet.',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      success('Message copied. Paste it into any email app and send it to support.', 'Message copied');
    } catch {
      toastError('Copying failed. Select the message text and copy it manually.', 'Copy failed');
    }
  };

  return (
    <StaticPage
      title="Talk to a human who cares about your records."
      eyebrow="Contact"
      description="Questions about your vault, a hospital rollout, research, privacy, or a security report. Pick the path that fits and we will route it to the right person."
      heroTone="light"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
              <PaperAirplaneIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#101217]">Send a message</h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                This opens your email app with the details filled in. Nothing is sent until you
                press send there.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Your name
                </span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  autoComplete="name"
                  placeholder="Ada Okafor"
                  className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-[#FAFBFF] px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Email address
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-[#FAFBFF] px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                What is this about?
              </span>
              <select
                value={form.topic}
                onChange={(event) => setForm({ ...form, topic: event.target.value })}
                className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-[#FAFBFF] px-4 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-[#6183FF] focus:bg-white"
              >
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                Message
              </span>
              <textarea
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                rows={5}
                placeholder="Tell us what you need help with. Do not include full medical records in this form."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-[#FAFBFF] px-4 py-3 text-sm font-medium leading-relaxed text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white"
              />
            </label>

            {sent && (
              <div
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3"
              >
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <p className="text-[11px] font-semibold leading-relaxed text-green-700">
                  Your email app should be open. If it did not open, use Copy message above or write
                  to{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Open email and send
              </button>
              <button
                type="button"
                onClick={copyMessage}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-sm font-bold text-gray-600 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
                Copy message
              </button>
            </div>

            <p className="text-[10px] font-medium leading-relaxed text-gray-400">
              For urgent medical emergencies, contact your local emergency service. Do not wait for
              an email reply.
            </p>
          </form>
        </section>

        <div className="space-y-4">
          <section className="rounded-[28px] border border-gray-100 bg-[#101217] p-6 text-white">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8FA8FF]">
              Direct email
            </p>
            <h3 className="mt-2 text-lg font-black tracking-tight">Reach the right team</h3>
            <div className="mt-5 space-y-2.5">
              {[
                {
                  label: 'General and patient support',
                  email: CONTACT_EMAIL,
                  subject: 'General question',
                  icon: EnvelopeIcon,
                },
                {
                  label: 'Privacy and data requests',
                  email: PRIVACY_EMAIL,
                  subject: 'Privacy or data request',
                  icon: ShieldCheckIcon,
                },
                {
                  label: 'Security reports',
                  email: SECURITY_EMAIL,
                  subject: 'Security report',
                  icon: ShieldCheckIcon,
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={`mailto:${item.email}?subject=${encodeURIComponent(item.subject)}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 transition-colors hover:border-[#6183FF]/40 hover:bg-[#6183FF]/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6183FF]/15 text-[#8FA8FF]">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold text-white/45">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-bold text-white">
                      {item.email}
                    </span>
                  </span>
                  <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0 text-white/35" />
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={copyEmail}
              className="mt-4 min-h-[40px] w-full rounded-full border border-white/15 px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-white/30 hover:text-white"
            >
              Copy general email
            </button>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-[#6183FF]/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAFBF2] text-[#15955C]">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-[#101217]">Join the community</span>
                <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-gray-500">
                  Ask questions and follow product updates in the Selorah WhatsApp group.
                </span>
              </span>
            </a>

            <div className="flex items-start gap-3 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                <MapPinIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#101217]">Lagos, Nigeria</p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-500">
                  Remote first, with team members across Nigeria. Meetings are scheduled by email.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                <ClockIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#101217]">Monday to Friday</p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-500">
                  9:00am to 5:00pm West Africa Time. We reply within two business days.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </StaticPage>
  );
}
