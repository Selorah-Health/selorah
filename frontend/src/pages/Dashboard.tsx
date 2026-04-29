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
import { useNavigate } from 'react-router-dom';

interface Record {
  id: string;
  name: string;
  date: string;
  status: string;
  icon: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const supabase = createClient();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUser({ email: 'use..ail@gmail.com', user_metadata: { first_name: 'User' } });
          fetchRecords('mock-id');
          return;
        }
        setUser(user);
        fetchRecords(user.id);
      } catch (err) {
        setUser({ email: 'use..ail@gmail.com', user_metadata: { first_name: 'User' } });
        fetchRecords('mock-id');
      }
    }
    getUser();
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

  const fetchRecords = async (userId: string) => {
    setLoading(true);
    try {
      setRecords([
        { id: '1', name: 'SNH Lab Result', date: 'Yesterday • St. Nicholas Hospital • Lagos Island', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
        { id: '2', name: 'Metformin 500mg Prescription', date: '03/15/2026 • Igando General Hospital • Dr. Adeyemi', status: 'Encrypted', icon: '/assets/custom-prescription-icon.png' },
        { id: '3', name: 'YFB Vaccination', date: '03/16/2026 • Self-reported', status: 'Shared Once', icon: '/assets/custom-vaccination-icon.png' },
        { id: '4', name: 'HSH Lab Result', date: '01/10/2026 • Havana Specialist Hospital • Surulere', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
        { id: '5', name: 'Pregnacare Prescription', date: '12/15/2025 • Havana Specialist Hospital • Surulere', status: 'Encrypted', icon: '/assets/custom-prescription-icon.png' },
      ]);
    } catch (err) { } finally { setLoading(false); }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      alert('Record uploaded successfully!');
    }, 1500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Home', icon: HomeIcon },
    { name: 'Records', icon: DocumentDuplicateIcon },
    { name: 'Research', icon: BeakerIcon },
    { name: 'Earnings', icon: WalletIcon },
  ];

  // Random gradient for new users
  const avatarGradient = "bg-gradient-to-tr from-[#14F1D9] to-[#3672F8]";

  return (
    <div className="flex h-screen bg-[#F8F9FE] overflow-hidden font-sora selection:bg-primary/30">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Sidebar - Collapsible */}
      <aside className={`transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-[#6183FF] text-white flex flex-col shrink-0 h-full relative z-50`}>
        {/* Top Section */}
        <div className={`p-6 pb-4 border-b border-white/10 ${isCollapsed ? 'px-4' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <img src="/assets/logo/selora-logo-icon-white-outline.png" alt="Logo" className="w-8 h-8 object-contain shrink-0" />
              {!isCollapsed && <span className="font-bold text-2xl tracking-tight">Selorah</span>}
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
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              title={item.name}
              className={`w-full flex items-center px-5 py-3 rounded-xl transition-all ${activeTab === item.name ? 'bg-white/20 font-bold' : 'hover:bg-white/5 text-white/80 hover:text-white'} ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="text-base tracking-tight whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom Section with Logout */}
        <div className="mt-auto border-t border-white/10 pt-6 pb-6">
          <div className={`mb-6 flex items-center gap-3 ${isCollapsed ? 'justify-center px-0 flex-col' : 'px-5'}`}>
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
          </div>

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
        <header className="h-[70px] bg-transparent flex items-center justify-between px-8 lg:px-12 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-[#101217]" onClick={() => setIsSidebarOpen(true)}>
              <Bars3Icon className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-[#101217] tracking-tight">
              {activeTab === 'Home' ? 'Dashboard' :
                activeTab === 'Records' ? 'My Medical Records' :
                  activeTab === 'Research' ? 'Research' :
                    activeTab === 'Earnings' ? 'My Earnings' :
                      activeTab === 'Profile' ? 'Profile & Settings' : 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block w-[320px]">
              <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for records..."
                className="w-full bg-transparent border border-gray-200 rounded-full py-2.5 pl-12 pr-6 text-sm focus:outline-none focus:border-[#6183FF] transition-all placeholder:text-gray-300 font-medium"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => alert('Notifications')}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-full 
  shadow-[0_8px_24px_-6px_rgba(97,131,255,0.4)] 
  border border-[#6183FF]/30 
  hover:scale-105 transition-transform relative"
              >
                <img
                  src="/assets/custom-notification-icon.png"
                  alt="N"
                  className="w-7 h-7 object-contain drop-shadow-sm"
                />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#6183FF] rounded-full border-2 border-white"></div>
              </button>

              <button
                onClick={() => setActiveTab('QRCodes')}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-full 
  shadow-[0_8px_24px_-6px_rgba(97,131,255,0.4)] 
  border border-[#6183FF]/30 
  hover:scale-105 transition-transform"
              >
                <img
                  src="/assets/custom-qr-code-icon.png"
                  alt="Q"
                  className="w-7 h-7 object-contain drop-shadow-sm"
                />
              </button>

              <button onClick={() => setActiveTab('Profile')} className="relative ml-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center p-[2px] shadow-sm relative" style={{ backgroundImage: "url('/assets/custom-profile-icon-ring.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className={`w-full h-full rounded-full ${avatarGradient}`}></div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#DCE4FF] text-[#6183FF] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm z-10">
                  PRO
                </div>
              </button>
            </div>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 scrollbar-hide pt-4">
          {activeTab === 'Home' && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-[#101217] tracking-tight">Welcome back, {user?.user_metadata?.first_name || 'User'}</h2>
                  <img src="/assets/custom-heart.png" alt="H" className="w-8 h-8 object-contain" />
                </div>
                <p className="text-gray-400 font-medium text-base">{getFormattedDate()}</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-[#6183FF] text-white p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:opacity-90 transition-opacity">
                  <div><p className="text-[10px] font-bold opacity-80 mb-1 uppercase tracking-wider">Health Score</p><span className="text-[36px] font-bold leading-none">60/100</span></div>
                  <div className="flex items-end justify-between">
                    <p className="text-[11px] font-medium">↑ +5 this month</p>
                    <img src="/assets/custom-heart.png" alt="I" className="w-8 h-8 brightness-0 invert opacity-60" />
                  </div>
                </div>
                <div onClick={() => setActiveTab('Records')} className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-[#6183FF]/30 transition-colors">
                  <div><p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Total Records</p><span className="text-[36px] font-bold text-[#101217] leading-none">12</span></div>
                  <div className="flex items-end justify-between">
                    <p className="text-[11px] font-bold text-gray-400">8 verified • 4 self-reported</p>
                    <img src="/assets/total-records-card-icon.png" alt="I" className="w-8 h-8" />
                  </div>
                </div>
                <div onClick={() => setActiveTab('Earnings')} className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-[#6183FF]/30 transition-colors">
                  <div><p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">This Month Earnings</p><span className="text-[36px] font-bold text-[#101217] leading-none">₦3,000</span></div>
                  <div className="flex items-end justify-between">
                    <p className="text-[11px] font-bold text-gray-400">₦10,000 projected</p>
                    <img src="/assets/this-month-earnings-card-icon.png" alt="I" className="w-8 h-8" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-50 shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-[#6183FF]/30 transition-colors">
                  <div><p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Active Access Grants</p><span className="text-[36px] font-bold text-[#101217] leading-none">2</span></div>
                  <div className="flex items-end justify-between">
                    <p className="text-[11px] font-bold text-gray-400">1 expiring soon</p>
                    <img src="/assets/active-access-grants-card-icon.png" alt="I" className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-7 bg-white rounded-[32px] border border-gray-50 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#101217]">Recent Records</h3>
                    <button onClick={() => setActiveTab('Records')} className="text-[#6183FF] font-bold text-sm flex items-center gap-1 group hover:underline">
                      See all <ChevronRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {records.map((record) => (
                      <div key={record.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-[#F8F9FE] rounded-xl flex items-center justify-center p-1.5"><img src={record.icon} alt="R" className="w-full h-full object-contain" /></div><div><p className="font-bold text-[#101217] text-base">{record.name}</p><p className="text-[12px] text-gray-400 font-medium">{record.date}</p></div></div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${record.status === 'Shared Once' ? 'bg-[#EEF2FF] text-[#6183FF]' : 'bg-[#6183FF] text-white'}`}>{record.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-5 space-y-6">
                  <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-[#101217]">Access Log</h3>
                      <button onClick={() => setActiveTab('Records')} className="text-[#6183FF] font-bold text-sm flex items-center gap-1 hover:underline">
                        View Full Audit <ChevronRightIcon className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-6">
                      {[
                        { title: 'Reddington Hospital', action: 'viewed SNH Lab Result', time: '2hr ago', color: 'bg-[#22C55E]' },
                        { title: 'St. Nicholas Hospital', action: 'gained access to your medical history', time: 'Yesterday', color: 'bg-[#FACC15]' },
                        { title: 'Igandon General Hospital', action: 'viewed YFB Vaccination', time: '2 days ago', color: 'bg-[#EF4444]' },
                      ].map((log, i) => (
                        <div key={i} className="flex items-start gap-3"><div className={`w-2.5 h-2.5 rounded-full ${log.color} mt-1 shrink-0 border border-white shadow-sm`}></div><div className="flex-1"><p className="text-[13px] font-medium text-[#101217] leading-tight"><span className="font-bold">{log.title}</span> {log.action}</p></div><span className="text-[10px] text-gray-400 font-black uppercase whitespace-nowrap pt-0.5">{log.time}</span></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-[#101217]">Earnings (Last 6 months)</h3>
                      <button className="text-[#6183FF] hover:bg-[#6183FF]/10 p-1.5 rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M12.53 16.28a.75.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <div className="h-[140px] flex items-end justify-between gap-3">
                      {[40, 70, 90, 60, 95, 45].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className={`w-full rounded-md ${i === 5 ? 'bg-[#6183FF]' : 'bg-[#6183FF]/10'}`} style={{ height: `${h}%` }}></div>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Records' && (
            <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[400px]">
              <h2 className="text-2xl font-bold text-[#101217] mb-6">Medical Records Management</h2>
              <p className="text-gray-500 mb-8">View, manage, and upload your medical history.</p>

              <div className="divide-y divide-gray-50">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-5 first:pt-0 last:pb-0 hover:bg-gray-50 px-4 rounded-xl transition-colors cursor-pointer">
                    <div className="flex items-center gap-6"><div className="w-14 h-14 bg-[#F8F9FE] rounded-2xl flex items-center justify-center p-2"><img src={record.icon} alt="R" className="w-full h-full object-contain" /></div><div><p className="font-bold text-[#101217] text-lg">{record.name}</p><p className="text-[13px] text-gray-400 font-medium mt-1">{record.date}</p></div></div>
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${record.status === 'Shared Once' ? 'bg-[#EEF2FF] text-[#6183FF]' : 'bg-[#6183FF] text-white'}`}>{record.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Research' && (
            <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
              <BeakerIcon className="w-16 h-16 text-[#6183FF] mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-[#101217] mb-2">Research Opportunities</h2>
              <p className="text-gray-500 max-w-md">Discover and participate in ongoing medical research that matches your health profile.</p>
            </div>
          )}

          {activeTab === 'Earnings' && (
            <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
              <WalletIcon className="w-16 h-16 text-[#6183FF] mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-[#101217] mb-2">Your Earnings</h2>
              <p className="text-gray-500 max-w-md">Track compensation from active data grants and research participation.</p>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[400px]">
              <h2 className="text-2xl font-bold text-[#101217] mb-6">Profile & Settings</h2>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-24 h-24 rounded-full flex items-center justify-center p-[3px] shadow-sm relative" style={{ backgroundImage: "url('/assets/custom-profile-icon-ring.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className={`w-full h-full rounded-full ${avatarGradient}`}></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#101217]">{user?.user_metadata?.first_name || 'User'} {user?.user_metadata?.last_name || ''}</h3>
                  <p className="text-gray-500">{user?.email || 'use..ail@gmail.com'}</p>
                  <span className="inline-block mt-2 bg-[#EEF2FF] text-[#6183FF] text-[10px] font-black uppercase px-2 py-1 rounded-md">Pro Member</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-center py-6 opacity-30"><p className="text-[#101217] text-[10px] font-bold uppercase tracking-[0.4em]">© 2026, Selorah Health. All Rights Reserved.</p></div>
        </div>
      </main>
    </div>
  );
}
