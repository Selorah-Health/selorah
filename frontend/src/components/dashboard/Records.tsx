import {
  ChevronRightIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  LockClosedIcon,
  QrCodeIcon,
  ShareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import type { MedicalRecord } from '../../lib/records';
import type { RecentAccess } from '../../pages/Dashboard';

interface RecordsProps {
  records: MedicalRecord[];
  handleUploadClick: () => void;
  activeGrants: number;
  recentAccess: RecentAccess[];
  searchActive: boolean;
}

export default function Records({
  records,
  handleUploadClick,
  activeGrants,
  recentAccess,
  searchActive,
}: RecordsProps) {
  const navigate = useNavigate();

  const summary = [
    {
      label: 'Total records',
      value: String(records.length).padStart(2, '0'),
      icon: DocumentTextIcon,
      color: 'text-[#6183FF]',
      bg: 'bg-[#EEF2FF]',
    },
    {
      label: 'Active grants',
      value: String(activeGrants).padStart(2, '0'),
      icon: ShareIcon,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      label: 'Encryption',
      value: 'AES-256',
      icon: ShieldCheckIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Health records
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Every clinical document, encrypted and under your control.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUploadClick}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#4D6ED6]"
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          Upload a record
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summary.map((card) => (
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7 lg:col-span-7 xl:col-span-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[#101217]">
                {searchActive ? 'Search results' : 'All records'}
              </h3>
              <p className="text-xs font-medium text-gray-400">
                {searchActive
                  ? `${records.length} matching document${records.length === 1 ? '' : 's'}`
                  : 'Tap a record to inspect, share, or download it.'}
              </p>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-5 py-11 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#6183FF] shadow-sm">
                <DocumentTextIcon className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-bold text-[#101217]">
                {searchActive ? 'Nothing matches that search' : 'No clinical records yet'}
              </p>
              <p className="mt-1 max-w-[280px] text-xs font-medium leading-relaxed text-gray-400">
                {searchActive
                  ? 'Try a shorter keyword, or search by document type such as lab or imaging.'
                  : 'Upload a lab result, scan, prescription, or visit report to start your portable history.'}
              </p>
              {!searchActive && (
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="mt-4 min-h-[40px] rounded-full bg-[#6183FF] px-4 text-xs font-bold text-white"
                >
                  Upload your first record
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/records/${record.id}`)}
                  className="group flex w-full items-center justify-between gap-4 py-4 text-left transition-colors first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] p-1.5">
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
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full bg-[#6183FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white sm:inline">
                      {record.status}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#6183FF]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 lg:col-span-5 xl:col-span-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/qrcodes')}
            className="flex w-full flex-col items-center justify-center rounded-[28px] bg-[#6183FF] p-6 text-center text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#5577EE]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <QrCodeIcon className="h-6 w-6" />
            </span>
            <h3 className="mt-3 text-base font-bold">Generate a QR code</h3>
            <p className="mt-1 max-w-[220px] text-xs font-medium leading-relaxed text-white/75">
              Give a clinician time-bound access. Revoke it whenever you want.
            </p>
          </button>

          <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#101217]">Access log</h3>
                <p className="text-[11px] font-medium text-gray-400">Latest activity</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/access-log')}
                className="text-[11px] font-bold text-[#6183FF] hover:underline"
              >
                View all
              </button>
            </div>

            {recentAccess.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-4 py-6 text-center">
                <LockClosedIcon className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-xs font-bold text-[#101217]">No access yet</p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                  Shares appear here with a timestamp.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAccess.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${log.color}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#101217]">{log.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-gray-400">
                        {log.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
