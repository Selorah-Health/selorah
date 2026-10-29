import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BeakerIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../contexts/ToastContext';
import { createClient } from '../lib/supabase/client';
import { readLocalSession } from '../lib/auth/session';
import {
  DEFAULT_PRO_PLAN,
  PRO_PLANS,
  PRO_PLAN_LABEL,
  activatePro,
  readProState,
  withTimeout,
  type ProPlanId,
  type ProState,
} from '../lib/pro';
import { isPaystackConfigured, loadPaystack, startPaystackCheckout } from '../lib/paystack';

type CheckoutStatus = 'idle' | 'opening' | 'verifying' | 'done';

const FEATURE_DETAILS = [
  {
    icon: UserGroupIcon,
    title: 'Up to 10 emergency contacts',
    body: 'Keep every trusted person in one place, with their relationship and phone number ready for an emergency.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Priority record verification',
    body: 'Your uploaded records move to the front of the verification queue, so clinicians see confirmed documents sooner.',
  },
  {
    icon: SparklesIcon,
    title: 'Ad free and premium themes',
    body: 'A calm, uninterrupted interface with the full premium theme set included.',
  },
  {
    icon: BeakerIcon,
    title: 'Early research rewards',
    body: 'See new research opportunities and reward pools before they open to every member.',
  },
  {
    icon: UsersIcon,
    title: 'Secure family sharing',
    body: 'Invite family members into a private vault with access you control and can withdraw.',
  },
  {
    icon: HeartIcon,
    title: 'Exclusive wellness insights',
    body: 'Monthly guidance drawn from the health data you already track, written for your record.',
  },
];

const COMPARISON = [
  { label: 'Emergency contacts', basic: 'Standard', pro: 'Up to 10' },
  { label: 'Record verification', basic: 'Standard queue', pro: 'Priority queue' },
  { label: 'Family sharing', basic: 'Not included', pro: 'Included' },
  { label: 'Research rewards', basic: 'Standard access', pro: 'Early access' },
  { label: 'Interface', basic: 'Basic themes', pro: 'Ad free, premium themes' },
  { label: 'Wellness insights', basic: 'Occasional', pro: 'Exclusive monthly' },
];

