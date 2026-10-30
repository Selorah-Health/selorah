import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  LockClosedIcon,
  WalletIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import {
  EARNINGS_EVENT,
  EMPTY_EARNINGS,
  fetchEarnings,
  formatNaira,
  requestWithdrawal,
  subscribeEarnings,
  type EarningsSummary,
} from '../../lib/earnings';
import { useToast } from '../../contexts/ToastContext';

const BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'GTBank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank' },
  { code: '033', name: 'UBA' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '214', name: 'FCMB' },
  { code: '050', name: 'Ecobank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '215', name: 'Unity Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '50211', name: 'Kuda' },
  { code: '999992', name: 'OPay' },
  { code: '999991', name: 'PalmPay' },
  { code: '50515', name: 'Moniepoint' },
];

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value === 'paid' || value === 'available' || value === 'cleared') {
    return 'bg-[#EAFBF2] text-[#15955C]';
  }
  if (value === 'rejected' || value === 'failed') return 'bg-red-50 text-red-500';
  return 'bg-orange-50 text-orange-500';
}

export default function Earnings() {
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();
  const [data, setData] = useState<EarningsSummary>(EMPTY_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    bankCode: '044',
    accountNumber: '',
    accountName: '',
  });

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        setData(await fetchEarnings(supabase));
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Earnings could not be loaded.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase, toastError]
  );

  useEffect(() => {
    void load();
    const refresh = () => void load(true);
    window.addEventListener(EARNINGS_EVENT, refresh);
    return () => window.removeEventListener(EARNINGS_EVENT, refresh);
  }, [load]);

  useEffect(() => {
    if (!data.patientId) return;
    return subscribeEarnings(supabase, data.patientId, () => void load(true));
  }, [data.patientId, load, supabase]);

  const bankName = useMemo(
    () => BANKS.find((bank) => bank.code === form.bankCode)?.name || 'Bank',
    [form.bankCode]
  );

  const openWithdraw = () => {
    if (data.available < 1000) {
      info('You need at least N1,000 available before you can withdraw.');
      return;
    }
    setForm((current) => ({ ...current, amount: String(Math.floor(data.available)) }));
    setModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 1000) {
      toastError('The minimum withdrawal is N1,000.');
      return;
    }
    if (amount > data.available) {
      toastError('That is more than your available balance.');
      return;
    }
    if (form.accountNumber.replace(/\D/g, '').length < 10) {
      toastError('Enter a valid 10-digit account number.');
      return;
    }
    if (form.accountName.trim().length < 3) {
      toastError('Enter the account name exactly as it appears on your bank account.');
      return;
    }

    setSubmitting(true);
    try {
      await requestWithdrawal(supabase, {
        amount,
        bankCode: form.bankCode,
        bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
      });
      success('Withdrawal requested. You will be notified when it is processed.');
      setModalOpen(false);
      setForm((current) => ({ ...current, accountNumber: '', accountName: '' }));
      await load(true);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'The withdrawal could not be requested.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-[24px] bg-white" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-[24px] bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
            Financial rewards
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Earnings
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Every survey point is worth N20. Withdraw to your bank when you are ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            aria-label="Refresh earnings"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openWithdraw}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Withdraw funds
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Available balance',
            value: formatNaira(data.available),
            hint: 'Ready to withdraw',
            icon: BanknotesIcon,
            color: 'text-[#15955C]',
            bg: 'bg-[#EAFBF2]',
          },
          {
            label: 'Pending clearance',
            value: formatNaira(data.pending),
            hint: 'Withdrawals in review',
            icon: ClockIcon,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
          },
          {
            label: 'Lifetime earnings',
            value: formatNaira(data.lifetime),
            hint: `${data.earnings.length} reward${data.earnings.length === 1 ? '' : 's'}`,
            icon: WalletIcon,
            color: 'text-[#6183FF]',
            bg: 'bg-[#EEF2FF]',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
          >
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#101217]">{card.value}</p>
            <p className="mt-1 text-[11px] font-medium text-gray-400">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#101217]">Reward history</h3>
              <p className="text-[11px] font-medium text-gray-400">
                Survey rewards land here the moment you submit.
              </p>
            </div>
            <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6183FF]">
              N20 / point
            </span>
          </div>

          {data.earnings.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-5 py-8 text-center">
              <BanknotesIcon className="mx-auto h-7 w-7 text-gray-300" />
              <p className="mt-2 text-sm font-bold text-[#101217]">No rewards yet</p>
              <p className="mx-auto mt-1 max-w-xs text-[11px] font-medium leading-relaxed text-gray-400">
                Complete a survey in Research to earn your first reward.
              </p>
            </div>
          ) : (
            <div className="mt-3 divide-y divide-gray-50">
              {data.earnings.slice(0, 20).map((row) => (
                <div key={row.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                    <CheckCircleIcon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#101217]">
                      {row.description || 'Survey reward'}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400">
                      {new Date(row.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#15955C]">
                      +{formatNaira(Number(row.amount_local))}
                    </p>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] ${statusTone(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6 lg:col-span-5">
          <h3 className="text-base font-bold text-[#101217]">Withdrawals</h3>
          <p className="text-[11px] font-medium text-gray-400">
            Bank payouts are reviewed before they are sent.
          </p>

          {data.withdrawals.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-[#F8F9FE] px-4 py-6 text-center">
              <CreditCardIcon className="mx-auto h-6 w-6 text-gray-300" />
              <p className="mt-2 text-xs font-bold text-[#101217]">No withdrawals yet</p>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-gray-400">
                Minimum N1,000. Your bank details are only used for this payout.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {data.withdrawals.slice(0, 10).map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-gray-100 bg-[#F8F9FE] p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#101217]">
                      {formatNaira(Number(row.amount_local))}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] ${statusTone(
                        row.status
                      )}`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-medium text-gray-400">
                    {row.bank_name || 'Bank'} - {row.account_number}
                  </p>
                  {row.admin_note && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">{row.admin_note}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-gray-100 px-3.5 py-3">
            <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]" />
            <p className="text-[10px] font-medium leading-relaxed text-gray-400">
              Payouts are protected and auditable. You can see every status change here.
            </p>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-[#05081A]/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-title"
            className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_40px_100px_-30px_rgba(5,8,26,0.6)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                  <BanknotesIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="withdraw-title" className="text-sm font-black text-[#101217]">
                    Withdraw to your bank
                  </h2>
                  <p className="text-[10px] font-medium text-gray-400">
                    Available {formatNaira(data.available)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                aria-label="Close withdrawal form"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3 px-5 py-4">
              <label className="block">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                  Amount (NGN)
                </span>
                <input
                  type="number"
                  min={1000}
                  max={data.available}
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-sm font-bold outline-none focus:border-[#6183FF]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                  Bank
                </span>
                <select
                  value={form.bankCode}
                  onChange={(event) => setForm({ ...form, bankCode: event.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
                >
                  {BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                  Account number
                </span>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  value={form.accountNumber}
                  onChange={(event) =>
                    setForm({ ...form, accountNumber: event.target.value.replace(/\D/g, '') })
                  }
                  placeholder="10 digits"
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-sm font-semibold tracking-wider outline-none focus:border-[#6183FF]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                  Account name
                </span>
                <input
                  value={form.accountName}
                  onChange={(event) => setForm({ ...form, accountName: event.target.value })}
                  placeholder="As it appears on your bank account"
                  className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
                />
              </label>

              <div className="rounded-xl bg-[#F8F9FE] px-3.5 py-2.5">
                <p className="text-[10px] font-medium leading-relaxed text-gray-500">
                  {formatNaira(Number(form.amount) || 0)} to {bankName}. Requests are reviewed
                  before payout. Nothing is deducted until the transfer is approved.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#6183FF] text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 disabled:opacity-60"
              >
                {submitting ? 'Requesting...' : 'Request withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
