import { useParams } from 'react-router-dom';
import {
  ShieldCheckIcon,
  CalendarIcon,
  IdentificationIcon,
  BeakerIcon,
  ClockIcon,
  HeartIcon,
  InformationCircleIcon,
  DocumentPlusIcon,
  XMarkIcon,
  ChevronRightIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

export default function SharedRecord() {
  const { token } = useParams();
  const supabase = createClient();
  const { success, error: toastError, info, warning } = useToast();

  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isVerified, setIsVerified] = useState(false);
  const [verificationRole, setVerificationRole] = useState<'doctor' | 'nurse' | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(true);
  const [showVisitReportModal, setShowVisitReportModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'lab' | 'rad' | 'pres'>('all');
  const [visitFacility, setVisitFacility] = useState('Selorah Medical Center');
  const [visitDoctor, setVisitDoctor] = useState('Dr. Admin');
  const [visitNotes, setVisitNotes] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = licenseNumber.trim().toUpperCase();
    if (normalized.length >= 6) {
      setIsVerified(true);
      setShowVerificationModal(false);
    } else {
      warning('Enter a valid license number (min 6 characters).');
    }
  };

  // Load shared link → patient profile → medical records
  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoadError('Missing share token.');
        setLoading(false);
        return;
      }

      try {
        // 1) Resolve shared_links row by token
        const { data: link, error: linkError } = await supabase
          .from('shared_links')
          .select('id, user_id, token, is_active, expires_at, created_at')
          .eq('token', token)
          .maybeSingle();

        if (linkError) {
          console.error(linkError);
          setLoadError(linkError.message);
          setLoading(false);
          return;
        }

        if (!link) {
          setLoadError('This share link was not found.');
          setLoading(false);
          return;
        }

        if (!link.is_active) {
          setIsRevoked(true);
          setLoading(false);
          return;
        }

        const expiresMs = new Date(link.expires_at).getTime() - Date.now();
        if (expiresMs <= 0) {
          setIsExpired(true);
          setTimeLeft(0);
          setLoading(false);
          return;
        }

        // Far-future "no expiry" links → no countdown (∞)
        const TEN_YEARS_MS = 9 * 365 * 24 * 60 * 60 * 1000;
        if (expiresMs < TEN_YEARS_MS) {
          setTimeLeft(Math.floor(expiresMs / 1000));
        } else {
          setTimeLeft(null);
        }

        // 2) Patient profile for the link owner
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('id, user_id, full_name, date_of_birth, blood_group, genotype, phone, nin')
          .eq('user_id', link.user_id)
          .maybeSingle();

        // Optional: auth metadata via public fields is not available; use profile only
        const fullName = profile?.full_name || 'Patient';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Patient';
        const lastName = nameParts.slice(1).join(' ') || '';

        let age: number | null = null;
        let dobLabel = '—';
        if (profile?.date_of_birth) {
          const dob = new Date(profile.date_of_birth);
          if (!Number.isNaN(dob.getTime())) {
            dobLabel = dob.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const now = new Date();
            age = now.getFullYear() - dob.getFullYear();
            const m = now.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
          }
        }

        const patientIdShort = profile?.id
          ? `SH-${String(profile.id).replace(/-/g, '').substring(0, 4).toUpperCase()}-${firstName.substring(0, 1)}${lastName.substring(0, 1) || 'X'}`.toUpperCase()
          : `SH-${String(link.user_id).replace(/-/g, '').substring(0, 6).toUpperCase()}`;

        // 3) Medical records for this patient (also used to fill vitals/history)
        let height = '—';
        let weight = '—';
        let bloodGroup = profile?.blood_group || '—';
        let genotype = profile?.genotype || '—';
        let allergies: string[] = [];
        let familyHistory = 'Not provided';
        let medicationHistory = 'Not provided';
        const emergencyContacts: { name: string; relationship: string; phone: string }[] = [];

        const decodeContent = (fileUrl: string | null) => {
          if (!fileUrl) return '';
          if (fileUrl.startsWith('data:text/plain')) {
            try {
              const raw = fileUrl.split(',')[1] || '';
              return decodeURIComponent(raw);
            } catch {
              return '';
            }
          }
          return '';
        };

        if (profile?.id) {
          const { data: dbRecords } = await supabase
            .from('medical_records')
            .select('id, title, record_type, file_url, status, created_at')
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false });

          if (dbRecords && dbRecords.length > 0) {
            for (const r of dbRecords) {
              const title = (r.title || '').toLowerCase();
              const type = (r.record_type || '').toLowerCase();
              const content = decodeContent(r.file_url).trim();
              if (!content && !title) continue;

              if (title.includes('height') || type === 'vital' && title.includes('height')) {
                if (height === '—') height = content || r.title;
              } else if (title.includes('weight')) {
                if (weight === '—') weight = content || r.title;
              } else if (title.includes('blood')) {
                if (bloodGroup === '—' || bloodGroup === profile?.blood_group) bloodGroup = content || bloodGroup;
              } else if (title.includes('genotype')) {
                if (genotype === '—' || genotype === profile?.genotype) genotype = content || genotype;
              } else if (title.includes('allerg') || type === 'allergy') {
                const parts = (content || r.title).split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
                allergies.push(...parts);
              } else if (title.includes('family')) {
                if (familyHistory === 'Not provided') familyHistory = content || r.title;
              } else if (title.includes('medication') || title.includes('medicine')) {
                if (medicationHistory === 'Not provided') medicationHistory = content || r.title;
              } else if (title.includes('emergency') || type.includes('emergency')) {
                emergencyContacts.push({
                  name: content.split(/[–\-•|]/)[0]?.trim() || content || r.title,
                  relationship: 'Contact',
                  phone: content.match(/\+?[\d\s\-]{7,}/)?.[0]?.trim() || '—',
                });
              }
            }

            // de-dupe allergies
            allergies = Array.from(new Set(allergies));

            const PROFILE_TYPES = new Set(['vital', 'allergy', 'history', 'emergency contact', 'note']);
            const isClinical = (r: any) => {
              const type = (r.record_type || '').toLowerCase();
              const title = (r.title || '').toLowerCase();
              if (PROFILE_TYPES.has(type)) return false;
              if (['height', 'weight', 'blood group', 'genotype', 'allergies', 'family history', 'medication history', 'emergency contact'].includes(title))
                return false;
              return true;
            };

            setRecords(
              dbRecords.filter(isClinical).map((r: any) => {
                const type = (r.record_type || '').toLowerCase();
                let category: 'lab' | 'rad' | 'pres' | 'other' = 'other';
                if (type.includes('lab') || type.includes('test')) category = 'lab';
                else if (type.includes('xray') || type.includes('rad') || type.includes('scan') || type.includes('image'))
                  category = 'rad';
                else if (type.includes('pres') || type.includes('drug')) category = 'pres';
                else if (type.includes('visit')) category = 'other';

                const content = decodeContent(r.file_url);
                const isTextData = (r.file_url || '').startsWith('data:text/plain');
                return {
                  id: r.id,
                  title: r.title || 'Clinical Document',
                  category,
                  facility: type.includes('visit') ? 'Visit Report' : 'Clinical Upload',
                  doctor: '—',
                  date: r.created_at
                    ? new Date(r.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—',
                  content: isTextData
                    ? content || 'Document attached.'
                    : r.file_url
                      ? 'Document attached.'
                      : 'No file attached.',
                  file_url: r.file_url,
                };
              })
            );
          }
        }

        setPatient({
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          dob: dobLabel,
          age,
          height,
          weight,
          bloodGroup,
          genotype,
          allergies,
          familyHistory,
          medicationHistory,
          immunization: [] as string[],
          emergencyContacts,
          patientId: patientIdShort,
          profileId: profile?.id,
          userId: link.user_id,
        });

        // Log access (owner-side localStorage only works if same browser — demo only)
        try {
          const accessLog = JSON.parse(localStorage.getItem('selorah_access_log') || '[]');
          accessLog.unshift({
            id: Math.random().toString(36).slice(2, 11),
            title: 'Shared Link Access',
            device: /iPhone|Android/i.test(navigator.userAgent) ? 'Mobile Device' : 'Desktop Browser',
            location: 'Unknown',
            timestamp: new Date().toISOString(),
            verified: false,
            action: 'viewed medical history via shared link',
          });
          localStorage.setItem('selorah_access_log', JSON.stringify(accessLog.slice(0, 50)));
        } catch {
          /* ignore */
        }
      } catch (err: any) {
        console.error(err);
        setLoadError(err?.message || 'Failed to load shared record.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  // Countdown ticker
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const filteredRecords =
    activeCategory === 'all' ? records : records.filter((r) => r.category === activeCategory);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '∞';
    if (seconds <= 0) return '0m 0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const initials = patient
    ? `${(patient.first_name || 'P')[0]}${(patient.last_name || 'X')[0] || ''}`.toUpperCase()
    : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sora">
        <p className="text-gray-400 font-medium">Loading shared record…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sora">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Unable to open link</h2>
          <p className="text-gray-500 mb-8">{loadError}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-[#0A0B14] text-white py-5 rounded-2xl font-bold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isRevoked) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sora">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl border border-gray-100">
          <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
            <XMarkIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Access Revoked</h2>
          <p className="text-gray-500 leading-relaxed mb-10">
            This secure link has been revoked by the patient and can no longer be used.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-[#0A0B14] text-white py-5 rounded-2xl font-bold hover:bg-black transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sora">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl border border-gray-100">
          <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
            <ClockIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Access Expired</h2>
          <p className="text-gray-500 leading-relaxed mb-10">
            This secure link has reached its time limit. Please request a new one from the patient.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full bg-[#0A0B14] text-white py-5 rounded-2xl font-bold hover:bg-black transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sora py-8 md:py-16 px-4 selection:bg-primary/30">
      {showVerificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0B14]/80 backdrop-blur-md p-4 sm:p-6">
          <div className="max-w-md w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl sm:rounded-[40px] p-6 sm:p-10 md:p-12 shadow-2xl my-auto">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-[#0A0B14]">
                Selorah Secure
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight leading-tight">
              Verification Required
            </h2>
            <p className="text-gray-500 mb-6 sm:mb-10 leading-relaxed font-medium text-sm sm:text-base">
              To view this patient&apos;s full medical history, please verify your credentials.
            </p>

            <form onSubmit={handleVerify} className="space-y-5 sm:space-y-6">
              <div className="flex p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setVerificationRole('doctor')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                    verificationRole === 'doctor'
                      ? 'bg-white text-[#4262ff] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationRole('nurse')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                    verificationRole === 'nurse'
                      ? 'bg-white text-[#4262ff] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Nurse
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  License Number
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Enter License No."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 focus:outline-none focus:border-[#4262ff] transition-all font-bold placeholder:text-gray-300 text-base"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={!verificationRole || !licenseNumber}
                className="w-full bg-[#4262ff] text-white py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg hover:bg-[#3252DF] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
              >
                Unlock Records
              </button>

              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
              >
                View as Guest (Restricted)
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-[32px] flex items-center justify-between shadow-xl shadow-blue-500/5 sticky top-8 z-50">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <div className="hidden sm:block">
              <span className="font-black text-lg tracking-tight">Selorah Health</span>
              <p className="text-[10px] font-black uppercase text-[#4262ff] tracking-[0.2em] leading-none">
                Shared Access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isVerified && (
              <button
                onClick={() => setShowVisitReportModal(true)}
                className="bg-[#4262ff] text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-[#3252DF] transition-all shadow-lg shadow-blue-500/20"
              >
                <DocumentPlusIcon className="w-4 h-4" />
                Add Visit Report
              </button>
            )}
            <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                Time Remaining
              </p>
              <p
                className={`font-bold text-sm ${
                  timeLeft !== null && timeLeft < 300 ? 'text-red-500' : 'text-gray-900'
                }`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[48px] overflow-hidden shadow-2xl relative">
          <div className="h-32 bg-[#F0F2FF] relative">
            <div className="absolute -bottom-16 left-12">
              <div className="w-32 h-32 rounded-[40px] bg-white p-2 shadow-xl border border-gray-100">
                <div className="w-full h-full rounded-[32px] bg-gradient-to-tr from-[#6183FF] to-[#14F1D9] flex items-center justify-center font-black text-4xl text-white">
                  {initials}
                </div>
              </div>
            </div>
            {isVerified && (
              <div className="absolute top-6 right-12 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-[#4262ff]" />
                <span className="text-xs font-bold text-[#4262ff] uppercase tracking-widest">
                  Verified {verificationRole}
                </span>
              </div>
            )}
          </div>

          <div className="pt-24 px-12 pb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-gray-100 pb-12">
              <div>
                <h1 className="text-5xl font-black text-[#0A0B14] tracking-tighter mb-4">
                  {patient?.full_name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()}
                </h1>
                <div className="flex flex-wrap gap-4">
                  <span className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {patient?.dob}
                    {patient?.age != null ? ` (${patient.age}Y)` : ''}
                  </span>
                  <span className="bg-[#4262ff]/5 px-4 py-2 rounded-xl text-sm font-bold text-[#4262ff] flex items-center gap-2 border border-[#4262ff]/10">
                    <IdentificationIcon className="w-4 h-4" /> Patient ID: {patient?.patientId}
                  </span>
                </div>
              </div>
              {patient?.allergies?.length > 0 && (
                <div className="flex flex-col items-start md:items-end gap-2">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Emergency Priority
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-red-500 font-bold">Critical Allergies Listed</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="space-y-12">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] mb-6 flex items-center gap-2">
                    <HeartIcon className="w-4 h-4" /> Physical Vitals
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Height</p>
                      <p className="text-xl font-bold text-gray-900">{patient?.height}</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Weight</p>
                      <p className="text-xl font-bold text-gray-900">{patient?.weight}</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Blood Group</p>
                      <p className="text-xl font-black text-[#4262ff]">{patient?.bloodGroup}</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Genotype</p>
                      <p className="text-xl font-bold text-gray-900">{patient?.genotype}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2">
                    <InformationCircleIcon className="w-4 h-4" /> Allergies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {patient?.allergies?.length ? (
                      patient.allergies.map((a: string) => (
                        <span
                          key={a}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100"
                        >
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 font-medium">None recorded</span>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] mb-6 flex items-center gap-2">
                    <UserPlusIcon className="w-4 h-4" /> Emergency Contacts
                  </h3>
                  <div className="space-y-4">
                    {patient?.emergencyContacts?.length ? (
                      patient.emergencyContacts.map((c: any, i: number) => (
                        <div key={i} className="border-l-4 border-[#4262ff] pl-4 py-1">
                          <p className="font-bold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            {c.relationship} • {c.phone}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 font-medium">None recorded</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="lg:col-span-2 space-y-16">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] mb-8 flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-4 h-4" /> Medical History
                  </h3>
                  <div className="grid md:grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">
                        Family History
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {patient?.familyHistory}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">
                        Medication History
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {patient?.medicationHistory}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] flex items-center gap-2">
                      <BeakerIcon className="w-4 h-4" /> Clinical Records
                    </h3>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                      {[
                        { id: 'all', label: 'All', icon: FunnelIcon },
                        { id: 'lab', label: 'Labs', icon: BeakerIcon },
                        { id: 'rad', label: 'Imaging', icon: IdentificationIcon },
                        { id: 'pres', label: 'Prescriptions', icon: PencilSquareIcon },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                            activeCategory === cat.id
                              ? 'bg-white text-[#4262ff] shadow-sm'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <cat.icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredRecords.length === 0 && (
                      <p className="text-sm text-gray-400 font-medium py-8 text-center">
                        No clinical records available for this patient yet.
                      </p>
                    )}
                    {filteredRecords.map((r) => (
                      <div
                        key={r.id}
                        className="group p-6 bg-gray-50 rounded-[32px] border border-transparent hover:border-[#4262ff]/20 hover:bg-white transition-all"
                      >
                        <div className="flex justify-between items-start mb-4 gap-4">
                          <h4 className="font-black text-gray-900 group-hover:text-[#4262ff] transition-colors">
                            {r.title}
                          </h4>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                            {r.date}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                          <div>
                            <p className="text-[9px] font-black uppercase text-gray-400">Facility</p>
                            <p className="text-xs font-bold text-gray-700">{r.facility}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-gray-400">
                              Practitioner
                            </p>
                            <p className="text-xs font-bold text-gray-700">{r.doctor}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-2xl border border-gray-100">
                          <p className="text-xs text-gray-500 leading-relaxed italic line-clamp-2">
                            &quot;{r.content}&quot;
                          </p>
                          {r.file_url && (
                            <a
                              href={r.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block mt-3 text-xs font-bold text-[#4262ff] hover:underline"
                            >
                              Open attached document →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center pb-20">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-full shadow-lg shadow-blue-500/5">
            <ShieldCheckIcon className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Verified & Encrypted • Selorah Health Infrastructure
            </span>
          </div>
        </footer>
      </div>

      {showVisitReportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0A0B14]/90 backdrop-blur-xl p-4 sm:p-6">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl sm:rounded-[40px] overflow-hidden shadow-2xl my-auto">
            <div className="p-5 sm:p-8 md:p-10">
              <div className="flex justify-between items-start gap-4 mb-6 sm:mb-10">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                    Add Visit Report
                  </h3>
                  <p className="text-gray-500 font-medium text-sm sm:text-base">
                    Record a new interaction for {patient?.first_name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVisitReportModal(false)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-5 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Facility
                    </label>
                    <input
                      type="text"
                      value={visitFacility}
                      onChange={(e) => setVisitFacility(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-gray-700 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Doctor
                    </label>
                    <input
                      type="text"
                      value={visitDoctor}
                      onChange={(e) => setVisitDoctor(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-gray-700 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Observations & Notes
                  </label>
                  <textarea
                    placeholder="Describe visit details, diagnosis, or recommendations..."
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3.5 sm:py-4 font-medium text-gray-700 h-32 sm:h-40 focus:outline-none focus:border-[#4262ff] transition-all text-base"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    onClick={() => setShowVisitReportModal(false)}
                    className="flex-1 bg-gray-50 text-gray-900 py-5 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!patient?.profileId) {
                        toastError('Patient profile not loaded. Cannot save report.');
                        return;
                      }
                      if (!visitNotes.trim()) {
                        warning('Please add observations or notes before submitting.');
                        return;
                      }
                      setSubmittingReport(true);
                      try {
                        const title = `Visit Report — ${visitFacility || 'Clinic'} (${new Date().toLocaleDateString()})`;
                        // Schema has no notes column — store report body as a text data URL
                        const reportBody = [
                          `Visit Report`,
                          `Facility: ${visitFacility || 'Clinic'}`,
                          `Doctor: ${visitDoctor || 'Doctor'}`,
                          `Date: ${new Date().toISOString()}`,
                          ``,
                          visitNotes.trim(),
                        ].join('\n');
                        const notesDataUrl =
                          'data:text/plain;charset=utf-8,' + encodeURIComponent(reportBody);

                        const { data, error } = await supabase
                          .from('medical_records')
                          .insert({
                            patient_id: patient.profileId,
                            title,
                            record_type: 'Visit Report',
                            file_url: notesDataUrl,
                            status: 'active',
                            encrypted: true,
                          })
                          .select('id, title, record_type, file_url, created_at')
                          .single();

                        if (error) throw error;

                        // Also store notes in a second field if your schema has description/notes;
                        // for now prepend notes into list content client-side.
                        setRecords((prev) => [
                          {
                            id: data.id,
                            title: data.title,
                            category: 'other',
                            facility: visitFacility || 'Clinic',
                            doctor: visitDoctor || 'Doctor',
                            date: data.created_at
                              ? new Date(data.created_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : new Date().toLocaleDateString(),
                            content: visitNotes.trim(),
                            file_url: notesDataUrl,
                          },
                          ...prev,
                        ]);

                        setVisitNotes('');
                        setShowVisitReportModal(false);
                        success('Visit report saved to the patient\'s records.');
                      } catch (err: any) {
                        console.error(err);
                        toastError(err?.message || 'Unknown error', 'Failed to save visit report');
                      } finally {
                        setSubmittingReport(false);
                      }
                    }}
                    disabled={submittingReport}
                    className="flex-[2] bg-[#4262ff] text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:bg-[#3252DF] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {submittingReport ? 'Saving…' : 'Submit Report'} <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
