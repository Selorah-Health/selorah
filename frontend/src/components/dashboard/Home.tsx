import {
  ArrowRightIcon,
  BeakerIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  LockClosedIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import type { DashboardSummary } from '../../pages/Dashboard';
import type { MedicalRecord } from '../../lib/records';

interface HomeProps {
  user: any;
  displayName: string;
  records: MedicalRecord[];
  getFormattedDate: () => string;
  isPro: boolean;
  summary: DashboardSummary;
  onAddRecord: () => void;
  searchActive: boolean;
}

function statusClasses(status: string) {
  return status === 'Shared Once'
    ? 'bg-[#EEF2FF] text-[#6183FF]'
    : 'bg-[#6183FF] text-white';
}

export default function Home({
  user,
  displayName,
  records,
  getFormattedDate,
  isPro,
  summary,
  onAddRecord,
  searchActive,
}: HomeProps) {
  const navigate = useNavigate();
  const healthScore = Math.min(100, 40 + records.length * 5);

  const stats = [
    {
      label: 'Health score',
      value: `${healthScore}/100`,
      hint: records.length > 0 ? `Based on ${records.length} records` : 'Add a record to begin',
      icon: SparklesIcon,
      tone: 'primary' as const,
      onClick: undefined,
    },
    {
      label: 'Total records',
      value: String(records.length).padStart(2, '0'),
      hint: records.length === 1 ? '1 clinical document' : `${records.length} clinical documents`,
      icon: DocumentTextIcon,
      tone: 'light' as const,
      onClick: () => navigate('/dashboard/records'),
    },
    {
      label: 'Active grants',
      value: String(summary.activeGrants).padStart(2, '0'),
      hint:
        summary.activeGrants > 0
          ? 'Temporary QR access is live'
          : 'No one has temporary access',
      icon: QrCodeIcon,
      tone: 'light' as const,
      onClick: () => navigate('/dashboard/access-log'),
    },
    {
      label: 'Research earnings',
      value: '₦0',
      hint: 'Opt in to studies to earn',
      icon: BeakerIcon,
      tone: 'light' as const,
      onClick: () => navigate('/dashboard/research'),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
              Welcome back, {displayName}
            </h2>
            {isPro && (
              <span className="rounded-full bg-[#6183FF]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#6183FF]">
                Pro
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-gray-400">{getFormattedDate()}</p>
        </div>
        <button
          type="button"
          onClick={onAddRecord}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#4D6ED6] active:scale-[0.98]"
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          Add a record
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => {
          const Icon = card.icon;
          const isPrimary = card.tone === 'primary';
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              disabled={!card.onClick}
              className={`group flex min-h-[142px] flex-col justify-between rounded-[24px] border p-5 text-left transition-all ${
                isPrimary
                  ? 'border-transparent bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/20'
                  : 'border-gray-50 bg-white shadow-sm hover:border-[#6183FF]/25 disabled:cursor-default'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`mb-1 text-[9px] font-black uppercase tracking-[0.16em] ${
                      isPrimary ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {card.label}
                  </p>
                  <p
                    className={`text-[30px] font-bold leading-none tracking-tight ${
                      isPrimary ? 'text-white' : 'text-[#101217]'
                    }`}
                  >
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isPrimary ? 'bg-white/15 text-white' : 'bg-[#F8F9FE] text-[#6183FF]'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <p
                className={`mt-4 text-[11px] font-semibold ${
                  isPrimary ? 'text-white/70' : 'text-gray-400'
                }`}
              >
                {card.hint}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7 lg:col-span-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[#101217]">Recent records</h3>
              <p className="text-xs font-medium text-gray-400">
                Clinical files you have added to your vault.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/records')}
              className="group flex items-center gap-1 text-xs font-bold text-[#6183FF] hover:underline"
            >
              See all
              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-5 py-9 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#6183FF] shadow-sm">
                <DocumentTextIcon className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-bold text-[#101217]">
                {searchActive ? 'No records match your search' : 'Your vault is ready'}
              </p>
              <p className="mt-1 max-w-[260px] text-xs font-medium leading-relaxed text-gray-400">
                {searchActive
                  ? 'Try a different name or document type.'
                  : 'Add your first lab result, scan, or prescription. It stays private until you share it.'}
              </p>
              {!searchActive && (
                <button
                  type="button"
                  onClick={onAddRecord}
                  className="mt-4 min-h-[40px] rounded-full bg-[#6183FF] px-4 text-xs font-bold text-white"
                >
                  Add your first record
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {records.slice(0, 4).map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/records/${record.id}`)}
                  className="group flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-transparent bg-[#F8F9FE] p-1.5 transition-colors group-hover:border-gray-100 group-hover:bg-white">
                      <img src={record.icon} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#101217] transition-colors group-hover:text-[#6183FF]">
                        {record.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-gray-400">
                        {record.record_type ? `${record.record_type} • ` : ''}
                        {record.date}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${statusClasses(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[#101217]">Access log</h3>
                <p className="text-xs font-medium text-gray-400">Who opened your record.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/access-log')}
                className="flex items-center gap-1 text-xs font-bold text-[#6183FF] hover:underline"
              >
                Full audit
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {summary.recentAccess.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-4 py-6 text-center">
                <LockClosedIcon className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-xs font-bold text-[#101217]">No access yet</p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                  Every QR share creates a timestamped entry here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.recentAccess.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-white shadow-sm ${log.color}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold leading-snug text-[#101217]">
                        <span className="font-bold">{log.title}</span> {log.action}
                      </p>
                    </div>
                    <span className="whitespace-nowrap pt-0.5 text-[9px] font-black uppercase text-gray-300">
                      {log.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isPro ? (
            <div className="relative overflow-hidden rounded-[28px] border border-[#6183FF]/15 bg-[#EEF2FF] p-6">
              <div
                aria-hidden
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#6183FF]/20 blur-2xl"
              />
              <div className="relative flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/25">
                  <StarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#101217]">Selorah Pro is active</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                    Unlimited emergency contacts, priority verification, and family sharing are
                    unlocked.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/billing')}
                    className="mt-3 flex items-center gap-1 text-xs font-bold text-[#6183FF] hover:underline"
                  >
                    Manage billing
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[28px] bg-[#020924] p-6 text-white">
              <div
                aria-hidden
                className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#6183FF]/30 blur-2xl"
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-4 w-4 text-[#5FFAB0]" />
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5FFAB0]">
                    Selorah Pro
                  </p>
                </div>
                <p className="mt-2 text-lg font-bold leading-tight">
                  More protection for the people you love.
                </p>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-white/55">
                  Add up to 10 emergency contacts, share a family vault, and get priority record
                  verification.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/upgrade')}
                  className="mt-4 flex min-h-[40px] items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#020924]"
                >
                  Upgrade from ₦2,000 a month
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate('/dashboard/qrcodes')}
            className="flex w-full items-center gap-3 rounded-[24px] border border-gray-50 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#6183FF]/25"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6183FF]/10 text-[#6183FF]">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#101217]">Share with a QR code</span>
              <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
                Time-bound access you can revoke instantly.
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
          </button>
        </div>
      </div>
    </>
  );
}
