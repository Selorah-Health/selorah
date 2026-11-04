import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { createClient } from '../lib/supabase/client';
import {
  DEFAULT_PRO_PLAN,
  PRO_FEATURES,
  PRO_PLANS,
  PRO_PLAN_LABEL,
  readPayments,
  readProState,
  refreshProFromProfile,
  verifyProReference,
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
  const supabase = useMemo(() => createClient(), []);
  const [pro, setPro] = useState<ProState>(() => readProState());
  const [localPayments, setLocalPayments] = useState<PaymentRecord[]>(() => readPayments());
  const [dbPayments, setDbPayments] = useState<PaymentRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setPro(readProState());
    setLocalPayments(readPayments());
  }, []);

  const loadDbPayments = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('payments')
        .select('reference, amount, currency, status, plan, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data) return;

      setDbPayments(
        data.map((row) => ({
          reference: String(row.reference || ''),
          amount: Number(row.amount || 0),
          currency: String(row.currency || 'NGN'),
          status:
            row.status === 'paid'
              ? 'paid'
              : row.status === 'pending'
                ? 'pending'
                : 'failed',
          plan: String(row.plan || PRO_PLAN_LABEL),
          createdAt: String(row.created_at || new Date().toISOString()),
        }))
      );
    } catch {
      // The local receipt list still works when the database is offline.
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
    void loadDbPayments();

    const syncServer = async () => {
      const serverState = await refreshProFromProfile(supabase);
      if (serverState?.active) setPro(serverState);
    };
    void syncServer();
    window.addEventListener('focus', syncServer);

    window.addEventListener('selorah:pro-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', syncServer);
      window.removeEventListener('selorah:pro-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh, loadDbPayments, supabase]);

  const payments = useMemo(() => {
    const merged = [...dbPayments];
    for (const payment of localPayments) {
      if (!merged.some((item) => item.reference === payment.reference)) {
        merged.push(payment);
      }
    }
    return merged
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [dbPayments, localPayments]);

  const restorePurchase = async () => {
    setSyncing(true);
    setRestoreMessage(null);

    try {
      const serverState = await refreshProFromProfile(supabase);
      if (serverState?.active) {
        setPro(serverState);
        setRestoreMessage('Selorah Pro is active on this account.');
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        setRestoreMessage('Sign in again to restore a purchase.');
        return;
      }

      const { data: rows } = await supabase
        .from('payments')
        .select('reference, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const candidate =
        (rows || []).find((row) => row.status === 'paid' || row.status === 'pending') ||
        (rows || [])[0];

      if (!candidate?.reference) {
        setRestoreMessage(
          'No payment was found on this account. If you paid with a different email, verify the Paystack reference on the upgrade page.'
        );
        return;
      }

      const result = await verifyProReference(String(candidate.reference), { supabase });
      if (result.verified) {
        setPro(result.state);
        setRestoreMessage('Payment verified. Selorah Pro is active.');
        void loadDbPayments();
      } else if (result.pendingMessage) {
        setRestoreMessage(result.pendingMessage);
      } else {
        setRestoreMessage('The latest payment is not confirmed yet. Try again in a moment.');
      }
    } catch (error) {
      setRestoreMessage(
        error instanceof Error ? error.message : 'Could not restore that purchase.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const isPro = pro.active;
  const activePlan = PRO_PLANS[pro.planId || DEFAULT_PRO_PLAN];

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
              {isPro
                ? `₦${activePlan.priceNaira.toLocaleString('en-NG')} ${activePlan.billingLabel}`
                : '₦0 today'}
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
            <button
              type="button"
              onClick={restorePurchase}
              disabled={syncing}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 text-xs font-bold text-white/80 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Checking...' : 'Restore a purchase'}
            </button>
            <p className="text-center text-[10px] font-medium text-white/35">
              From ₦2,000 per month or ₦20,000 per year
            </p>
          </div>
        </div>

        {restoreMessage && (
          <p className="relative mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold leading-relaxed text-white/70">
            {restoreMessage}
          </p>
        )}
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
              Payments linked to this account.
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
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                      payment.status === 'paid'
                        ? 'bg-green-50 text-green-600'
                        : payment.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {payment.status === 'paid' ? (
                      <CheckBadgeIcon className="h-3.5 w-3.5" />
                    ) : payment.status === 'pending' ? (
                      <ArrowPathIcon className="h-3.5 w-3.5" />
                    ) : (
                      <DocumentTextIcon className="h-3.5 w-3.5" />
                    )}
                    {payment.status === 'paid'
                      ? 'Paid'
                      : payment.status === 'pending'
                        ? 'Pending'
                        : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
        <p className="text-[11px] font-medium leading-relaxed text-gray-400">
          Selorah Pro is sold as a 30 day monthly pass or a 12 month annual pass. It does not renew
          automatically, and you are only charged when you choose to buy another pass. Need help
          with a payment? Contact support with your receipt reference.
        </p>
      </div>
    </div>
  );
}
