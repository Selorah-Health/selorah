import { useState, useEffect, useRef } from 'react';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  WalletIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  CloudArrowUpIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import SEOTitle from '../components/SEOTitle';

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

interface Record {
  id: string;
  name: string;
  date: string;
  status: string;
  icon: string;
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
        const savedUser = localStorage.getItem('selorah_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser({
            email: parsed.email || parsed.phone,
            user_metadata: {
              first_name: parsed.first_name,
              last_name: parsed.last_name,
              is_pro: parsed.is_pro
            }
          });
          fetchRecords(parsed.first_name);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setUser({ email: 'user@selorah.com', user_metadata: { first_name: 'Guest', is_pro: false } });
            fetchRecords('Guest');
          } else {
            setUser(user);
            fetchRecords(user.user_metadata?.first_name || 'User');
          }
        }
      } catch (err) {
        setUser({ email: 'user@selorah.com', user_metadata: { first_name: 'User', is_pro: false } });
        fetchRecords('User');
      }
    }

    getUser();

    // Listen for storage changes (for real-time plan/profile updates)
    const handleStorageChange = () => getUser();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getFormattedDate = () => {
    const date = new Date();
    const day = date.getDate();
    const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || Math.floor(day % 100 / 10) === 1) ? 0 : day % 10];
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${weekday}, ${day}${suffix} ${month} ${year}`;
  };

  const fetchRecords = async (name: string) => {
    setLoading(true);
    try {
      setRecords([
        { id: '1', name: `${name}'s Health Checkup`, date: 'Today • Selorah Medical Center', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
        { id: '2', name: 'SNH Lab Result', date: 'Yesterday • St. Nicholas Hospital • Lagos Island', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
        { id: '3', name: 'Metformin 500mg Prescription', date: '03/15/2026 • Igando General Hospital', status: 'Encrypted', icon: '/assets/custom-prescription-icon.png' },
        { id: '4', name: 'YFB Vaccination', date: '03/16/2026 • Self-reported', status: 'Shared Once', icon: '/assets/custom-vaccination-icon.png' },
        { id: '5', name: 'HSH Lab Result', date: '01/10/2026 • Havana Specialist Hospital', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
      ]);
    } catch (err) { } finally { setLoading(false); }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    // For demo: Create a data URL and save to localStorage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      localStorage.setItem('selorah_demo_upload', base64String);
      setUploading(false);
      alert('Record uploaded successfully! You can now see it in your records list.');
      // Dispatch storage event to update other tabs
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('selorah_user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon, path: '/dashboard' },
    { name: 'Records', icon: DocumentDuplicateIcon, path: '/dashboard/records' },
    { name: 'Research', icon: BeakerIcon, path: '/dashboard/research' },
    { name: 'Earnings', icon: WalletIcon, path: '/dashboard/earnings' },
  ];

  // Random gradient for new users
  const avatarGradient = "bg-gradient-to-tr from-[#14F1D9] to-[#3672F8]";

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/dashboard/records')) return 'My Medical Records';
    if (path === '/dashboard/research') return 'Research';
    if (path === '/dashboard/earnings') return 'My Earnings';
    if (path === '/dashboard/profile') return 'Profile & Settings';
    if (path === '/dashboard/notifications') return 'Notifications';
    if (path === '/dashboard/access-log') return 'Access Log';
    if (path === '/dashboard/qrcodes') return 'QR Codes';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#F8F9FE] overflow-hidden font-sora selection:bg-primary/30">
      <SEOTitle title={getPageTitle()} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Sidebar - Collapsible */}
      <aside className={`hidden md:flex transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-[#6183FF] text-white flex-col shrink-0 h-full relative z-50`}>
        {/* Top Section */}
        <div className={`p-6 pb-4 border-b border-white/10 ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain shrink-0" />
              {!isCollapsed && <span className="font-bold text-xl tracking-tight">Selorah</span>}
            </div>
            <button className="text-white opacity-80 hover:opacity-100 transition-opacity" onClick={() => setIsCollapsed(!isCollapsed)}>
              <img src="/assets/menu-closed.png" alt="M" className="w-5 h-5 object-contain" />
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <div className={`py-6 border-b border-white/10 ${isCollapsed ? 'px-3' : 'px-5'}`}>
          <button
            onClick={handleUploadClick}
            className={`w-full border-2 border-dashed border-white/30 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-white/10 transition-all ${isCollapsed ? 'px-0' : ''}`}
            title="Upload Record"
          >
            <CloudArrowUpIcon className="w-5 h-5 text-white shrink-0" />
            {!isCollapsed && <span className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis">Upload Record</span>}
          </button>
        </div>

        {/* Nav Section */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide ${isCollapsed ? 'px-3' : 'px-3'}`}>
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              title={item.name}
              className={({ isActive }) =>
                `w-full flex items-center px-5 py-3 rounded-xl transition-all ${isActive ? 'bg-white/20 font-bold' : 'hover:bg-white/5 text-white/80 hover:text-white'} ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-base tracking-tight whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section with Logout */}
        <div className="mt-auto border-t border-white/10 pt-6 pb-6">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `mb-6 flex items-center gap-3 transition-all rounded-xl mx-3 p-2 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'} ${isCollapsed ? 'justify-center flex-col' : ''}`
            }
          >
            <div className="relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center p-[2px] shadow-sm" style={{ backgroundImage: "url('/assets/custom-profile-icon-ring.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className={`w-full h-full rounded-full ${avatarGradient}`}></div>
              <div className={`absolute ${isCollapsed ? '-bottom-2' : '-bottom-1 -right-2'} bg-[#DCE4FF] text-[#6183FF] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm whitespace-nowrap z-10`}>
                PRO
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-base leading-tight text-white">{user?.user_metadata?.first_name || 'User'}</p>
                <p className="text-white/40 text-[11px] truncate font-medium">{user?.email || 'use..ail@gmail.com'}</p>
              </div>
            )}
          </NavLink>

          <div className={`${isCollapsed ? 'px-3' : 'px-5'}`}>
            <button
              onClick={handleLogout}
              title="Logout"
              className={`w-full bg-[#83A0FF] py-3 rounded-full flex items-center justify-center gap-3 hover:bg-white/30 transition-all font-bold text-base text-white shadow-sm ${isCollapsed ? 'px-0' : ''}`}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Transparent, smaller elements */}
        <header className="h-[70px] bg-transparent flex items-center justify-between px-4 md:px-8 lg:px-12 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#101217] tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-[320px]">
              <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for records..."
                className="w-full bg-transparent border border-gray-200 rounded-full py-2.5 pl-12 pr-6 text-sm focus:outline-none focus:border-[#6183FF] transition-all placeholder:text-gray-300 font-medium"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate('/dashboard/notifications')}
                className="relative w-fit h-fit hover:scale-105 transition-transform"
              >
                <img
                  src="/assets/custom-notification-icon.png"
                  alt="N"
                  className=" w-18 h-18 relative object-contain drop-shadow-sm"
                />
                <div className="absolute top-3.5 right-4 w-3.5 h-3.5 bg-[#6183FF] rounded-full border-2 border-white"></div>
              </button>

              <button
                onClick={() => navigate('/dashboard/qrcodes')}
                className="w-fit h-fit hover:scale-105 transition-transform"
              >
                <img
                  src="/assets/custom-qr-code-icon.png"
                  alt="Q"
                  className="w-18 h-18 object-contain drop-shadow-sm"
                />
              </button>

              <button onClick={() => navigate('/dashboard/profile')} className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center p-[2px] shadow-sm relative" style={{ backgroundImage: "url('/assets/custom-profile-icon-ring.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className={`w-full h-full rounded-full ${avatarGradient}`}></div>
                </div>
                {user?.user_metadata?.is_pro && (
                  <div className="absolute -bottom-1 -right-1 bg-[#DCE4FF] text-[#6183FF] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm z-10">
                    PRO
                  </div>
                )}
              </button>
            </div>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-8 lg:pb-12 space-y-10 scrollbar-hide pt-4">
          <Routes>
            <Route index element={<Home user={user} records={records} getFormattedDate={getFormattedDate} />} />
            <Route path="records" element={<Records records={records} handleUploadClick={handleUploadClick} />} />
            <Route path="records/:id" element={<RecordDetails />} />
            <Route path="research" element={<Research />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="profile" element={<Profile user={user} avatarGradient={avatarGradient} />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="access-log" element={<AccessLog />} />
            <Route path="access-log/:id" element={<AccessLogDetails />} />
            <Route path="qrcodes" element={<QRCodes />} />
            <Route path="security" element={<Security />} />
            <Route path="billing" element={<Billing />} />
            <Route path="family" element={<Family />} />
          </Routes>

          <div className="text-center py-6 opacity-30"><p className="text-[#101217] text-[10px] font-normal">Copyright (c) 2026, Selorah Health Limited. All rights reserved.</p></div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-[#6183FF]' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
}
