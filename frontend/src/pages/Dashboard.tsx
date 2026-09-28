import { useState, useEffect, useRef } from 'react';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  BeakerIcon,
  WalletIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  CloudArrowUpIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useNavigate, NavLink, Routes, Route, useLocation } from 'react-router-dom';
import SEOTitle from '../components/SEOTitle';
import { useToast } from '../contexts/ToastContext';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'text' | 'file'>('text');
  const [profileForm, setProfileForm] = useState({
    height: '',
    weight: '',
    bloodGroup: '',
    genotype: '',
    allergies: '',
    familyHistory: '',
    medicationHistory: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });
  const [fileCategory, setFileCategory] = useState('Lab Results');
  const [savingText, setSavingText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = createClient();
  const { success, error: toastError, info, warning } = useToast();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
        const savedUser = localStorage.getItem('selorah_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser({
              email: parsed.email || parsed.phone,
              user_metadata: {
                first_name: parsed.first_name,
                last_name: parsed.last_name,
                is_pro: parsed.is_pro
              }
            });
          } catch (e) {
            setUser({ email: 'user@selorah.com', user_metadata: { first_name: 'Guest', is_pro: false } });
          }
          fetchRecords();
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setUser({ email: 'user@selorah.com', user_metadata: { first_name: 'Guest', is_pro: false } });
            fetchRecords();
          } else {
            setUser(user);
            fetchRecords();
          }
        }
      } catch (err) {
        setUser({ email: 'user@selorah.com', user_metadata: { first_name: 'User', is_pro: false } });
        fetchRecords();
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

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.user_metadata?.first_name || 'User';

      const hardcodedRecords = [
        { id: 'hc1', name: `${userName}'s Health Checkup`, date: 'Today • Selorah Medical Center', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
        { id: 'hc2', name: 'SNH Lab Result', date: 'Yesterday • St. Nicholas Hospital • Lagos Island', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
        { id: 'hc3', name: 'Metformin 500mg Prescription', date: '03/15/2026 • Igando General Hospital', status: 'Encrypted', icon: '/assets/custom-prescription-icon.png' },
        { id: 'hc4', name: 'YFB Vaccination', date: '03/16/2026 • Self-reported', status: 'Shared Once', icon: '/assets/custom-vaccination-icon.png' },
        { id: 'hc5', name: 'HSH Lab Result', date: '01/10/2026 • Havana Specialist Hospital', status: 'Encrypted', icon: '/assets/total-records-card-icon.png' },
      ];

      if (!user) {
        setRecords(hardcodedRecords as any);
        return;
      }

      // Resolve real patient_profiles.id (FK target for medical_records.patient_id)
      const { data: patientProfile } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let dbRecords: any[] = [];
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
            'height', 'weight', 'blood group', 'genotype', 'allergies',
            'family history', 'medication history', 'emergency contact',
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
              date: record.created_at
                ? new Date(record.created_at).toLocaleDateString()
                : '',
              status: record.status === 'active' ? 'Encrypted' : (record.status || 'Private'),
              icon: '/assets/total-records-card-icon.png',
              document_url: record.file_url || record.document_url,
              record_type: record.record_type,
            }));
        }
      }

      // DB rows first, then demo mock records
      setRecords([...dbRecords, ...hardcodedRecords] as any);
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  };

  /** Require a real authenticated session before any privileged action. */
  const requireAuth = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return true;
    // Also reject placeholder/guest localStorage-only sessions
    const saved = localStorage.getItem('selorah_user');
    if (!saved) {
      toastError('Please log in to continue.');
      navigate('/login');
      return false;
    }
    // localStorage alone is not enough for uploads / writes
    toastError('Please log in to continue.');
    navigate('/login');
    return false;
  };

  const handleUploadClick = async () => {
    const ok = await requireAuth();
    if (!ok) return;
    setShowAddModal(true);
    setAddMode('text');
    setProfileForm({
      height: '',
      weight: '',
      bloodGroup: '',
      genotype: '',
      allergies: '',
      familyHistory: '',
      medicationHistory: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
    });
    setFileCategory('Lab Results');
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const FILE_CATEGORY_TO_TYPE: Record<string, string> = {
    'Lab Results': 'Lab Results',
    'Imaging': 'Imaging',
    'Prescriptions': 'Prescription',
    'Visit Report': 'Visit Report',
    'Test Results': 'Test Results',
    'Other Clinical': 'Clinical Document',
  };

  const saveProfileFields = async () => {
    const entries: { title: string; content: string; recordType: string; profileKey?: string }[] = [];
    if (profileForm.height.trim())
      entries.push({ title: 'Height', content: profileForm.height.trim(), recordType: 'Vital' });
    if (profileForm.weight.trim())
      entries.push({ title: 'Weight', content: profileForm.weight.trim(), recordType: 'Vital' });
    if (profileForm.bloodGroup.trim())
      entries.push({
        title: 'Blood Group',
        content: profileForm.bloodGroup.trim(),
        recordType: 'Vital',
        profileKey: 'blood_group',
      });
    if (profileForm.genotype.trim())
      entries.push({
        title: 'Genotype',
        content: profileForm.genotype.trim(),
        recordType: 'Vital',
        profileKey: 'genotype',
      });
    if (profileForm.allergies.trim())
      entries.push({ title: 'Allergies', content: profileForm.allergies.trim(), recordType: 'Allergy' });
    if (profileForm.familyHistory.trim())
      entries.push({
        title: 'Family History',
        content: profileForm.familyHistory.trim(),
        recordType: 'History',
      });
    if (profileForm.medicationHistory.trim())
      entries.push({
        title: 'Medication History',
        content: profileForm.medicationHistory.trim(),
        recordType: 'History',
      });
    if (profileForm.emergencyName.trim() || profileForm.emergencyPhone.trim()) {
      const content = [
        profileForm.emergencyName.trim(),
        profileForm.emergencyRelation.trim(),
        profileForm.emergencyPhone.trim(),
      ]
        .filter(Boolean)
        .join(' – ');
      entries.push({ title: 'Emergency Contact', content, recordType: 'Emergency Contact' });
    }

    if (!entries.length) {
      warning('Fill in at least one field before saving.');
      return;
    }

    setSavingText(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toastError('Please log in to continue.');
        navigate('/login');
        return;
      }

      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !patientProfile) {
        toastError('Patient profile not found. Please complete onboarding first.');
        return;
      }

      const rows = entries.map((e) => ({
        patient_id: patientProfile.id,
        title: e.title,
        record_type: e.recordType,
        file_url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(e.content),
        status: 'active',
        encrypted: true,
      }));

      const { error } = await supabase.from('medical_records').insert(rows);
      if (error) {
        toastError(error.message, 'Failed to save');
        return;
      }

      const profilePatch: Record<string, string> = {};
      for (const e of entries) {
        if (e.profileKey) profilePatch[e.profileKey] = e.content;
      }
      if (Object.keys(profilePatch).length) {
        await supabase.from('patient_profiles').update(profilePatch).eq('id', patientProfile.id);
      }

      setShowAddModal(false);
      await fetchRecords();
      success(`${entries.length} field${entries.length > 1 ? 's' : ''} saved to your profile.`, 'Profile updated');
    } catch (err: any) {
      toastError(err?.message || 'Unknown error');
    } finally {
      setSavingText(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = await requireAuth();
    if (!ok) {
      e.target.value = '';
      return;
    }

    setUploading(true);

    const saveRecordToDb = async (name: string, url: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toastError('Please log in to upload records.');
        navigate('/login');
        setUploading(false);
        return;
      }

      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !patientProfile) {
        toastError('Patient profile not found. Please complete onboarding first.');
        setUploading(false);
        return;
      }

      const { error } = await supabase.from('medical_records').insert({
        patient_id: patientProfile.id,
        title: name,
        record_type: FILE_CATEGORY_TO_TYPE[fileCategory] || 'Clinical Document',
        file_url: url,
        status: 'active',
        encrypted: true,
      });

      if (error) {
        toastError(error.message, 'Upload failed');
      } else {
        success('Your file was uploaded.', 'Upload complete');
        setShowAddModal(false);
        fetchRecords();
      }
      setUploading(false);
    };

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toastError('Please log in to upload records.');
        navigate('/login');
        setUploading(false);
        return;
      }
      // Path must start with user id for storage RLS policies
      const fileName = `${authUser.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('records')
        .upload(fileName, file);

      if (uploadError) {
        console.warn('Storage upload failed, attempting fallback to base64 data URL', uploadError);
        // Still require auth for fallback path
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toastError('Please log in to upload records.');
          navigate('/login');
          setUploading(false);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
          await saveRecordToDb(file.name, reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        const { data: urlData } = supabase.storage.from('records').getPublicUrl(fileName);
        await saveRecordToDb(file.name, urlData.publicUrl);
      }
    } catch (err: any) {
      toastError(err.message, 'Upload error');
      setUploading(false);
    }
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
  const avatarGradient = 'bg-gradient-to-tr from-[#14F1D9] to-[#3672F8]';

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
            title="Add a Record"
          >
            <CloudArrowUpIcon className="w-5 h-5 text-white shrink-0" />
            {!isCollapsed && <span className="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis">Add a Record</span>}
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

      
      {/* Add a Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0A0B14]/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black text-[#101217]">Add a Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-2 bg-gray-50 mx-6 mt-6 rounded-2xl flex gap-1 shrink-0">
              <button
                onClick={() => setAddMode('text')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  addMode === 'text' ? 'bg-white text-[#6183FF] shadow-sm' : 'text-gray-400'
                }`}
              >
                Health profile
              </button>
              <button
                onClick={() => setAddMode('file')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  addMode === 'file' ? 'bg-white text-[#6183FF] shadow-sm' : 'text-gray-400'
                }`}
              >
                Clinical file
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {addMode === 'text' ? (
                <>
                  <p className="text-sm text-gray-500 font-medium">
                    Fill any fields you want — they update your profile (vitals, history, allergies). They will not appear under Clinical Records.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Height</label>
                      <input
                        value={profileForm.height}
                        onChange={(e) => setProfileForm((p) => ({ ...p, height: e.target.value }))}
                        placeholder="e.g. 182 cm"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Weight</label>
                      <input
                        value={profileForm.weight}
                        onChange={(e) => setProfileForm((p) => ({ ...p, weight: e.target.value }))}
                        placeholder="e.g. 75 kg"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Blood group</label>
                      <input
                        value={profileForm.bloodGroup}
                        onChange={(e) => setProfileForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                        placeholder="e.g. O+"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Genotype</label>
                      <input
                        value={profileForm.genotype}
                        onChange={(e) => setProfileForm((p) => ({ ...p, genotype: e.target.value }))}
                        placeholder="e.g. AA"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Allergies</label>
                    <input
                      value={profileForm.allergies}
                      onChange={(e) => setProfileForm((p) => ({ ...p, allergies: e.target.value }))}
                      placeholder="e.g. Penicillin, Peanuts"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Family history</label>
                    <textarea
                      value={profileForm.familyHistory}
                      onChange={(e) => setProfileForm((p) => ({ ...p, familyHistory: e.target.value }))}
                      placeholder="e.g. Hypertension on father's side"
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 font-medium text-gray-700 text-sm focus:outline-none focus:border-[#6183FF] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Medication history</label>
                    <textarea
                      value={profileForm.medicationHistory}
                      onChange={(e) => setProfileForm((p) => ({ ...p, medicationHistory: e.target.value }))}
                      placeholder="e.g. Metformin 500mg"
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 font-medium text-gray-700 text-sm focus:outline-none focus:border-[#6183FF] resize-none"
                    />
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Emergency contact</p>
                    <input
                      value={profileForm.emergencyName}
                      onChange={(e) => setProfileForm((p) => ({ ...p, emergencyName: e.target.value }))}
                      placeholder="Full name"
                      className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={profileForm.emergencyRelation}
                        onChange={(e) => setProfileForm((p) => ({ ...p, emergencyRelation: e.target.value }))}
                        placeholder="Relationship"
                        className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                      />
                      <input
                        value={profileForm.emergencyPhone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, emergencyPhone: e.target.value }))}
                        placeholder="Phone"
                        className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 font-bold text-gray-700 text-sm focus:outline-none focus:border-[#6183FF]"
                      />
                    </div>
                  </div>
                  <button
                    onClick={saveProfileFields}
                    disabled={savingText}
                    className="w-full bg-[#6183FF] text-white font-bold py-4 rounded-2xl hover:bg-[#4E6EEF] transition-all disabled:opacity-50"
                  >
                    {savingText ? 'Saving…' : 'Save profile fields'}
                  </button>
                </>
              ) : (
                <div className="space-y-5 py-2">
                  <p className="text-sm text-gray-500 font-medium">
                    Upload labs, imaging, prescriptions, visit reports, or other clinical documents. These appear under Clinical Records.
                  </p>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">
                      Category *
                    </label>
                    <select
                      value={fileCategory}
                      onChange={(e) => setFileCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-700 focus:outline-none focus:border-[#6183FF]"
                    >
                      {['Lab Results', 'Imaging', 'Prescriptions', 'Visit Report', 'Test Results', 'Other Clinical'].map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <button
                    onClick={handlePickFile}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-[#6183FF]/40 bg-[#6183FF]/5 text-[#6183FF] font-bold py-10 rounded-2xl hover:bg-[#6183FF]/10 transition-all disabled:opacity-50"
                  >
                    {uploading ? 'Uploading…' : 'Choose file to upload'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
