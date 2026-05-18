import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import PortalSidebar from '../../components/PortalSidebar';
import SEOTitle from '../../components/SEOTitle';

export default function InsurerDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();

  useEffect(() => {
    const savedUser = localStorage.getItem('selorah_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser({
        email: parsed.email || parsed.phone,
        user_metadata: {
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          role: parsed.role
        }
      });
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('selorah_user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Claims', icon: DocumentTextIcon, path: '/insurer' },
    { name: 'Policyholders', icon: ShieldCheckIcon, path: '/insurer/policyholders' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/insurer/analytics' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/insurer/settings' },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/insurer') return 'Claims Management';
    if (path.startsWith('/insurer/policyholders')) return 'Policyholders';
    if (path.startsWith('/insurer/analytics')) return 'Analytics';
    if (path.startsWith('/insurer/settings')) return 'Settings';
    return 'Insurer Portal';
  };

  const claims = [
    { id: 'CLM-2026-904', patient: 'Chioma Eze', facility: 'St. Nicholas Hospital', date: 'May 18, 2026', amount: '₦450,000', status: 'Pending', type: 'Inpatient Surgery' },
    { id: 'CLM-2026-903', patient: 'John Doe', facility: 'Reddington Hospital', date: 'May 16, 2026', amount: '₦25,000', status: 'Approved', type: 'Consultation' },
    { id: 'CLM-2026-902', patient: 'Musa Ibrahim', facility: 'Igando General Hospital', date: 'May 14, 2026', amount: '₦120,000', status: 'Denied', type: 'Uncovered Medication' },
    { id: 'CLM-2026-901', patient: 'Sarah Johnson', facility: 'Avon Medical Center', date: 'May 10, 2026', amount: '₦85,000', status: 'Approved', type: 'Diagnostic Imaging' },
  ];

  const policyholders = [
    { id: 'POL-00192', name: 'Chioma Eze', plan: 'Premium Plus', status: 'Active', renewal: 'Dec 2026' },
    { id: 'POL-00193', name: 'John Doe', plan: 'Standard', status: 'Active', renewal: 'Aug 2026' },
    { id: 'POL-00194', name: 'Musa Ibrahim', plan: 'Basic', status: 'Lapsed', renewal: 'Jan 2026' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FE] overflow-hidden font-sora selection:bg-primary/30">
      <SEOTitle title={`${getPageTitle()} | Insurer Portal`} />
      
      {/* Sidebar - Reusable Component */}
      <PortalSidebar 
        role="insurer"
        roleTag="Insurer"
        menuItems={menuItems}
        user={user}
        sidebarBg="bg-[#1A4D2E]"
        logoutBg="bg-[#4F6F52]"
        avatarGradient="bg-gradient-to-tr from-[#1A4D2E] to-[#4F6F52]"
        roleDescription="Claims Department"
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[70px] bg-transparent flex items-center justify-between px-4 md:px-8 lg:px-12 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#101217] tracking-tight">{getPageTitle()}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-8 lg:pb-12 pt-4">
          <Routes>
            <Route index element={
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#1A4D2E]/30 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Claims (May)</p>
                      <h3 className="text-3xl font-black text-[#101217]">1,284</h3>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-[#1A4D2E]/10 transition-colors">
                      <DocumentTextIcon className="w-6 h-6 text-gray-400 group-hover:text-[#1A4D2E]" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-yellow-300 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pending Approval</p>
                      <h3 className="text-3xl font-black text-[#101217]">342</h3>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center">
                      <ClockIcon className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#1A4D2E] to-[#4F6F52] p-6 rounded-[24px] shadow-lg shadow-green-900/20 text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Total Payout (YTD)</p>
                    <h3 className="text-3xl font-black">₦42.5M</h3>
                    <div className="mt-2 text-xs font-bold text-green-300 flex items-center gap-1">
                      <ArrowPathIcon className="w-3 h-3" /> +12% from last month
                    </div>
                  </div>
                </div>

                {/* Claims Table */}
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <h3 className="font-bold text-xl text-[#101217]">Recent Claims</h3>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search claim ID or patient..." className="w-full bg-gray-50 border border-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#1A4D2E]" />
                      </div>
                      <button className="p-2 border border-gray-100 rounded-full text-gray-500 hover:bg-gray-50">
                        <FunnelIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <tr>
                          <th className="px-8 py-4">Claim ID</th>
                          <th className="px-8 py-4">Patient & Facility</th>
                          <th className="px-8 py-4">Type</th>
                          <th className="px-8 py-4">Amount</th>
                          <th className="px-8 py-4">Status</th>
                          <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {claims.map((claim) => (
                          <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-8 py-5 font-mono text-xs font-bold text-gray-600">{claim.id}</td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-[#101217]">{claim.patient}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{claim.facility}</p>
                            </td>
                            <td className="px-8 py-5 font-medium text-gray-600">{claim.type}</td>
                            <td className="px-8 py-5 font-black text-[#101217]">{claim.amount}</td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                                ${claim.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' : 
                                  claim.status === 'Denied' ? 'bg-red-50 text-red-500 border-red-100' : 
                                  'bg-yellow-50 text-yellow-600 border-yellow-100'}`}
                              >
                                {claim.status === 'Approved' && <CheckCircleIcon className="w-3 h-3" />}
                                {claim.status === 'Denied' && <XCircleIcon className="w-3 h-3" />}
                                {claim.status === 'Pending' && <ClockIcon className="w-3 h-3" />}
                                {claim.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button className="text-[#1A4D2E] font-bold text-xs hover:underline">Review</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            } />
            <Route path="policyholders" element={
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {policyholders.map(p => (
                    <div key={p.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#1A4D2E]/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center font-black text-[#1A4D2E] text-lg">
                          {p.name.charAt(0)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {p.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg text-[#101217]">{p.name}</h4>
                      <p className="font-mono text-xs text-gray-400 mb-6">{p.id}</p>
                      
                      <div className="bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Plan Tier</p>
                          <p className="font-bold text-sm text-[#1A4D2E]">{p.plan}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Renewal</p>
                          <p className="font-bold text-sm text-gray-600">{p.renewal}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            } />
            <Route path="analytics" element={
              <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px] text-center">
                <ChartBarIcon className="w-16 h-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-[#101217] mb-2">Advanced Analytics</h2>
                <p className="text-gray-500 text-sm max-w-md">Connect your actuaries' models to Selorah's anonymized dataset to predict claims trends and optimize premiums.</p>
                <button className="mt-8 bg-[#1A4D2E] text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-green-900/20 hover:bg-[#143d24] transition-colors">
                  Generate Report
                </button>
              </div>
            } />
            <Route path="settings" element={
              <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 max-w-3xl">
                <h2 className="text-2xl font-bold text-[#101217] mb-8">Platform Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Corporate Entity</label>
                    <input type="text" defaultValue="Reliance HMO" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-medium text-sm focus:border-[#1A4D2E] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Automated Approval Threshold</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                      <input type="text" defaultValue="50,000" className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-8 pr-4 font-bold text-sm focus:border-[#1A4D2E] outline-none transition-all" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Claims below this amount from verified hospitals will be auto-approved.</p>
                  </div>
                  <div className="pt-6">
                    <button className="bg-[#1A4D2E] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-900/20 hover:bg-[#143d24] transition-colors">
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            } />
            <Route path="*" element={<div className="text-center text-gray-500 py-20">Content coming soon.</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Bars3Icon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}
