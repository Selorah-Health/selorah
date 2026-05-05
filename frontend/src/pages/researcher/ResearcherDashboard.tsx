import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import {
  BeakerIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon
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
