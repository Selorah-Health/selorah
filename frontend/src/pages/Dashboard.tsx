// changed
import { useCallback, useEffect, useState } from 'react';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  WalletIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  CloudArrowUpIcon,
  PlusIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import SEOTitle from '../components/SEOTitle';
import { useToast } from '../contexts/ToastContext';
import { useSync } from '../contexts/SyncContext';

// Tab Components
import Home from '../components/dashboard/Home';
import Records from '../components/dashboard/Records';
import Research from '../components/dashboard/Research';
import Earnings from '../components/dashboard/Earnings';
import Profile from '../components/dashboard/Profile';
import Notifications from './Notifications';
import RecordDetails from './RecordDetails';
import AccessLog from './AccessLog';
import QRCodes from './QRCodes';
import AccessLogDetails from './AccessLogDetails';
import Security from './Security';
import Billing from './Billing';
import Family from './Family';
import AddRecordModal from '../components/dashboard/AddRecordModal';
import {
  cacheRecords,
  readCachedRecords,
  RECORDS_EVENT,
  type CachedRecord,
} from '../lib/offline/records';

export interface DashboardRecord extends CachedRecord {
  pending?: boolean;
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<DashboardRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'scan' | 'upload' | 'manual' | 'profile'>('scan');
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();
  const { success, error: toastError } = useToast();
  const { pending } = useSync();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchRecords = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!silent) setLoading(true);
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          const cached = await readCachedRecords();
          setRecords(cached);
          return;
        }

        const { data: patientProfile } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        let dbRecords: DashboardRecord[] = [];
        if (patientProfile) {
          const { data, error } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', patientProfile.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data) {
            const PROFILE_TYPES = new Set(['vital', 'allergy', 'history', 'emergency contact', 'note']);
            const PROFILE_TITLES = new Set([
              'height',
              'weight',
              'blood group',
              'genotype',
              'allergies',
              'family history',
              'medication history',
              'emergency contact',
            ]);
            dbRecords = data
              .filter((record: any) => {
                const type = (record.record_type || '').toLowerCase();
                const title = (record.title || '').toLowerCase();
                if (PROFILE_TYPES.has(type)) return false;
                if (PROFILE_TITLES.has(title)) return false;
                return true;
              })
              .map((record: any) => ({
                id: record.id,
                name: record.title || record.name || 'Clinical Document',
                date: record.created_at ? new Date(record.created_at).toLocaleDateString() : '',
                status: record.status === 'active' ? 'Encrypted' : record.status || 'Private',
                icon: '/assets/total-records-card-icon.png',
                document_url: record.file_url || record.document_url,
                record_type: record.record_type,
                created_at: record.created_at,
                ocrText: record.ocr_text || undefined,
                notes: record.notes || undefined,
                capturedVia: record.captured_via || undefined,
              }));
          }
        }

        const cached = await readCachedRecords();
        const pendingRecords = cached.filter(
          (record) => record.pending && !dbRecords.some((item) => item.id === record.id)
        );

        await cacheRecords(dbRecords);
        setRecords([...pendingRecords, ...dbRecords]);
      } catch (err) {
        console.error('Failed to fetch records:', err);
        const cached = await readCachedRecords();
        if (cached.length) setRecords(cached);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    async function getUser() {
      try {
        const saved = localStorage.getItem('selorah_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUser({
              email: parsed.email || parsed.phone,
              user_metadata: {
                first_name: parsed.first_name || parsed.name?.split(' ')[0] || 'User',
                last_name: parsed.last_name || '',
                is_pro: parsed.is_pro || false,
              },
            });
          } catch {
            /* ignore */
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const authUser = session?.user;
        if (authUser) {
          setUser(authUser);
          localStorage.setItem(
            'selorah_user',
            JSON.stringify({
              email: authUser.email,
              first_name: authUser.user_metadata?.first_name,
              last_name: authUser.user_metadata?.last_name,
              is_pro: authUser.user_metadata?.is_pro,
            })
          );
        }
        await fetchRecords({ silent: true });
      } catch {
        await fetchRecords({ silent: true });
      }
    }

    getUser();

    const handleStorageChange = () => getUser();
    const handleRecords = () => fetchRecords({ silent: true });
    const handleNotifications = () => {
      setHasUnread(localStorage.getItem('selorah_notifications_seen') !== '1');
    };

    setHasUnread(localStorage.getItem('selorah_notifications_seen') !== '1');
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(RECORDS_EVENT, handleRecords);
    window.addEventListener('selorah:notifications-seen', handleNotifications);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(RECORDS_EVENT, handleRecords);
      window.removeEventListener('selorah:notifications-seen', handleNotifications);
    };
  }, [fetchRecords, supabase]);

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
    localStorage.removeItem('selorah_user');
    navigate('/login');
    void supabase.auth.signOut();
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon, path: '/dashboard' },
    { name: 'Records', icon: DocumentDuplicateIcon, path: '/dashboard/records' },
    { name: 'Research', icon: BeakerIcon, path: '/dashboard/research' },
    { name: 'Earnings', icon: WalletIcon, path: '/dashboard/earnings' },
  ];

  const avatarGradient = 'bg-gradient-to-tr from-[#14F1D9] to-[#3672F8]';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/dashboard/records')) return 'My Medical Records';
    if (path === '/dashboard/research') return 'Research';
    if (path === '/dashboard/earnings') return 'My Earnings';
    if (path === '/dashboard/profile') return 'Profile & Settings';
    if (path === '/dashboard/notifications') return 'Notifications';
    if (path.startsWith('/dashboard/access-log')) return 'Access Log';
    if (path === '/dashboard/qrcodes') return 'QR Codes';
    if (path === '/dashboard/security') return 'Security';
    if (path === '/dashboard/billing') return 'Billing';
    if (path === '/dashboard/family') return 'Family';
    return 'Dashboard';
  };

  const openAdd = (mode: typeof addMode = 'scan') => {
    setAddMode(mode);
    setShowAddModal(true);
  };

  return (
    <div className="app-shell flex overflow-hidden bg-[#F8F9FE] font-sora selection:bg-primary/30">
      <SEOTitle title={getPageTitle()} />

      {/* Sidebar - Collapsible */}
      <aside
        className={`hidden md:flex transition-all duration-300 ${
          isCollapsed ? 'w-[80px]' : 'w-[260px]'
        } bg-[#6183FF] text-white flex-col shrink-0 h-full relative z-50`}
      >
        <div className={`p-6 pb-4 border-b border-white/10 ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Selorah" className="w-10 h-10 object-contain shrink-0" />
              {!isCollapsed && <span className="font-bold text-xl tracking-tight">Selorah</span>}
            </div>
            <button
              type="button"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="text-white opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <img src="/assets/menu-closed.png" alt="" className="w-5 h-5 object-contain" />
            </button>
          </div>
        </div>

        <div className={`py-6 border-b border-white/10 ${isCollapsed ? 'px-3' : 'px-5'}`}>
          <button
            type="button"
            onClick={() => openAdd('scan')}
            className={`w-full border-2 border-dashed border-white/30 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-white/10 transition-all ${
              isCollapsed ? 'px-0' : ''
            }`}
            title="Add a Record"
          >
            <CloudArrowUpIcon className="w-5 h-5 text-white shrink-0" />
            {!isCollapsed && (
              <span className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis">
                Add a Record
              </span>
            )}
          </button>
        </div>

        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide ${isCollapsed ? 'px-3' : 'px-3'}`}>
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              title={item.name}
              className={({ isActive }) =>
                `w-full flex items-center px-5 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-white/20 font-bold' : 'hover:bg-white/5 text-white/80 hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-base tracking-tight whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
          <NavLink
            to="/dashboard/qrcodes"
            className={({ isActive }) =>
              `w-full flex items-center px-5 py-3 rounded-xl transition-all ${
                isActive ? 'bg-white/20 font-bold' : 'hover:bg-white/5 text-white/80 hover:text-white'
              } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`
            }
          >
            <QrCodeIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-base tracking-tight whitespace-nowrap">QR Codes</span>}
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6 pb-6">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `mb-6 flex items-center gap-3 transition-all rounded-xl mx-3 p-2 ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              } ${isCollapsed ? 'justify-center flex-col' : ''}`
            }
          >
            <div
              className="relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center p-[2px] shadow-sm"
              style={{
                backgroundImage: "url('/assets/custom-profile-icon-ring.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className={`w-full h-full rounded-full ${avatarGradient}`}></div>
              <div
                className={`absolute ${
                  isCollapsed ? '-bottom-2' : '-bottom-1 -right-2'
                } bg-[#DCE4FF] text-[#6183FF] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap z-10`}
              >
                PRO
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-base leading-tight text-white">
                  {user?.user_metadata?.first_name || 'User'}
                </p>
                <p className="text-white/40 text-[11px] truncate font-medium">{user?.email || ''}</p>
              </div>
            )}
          </NavLink>

          <div className={`${isCollapsed ? 'px-3' : 'px-5'}`}>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className={`w-full bg-[#83A0FF] py-3 rounded-full flex items-center justify-center gap-3 hover:bg-white/30 transition-all font-bold text-base text-white shadow-sm ${
                isCollapsed ? 'px-0' : ''
              }`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="safe-top h-[calc(64px+env(safe-area-inset-top))] shrink-0 bg-transparent px-4 md:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-xl font-bold tracking-tight text-[#101217] sm:text-2xl">
                {getPageTitle()}
              </h1>
              {pending > 0 && (
                <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 sm:inline-flex">
                  {pending} queued
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden md:block w-[320px]">
                <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for records..."
                  className="w-full bg-transparent border border-gray-200 rounded-full py-2.5 pl-12 pr-6 text-sm focus:outline-none focus:border-[#6183FF] transition-all placeholder:text-gray-300 font-medium"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      navigate('/dashboard/records');
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/notifications')}
                  aria-label={hasUnread ? 'Notifications, unread' : 'Notifications'}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105 sm:h-11 sm:w-11"
                >
                  <img
                    src="/assets/custom-notification-icon.png"
                    alt=""
                    className="h-full w-full object-contain drop-shadow-sm"
                  />
                  {hasUnread && (
                    <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-[#6183FF]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard/qrcodes')}
                  aria-label="Open QR sharing"
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105 sm:h-11 sm:w-11"
                >
                  <img
                    src="/assets/custom-qr-code-icon.png"
                    alt=""
                    className="h-full w-full object-contain drop-shadow-sm"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard/profile')}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full p-[2px] shadow-sm sm:h-11 sm:w-11"
                  style={{
                    backgroundImage: "url('/assets/custom-profile-icon-ring.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-label="Open profile"
                >
                  <div className={`w-full h-full rounded-full ${avatarGradient}`}></div>
                  {user?.user_metadata?.is_pro && (
                    <div className="absolute -bottom-1 -right-1 bg-[#DCE4FF] text-[#6183FF] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm z-10">
                      PRO
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] space-y-8 scrollbar-hide md:p-8 md:pb-8 lg:p-12 lg:pb-12">
          <Routes>
            <Route
              index
              element={<Home user={user} records={records} getFormattedDate={getFormattedDate} />}
            />
            <Route
              path="records"
              element={<Records records={records} handleUploadClick={() => openAdd('scan')} />}
            />
            <Route path="records/:id" element={<RecordDetails />} />
            <Route path="research" element={<Research />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="profile" element={<Profile user={user} avatarGradient={avatarGradient} />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="access-log" element={<AccessLog />} />
            <Route path="access-log/:id" element={<AccessLogDetails />} />
            <Route path="qrcodes" element={<QRCodes records={records} />} />
            <Route path="security" element={<Security />} />
            <Route path="billing" element={<Billing />} />
            <Route path="family" element={<Family />} />
          </Routes>

          <div className="text-center py-6 opacity-30">
            <p className="text-[#101217] text-[10px] font-normal">
              Copyright (c) 2026, Selorah Health Limited. All rights reserved.
            </p>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="grid grid-cols-5 items-end px-1 pt-2">
            {menuItems.slice(0, 2).map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-all ${
                    isActive ? 'text-[#6183FF]' : 'text-gray-400'
                  }`
                }
              >
                <item.icon className="h-6 w-6" />
                <span className="text-[10px] font-bold">{item.name}</span>
              </NavLink>
            ))}

            <button
              type="button"
              onClick={() => openAdd('scan')}
              className="flex flex-col items-center justify-center gap-1 pb-1 text-[#6183FF]"
              aria-label="Add a record"
            >
              <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#6183FF] text-white shadow-xl shadow-blue-500/30 ring-4 ring-white">
                <PlusIcon className="h-7 w-7" />
              </span>
              <span className="text-[10px] font-bold">Add</span>
            </button>

            {menuItems.slice(2).map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-all ${
                    isActive ? 'text-[#6183FF]' : 'text-gray-400'
                  }`
                }
              >
                <item.icon className="h-6 w-6" />
                <span className="text-[10px] font-bold">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </main>

      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultMode={addMode}
        onSaved={() => fetchRecords({ silent: true })}
      />
    </div>
  );
}
