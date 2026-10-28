import {
  ArrowUpRightIcon,
  BanknotesIcon,
  ClockIcon,
  LockClosedIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';

export default function Earnings() {
  const { info } = useToast();

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Financial rewards
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Withdraw what your consented data earns. No hidden deductions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => info('You will be able to withdraw once you have a cleared balance.')}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-gray-400"
        >
          Withdraw funds
          <ArrowUpRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Available balance',
            value: '₦0',
            icon: BanknotesIcon,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Pending clearance',
            value: '₦0',
            icon: ClockIcon,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
          },
          {
            label: 'Lifetime earnings',
            value: '₦0',
            icon: WalletIcon,
            color: 'text-[#6183FF]',
            bg: 'bg-[#EEF2FF]',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
            >
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#101217]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm sm:p-10">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F9FE] text-[#6183FF]">
            <WalletIcon className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight text-[#101217]">
            Your earnings will show up here
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
            When you join a study and your consented data is used, the reward lands in this
            balance. Nothing is deducted without your approval.
          </p>

          <div className="mt-6 space-y-2.5 text-left">
            {[
              'Join an approved study from the Research tab.',
              'Complete consent and any required check-ins.',
              'Get paid after the study closes and clears.',
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-2xl bg-[#F8F9FE] px-4 py-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6183FF] text-[10px] font-black text-white">
                  {index + 1}
                </span>
                <p className="text-xs font-semibold leading-relaxed text-gray-600">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
            <LockClosedIcon className="h-3.5 w-3.5" />
            Payouts are protected and auditable.
          </div>
        </div>
      </div>
    </div>
  );
}
