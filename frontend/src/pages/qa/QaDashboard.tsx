import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BeakerIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import { formatNaira } from '../../lib/earnings';
import { readLocalSession, writeLocalSession } from '../../lib/auth/session';
import PortalSidebar from '../../components/PortalSidebar';
import SEOTitle from '../../components/SEOTitle';
import ThemeToggle from '../../components/ThemeToggle';

type QaUser = {
  id: string;
  email: string;
  role: string;
  verification_status: string | null;
  created_at: string | null;
};

type QaWaitlist = {
  id: string;
  email: string;
  full_name: string;
  role: string | null;
  source: string | null;
  frustration: string | null;
  created_at: string;
};

type OverviewStats = {
  portalUsers: QaUser[];
  patients: QaUser[];
  verified: QaUser[];
  joinedThisWeek: QaUser[];
  waitlistThisWeek: QaWaitlist[];
};

const PORTAL_ROLES = new Set(['provider', 'hospital', 'researcher', 'insurer', 'qa', 'admin']);

const ROLE_LABEL: Record<string, string> = {
  patient: 'Patient',
  provider: 'Hospital',
  hospital: 'Hospital',
  researcher: 'Researcher',
  insurer: 'Insurer',
  qa: 'QA',
  admin: 'Admin',
  doctor: 'Doctor',
  other: 'Other',
  unknown: 'Unknown',
};

function roleLabel(role?: string | null) {
  if (!role) return 'Unknown';
  return ROLE_LABEL[role.toLowerCase()] || role;
}

