import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
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
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-gray-900">Recent Claims</h3>
                <div className="text-center text-gray-500 py-10">No pending claims.</div>
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
