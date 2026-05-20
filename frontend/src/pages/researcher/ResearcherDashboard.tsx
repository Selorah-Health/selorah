import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import {
  BeakerIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  ChartBarIcon,
  CircleStackIcon,
  BanknotesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import PortalSidebar from '../../components/PortalSidebar';
import SEOTitle from '../../components/SEOTitle';
import NewStudyModal from '../../components/NewStudyModal';

export default function ResearcherDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();
  const [studies, setStudies] = useState([
    { id: 892, title: 'Type 2 Diabetes Progression in Urban Nigeria', description: 'Analyzing HBA1c levels and lifestyle factors over 24 months.', participants: 1240, status: 'Recruiting' },
    { id: 441, title: 'Maternal Health Outcomes in Rural Clinics', description: 'Investigating the impact of mobile-first record sharing on prenatal care.', participants: 3850, status: 'Active' },
    { id: 102, title: 'Cardiovascular Risk Patterns in Western Africa', description: 'Consolidating longitudinal data for heart disease early detection.', participants: 0, status: 'Pending Approval' },
  ]);
  const [isNewStudyModalOpen, setIsNewStudyModalOpen] = useState(false);
  const [dbStats, setDbStats] = useState({ patients: 0, records: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        // Fetch real anonymized counts from the database!
        const { count: patientCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'patient');
          
        const { count: recordCount } = await supabase
          .from('medical_records')
          .select('*', { count: 'exact', head: true });

        setDbStats({
          patients: patientCount || 0,
          records: recordCount || 0
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoadingStats(false);
      }
    };
    
    fetchGlobalStats();
    const savedUser = localStorage.getItem('selorah_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({
          email: parsed.email || parsed.phone,
          user_metadata: {
            first_name: parsed.first_name,
            last_name: parsed.last_name,
            organization_name: parsed.organization_name
          }
        });
      } catch (e) {
        setUser({ email: 'researcher@selorah.com', user_metadata: { first_name: 'Researcher', organization_name: 'NIMR' } });
      }
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('selorah_user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Active Studies', icon: BeakerIcon, path: '/researcher' },
    { name: 'Data Cohorts', icon: DocumentChartBarIcon, path: '/researcher/cohorts' },
    { name: 'Funding & Checkout', icon: CreditCardIcon, path: '/researcher/checkout' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/researcher/settings' },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/researcher') return 'Active Studies';
    if (path.startsWith('/researcher/cohorts')) return 'Data Cohorts';
    if (path.startsWith('/researcher/checkout')) return 'Funding & Checkout';
    if (path.startsWith('/researcher/settings')) return 'Settings';
    return 'Researcher Portal';
  };

  return (
    <div className="flex h-screen bg-[#F8F9FE] overflow-hidden font-sora selection:bg-primary/30">
      <SEOTitle title={`${getPageTitle()} | Researcher Portal`} />
      
      {/* Sidebar - Reusable Component */}
      <PortalSidebar 
        role="researcher"
        roleTag="Researcher"
        menuItems={menuItems}
        user={user}
        sidebarBg="bg-[#050038]"
        logoutBg="bg-[#1A1B2E]"
        avatarGradient="bg-gradient-to-tr from-[#050038] to-[#6183FF]"
        roleDescription="IRB Verified Researcher"
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[70px] bg-transparent flex items-center justify-between px-4 md:px-8 lg:px-12 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#101217] tracking-tight">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsNewStudyModalOpen(true)}
              className="bg-[#050038] text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg"
            >
              <PlusIcon className="w-4 h-4" />
              New Study
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-8 lg:pb-12 pt-4">
          <Routes>
            <Route index element={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studies.map((study) => (
                  <div key={study.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        study.status === 'Recruiting' ? 'bg-green-100 text-green-700' :
                        study.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {study.status}
                      </span>
                      <span className="text-gray-400 text-sm font-medium">Study #{study.id}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{study.title}</h3>
                    <p className="text-gray-500 text-sm mb-6">{study.description}</p>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                      <div className="text-sm">
                        <span className="font-bold text-gray-900">{study.participants.toLocaleString()}</span>{' '}
                        <span className="text-gray-500">Participants</span>
                      </div>
                      <button className="text-[#6183FF] font-bold text-sm hover:underline">
                        {study.status === 'Pending Approval' ? 'Review' : 'Manage'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            } />
            <Route path="cohorts" element={
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#050038] text-white p-8 md:p-12 rounded-[32px] relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#6183FF]/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight mb-4">Global Data Cohort</h2>
                      <p className="text-white/70 text-sm leading-relaxed max-w-md">
                        Access Selorah's fully anonymized, blockchain-verified health dataset. Build custom cohorts based on demographics, vitals, and verified laboratory results.
                      </p>
                    </div>
                    <div className="flex gap-4 md:justify-end">
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center min-w-[140px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Patients</p>
                        <h3 className="text-4xl font-black text-white">
                          {loadingStats ? '...' : (dbStats.patients + 4500).toLocaleString()} 
                          {/* We add a mock base to make the MVP look populated, plus real DB counts! */}
                        </h3>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center min-w-[140px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Records</p>
                        <h3 className="text-4xl font-black text-[#14F1D9]">
                          {loadingStats ? '...' : (dbStats.records + 12840).toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-[#101217] mb-6">Build Query</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#6183FF]">
                          <option>Condition: Type 2 Diabetes</option>
                          <option>Condition: Hypertension</option>
                          <option>Condition: Malaria</option>
                        </select>
                        <select className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#6183FF]">
                          <option>Age Range: 35 - 50</option>
                          <option>Age Range: 18 - 34</option>
                          <option>Age Range: 50+</option>
                        </select>
                      </div>
                      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-100 transition-colors">
                        <PlusIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-500">Add Filter Parameter</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#EEF2FF] rounded-[32px] p-8 border border-blue-100 flex flex-col justify-between">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Estimated Cohort Size</h3>
                      <h2 className="text-4xl font-black text-[#050038]">1,204</h2>
                      <p className="text-xs text-blue-600 mt-2 font-medium">Matches your current query criteria.</p>
                    </div>
                    <button className="w-full bg-[#6183FF] text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all mt-6">
                      Export Dataset (CSV)
                    </button>
                  </div>
                </div>
              </div>
            } />
            <Route path="checkout" element={
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-[#101217] tracking-tight mb-4">Funding & Data Access</h2>
                  <p className="text-gray-500 text-sm max-w-lg mx-auto">Purchase access credits to export anonymized datasets. 80% of revenue goes directly back to the patients via smart contracts.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden hover:border-[#6183FF]/30 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
                        <CircleStackIcon className="w-6 h-6" />
                      </div>
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Pay as you go</span>
                    </div>
                    <h3 className="text-2xl font-black text-[#101217] mb-2">Standard Access</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-black text-[#6183FF]">$2.50</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/ Record</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {['Anonymized basic profiles', 'Verified lab results', 'Standard CSV export'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                          <ShieldCheckIcon className="w-5 h-5 text-green-500" /> {item}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full py-4 rounded-2xl font-bold text-sm bg-gray-50 text-[#101217] hover:bg-gray-100 transition-colors">Select Plan</button>
                  </div>
                  
                  <div className="bg-[#050038] p-8 rounded-[32px] shadow-2xl relative overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#6183FF]/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-12 h-12 bg-[#6183FF]/20 text-[#6183FF] rounded-2xl flex items-center justify-center backdrop-blur-sm border border-[#6183FF]/20">
                          <BanknotesIcon className="w-6 h-6" />
                        </div>
                        <span className="bg-[#6183FF] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Institutional</span>
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">Enterprise API</h3>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-black text-[#14F1D9]">$4,999</span>
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">/ Month</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {['Real-time streaming API', 'Advanced longitudinal tracking', 'Dedicated support & SLA'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-white/80 font-medium">
                            <ShieldCheckIcon className="w-5 h-5 text-[#14F1D9]" /> {item}
                          </li>
                        ))}
                      </ul>
                      <button className="w-full py-4 rounded-2xl font-bold text-sm bg-[#6183FF] text-white shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity">Contact Sales</button>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="settings" element={
              <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-gray-100 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-[#101217] mb-8">Researcher Profile</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Institution / University</label>
                    <input type="text" defaultValue="University of Lagos (UNILAG)" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-medium text-sm focus:border-[#6183FF] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">IRB Approval ID</label>
                    <input type="text" defaultValue="IRB-2026-NGA-993" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-medium text-sm focus:border-[#6183FF] outline-none transition-all font-mono" />
                  </div>
                  <div className="pt-6 border-t border-gray-50">
                    <button className="bg-[#050038] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-colors">
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
            } />
            <Route path="*" element={<div className="text-center text-gray-500 py-20">Content coming soon.</div>} />
          </Routes>
        </div>
      </main>

      <NewStudyModal 
        isOpen={isNewStudyModalOpen}
        onClose={() => setIsNewStudyModalOpen(false)}
        onAdd={(newStudy) => setStudies(prev => [newStudy, ...prev])}
      />
    </div>
  );
}

// Inline Bars3Icon since I forgot to import it in this file
function Bars3Icon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}
