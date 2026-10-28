import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';

interface MenuItem {
  name: string;
  icon: any;
  path: string;
}

interface PortalSidebarProps {
  role: 'hospital' | 'researcher' | 'insurer' | 'patient';
  roleTag: string;
  menuItems: MenuItem[];
  user: any;
  sidebarBg: string;
  logoutBg: string;
  avatarGradient: string;
  roleDescription?: string;
}

export default function PortalSidebar({ 
  role, 
  roleTag, 
  menuItems, 
  user, 
  sidebarBg, 
  logoutBg,
  avatarGradient,
  roleDescription = "Verified Provider"
}: PortalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('selorah_user');
    navigate('/login');
  };

  return (
    <>
      <aside className={`hidden md:flex transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'} ${sidebarBg} text-white flex-col shrink-0 h-full relative z-50`}>
      {/* Brand & Toggle */}
      <div className={`p-6 pb-4 border-b border-white/10 ${isCollapsed ? 'px-4' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-white leading-none">Selorah</span>
                <span className="mt-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-white/10 w-fit">
                  {roleTag}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-200 hover:border-white/25 hover:bg-white/[0.12] hover:text-white active:scale-95"
          >
            {isCollapsed ? (
              <ChevronDoubleRightIcon className="h-4 w-4" strokeWidth={2} />
            ) : (
              <ChevronDoubleLeftIcon className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide ${isCollapsed ? 'px-3' : 'px-3'}`}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === `/${role}`}
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

      {/* User & Logout */}
      <div className="mt-auto border-t border-white/10 pt-6 pb-6">
        <div className={`mb-6 flex items-center gap-3 transition-all rounded-xl mx-3 p-2 ${isCollapsed ? 'justify-center flex-col' : ''}`}>
          <div className="relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center p-[2px] shadow-sm bg-white">
            <div className={`w-full h-full rounded-full ${avatarGradient} flex items-center justify-center font-bold text-white`}>
              {(user?.user_metadata?.first_name || 'U')[0]}
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-base leading-tight text-white">{user?.user_metadata?.first_name || 'User'}</p>
              <p className="text-white/40 text-[11px] truncate font-medium">{roleDescription}</p>
            </div>
          )}
        </div>
        <div className={`${isCollapsed ? 'px-3' : 'px-5'}`}>
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full ${logoutBg} py-3 rounded-full flex items-center justify-center gap-3 hover:opacity-80 transition-all font-bold text-base text-white shadow-sm`}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>

      <nav className="portal-mobile-nav fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="grid grid-cols-5 items-end px-1 pt-2">
          {menuItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === `/${role}`}
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
            onClick={handleLogout}
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-gray-400 transition-all"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="text-[10px] font-bold">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
