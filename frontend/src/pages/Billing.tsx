import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import {
  PRO_FEATURES,
  PRO_PRICE_NAIRA,
  PRO_PLAN_LABEL,
  readPayments,
  readProState,
  type PaymentRecord,
  type ProState,
} from '../lib/pro';

function formatDate(value?: string) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Billing() {
  const navigate = useNavigate();
  const [pro, setPro] = useState<ProState>(() => readProState());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => readPayments());

  const refresh = useCallback(() => {
    setPro(readProState());
    setPayments(readPayments());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('selorah:pro-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('selorah:pro-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const isPro = pro.active;

  return (
    <div className="space-y-6 font-sora">
      <button
        type="button"
        onClick={() => navigate('/dashboard/profile')}
        className="group flex items-center gap-2 text-xs font-bold text-gray-400 transition-colors hover:text-[#6183FF]"
      >
        <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to profile
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Billing and subscription
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Manage your Selorah plan, payment receipts, and renewal date.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-green-600">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          Secured by Paystack
        </span>
      </div>

      <section className="relative overflow-hidden rounded-[28px] bg-[#020924] p-6 text-white shadow-xl sm:p-8">
        <div
          aria-hidden
          className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#6183FF]/30 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/70">
              <StarIcon className="h-3.5 w-3.5 text-[#5FFAB0]" />
              Current plan
            </span>
            <h3 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {isPro ? PRO_PLAN_LABEL : 'Selorah Basic'}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white/55">
              {isPro
                ? `Active until ${formatDate(pro.expiresAt)}. Your Pro features stay unlocked while the plan is active.`
                : 'Free forever for patients. Upgrade to unlock family sharing, priority verification, and more.'}
            </p>
            <p className="mt-4 text-sm font-bold text-white">
              {isPro ? `₦${PRO_PRICE_NAIRA.toLocaleString('en-NG')} per year` : '₦0 today'}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/dashboard/upgrade')}
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-6 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-colors hover:bg-[#4D6ED6]"
            >
              {isPro ? (
                <>
                  <ArrowPathIcon className="h-4 w-4" />
                  Renew Pro
                </>
              ) : (
                <>
                  <StarIcon className="h-4 w-4" />
                  Upgrade to Pro
                </>
              )}
            </button>
            <p className="text-center text-[10px] font-medium text-white/35">
              One payment of ₦{PRO_PRICE_NAIRA.toLocaleString('en-NG')} for 12 months
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
            Payment method
          </h3>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F8F9FE] p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#6183FF] shadow-sm">
              <CreditCardIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#101217]">Paystack checkout</p>
              <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                Cards, bank transfer, and USSD. No card details are stored by Selorah.
              </p>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
            <LockClosedIcon className="h-3 w-3" />
            Payment details are handled entirely by Paystack.
          </p>
        </div>

        <div className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
            Pro includes
          </h3>
          <div className="mt-4 grid gap-2">
            {PRO_FEATURES.slice(0, 4).map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6183FF]" />
                <span className="text-[11px] font-semibold leading-relaxed text-gray-600">
                  {feature}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/upgrade')}
            className="mt-4 text-[11px] font-bold text-[#6183FF] hover:underline"
          >
            See everything included
          </button>
        </div>
      </div>

      <section className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#101217]">Payment history</h3>
            <p className="text-[11px] font-medium text-gray-400">
              Receipts for Pro payments made on this device.
            </p>
          </div>
          <DocumentTextIcon className="h-5 w-5 text-gray-300" />
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-5 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#6183FF] shadow-sm">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-bold text-[#101217]">No payments yet</p>
            <p className="mx-auto mt-1 max-w-[260px] text-[11px] font-medium leading-relaxed text-gray-400">
              When you upgrade to Pro, your receipt reference and amount will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((payment) => (
              <div
                key={payment.reference}
                className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#101217]">{payment.plan}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                    {formatDate(payment.createdAt)} - {payment.reference}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-600">
                    ₦{(payment.amount / 100).toLocaleString('en-NG')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-green-600">
                    <CheckBadgeIcon className="h-3.5 w-3.5" />
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
        <p className="text-[11px] font-medium leading-relaxed text-gray-400">
          Selorah Pro is a one year plan, not an auto-renewing subscription. You will only be
          charged when you choose to renew. Need help with a payment? Contact support with your
          receipt reference.
        </p>
      </div>
    </div>
  );
}