function roleTone(role?: string | null) {
  switch ((role || '').toLowerCase()) {
    case 'patient':
      return 'bg-[#EEF2FF] text-[#4D6ED6]';
    case 'provider':
    case 'hospital':
      return 'bg-[#EAFBF2] text-[#15955C]';
    case 'researcher':
      return 'bg-[#F3EFFF] text-[#6C4DF6]';
    case 'insurer':
      return 'bg-[#FFF4E6] text-[#B26A00]';
    case 'qa':
    case 'admin':
      return 'bg-[#101217] text-white';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

function initials(value?: string | null) {
  const clean = (value || '?').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase() || '?';
}

function formatDate(value?: string | null) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(value?: string | null) {
  if (!value) return '';
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return '';
  const seconds = Math.max(0, Math.round((Date.now() - date) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  primary = false,
  onClick,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof UsersIcon;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group flex min-h-[142px] flex-col justify-between rounded-[24px] border p-5 text-left transition-all ${
        primary
          ? 'border-transparent bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/20'
          : 'border-gray-50 bg-white shadow-sm hover:border-[#6183FF]/25 disabled:cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`mb-1 text-[9px] font-black uppercase tracking-[0.16em] ${
              primary ? 'text-white/70' : 'text-gray-400'
            }`}
          >
            {label}
          </p>
          <p
            className={`text-[30px] font-bold leading-none tracking-tight ${
              primary ? 'text-white' : 'text-[#101217]'
            }`}
          >
            {value}
          </p>
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            primary ? 'bg-white/15 text-white' : 'bg-[#F8F9FE] text-[#6183FF]'
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p
        className={`mt-4 text-[11px] font-semibold ${
          primary ? 'text-white/70' : 'text-gray-400'
        }`}
      >
        {hint}
      </p>
    </button>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-5 py-9 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#6183FF] shadow-sm">
        <SparklesIcon className="h-7 w-7" />
      </div>
      <p className="mt-3 text-sm font-bold text-[#101217]">{title}</p>
      <p className="mt-1 max-w-[280px] text-xs font-medium leading-relaxed text-gray-400">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 min-h-[40px] rounded-full bg-[#6183FF] px-4 text-xs font-bold text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6183FF]/25 border-t-[#6183FF]" />
      <p className="mt-3 text-xs font-semibold text-gray-400">{label}</p>
    </div>
  );
}

export default function QaDashboard() {
  const supabase = createClient();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<QaUser[]>([]);
  const [waitlist, setWaitlist] = useState<QaWaitlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const reloadTimer = useRef<number | undefined>(undefined);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        const [usersRes, waitlistRes] = await Promise.all([
          supabase
            .from('users')
            .select('id, email, role, verification_status, created_at')
            .order('created_at', { ascending: false }),
          supabase
            .from('waitlist')
            .select('id, email, full_name, role, source, frustration, created_at')
            .order('created_at', { ascending: false }),
        ]);

        if (usersRes.error) throw usersRes.error;
        if (waitlistRes.error) throw waitlistRes.error;

        setUsers((usersRes.data || []) as QaUser[]);
        setWaitlist((waitlistRes.data || []) as QaWaitlist[]);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'The QA data could not be loaded. Check the QA policies and try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      if (data.user?.email) {
        writeLocalSession({
          id: data.user.id,
          email: data.user.email,
          role: 'qa',
          first_name: data.user.user_metadata?.first_name,
          last_name: data.user.user_metadata?.last_name,
        });
      }
    });

    void load();

    return () => {
      active = false;
    };
  }, [load, supabase]);

  useEffect(() => {
    const schedule = () => {
      window.clearTimeout(reloadTimer.current);
      reloadTimer.current = window.setTimeout(() => void load(true), 700);
    };

    const channel = supabase
      .channel('qa-live-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, schedule)
      .subscribe((status) => setLive(status === 'SUBSCRIBED'));

    const fallback = window.setInterval(() => void load(true), 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(reloadTimer.current);
      window.clearInterval(fallback);
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  const local = readLocalSession();
  const firstName =
    user?.user_metadata?.first_name || local?.first_name || user?.email?.split('@')[0] || 'QA';

  const stats = useMemo<OverviewStats>(() => {
    const portalUsers = users.filter((row) => PORTAL_ROLES.has((row.role || '').toLowerCase()));
    const patients = users.filter((row) => (row.role || '').toLowerCase() === 'patient');
    const verified = users.filter((row) => row.verification_status === 'verified');
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const joinedThisWeek = users.filter(
      (row) => row.created_at && new Date(row.created_at).getTime() >= weekAgo
    );
    const waitlistThisWeek = waitlist.filter(
      (row) => row.created_at && new Date(row.created_at).getTime() >= weekAgo
    );

    return {
      portalUsers,
      patients,
      verified,
      joinedThisWeek,
      waitlistThisWeek,
    };
  }, [users, waitlist]);

  const menuItems = [
    { name: 'Dashboard', icon: ChartBarIcon, path: '/qa' },
    { name: 'Waitlist', icon: EnvelopeIcon, path: '/qa/waitlist' },
    { name: 'Users', icon: IdentificationIcon, path: '/qa/users' },
    { name: 'QA lab', icon: BeakerIcon, path: '/qa/lab' },
    { name: 'Withdrawals', icon: BanknotesIcon, path: '/qa/withdrawals' },
  ];

  const pageTitle =
    location.pathname === '/qa/waitlist'
      ? 'Waitlist'
      : location.pathname === '/qa/users'
        ? 'Registered users'
        : location.pathname === '/qa/lab'
          ? 'QA lab'
          : location.pathname === '/qa/withdrawals'
            ? 'Withdrawals'
            : 'Dashboard';

  const exportWaitlist = () =>
    downloadCsv('selorah-waitlist.csv', [
      ['Name', 'Email', 'Role', 'Source', 'Frustration', 'Joined'],
      ...waitlist.map((row) => [
        row.full_name,
        row.email,
        roleLabel(row.role),
        row.source || '',
        row.frustration || '',
        formatDate(row.created_at),
      ]),
    ]);

  const exportUsers = () =>
    downloadCsv('selorah-users.csv', [
      ['Email', 'Role', 'Verification', 'Joined'],
      ...users.map((row) => [
        row.email,
        roleLabel(row.role),
        row.verification_status || 'pending',
        formatDate(row.created_at),
      ]),
    ]);

  return (
    <div className="flex app-shell overflow-hidden bg-[#F8F9FE] font-sora selection:bg-primary/30">
      <SEOTitle title={pageTitle} />
      <PortalSidebar
        role="qa"
        roleTag="QA"
        menuItems={menuItems}
        user={user}
        sidebarBg="bg-[#6183FF]"
        logoutBg="bg-white/15"
        avatarGradient="bg-[#DCE4FF]"
        roleDescription="Quality assurance"
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="z-10 flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-5 md:px-8 md:pb-4 md:pt-6 lg:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white p-1.5 md:hidden">
              <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-[#101217] md:text-2xl">
                {pageTitle}
              </h1>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                <ShieldCheckIcon className="h-3 w-3 text-[#6183FF]" />
                QA workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                live
                  ? 'border-green-100 bg-green-50 text-green-600'
                  : 'border-amber-100 bg-amber-50 text-amber-600'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {live && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    live ? 'bg-green-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              {live ? 'Live' : 'Reconnecting'}
            </span>
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing}
              aria-label="Refresh QA data"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle className="h-10 w-10" />
          </div>
        </header>

        <div data-scroll-root className="flex-1 space-y-8 overflow-y-auto px-4 pb-28 pt-3 scrollbar-hide md:px-8 md:pb-10 lg:px-12">
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-red-500">
                  Data connection issue
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-red-600">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-red-500 shadow-sm"
              >
                Try again
              </button>
            </div>
          )}

          <Routes>
            <Route
              path="/"
              element={
                <Overview
                  users={users}
                  waitlist={waitlist}
                  stats={stats}
                  loading={loading}
                  firstName={firstName}
                  live={live}
                  lastUpdated={lastUpdated}
                  onRefresh={() => void load(true)}
                  onExportUsers={exportUsers}
                  onExportWaitlist={exportWaitlist}
                />
              }
            />
            <Route
              path="waitlist"
              element={<WaitlistPage rows={waitlist} loading={loading} onExport={exportWaitlist} />}
            />
            <Route path="users" element={<UsersPage rows={users} loading={loading} onExport={exportUsers} />} />
            <Route path="lab" element={<QaLabPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="*" element={<Navigate to="/qa" replace />} />
          </Routes>

          <div className="py-4 text-center opacity-40">
            <p className="text-[10px] font-medium text-[#101217]">
              Copyright (c) 2026, Selorah Health Limited. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Overview({
  users,
  waitlist,
  stats,
  loading,
  firstName,
  live,
  lastUpdated,
  onRefresh,
  onExportUsers,
  onExportWaitlist,
}: {
  users: QaUser[];
  waitlist: QaWaitlist[];
  stats: OverviewStats;
  loading: boolean;
  firstName: string;
  live: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onExportUsers: () => void;
  onExportWaitlist: () => void;
}) {
  const navigate = useNavigate();

  if (loading && users.length === 0 && waitlist.length === 0) {
    return <LoadingState label="Loading live numbers" />;
  }

  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
              Welcome back, {firstName}
            </h2>
            <span className="rounded-full bg-[#6183FF]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#6183FF]">
              QA
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-400">{date}</p>
        </div>
        <button
          type="button"
          onClick={onExportUsers}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#4D6ED6] active:scale-[0.98]"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export users
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          primary
          label="Waitlist"
          value={waitlist.length.toLocaleString()}
          hint={`${stats.waitlistThisWeek.length} joined in the last 7 days`}
          icon={EnvelopeIcon}
          onClick={() => navigate('/qa/waitlist')}
        />
        <StatCard
          label="Registered users"
          value={users.length.toLocaleString()}
          hint={`${stats.joinedThisWeek.length} new accounts this week`}
          icon={UsersIcon}
          onClick={() => navigate('/qa/users')}
        />
        <StatCard
          label="Portal accounts"
          value={stats.portalUsers.length.toLocaleString()}
          hint="Hospital, researcher, insurer, QA"
          icon={UserGroupIcon}
          onClick={() => navigate('/qa/users')}
        />
        <StatCard
          label="Patients"
          value={stats.patients.length.toLocaleString()}
          hint={`${stats.verified.length} accounts verified`}
          icon={IdentificationIcon}
          onClick={() => navigate('/qa/users')}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7 lg:col-span-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-[#101217]">Recent accounts</h3>
              <p className="text-xs font-medium text-gray-400">
                The newest people to join Selorah.
              </p>
            </div>
            <Link
              to="/qa/users"
              className="group flex items-center gap-1 text-xs font-bold text-[#6183FF] hover:underline"
            >
              See all
              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {users.length === 0 ? (
            <EmptyState
              title="No accounts yet"
              body="New patient and portal accounts will appear here as soon as they are created."
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {users.slice(0, 5).map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] text-[11px] font-black uppercase text-[#6183FF]">
                      {initials(row.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#101217]">{row.email}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-gray-400">
                        <ClockIcon className="h-3 w-3" />
                        {timeAgo(row.created_at)}
                        <span className="text-gray-300">·</span>
                        ID {row.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${roleTone(
                      row.role
                    )}`}
                  >
                    {roleLabel(row.role)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[#101217]">Waitlist</h3>
                <p className="text-xs font-medium text-gray-400">Latest people waiting for access.</p>
              </div>
              <Link
                to="/qa/waitlist"
                className="flex items-center gap-1 text-xs font-bold text-[#6183FF] hover:underline"
              >
                Full list
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            {waitlist.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-4 py-6 text-center">
                <EnvelopeIcon className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-xs font-bold text-[#101217]">No signups yet</p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                  New waitlist entries appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {waitlist.slice(0, 4).map((row) => (
                  <div key={row.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] text-[10px] font-black uppercase text-[#6183FF]">
                      {initials(row.full_name || row.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold leading-snug text-[#101217]">
                        {row.full_name || 'No name'}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-gray-400">
                        {row.email}
                      </p>
                    </div>
                    <span className="whitespace-nowrap pt-0.5 text-[9px] font-black uppercase text-gray-300">
                      {timeAgo(row.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[28px] bg-[#020924] p-6 text-white">
            <div className="flex items-center gap-2">
              <SignalIcon className="h-4 w-4 text-[#5FFAB0]" />
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5FFAB0]">
                Live connection
              </p>
            </div>
            <p className="mt-2 text-lg font-bold leading-tight">
              {live ? 'Realtime is connected.' : 'Realtime is reconnecting.'}
            </p>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-white/55">
              New accounts and waitlist signups appear without a refresh.
            </p>
            <p className="mt-4 text-[10px] font-semibold text-white/40">
              {lastUpdated ? `Last sync ${lastUpdated.toLocaleTimeString()}` : 'Waiting for first sync'}
            </p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 flex min-h-[40px] items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#020924]"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Refresh now
            </button>
          </div>

          <button
            type="button"
            onClick={onExportWaitlist}
            className="flex w-full items-center gap-3 rounded-[24px] border border-gray-50 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#6183FF]/25"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6183FF]/10 text-[#6183FF]">
              <ArrowDownTrayIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#101217]">Export the waitlist</span>
              <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
                Download every signup as a CSV file.
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}

function WaitlistPage({
  rows,
  loading,
  onExport,
}: {
  rows: QaWaitlist[];
  loading: boolean;
  onExport: () => void;
}) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');

  const roles = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => set.add((row.role || 'unknown').toLowerCase()));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (role !== 'all' && (row.role || 'unknown').toLowerCase() !== role) return false;
      if (!needle) return true;
      return [row.full_name, row.email, row.role, row.source, row.frustration]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query, role]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">Waitlist</h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            {rows.length.toLocaleString()} people waiting for Selorah. Updates appear live.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#4D6ED6] active:scale-[0.98]"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-[24px] border border-gray-50 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, role, or frustration"
            className="min-h-[42px] w-full rounded-xl border border-gray-100 bg-[#F8F9FE] pl-10 pr-3 text-xs font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
          />
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            type="button"
            onClick={() => setRole('all')}
            className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
              role === 'all' ? 'bg-[#6183FF] text-white' : 'bg-[#F8F9FE] text-gray-400'
            }`}
          >
            All
          </button>
          {roles.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
                role === item ? 'bg-[#6183FF] text-white' : 'bg-[#F8F9FE] text-gray-400'
              }`}
            >
              {roleLabel(item)}
            </button>
          ))}
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <LoadingState label="Loading waitlist" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching signups"
          body="Try a different search, or clear the role filter to see everyone on the waitlist."
          action={{
            label: 'Clear filters',
            onClick: () => {
              setQuery('');
              setRole('all');
            },
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-gray-50 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.4fr_1.5fr_0.7fr_0.8fr_0.7fr] gap-3 border-b border-gray-100 bg-[#F8F9FE] px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-gray-400 lg:grid">
            <span>Person</span>
            <span>Email</span>
            <span>Role</span>
            <span>Source</span>
            <span className="text-right">Joined</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-[#F8F9FE] lg:grid-cols-[1.4fr_1.5fr_0.7fr_0.8fr_0.7fr] lg:items-center lg:gap-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] text-[10px] font-black uppercase text-[#6183FF]">
                    {initials(row.full_name || row.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#101217]">
                      {row.full_name || 'No name'}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-gray-400 lg:hidden">
                      {row.email}
                    </p>
                  </div>
                </div>
                <p className="hidden min-w-0 truncate text-[11px] font-medium text-gray-500 lg:block">
                  {row.email}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`w-fit rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${roleTone(
                      row.role
                    )}`}
                  >
                    {roleLabel(row.role)}
                  </span>
                  <span className="text-[10px] font-medium capitalize text-gray-400 lg:hidden">
                    {row.source || 'Unknown source'}
                  </span>
                </div>
                <p className="hidden truncate text-[10px] font-medium capitalize text-gray-400 lg:block">
                  {row.source || 'Unknown'}
                </p>
                <p className="text-[10px] font-semibold text-gray-400 lg:text-right">
                  {formatDate(row.created_at)}
                </p>
                {row.frustration && (
                  <p className="rounded-xl bg-[#F8F9FE] px-3 py-2 text-[10px] font-medium italic leading-relaxed text-gray-500 lg:col-span-5">
                    “{row.frustration}”
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

type TestPlan = {
  id: string;
  title: string;
  area: string;
  owner: string | null;
  status: string;
  created_at: string;
};

type TestCase = {
  id: string;
  plan_id: string | null;
  title: string;
  steps: string | null;
  expected: string | null;
  priority: string;
  status: string;
  created_at: string;
};

type TestRun = {
  id: string;
  case_id: string;
  status: string;
  notes: string | null;
  run_by: string | null;
  created_at: string;
};

type Defect = {
  id: string;
  title: string;
  area: string;
  severity: string;
  status: string;
  steps: string | null;
  expected: string | null;
  actual: string | null;
  created_at: string;
};

const RUN_STATUSES = ['passed', 'failed', 'blocked'] as const;

function runTone(status: string) {
  if (status === 'passed') return 'bg-green-50 text-green-600';
  if (status === 'failed') return 'bg-red-50 text-red-500';
  if (status === 'blocked') return 'bg-amber-50 text-amber-600';
  return 'bg-gray-100 text-gray-400';
}

function QaLabPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<'plans' | 'cases' | 'runs' | 'defects'>('plans');
  const [plans, setPlans] = useState<TestPlan[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [defectForm, setDefectForm] = useState({
    title: '',
    area: 'General',
    severity: 'medium',
    steps: '',
    expected: '',
    actual: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, casesRes, runsRes, defectsRes] = await Promise.all([
        supabase.from('qa_test_plans').select('*').order('created_at', { ascending: false }),
        supabase.from('qa_test_cases').select('*').order('created_at', { ascending: true }),
        supabase.from('qa_test_runs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('qa_defects').select('*').order('created_at', { ascending: false }),
      ]);

      const firstError =
        plansRes.error || casesRes.error || runsRes.error || defectsRes.error;
      if (firstError) throw firstError;

      setPlans((plansRes.data || []) as TestPlan[]);
      setCases((casesRes.data || []) as TestCase[]);
      setRuns((runsRes.data || []) as TestRun[]);
      setDefects((defectsRes.data || []) as Defect[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The QA lab could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const recordRun = async (testCase: TestCase, status: (typeof RUN_STATUSES)[number]) => {
    setBusy(testCase.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: runError } = await supabase.from('qa_test_runs').insert({
        case_id: testCase.id,
        status,
        run_by: user?.id || null,
      });
      if (runError) throw runError;

      const { error: caseError } = await supabase
        .from('qa_test_cases')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', testCase.id);
      if (caseError) throw caseError;

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The run could not be recorded.');
    } finally {
      setBusy(null);
    }
  };

  const addDefect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (defectForm.title.trim().length < 4) {
      setError('Give the defect a clear title.');
      return;
    }

    setBusy('defect');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('qa_defects').insert({
        title: defectForm.title.trim(),
        area: defectForm.area.trim() || 'General',
        severity: defectForm.severity,
        steps: defectForm.steps.trim() || null,
        expected: defectForm.expected.trim() || null,
        actual: defectForm.actual.trim() || null,
        reported_by: user?.id || null,
      });
      if (insertError) throw insertError;

      setDefectForm({
        title: '',
        area: 'General',
        severity: 'medium',
        steps: '',
        expected: '',
        actual: '',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The defect could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  const planName = (planId: string | null) =>
    plans.find((plan) => plan.id === planId)?.title || 'Unassigned';
  const caseName = (caseId: string) =>
    cases.find((testCase) => testCase.id === caseId)?.title || 'Deleted case';

  const tabs = [
    { id: 'plans' as const, label: 'Plans', count: plans.length },
    { id: 'cases' as const, label: 'Cases', count: cases.length },
    { id: 'runs' as const, label: 'Runs', count: runs.length },
    { id: 'defects' as const, label: 'Defects', count: defects.length },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">QA lab</h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Test plans, cases, run history, and defects for the Selorah journey.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-red-600"
        >
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm scrollbar-hide">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[11px] font-black uppercase tracking-[0.08em] transition-all ${
              tab === item.id ? 'bg-[#6183FF] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {item.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                tab === item.id ? 'bg-white/20 text-white' : 'bg-[#F8F9FE] text-gray-400'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {loading && plans.length === 0 && cases.length === 0 ? (
        <LoadingState label="Loading the QA lab" />
      ) : tab === 'plans' ? (
        plans.length === 0 ? (
          <EmptyState
            title="No test plans yet"
            body="Apply the platform migration to seed the patient core journey plan."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => {
              const planCases = cases.filter((testCase) => testCase.plan_id === plan.id);
              const passed = planCases.filter((testCase) => testCase.status === 'passed').length;
              return (
                <article
                  key={plan.id}
                  className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                      {plan.status}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[#101217]">{plan.title}</h3>
                  <p className="mt-1 text-xs font-medium text-gray-400">
                    {plan.area} · Owner {plan.owner || 'QA'}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-500">
                    <span className="rounded-full bg-[#F8F9FE] px-2.5 py-1">
                      {planCases.length} cases
                    </span>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-600">
                      {passed} passed
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : tab === 'cases' ? (
        cases.length === 0 ? (
          <EmptyState title="No test cases yet" body="Seed the QA plan to add patient journey cases." />
        ) : (
          <div className="space-y-3">
            {cases.map((testCase) => (
              <article
                key={testCase.id}
                className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6183FF]">
                        {planName(testCase.plan_id)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${runTone(
                          testCase.status
                        )}`}
                      >
                        {testCase.status.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-gray-300">
                        {testCase.priority} priority
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-[#101217]">{testCase.title}</h3>
                    {testCase.steps && (
                      <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                        {testCase.steps}
                      </p>
                    )}
                    {testCase.expected && (
                      <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-gray-400">
                        Expected: {testCase.expected}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {RUN_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void recordRun(testCase, status)}
                        disabled={busy === testCase.id}
                        className={`min-h-[34px] rounded-full px-3 text-[9px] font-black uppercase tracking-[0.08em] transition-colors disabled:opacity-50 ${runTone(
                          status
                        )}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : tab === 'runs' ? (
        runs.length === 0 ? (
          <EmptyState
            title="No runs recorded"
            body="Record a pass, fail, or block from the Cases tab to build run history."
          />
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-gray-50 bg-white shadow-sm">
            <div className="divide-y divide-gray-50">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#101217]">
                      {caseName(run.case_id)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                      {formatDate(run.created_at)}
                      {run.notes ? ` · ${run.notes}` : ''}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${runTone(
                      run.status
                    )}`}
                  >
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="space-y-5">
          <form
            onSubmit={addDefect}
            className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
          >
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#101217]">
              <PlusIcon className="h-4 w-4 text-[#6183FF]" />
              Log a defect
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input
                value={defectForm.title}
                onChange={(event) => setDefectForm({ ...defectForm, title: event.target.value })}
                placeholder="Short defect title"
                className="min-h-[42px] rounded-xl border border-gray-100 bg-[#F8F9FE] px-3.5 text-xs font-semibold text-[#101217] outline-none placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF] sm:col-span-2"
              />
              <input
                value={defectForm.area}
                onChange={(event) => setDefectForm({ ...defectForm, area: event.target.value })}
                placeholder="Area"
                className="min-h-[42px] rounded-xl border border-gray-100 bg-[#F8F9FE] px-3.5 text-xs font-semibold text-[#101217] outline-none placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
              />
              <select
                value={defectForm.severity}
                onChange={(event) =>
                  setDefectForm({ ...defectForm, severity: event.target.value })
                }
                className="min-h-[42px] rounded-xl border border-gray-100 bg-[#F8F9FE] px-3.5 text-xs font-semibold text-[#101217] outline-none focus:border-[#6183FF]"
              >
                {['low', 'medium', 'high', 'critical'].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <textarea
                value={defectForm.steps}
                onChange={(event) => setDefectForm({ ...defectForm, steps: event.target.value })}
                rows={2}
                placeholder="Steps to reproduce"
                className="rounded-xl border border-gray-100 bg-[#F8F9FE] px-3.5 py-2.5 text-xs font-medium text-[#101217] outline-none placeholder:text-gray-300 focus:border-[#6183FF] sm:col-span-2"
              />
              <textarea
                value={defectForm.actual}
                onChange={(event) => setDefectForm({ ...defectForm, actual: event.target.value })}
                rows={2}
                placeholder="What happened"
                className="rounded-xl border border-gray-100 bg-[#F8F9FE] px-3.5 py-2.5 text-xs font-medium text-[#101217] outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
              />
              <textarea
                value={defectForm.expected}
                onChange={(event) =>
                  setDefectForm({ ...defectForm, expected: event.target.value })
                }
                rows={2}
                placeholder="What should happen"
                className="rounded-xl border border-gray-100 bg-[#F8F9FE] px-3.5 py-2.5 text-xs font-medium text-[#101217] outline-none placeholder:text-gray-300 focus:border-[#6183FF] sm:col-span-2"
              />
            </div>
            <button
              type="submit"
              disabled={busy === 'defect'}
              className="mt-3 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-[#6183FF] px-4 text-[11px] font-bold text-white disabled:opacity-50"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Save defect
            </button>
          </form>

          {defects.length === 0 ? (
            <EmptyState
              title="No defects logged"
              body="Log anything that does not match the expected journey so it can be triaged."
            />
          ) : (
            <div className="space-y-3">
              {defects.map((defect) => (
                <article
                  key={defect.id}
                  className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#6183FF]">
                      {defect.area}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                        defect.severity === 'critical' || defect.severity === 'high'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {defect.severity}
                    </span>
                    <span className="rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                      {defect.status}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-[#101217]">{defect.title}</h3>
                  {defect.steps && (
                    <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                      {defect.steps}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] font-medium text-gray-400">
                    {formatDate(defect.created_at)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

type QaWithdrawal = {
  id: string;
  patient_id: string;
  amount_local: number;
  currency: string;
  status: string;
  bank_name: string | null;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
};

function WithdrawalsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<QaWithdrawal[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: listError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (listError) throw listError;

      const list = (data || []) as QaWithdrawal[];
      setRows(list);

      const ids = Array.from(new Set(list.map((row) => row.patient_id).filter(Boolean)));
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('patient_profiles')
          .select('id, full_name')
          .in('id', ids);

        const map: Record<string, string> = {};
        (profiles || []).forEach((profile: Record<string, any>) => {
          map[profile.id] = profile.full_name || 'Patient';
        });
        setNames(map);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawals could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (row: QaWithdrawal, status: string) => {
    setBusy(row.id);
    try {
      const { data, error: reviewError } = await supabase.rpc('review_withdrawal', {
        p_id: row.id,
        p_status: status,
        p_note: notes[row.id]?.trim() || null,
      });
      if (reviewError) throw reviewError;

      const result = data as { ok?: boolean; message?: string } | null;
      if (!result?.ok) throw new Error(result?.message || 'The withdrawal was not updated.');

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The withdrawal could not be updated.');
    } finally {
      setBusy(null);
    }
  };

  const pending = rows.filter((row) => row.status === 'pending').length;
  const processing = rows.filter((row) => row.status === 'processing').length;
  const paid = rows.filter((row) => row.status === 'paid').length;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Withdrawals
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Review payout requests and mark them paid or rejected. Patients are notified.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-semibold leading-relaxed text-red-600"
        >
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: pending, tone: 'text-amber-600 bg-amber-50' },
          { label: 'Processing', value: processing, tone: 'text-[#6183FF] bg-[#EEF2FF]' },
          { label: 'Paid', value: paid, tone: 'text-green-600 bg-green-50' },
        ].map((item) => (
          <div key={item.label} className="rounded-[20px] border border-gray-50 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
              {item.label}
            </p>
            <p className={`mt-1 inline-flex rounded-lg px-2 py-0.5 text-xl font-bold ${item.tone}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {loading && rows.length === 0 ? (
        <LoadingState label="Loading withdrawals" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No withdrawal requests"
          body="Requests appear here as soon as a patient asks for a payout."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const terminal = row.status === 'paid' || row.status === 'rejected';
            return (
              <article
                key={row.id}
                className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-[#101217]">
                        {formatNaira(Number(row.amount_local))}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                          row.status === 'paid'
                            ? 'bg-green-50 text-green-600'
                            : row.status === 'rejected'
                              ? 'bg-red-50 text-red-500'
                              : row.status === 'processing'
                                ? 'bg-[#EEF2FF] text-[#6183FF]'
                                : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#101217]">
                      {names[row.patient_id] || 'Patient'} · {row.account_name || 'No account name'}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                      {row.bank_name || 'Bank'} · {row.account_number || 'No account number'} ·
                      requested {formatDate(row.created_at)}
                    </p>
                    {row.admin_note && (
                      <p className="mt-1.5 rounded-lg bg-[#F8F9FE] px-2.5 py-1.5 text-[10px] font-medium text-gray-500">
                        Note: {row.admin_note}
                      </p>
                    )}
                  </div>

                  {!terminal && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void review(row, 'processing')}
                        disabled={busy === row.id}
                        className="min-h-[34px] rounded-full bg-[#EEF2FF] px-3 text-[9px] font-black uppercase tracking-[0.08em] text-[#6183FF] disabled:opacity-50"
                      >
                        Processing
                      </button>
                      <button
                        type="button"
                        onClick={() => void review(row, 'paid')}
                        disabled={busy === row.id}
                        className="min-h-[34px] rounded-full bg-green-50 px-3 text-[9px] font-black uppercase tracking-[0.08em] text-green-600 disabled:opacity-50"
                      >
                        Mark paid
                      </button>
                      <button
                        type="button"
                        onClick={() => void review(row, 'rejected')}
                        disabled={busy === row.id}
                        className="min-h-[34px] rounded-full bg-red-50 px-3 text-[9px] font-black uppercase tracking-[0.08em] text-red-500 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {!terminal && (
                  <input
                    value={notes[row.id] || ''}
                    onChange={(event) =>
                      setNotes((previous) => ({ ...previous, [row.id]: event.target.value }))
                    }
                    placeholder="Optional note shown to the patient"
                    className="mt-3 min-h-[38px] w-full rounded-xl border border-gray-100 bg-[#F8F9FE] px-3 text-[11px] font-medium text-[#101217] outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function UsersPage({
  rows,
  loading,
  onExport,
}: {
  rows: QaUser[];
  loading: boolean;
  onExport: () => void;
}) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const roles = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => set.add((row.role || 'unknown').toLowerCase()));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (role !== 'all' && (row.role || 'unknown').toLowerCase() !== role) return false;
      if (!needle) return true;
      return `${row.email} ${row.role} ${row.verification_status || ''}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query, role]);

  const copyEmail = async (row: QaUser) => {
    try {
      await navigator.clipboard.writeText(row.email);
      setCopiedId(row.id);
      window.setTimeout(() => setCopiedId((current) => (current === row.id ? null : current)), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Registered users
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            {rows.length.toLocaleString()} accounts across every portal. Updates appear live.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#4D6ED6] active:scale-[0.98]"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-[24px] border border-gray-50 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email, role, or verification"
            className="min-h-[42px] w-full rounded-xl border border-gray-100 bg-[#F8F9FE] pl-10 pr-3 text-xs font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
          />
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            type="button"
            onClick={() => setRole('all')}
            className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
              role === 'all' ? 'bg-[#6183FF] text-white' : 'bg-[#F8F9FE] text-gray-400'
            }`}
          >
            All
          </button>
          {roles.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition-colors ${
                role === item ? 'bg-[#6183FF] text-white' : 'bg-[#F8F9FE] text-gray-400'
              }`}
            >
              {roleLabel(item)}
            </button>
          ))}
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <LoadingState label="Loading accounts" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching accounts"
          body="Try a different search, or clear the role filter to see every registered account."
          action={{
            label: 'Clear filters',
            onClick: () => {
              setQuery('');
              setRole('all');
            },
          }}
        />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-gray-50 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.7fr_0.8fr_0.9fr_0.7fr_auto] gap-3 border-b border-gray-100 bg-[#F8F9FE] px-4 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-gray-400 sm:grid">
            <span>Account</span>
            <span>Role</span>
            <span>Verification</span>
            <span>Joined</span>
            <span className="text-right">Copy</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-[#F8F9FE] sm:grid-cols-[1.7fr_0.8fr_0.9fr_0.7fr_auto] sm:items-center sm:gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] text-[10px] font-black uppercase text-[#6183FF]">
                    {initials(row.email)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#101217]">{row.email}</p>
                    <p className="mt-0.5 text-[9px] font-medium text-gray-400">
                      ID {row.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${roleTone(
                    row.role
                  )}`}
                >
                  {roleLabel(row.role)}
                </span>
                <span
                  className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${
                    row.verification_status === 'verified'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {row.verification_status === 'verified' && <CheckBadgeIcon className="h-3 w-3" />}
                  {row.verification_status || 'pending'}
                </span>
                <p className="text-[10px] font-semibold text-gray-400">{formatDate(row.created_at)}</p>
                <button
                  type="button"
                  onClick={() => void copyEmail(row)}
                  aria-label={`Copy ${row.email}`}
                  className="flex h-8 w-8 items-center justify-center justify-self-end rounded-lg border border-gray-100 bg-white text-gray-300 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
                >
                  {copiedId === row.id ? (
                    <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
