import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BeakerIcon,
  BellIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  WalletIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import SEOTitle from '../components/SEOTitle';
import { clearLocalSession, readLocalSession, writeLocalSession } from '../lib/auth/session';
import { fetchMedicalRecords, type MedicalRecord } from '../lib/records';
import { readProState } from '../lib/pro';
import { prewarmOcr } from '../lib/ocr';

// Tab Components
import Home from '../components/dashboard/Home';
import Records from '../components/dashboard/Records';
import Research from '../components/dashboard/Research';
import Earnings from '../components/dashboard/Earnings';
import Profile from '../components/dashboard/Profile';
import AddRecordModal from '../components/dashboard/AddRecordModal';
import Notifications from './Notifications';
import RecordDetails from './RecordDetails';
import AccessLog from './AccessLog';
import QRCodes from './QRCodes';
import AccessLogDetails from './AccessLogDetails';
import Security from './Security';
import Billing from './Billing';
import Family from './Family';

export type RecentAccess = {
  id: string;
  title: string;
  action: string;
  date: string;
  color: string;
};

export type DashboardSummary = {
  activeGrants: number;
  recentAccess: RecentAccess[];
  unreadNotifications: number;
};

const EMPTY_SUMMARY: DashboardSummary = {
  activeGrants: 0,
  recentAccess: [],
  unreadNotifications: 0,
};

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [isPro, setIsPro] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();

  const loadSummary = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    const next: DashboardSummary = { ...EMPTY_SUMMARY };

    try {
      const { data: links } = await supabase
        .from('shared_links')
        .select('id, created_at, expires_at, is_active')
        .eq('user_id', authUser.id)
        .eq('is_active', true);

      const now = Date.now();
      next.activeGrants = (links || []).filter(
        (link: { expires_at?: string | null }) =>
          !link.expires_at || new Date(link.expires_at).getTime() > now
      ).length;
    } catch {
      // Shared links are optional on older projects.
    }

    try {
      const { data: logs } = await supabase
        .from('access_logs')
        .select('*')
        .eq('user_id', authUser.id)
        .order('accessed_at', { ascending: false })
        .limit(5);

      next.recentAccess = (logs || []).map((log: Record<string, any>) => ({
        id: String(log.id),
        title: log.organization_name || log.provider_name || 'Verified provider',
        action: log.action || 'Viewed your medical record',
        date: log.accessed_at
          ? new Date(log.accessed_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          : '',
        color: log.color || 'bg-[#6183FF]',
      }));
    } catch {
      // Access logs are optional on older projects.
    }

    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, is_read')
        .eq('user_id', authUser.id);

      next.unreadNotifications = (notifications || []).filter(
        (item: { is_read?: boolean }) => !item.is_read
      ).length;
    } catch {
      // Notifications are optional on older projects.
    }

    setSummary(next);
  }, [supabase]);

  const loadRecords = useCallback(async () => {
    try {
      const rows = await fetchMedicalRecords(supabase);
      setRecords(rows);
    } catch (error) {
      console.error('Failed to load records:', error);
      setRecords([]);
    }
  }, [supabase]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadRecords(), loadSummary()]);
  }, [loadRecords, loadSummary]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const local = readLocalSession();
      if (local) {
        setUser((prev: any) => prev || {
          email: local.email || local.phone,
          user_metadata: {
            first_name: local.first_name || 'User',
            last_name: local.last_name || '',
            is_pro: local.is_pro || false,
          },
        });
        setIsPro(Boolean(local.is_pro));
      }

      const proState = readProState();
      if (proState.active) setIsPro(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const authUser = session.user;
        setUser(authUser);

        const storedPro = readProState();
        const proFromMeta =
          Boolean(authUser.user_metadata?.is_pro) ||
          (authUser.user_metadata?.pro_expires_at
            ? new Date(authUser.user_metadata.pro_expires_at).getTime() > Date.now()
            : false);
        setIsPro(storedPro.active || proFromMeta);

        writeLocalSession({
          id: authUser.id,
          email: authUser.email,
          first_name: authUser.user_metadata?.first_name,
          last_name: authUser.user_metadata?.last_name,
          is_pro: storedPro.active || proFromMeta,
        });

        await Promise.all([loadRecords(), loadSummary()]);
      } catch (error) {
        console.error('Dashboard bootstrap failed:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();

    const handleProUpdate = () => {
      const proState = readProState();
      setIsPro(proState.active);
    };
    const handleStorage = () => {
      const local = readLocalSession();
      if (local) {
        setIsPro(Boolean(local.is_pro));
        setUser((prev: any) =>
          prev
            ? {
                ...prev,
                user_metadata: {
                  ...prev.user_metadata,
                  first_name: local.first_name || prev.user_metadata?.first_name,
                  last_name: local.last_name || prev.user_metadata?.last_name,
                },
              }
            : prev
        );
      }
    };

    window.addEventListener('selorah:pro-updated', handleProUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('selorah:pro-updated', handleProUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [supabase, loadRecords, loadSummary]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Download the OCR engine while the patient is browsing, so the first
    // scan does not wait for a large language file.
    const timer = window.setTimeout(() => {
      void prewarmOcr();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous || '';
    };
  }, [isSidebarOpen]);

  const getFormattedDate = () => {
    const date = new Date();
    const day = date.getDate();
    const suffix = ['th', 'st', 'nd', 'rd'][
      day % 10 > 3 || Math.floor((day % 100) / 10) === 1 ? 0 : day % 10
    ];
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${weekday}, ${day}${suffix} ${month} ${year}`;
  };

  const handleLogout = () => {
    clearLocalSession();
    navigate('/login');
    void supabase.auth.signOut();
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (location.pathname !== '/dashboard' && location.pathname !== '/dashboard/records') {
      navigate('/dashboard/records');
    }
  };

  const primaryItems = [
    { name: 'Home', icon: HomeIcon, path: '/dashboard' },
    { name: 'Records', icon: DocumentDuplicateIcon, path: '/dashboard/records' },
    { name: 'Research', icon: BeakerIcon, path: '/dashboard/research' },
    { name: 'Earnings', icon: WalletIcon, path: '/dashboard/earnings' },
  ];

  const secondaryItems = [
    { name: 'Access log', icon: ShieldCheckIcon, path: '/dashboard/access-log' },
    { name: 'QR codes', icon: QrCodeIcon, path: '/dashboard/qrcodes' },
  ];

  const filteredRecords = search.trim()
    ? records.filter((record) => {
        const needle = search.trim().toLowerCase();
        return (
          record.name.toLowerCase().includes(needle) ||
          (record.record_type || '').toLowerCase().includes(needle) ||
          record.date.toLowerCase().includes(needle)
        );
      })
    : records;

  const avatarGradient = 'bg-gradient-to-tr from-[#14F1D9] to-[#3672F8]';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    if (path.startsWith('/dashboard/records')) return 'Medical records';
    if (path === '/dashboard/research') return 'Research';
    if (path === '/dashboard/earnings') return 'Earnings';
    if (path === '/dashboard/profile') return 'Profile and settings';
    if (path === '/dashboard/notifications') return 'Notifications';
    if (path === '/dashboard/access-log') return 'Access log';
    if (path === '/dashboard/qrcodes') return 'QR codes';
    if (path === '/dashboard/billing') return 'Billing';
    if (path === '/dashboard/security') return 'Security';
    if (path === '/dashboard/family') return 'Family';
    return 'Dashboard';
  };

  const displayName =
    user?.user_metadata?.first_name ||
    readLocalSession()?.first_name ||
    user?.email?.split('@')[0] ||
    'there';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FE] font-sora selection:bg-primary/30">
      <SEOTitle title={getPageTitle()} />

      <aside
        className={`relative z-50 hidden h-full shrink-0 flex-col bg-[#6183FF] text-white transition-all duration-300 md:flex ${
          isCollapsed ? 'w-[84px]' : 'w-[264px]'
        }`}
      >
        <div className={`border-b border-white/10 p-5 pb-4 ${isCollapsed ? 'px-4' : ''}`}>
          <div
            className={`flex items-center ${
              isCollapsed ? 'flex-col justify-center gap-4' : 'justify-between'
            }`}
          >
            <NavLink to="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="" className="h-9 w-9 shrink-0 object-contain" />
              {!isCollapsed && (
                <span className="text-lg font-bold tracking-tight">Selorah</span>
              )}
            </NavLink>
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={() => setIsCollapsed((value) => !value)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={`border-b border-white/10 py-5 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={`flex w-full items-center justify-center gap-2.5 rounded-2xl border border-dashed border-white/35 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="Add a record"
          >
            <CloudArrowUpIcon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Add a record</span>}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
          {primaryItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              title={item.name}
              className={({ isActive }) =>
                `flex w-full items-center rounded-xl px-4 py-3 transition-all ${
                  isActive
                    ? 'bg-white/20 font-bold text-white'
                    : 'text-white/75 hover:bg-white/5 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm tracking-tight">{item.name}</span>}
            </NavLink>
          ))}

          {!isCollapsed && (
            <p className="px-4 pb-1 pt-5 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
              Security
            </p>
          )}
          {secondaryItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                `flex w-full items-center rounded-xl px-4 py-3 transition-all ${
                  isActive
                    ? 'bg-white/20 font-bold text-white'
                    : 'text-white/75 hover:bg-white/5 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm tracking-tight">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pb-5 pt-5">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `mx-3 mb-4 flex items-center gap-3 rounded-xl p-2 transition-all ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            <div
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-[2px] shadow-sm"
              style={{
                backgroundImage: "url('/assets/custom-profile-icon-ring.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className={`h-full w-full rounded-full ${avatarGradient}`} />
              <div
                className={`absolute ${
                  isCollapsed ? '-bottom-2' : '-bottom-1 -right-1'
                } z-10 rounded-full border-2 border-white bg-[#DCE4FF] px-1.5 py-0.5 text-[8px] font-black uppercase text-[#6183FF] shadow-sm`}
              >
                {isPro ? 'Pro' : 'Free'}
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight text-white">
                  {user?.user_metadata?.first_name || 'Your profile'}
                </p>
                <p className="truncate text-[11px] font-medium text-white/45">
                  {user?.email || ''}
                </p>
              </div>
            )}
          </NavLink>

          <div className={isCollapsed ? 'px-3' : 'px-4'}>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className={`flex w-full items-center justify-center gap-2.5 rounded-full bg-white/15 py-3 text-sm font-bold text-white transition-colors hover:bg-white/25 ${
                isCollapsed ? 'px-0' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-5 md:px-8 md:pb-4 md:pt-6 lg:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 md:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6183FF] md:hidden">
                Selorah
              </p>
              <h1 className="truncate text-xl font-bold tracking-tight text-[#101217] md:text-2xl">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden w-[300px] md:block lg:w-[340px]">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <input
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search records..."
                className="min-h-[44px] w-full rounded-full border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-[#6183FF]"
              />
            </div>

            <button
              type="button"
              onClick={() => setMobileSearchOpen((value) => !value)}
              aria-label="Search records"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 md:hidden"
            >
              {mobileSearchOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/qrcodes')}
              aria-label="Open QR codes"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] sm:flex"
            >
              <QrCodeIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/notifications')}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
            >
              <BellIcon className="h-5 w-5" />
              {summary.unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6183FF] opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-white bg-[#6183FF]" />
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/profile')}
              aria-label="Open profile"
              className="relative flex h-10 w-10 items-center justify-center rounded-full p-[2px] shadow-sm"
              style={{
                backgroundImage: "url('/assets/custom-profile-icon-ring.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className={`h-full w-full rounded-full ${avatarGradient}`} />
              {isPro && (
                <span className="absolute -bottom-1 -right-1 z-10 rounded-full border-2 border-white bg-[#DCE4FF] px-1.5 py-0.5 text-[8px] font-black uppercase text-[#6183FF]">
                  Pro
                </span>
              )}
            </button>
          </div>
        </header>

        {mobileSearchOpen && (
          <div className="px-4 pb-3 md:hidden">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <input
                type="search"
                autoFocus
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search records by name or type"
                className="min-h-[46px] w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
              />
            </div>
          </div>
        )}

        <div className="flex-1 space-y-8 overflow-y-auto px-4 pb-28 pt-3 scrollbar-hide md:px-8 md:pb-10 lg:px-12">
          {loading ? (
            <div className="space-y-5">
              <div className="h-24 animate-pulse rounded-[24px] bg-white" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-36 animate-pulse rounded-[24px] bg-white" />
                ))}
              </div>
            </div>
          ) : (
            <Routes>
              <Route
                index
                element={
                  <Home
                    user={user}
                    displayName={displayName}
                    records={filteredRecords}
                    getFormattedDate={getFormattedDate}
                    isPro={isPro}
                    summary={summary}
                    onAddRecord={() => setShowAddModal(true)}
                    searchActive={Boolean(search.trim())}
                  />
                }
              />
              <Route
                path="records"
                element={
                  <Records
                    records={filteredRecords}
                    handleUploadClick={() => setShowAddModal(true)}
                    activeGrants={summary.activeGrants}
                    recentAccess={summary.recentAccess}
                    searchActive={Boolean(search.trim())}
                  />
                }
              />
              <Route path="records/:id" element={<RecordDetails />} />
              <Route path="research" element={<Research />} />
              <Route path="earnings" element={<Earnings />} />
              <Route
                path="profile"
                element={<Profile user={user} avatarGradient={avatarGradient} isPro={isPro} />}
              />
              <Route path="notifications" element={<Notifications />} />
              <Route path="access-log" element={<AccessLog />} />
              <Route path="access-log/:id" element={<AccessLogDetails />} />
              <Route path="qrcodes" element={<QRCodes />} />
              <Route path="security" element={<Security />} />
              <Route path="billing" element={<Billing />} />
              <Route path="family" element={<Family />} />
            </Routes>
          )}

          <div className="py-4 text-center opacity-40">
            <p className="text-[10px] font-medium text-[#101217]">
              Copyright (c) 2026, Selorah Health Limited. All rights reserved.
            </p>
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-gray-100 bg-white/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_24px_rgba(0,0,0,0.04)] backdrop-blur-lg md:hidden">
          {[
            { name: 'Home', icon: HomeIcon, path: '/dashboard' },
            { name: 'Records', icon: DocumentDuplicateIcon, path: '/dashboard/records' },
          ].map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex min-w-[54px] flex-col items-center gap-1 rounded-xl py-1.5 transition-all ${
                  isActive ? 'text-[#6183FF]' : 'text-gray-400'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-bold">{item.name}</span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            aria-label="Add a record"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#6183FF] text-white shadow-xl shadow-[#6183FF]/35 transition-transform active:scale-95"
          >
            <PlusIcon className="h-6 w-6" />
          </button>

          {[
            { name: 'Research', icon: BeakerIcon, path: '/dashboard/research' },
            { name: 'Profile', icon: UserCircleSmall, path: '/dashboard/profile' },
          ].map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex min-w-[54px] flex-col items-center gap-1 rounded-xl py-1.5 transition-all ${
                  isActive ? 'text-[#6183FF]' : 'text-gray-400'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] font-bold">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <div
            className="absolute inset-0 bg-[#05081A]/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[320px] flex-col bg-[#020924] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" />
                <span className="text-lg font-bold">Selorah</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(true);
                  setIsSidebarOpen(false);
                }}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] py-3.5 text-sm font-bold text-white"
              >
                <PlusIcon className="h-5 w-5" />
                Add a record
              </button>

              <div className="space-y-1">
                {primaryItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? 'bg-white/10 font-bold text-white'
                          : 'text-white/65 hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </div>

              <p className="px-4 pb-1 pt-6 text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                Security
              </p>
              <div className="space-y-1">
                {[
                  ...secondaryItems,
                  { name: 'Notifications', icon: BellIcon, path: '/dashboard/notifications' },
                  { name: 'Billing', icon: WalletIcon, path: '/dashboard/billing' },
                ].map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? 'bg-white/10 font-bold text-white'
                          : 'text-white/65 hover:bg-white/5'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-bold text-white/85"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={refreshData}
      />
    </div>
  );
}

function UserCircleSmall({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18a6 6 0 0 1 11 0" strokeLinecap="round" />
    </svg>
  );
}