const FAQ = [
  {
    question: 'Is this a subscription?',
    answer:
      'No. Pro is sold as a pass, not an auto renewing subscription. A monthly pass covers 30 days and an annual pass covers 12 months. You choose when to renew.',
  },
  {
    question: 'Which plan is better value?',
    answer:
      'The annual plan is ₦20,000, which works out to about ₦1,667 a month. It saves ₦4,000 compared with twelve monthly payments.',
  },
  {
    question: 'How is my payment handled?',
    answer:
      'Paystack processes the card, bank transfer, or USSD payment. Selorah never sees or stores your card details.',
  },
  {
    question: 'Can I switch plans?',
    answer:
      'Yes. You can buy either plan at any time. Any time you have already paid for is added to your current end date, so you never lose days.',
  },
  {
    question: 'What happens when Pro ends?',
    answer:
      'Your records stay safe and accessible on the free plan. Pro features pause until you choose to renew.',
  },
];

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProUpgrade() {
  const navigate = useNavigate();
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();

  const [pro, setPro] = useState<ProState>(() => readProState());
  const [planId, setPlanId] = useState<ProPlanId>(() => readProState().planId || DEFAULT_PRO_PLAN);
  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);
  const [email, setEmail] = useState(() => readLocalSession()?.email || '');
  const [paystackReady, setPaystackReady] = useState(false);

  const plan = PRO_PLANS[planId];
  const priceLabel = `₦${plan.priceNaira.toLocaleString('en-NG')}`;
  const monthlyEquivalent = Math.round(plan.priceNaira / plan.months);
  const isActive = pro.active;
  const expiresOn = formatDate(pro.expiresAt);
  const busy = status === 'opening' || status === 'verifying';
  const configured = isPaystackConfigured();

  useEffect(() => {
    let active = true;

    const syncPro = () => setPro(readProState());
    window.addEventListener('selorah:pro-updated', syncPro);
    window.addEventListener('storage', syncPro);

    // Warm the Paystack script while the patient reads the page, so the click
    // opens checkout immediately instead of waiting on the network.
    if (configured) {
      loadPaystack()
        .then(() => {
          if (active) setPaystackReady(true);
        })
        .catch(() => {
          if (active) setPaystackReady(false);
        });
    }

    const loadEmail = async () => {
      if (readLocalSession()?.email) return;
      try {
        const { data } = await withTimeout(supabase.auth.getUser(), 8000, 'Session lookup timed out.');
        if (active && data.user?.email) setEmail(data.user.email);
      } catch {
        // The local session or the form below will cover this.
      }
    };

    void loadEmail();

    return () => {
      active = false;
      window.removeEventListener('selorah:pro-updated', syncPro);
      window.removeEventListener('storage', syncPro);
    };
  }, [configured, supabase]);

  const resolveEmail = async () => {
    if (email.trim()) return email.trim();
    const local = readLocalSession()?.email;
    if (local) return local;
    try {
      const { data } = await withTimeout(supabase.auth.getUser(), 8000, 'Session lookup timed out.');
      return data.user?.email || '';
    } catch {
      return '';
    }
  };

  const handleUpgrade = async () => {
    if (busy) return;
    setErrorMsg(null);
    setPendingMsg(null);

    if (!configured) {
      setErrorMsg(
        'Card payments are not available right now. Please try again later or contact support.'
      );
      return;
    }

    const address = await resolveEmail();
    if (!address) {
      setErrorMsg('Add an email address to your account before upgrading.');
      return;
    }

    setStatus('opening');
    let released = false;
    const release = window.setTimeout(() => {
      if (released) return;
      setStatus((current) => (current === 'opening' ? 'idle' : current));
    }, 20000);

    try {
      await startPaystackCheckout({
        email: address,
        amountKobo: plan.priceKobo,
        metadata: {
          source: 'upgrade-page',
          plan_id: planId,
          user_id: readLocalSession()?.id,
        },
        onSuccess: async (response) => {
          setStatus('verifying');
          setErrorMsg(null);
          try {
            const result = await activatePro(response.reference, {
              planId,
              amountKobo: plan.priceKobo,
              supabase,
            });
            released = true;
            window.clearTimeout(release);
            setPro(result.state);
            setStatus('done');
            if (result.pendingMessage) {
              setPendingMsg(result.pendingMessage);
            }
            success('Selorah Pro is active on your account.', 'Welcome to Pro');
          } catch (error) {
            released = true;
            window.clearTimeout(release);
            setStatus('idle');
            const message =
              error instanceof Error
                ? error.message
                : 'Payment succeeded but we could not activate Pro. Contact support with your receipt.';
            setErrorMsg(message);
            toastError(message, 'Activation failed');
          }
        },
        onCancel: () => {
          released = true;
          window.clearTimeout(release);
          setStatus('idle');
          info('Payment cancelled. You have not been charged.');
        },
      });

      // The Paystack window is open. Clear the opening state so the page is
      // readable behind it while the payment is completed.
      setStatus((current) => (current === 'opening' ? 'idle' : current));
    } catch (error) {
      released = true;
      window.clearTimeout(release);
      setStatus('idle');
      const message = error instanceof Error ? error.message : 'Could not start the payment.';
      setErrorMsg(message);
      toastError(message, 'Payment unavailable');
    }
  };

  const buttonLabel =
    status === 'opening'
      ? 'Opening secure checkout...'
      : status === 'verifying'
        ? 'Confirming payment...'
        : isActive
          ? `Renew for ${priceLabel}`
          : `Upgrade for ${priceLabel}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10 font-sora">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/billing')}
          className="group flex items-center gap-2 text-xs font-bold text-gray-400 transition-colors hover:text-[#6183FF]"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to billing
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-[#6183FF]" />
          Secure checkout by Paystack
        </span>
      </div>

      <section className="relative overflow-hidden rounded-[32px] bg-[#020924] px-5 py-8 text-white shadow-2xl shadow-blue-900/10 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#6183FF]/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#14F1D9]/10 blur-3xl"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#8FA8FF]">
              <StarIcon className="h-3.5 w-3.5 text-[#5FFAB0]" />
              Selorah Pro
            </span>

            <h1 className="mt-5 text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-[44px]">
              Your health record,
              <br />
              fully unlocked.
            </h1>

            <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/55">
              Start from ₦2,000 a month, or choose the annual plan at ₦20,000 and get two months
              free. Nothing renews automatically, and your data stays yours the entire time.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ClockIcon, label: plan.durationLabel, detail: 'Full access' },
                { icon: LockClosedIcon, label: 'No auto renew', detail: 'You choose' },
                { icon: ShieldCheckIcon, label: 'Paystack', detail: 'Protected payment' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3"
                >
                  <item.icon className="h-4 w-4 text-[#8FA8FF]" />
                  <p className="mt-2 text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] font-semibold text-white/40">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white p-5 text-[#101217] shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6183FF]">
                  {isActive ? 'Your plan' : planId === 'annual' ? 'Best value' : 'Flexible plan'}
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight">{PRO_PLAN_LABEL}</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                  isActive
                    ? 'bg-green-50 text-green-600'
                    : 'bg-[#EEF2FF] text-[#6183FF]'
                }`}
              >
                {isActive ? 'Active' : planId === 'annual' ? 'Save ₦4,000' : 'Monthly'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(Object.keys(PRO_PLANS) as ProPlanId[]).map((id) => {
                const option = PRO_PLANS[id];
                const selected = planId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPlanId(id)}
                    disabled={busy}
                    aria-pressed={selected}
                    className={`rounded-2xl border px-3 py-3 text-left transition-colors disabled:opacity-60 ${
                      selected
                        ? 'border-[#6183FF] bg-[#EEF2FF] ring-1 ring-[#6183FF]/30'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-black uppercase tracking-[0.1em] ${
                          selected ? 'text-[#6183FF]' : 'text-gray-400'
                        }`}
                      >
                        {option.label}
                      </span>
                      {option.badge && (
                        <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[8px] font-black text-green-600">
                          {option.badge}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-base font-black tracking-tight text-[#101217]">
                      ₦{option.priceNaira.toLocaleString('en-NG')}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {option.billingLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {isActive ? (
              <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-bold text-green-700">
                  <CheckBadgeIcon className="h-4 w-4" />
                  {expiresOn ? `Active until ${expiresOn}` : 'All Pro features are unlocked'}
                </p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-green-600/80">
                  Renewing adds another {plan.durationLabel} from your current end date.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight">{priceLabel}</span>
                  <span className="pb-1.5 text-xs font-semibold text-gray-400">
                    {plan.billingLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                  {planId === 'annual'
                    ? `About ₦${monthlyEquivalent.toLocaleString('en-NG')} a month, billed once a year.`
                    : 'A 30 day pass. Renew whenever you are ready.'}
                </p>
              </>
            )}

            <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-5">
              {FEATURE_DETAILS.slice(0, 4).map((feature) => (
                <div key={feature.title} className="flex items-start gap-2.5">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]" />
                  <span className="text-xs font-semibold leading-relaxed text-gray-600">
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-[11px] font-semibold leading-relaxed text-red-600"
              >
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {errorMsg}
              </p>
            )}

            {pendingMsg && (
              <p className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-[11px] font-semibold leading-relaxed text-amber-700">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {pendingMsg}
              </p>
            )}

            {status === 'done' ? (
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/billing')}
                  className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#101217] px-5 text-sm font-bold text-white transition-colors hover:bg-black"
                >
                  View billing
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="min-h-[44px] w-full rounded-2xl text-xs font-bold text-gray-400 transition-colors hover:text-gray-600"
                >
                  Back to dashboard
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={busy}
                  className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-all hover:bg-[#4D6ED6] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {buttonLabel}
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-4 w-4" />
                      {buttonLabel}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  disabled={busy}
                  className="mt-1.5 min-h-[42px] w-full rounded-2xl text-xs font-bold text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                >
                  Maybe later
                </button>
              </>
            )}

            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold leading-relaxed text-gray-400">
              <LockClosedIcon className="h-3 w-3 shrink-0" />
              {configured
                ? paystackReady
                  ? 'Checkout is ready. Your card details never touch Selorah.'
                  : 'Paystack loads when you continue. Your card details never touch Selorah.'
                : 'Card payments are being configured. Check back shortly.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
            What Pro unlocks
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#101217]">
            More protection, without more work.
          </h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
            Pro adds the safeguards that matter around an emergency, a family, and the records you
            rely on.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_DETAILS.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-[#F8F9FE] p-4 transition-colors hover:border-[#6183FF]/30 hover:bg-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6183FF] shadow-sm">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold leading-snug text-[#101217]">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-gray-500">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black tracking-tight text-[#101217]">Basic and Pro</h2>
          <p className="mt-1 text-xs font-medium text-gray-400">
            Your records stay free. Pro adds the extras around them.
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] bg-[#F8F9FE] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
              <span>Feature</span>
              <span className="text-center">Basic</span>
              <span className="text-center text-[#6183FF]">Pro</span>
            </div>
            {COMPARISON.map((row, index) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.2fr_0.9fr_0.9fr] items-center px-4 py-3 text-[11px] ${
                  index % 2 === 0 ? 'bg-white' : 'bg-[#FCFDFF]'
                }`}
              >
                <span className="font-semibold text-[#101217]">{row.label}</span>
                <span className="text-center font-medium text-gray-400">{row.basic}</span>
                <span className="text-center font-bold text-[#6183FF]">{row.pro}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black tracking-tight text-[#101217]">Common questions</h2>
          <p className="mt-1 text-xs font-medium text-gray-400">
            Everything about the monthly and annual plans.
          </p>

          <div className="mt-4 divide-y divide-gray-100">
            {FAQ.map((item) => (
              <details key={item.question} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-[#101217] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 pr-6 text-[11px] font-medium leading-relaxed text-gray-500">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
          <ShieldCheckIcon className="h-4 w-4 text-green-500" />
          Choose monthly or annual. No auto renew.
        </p>
        <p className="text-[10px] font-medium text-gray-400">
          Need help with a payment? Contact support with your receipt reference.
        </p>
      </div>
    </div>
  );
}
