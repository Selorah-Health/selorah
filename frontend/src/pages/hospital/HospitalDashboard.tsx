import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import {
  UsersIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowLeftIcon,
  HeartIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import PortalSidebar from '../../components/PortalSidebar';
import SEOTitle from '../../components/SEOTitle';
import NewPatientModal from '../../components/NewPatientModal';

export default function HospitalDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const location = useLocation();
  const supabase = createClient();
  const [patients, setPatients] = useState([
    { id: 'SH-94827', name: 'John Olusegun Doe', lastVisit: 'Today, 10:45 AM', status: 'Checked In' },
    { id: 'SH-11029', name: 'Chioma Eze', lastVisit: 'May 1, 2026', status: 'Discharged' },
    { id: 'SH-22918', name: 'Musa Ibrahim', lastVisit: 'April 28, 2026', status: 'Discharged' },
  ]);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const handleCheckIn = (id: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status: 'Checked In', lastVisit: 'Just now' } : p));
  };

  const handleCheckOut = (id: string) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status: 'Discharged', lastVisit: 'Just now' } : p));
  };

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
    { name: 'Patients', icon: UsersIcon, path: '/hospital' },
    { name: 'Admissions', icon: CalendarDaysIcon, path: '/hospital/admissions' },
    { name: 'Reports', icon: ClipboardDocumentCheckIcon, path: '/hospital/reports' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/hospital/settings' },
  ];

  /*
  ### 1. Reusable Sidebar Component [NEW]
  Create a `PortalSidebar.tsx` component that accepts:
  - `menuItems`: Array of navigation items.
  - `role`: 'hospital' | 'researcher' | 'insurer' | 'patient'.
  - `theme`: Specific colors/gradients for each portal.
  - `user`: Current user data.

  ### 2. Global SEO Titles
  Implement a `Title` component or hook for `[Page Description] | Selorah Health`.

  ### 3. Stakeholder Portal Expansions
  - **Hospital Portal**: Admissions, Reports, Settings, and functional Check-in/out.
  - **Researcher Portal**: Data Cohorts, Funding & Checkout (with Stripe-like UI), and Settings. Add 2 more mock studies.
  - **Insurer Portal**: Claims, Policyholders, Analytics, and Settings.
  - **Theming**: Apply different background gradients and use custom menu/profile icons consistently.

  ### 4. Printable CV-Style Patient Chart
  - **Layout**: Strict CV/Resume look.
  - **Print Functionality**: `@media print` logic to isolate the chart.
  - **Secondary Actions**: "Back to Directory" and "Share" on a single line.
  */

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/hospital') return 'Patient Directory';
    if (path.startsWith('/hospital/admissions')) return 'Admissions & Check-ins';
    if (path.startsWith('/hospital/reports')) return 'Medical Reports';
    if (path.startsWith('/hospital/settings')) return 'Hospital Settings';
    return 'Hospital Portal';
  };

  const avatarGradient = "bg-gradient-to-tr from-[#6183FF] to-[#14F1D9]";

  return (
    <div className="flex h-screen bg-[#F8F9FE] overflow-hidden font-sora selection:bg-primary/30">
      <SEOTitle title={`${getPageTitle()} | Hospital Portal`} />

      {/* Sidebar - Reusable Component */}
      <PortalSidebar
        role="hospital"
        roleTag="Provider"
        menuItems={menuItems}
        user={user}
        sidebarBg="bg-[#6183FF]"
        logoutBg="bg-[#83A0FF]"
        avatarGradient="bg-gradient-to-tr from-[#6183FF] to-[#14F1D9]"
        roleDescription="Verified Provider"
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[70px] bg-transparent flex items-center justify-between px-4 md:px-8 lg:px-12 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#101217] tracking-tight">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block w-[320px]">
              <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient by Name or ID..."
                className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-12 pr-6 text-sm focus:outline-none focus:border-[#6183FF] transition-all placeholder:text-gray-400 font-medium shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsNewPatientModalOpen(true)}
              className="bg-[#6183FF] text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-[#4E6EEF] transition-all shadow-lg shadow-blue-500/20"
            >
              <PlusIcon className="w-4 h-4" />
              New Patient
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-8 lg:pb-12 pt-4">
          <Routes>
            <Route index element={
              selectedPatient ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between mb-6 print:hidden">
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] font-bold text-sm transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4" /> Back to Patient Directory
                    </button>
                    <button className="flex items-center gap-2 bg-[#6183FF]/10 text-[#6183FF] px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#6183FF] hover:text-white transition-all">
                      <PlusIcon className="w-4 h-4" /> Share Chart
                    </button>
                  </div>

                  <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden print:shadow-none print:border-none print:rounded-none print:m-0">
                    {/* Chart Header - CV Style */}
                    <div className="p-8 md:p-12 bg-white border-b border-gray-100 flex flex-col md:flex-row justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-[#6183FF] to-[#14F1D9] flex items-center justify-center text-3xl font-black text-white shadow-lg">
                          {selectedPatient.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <h2 className="text-4xl font-black text-[#101217] tracking-tight mb-2">{selectedPatient.name}</h2>
                          <div className="flex flex-wrap gap-3">
                            <span className="bg-blue-50 text-[#6183FF] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Patient ID: {selectedPatient.id}</span>
                            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">DOB: Jan 15, 1990</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${selectedPatient.status === 'Checked In' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {selectedPatient.status}
                        </span>
                        <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Last Visit: {selectedPatient.lastVisit}</p>
                      </div>
                    </div>

                    {/* Chart Body */}
                    <div className="p-8 md:p-12">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Vitals Column */}
                        <div className="space-y-10">
                          <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#6183FF] mb-6 flex items-center gap-2">
                              <HeartIcon className="w-4 h-4" /> Physical Vitals
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Blood Group</p>
                                <p className="text-xl font-black text-[#6183FF]">O+</p>
                              </div>
                              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Genotype</p>
                                <p className="text-xl font-bold text-gray-900">AA</p>
                              </div>
                              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Height</p>
                                <p className="text-xl font-bold text-gray-900">182cm</p>
                              </div>
                              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Weight</p>
                                <p className="text-xl font-bold text-gray-900">78kg</p>
                              </div>
                            </div>
                          </section>

                          <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#6183FF] mb-6 flex items-center gap-2">
                              <ShieldCheckIcon className="w-4 h-4" /> Active Allergies
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {['Penicillin', 'Peanuts', 'Latex'].map(a => (
                                <span key={a} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-100">{a}</span>
                              ))}
                            </div>
                          </section>
                        </div>

                        {/* Medical History Column */}
                        <div className="lg:col-span-2 space-y-12">
                          <section>
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#6183FF] mb-8 flex items-center gap-2">
                              <ClipboardDocumentCheckIcon className="w-4 h-4" /> Clinical Summary
                            </h3>
                            <div className="space-y-6">
                              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Family History</h4>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">Father: Hypertension, Mother: Type 2 Diabetes. No history of cardiovascular disease in immediate family.</p>
                              </div>
                              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Recent Visit Notes</h4>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium italic">"Patient presents with mild fatigue. Blood sugar levels slightly elevated but within manageable range. Recommended lifestyle adjustments and follow-up in 2 weeks." — Dr. Admin</p>
                              </div>
                            </div>
                          </section>

                          <section>
                            <div className="flex items-center justify-between mb-8">
                              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#6183FF] flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" /> Recent Activity
                              </h3>
                              <button className="text-[10px] font-black uppercase text-[#6183FF] hover:underline tracking-widest">Full History</button>
                            </div>
                            <div className="space-y-3">
                              {[
                                { title: 'Lab Results Uploaded', date: 'Yesterday, 4:30 PM', sub: 'Comprehensive Metabolic Panel' },
                                { title: 'Prescription Renewed', date: 'April 20, 2026', sub: 'Metformin 500mg' },
                              ].map((act, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-100 transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <div>
                                      <p className="text-sm font-bold text-gray-900">{act.title}</p>
                                      <p className="text-[11px] text-gray-400 font-medium">{act.sub}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-300 uppercase">{act.date}</span>
                                </div>
                              ))}
                            </div>
                          </section>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 text-center print:hidden">
                    <p className="text-gray-400 text-xs font-medium">Press <kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl + P</kbd> to save as PDF</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-left-4 duration-500">
                  <h2 className="text-xl font-bold mb-6">Patient Directory</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                      <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 rounded-l-xl">Patient Name</th>
                          <th className="px-6 py-4">ID / Token</th>
                          <th className="px-6 py-4">Last Visit</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 rounded-r-xl text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((patient) => (
                          <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900">{patient.name}</td>
                            <td className="px-6 py-4 font-mono text-xs">{patient.id}</td>
                            <td className="px-6 py-4">{patient.lastVisit}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${patient.status === 'Checked In' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {patient.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                {patient.status === 'Discharged' ? (
                                  <button
                                    onClick={() => handleCheckIn(patient.id)}
                                    className="text-white font-bold bg-[#6183FF] px-4 py-2 rounded-xl transition-all hover:bg-blue-600 text-xs"
                                  >
                                    Check In
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleCheckOut(patient.id)}
                                    className="text-gray-500 font-bold bg-gray-100 px-4 py-2 rounded-xl transition-all hover:bg-gray-200 text-xs"
                                  >
                                    Check Out
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedPatient(patient)}
                                  className="text-[#6183FF] font-bold hover:underline bg-blue-50 px-4 py-2 rounded-xl transition-all hover:bg-[#6183FF] hover:text-white text-xs"
                                >
                                  View Chart
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            } />
            <Route path="admissions" element={
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6">Active Admissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.filter(p => p.status === 'Checked In').map(patient => (
                    <div key={patient.id} className="p-6 border border-gray-100 rounded-3xl bg-gray-50/50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#6183FF] flex items-center justify-center font-bold text-white">
                          {patient.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-400">ID: {patient.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <button
                          onClick={() => handleCheckOut(patient.id)}
                          className="text-sm font-bold text-red-500 hover:underline"
                        >
                          Check Out
                        </button>
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold hover:border-[#6183FF] hover:text-[#6183FF] transition-all"
                        >
                          Open Chart
                        </button>
                      </div>
                    </div>
                  ))}
                  {patients.filter(p => p.status === 'Checked In').length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 font-medium">No active admissions.</div>
                  )}
                </div>
              </div>
            } />
            <Route path="reports" element={
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Medical Reports</h2>
                  <button className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">Download All</button>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'Weekly Admission Summary', date: 'May 5, 2026', type: 'PDF' },
                    { title: 'Diagnostic Lab Statistics', date: 'May 3, 2026', type: 'XLS' },
                    { title: 'Pharmacy Inventory Audit', date: 'April 30, 2026', type: 'PDF' },
                  ].map((report, i) => (
                    <div key={i} className="flex items-center justify-between p-5 border border-gray-50 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-[#6183FF] flex items-center justify-center rounded-xl font-black text-xs">
                          {report.type}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{report.title}</p>
                          <p className="text-xs text-gray-400">{report.date}</p>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            } />
            <Route path="settings" element={
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-4xl">
                <h2 className="text-xl font-bold mb-8">Hospital Settings</h2>
                <div className="space-y-8">
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#6183FF] mb-6">Institutional Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Hospital Name</label>
                        <input type="text" defaultValue="Selorah Medical Center" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Institution ID</label>
                        <input type="text" defaultValue="SMC-LAG-001" disabled className="w-full bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-500" />
                      </div>
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#6183FF] mb-6">Staff Management</h3>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700 text-sm font-medium">
                      You have 12 registered providers under this institution.
                    </div>
                  </section>
                  <button className="bg-[#6183FF] text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all shadow-blue-500/20">Save Changes</button>
                </div>
              </div>
            } />
            <Route path="*" element={<div className="text-center text-gray-500 py-20">Content coming soon.</div>} />
          </Routes>
        </div>
      </main>

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onAdd={(newPatient) => setPatients(prev => [newPatient, ...prev])}
      />
    </div>
  );
}
