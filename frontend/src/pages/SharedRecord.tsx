import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  HeartIcon,
  IdentificationIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PhoneIcon,
  PrinterIcon,
  ShieldCheckIcon,
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

type RecordCategory = 'lab' | 'rad' | 'pres' | 'visit' | 'other';

type SharedRecordItem = {
  id: string;
  title: string;
  category: RecordCategory;
  facility: string;
  doctor: string;
  date: string;
  content: string;
  file_url: string | null;
};

type AccessMode = 'gate' | 'full' | 'guest';

type ProviderRole = 'doctor' | 'nurse' | 'pharmacist' | 'lab' | 'admin';

const ROLE_OPTIONS: { id: ProviderRole; label: string }[] = [
  { id: 'doctor', label: 'Doctor' },
  { id: 'nurse', label: 'Nurse' },
  { id: 'pharmacist', label: 'Pharmacist' },
  { id: 'lab', label: 'Lab scientist' },
  { id: 'admin', label: 'Admin staff' },
];

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  lab: 'Lab scientist',
  admin: 'Admin staff',
  guest: 'Guest',
};

const CATEGORY_ICONS: Record<RecordCategory, typeof DocumentTextIcon> = {
  lab: BeakerIcon,
  rad: IdentificationIcon,
  pres: PencilSquareIcon,
  visit: ClipboardDocumentListIcon,
  other: DocumentTextIcon,
};

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String((item as any)?.name || '')))
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toContacts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      name: String(item?.name || item?.full_name || '').trim(),
      relationship: String(item?.relationship || item?.relation || 'Contact').trim(),
      phone: String(item?.phone || item?.phone_number || '').trim(),
    }))
    .filter((item) => item.name || item.phone);
}

function formatTime(seconds: number | null) {
  if (seconds === null) return 'No expiry';
  if (seconds <= 0) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function SharedRecord() {
  const { token } = useParams();
  const supabase = createClient();
  const { success, error: toastError, info, warning } = useToast();

  const [patient, setPatient] = useState<any>(null);
  const [records, setRecords] = useState<SharedRecordItem[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [accessMode, setAccessMode] = useState<AccessMode>('gate');
  const [accessLogged, setAccessLogged] = useState(false);
  const [loggingAccess, setLoggingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [provider, setProvider] = useState({
    name: '',
    role: 'doctor' as ProviderRole,
    license: '',
    facility: '',
  });

  const [showVisitReportModal, setShowVisitReportModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | RecordCategory>('all');
  const [recordQuery, setRecordQuery] = useState('');
  const [visitFacility, setVisitFacility] = useState('');
  const [visitDoctor, setVisitDoctor] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Load shared link, patient profile, and scoped records.
  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoadError('Missing share token.');
        setLoading(false);
        return;
      }

      try {
        const { data: link, error: linkError } = await supabase
          .from('shared_links')
          .select('id, user_id, token, is_active, expires_at, created_at, record_id')
          .eq('token', token)
          .maybeSingle();

        if (linkError) {
          setLoadError(linkError.message);
          setLoading(false);
          return;
        }

        if (!link) {
          setLoadError('This share link was not found. Ask the patient for a new link.');
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

        const TEN_YEARS_MS = 9 * 365 * 24 * 60 * 60 * 1000;
        if (expiresMs < TEN_YEARS_MS) {
          setTimeLeft(Math.floor(expiresMs / 1000));
        } else {
          setTimeLeft(null);
        }

        const { data: profile, error: profileError } = await supabase
          .from('patient_profiles')
          .select(
            'id, user_id, full_name, date_of_birth, blood_group, genotype, gender, height, weight, allergies, emergency_contacts'
          )
          .eq('user_id', link.user_id)
          .maybeSingle();

        if (profileError) {
          console.warn('patient_profiles read failed:', profileError.message);
        }

        let fullName = (profile?.full_name && String(profile.full_name).trim()) || '';
        if (!fullName) fullName = 'Patient';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Patient';
        const lastName = nameParts.slice(1).join(' ') || '';

        let age: number | null = null;
        let dobLabel = 'Not recorded';
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
            const monthDiff = now.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
          }
        }

        const patientIdShort = profile?.id
          ? `SH-${String(profile.id).replace(/-/g, '').substring(0, 4).toUpperCase()}-${firstName
              .substring(0, 1)
              .toUpperCase()}${lastName.substring(0, 1).toUpperCase() || 'X'}`
          : `SH-${String(link.user_id).replace(/-/g, '').substring(0, 6).toUpperCase()}`;

        let height = profile?.height ? String(profile.height) : 'Not recorded';
        let weight = profile?.weight ? String(profile.weight) : 'Not recorded';
        let bloodGroup = profile?.blood_group || 'Not recorded';
        let genotype = profile?.genotype || 'Not recorded';
        let familyHistory = 'Not provided';
        let medicationHistory = 'Not provided';
        let allergies = toList(profile?.allergies);
        const emergencyContacts = toContacts(profile?.emergency_contacts);

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

        let mappedRecords: SharedRecordItem[] = [];

        if (profile?.id) {
          let query = supabase
            .from('medical_records')
            .select(
              'id, title, record_type, file_url, status, created_at, notes, ocr_text'
            )
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false });

          if (link.record_id) {
            query = query.eq('id', link.record_id);
          }

          const { data: dbRecords } = await query;

          if (dbRecords && dbRecords.length > 0) {
            for (const row of dbRecords) {
              const title = (row.title || '').toLowerCase();
              const type = (row.record_type || '').toLowerCase();
              const content =
                [row.notes, row.ocr_text].filter(Boolean).join('\n\n').trim() ||
                decodeContent(row.file_url).trim();

              if (!content && !title) continue;

              if (title.includes('height') && height === 'Not recorded') {
                height = content || row.title;
              } else if (title.includes('weight') && weight === 'Not recorded') {
                weight = content || row.title;
              } else if (title.includes('blood') && bloodGroup === 'Not recorded') {
                bloodGroup = content || row.title;
              } else if (title.includes('genotype') && genotype === 'Not recorded') {
                genotype = content || row.title;
              } else if (title.includes('allerg') || type === 'allergy') {
                allergies = Array.from(
                  new Set([
                    ...allergies,
                    ...(content || row.title)
                      .split(/[,;\n]+/)
                      .map((item: string) => item.trim())
                      .filter(Boolean),
                  ])
                );
              } else if (title.includes('family') && familyHistory === 'Not provided') {
                familyHistory = content || row.title;
              } else if (
                (title.includes('medication') || title.includes('medicine')) &&
                medicationHistory === 'Not provided'
              ) {
                medicationHistory = content || row.title;
              } else if (title.includes('emergency') || type.includes('emergency')) {
                emergencyContacts.push({
                  name: content.split(/[,\-|]/)[0]?.trim() || content || row.title,
                  relationship: 'Contact',
                  phone: content.match(/\+?[\d\s-]{7,}/)?.[0]?.trim() || '',
                });
              }
            }

            const PROFILE_TYPES = new Set([
              'vital',
              'allergy',
              'history',
              'emergency contact',
              'note',
            ]);
            const PROFILE_TITLES = [
              'height',
              'weight',
              'blood group',
              'genotype',
              'allergies',
              'family history',
              'medication history',
              'emergency contact',
            ];

            mappedRecords = dbRecords
              .filter((row) => {
                const type = (row.record_type || '').toLowerCase();
                const title = (row.title || '').toLowerCase();
                if (PROFILE_TYPES.has(type)) return false;
                if (PROFILE_TITLES.includes(title)) return false;
                return true;
              })
              .map((row: any) => {
                const type = (row.record_type || '').toLowerCase();
                let category: RecordCategory = 'other';
                if (type.includes('lab') || type.includes('test')) category = 'lab';
                else if (
                  type.includes('xray') ||
                  type.includes('rad') ||
                  type.includes('scan') ||
                  type.includes('image')
                )
                  category = 'rad';
                else if (type.includes('pres') || type.includes('drug')) category = 'pres';
                else if (type.includes('visit')) category = 'visit';

                const content =
                  [row.notes, row.ocr_text].filter(Boolean).join('\n\n').trim() ||
                  decodeContent(row.file_url);

                return {
                  id: row.id,
                  title: row.title || 'Clinical document',
                  category,
                  facility: type.includes('visit')
                    ? row.notes?.match(/Facility:\s*(.+)/i)?.[1]?.trim() || 'Visit report'
                    : 'Clinical upload',
                  doctor: type.includes('visit')
                    ? row.notes?.match(/Doctor:\s*(.+)/i)?.[1]?.trim() || 'Not recorded'
                    : 'Not recorded',
                  date: row.created_at
                    ? new Date(row.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Date not recorded',
                  content: content || 'No text was captured for this document.',
                  file_url: row.file_url,
                };
              })
              .filter((row: SharedRecordItem) => Boolean(row.id));
          }
        }

        setRecords(mappedRecords);
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
          gender: profile?.gender || '',
          allergies,
          familyHistory,
          medicationHistory,
          emergencyContacts,
          patientId: patientIdShort,
          profileId: profile?.id,
          userId: link.user_id,
          singleRecord: Boolean(link.record_id),
        });
      } catch (err: any) {
        console.error(err);
        setLoadError(err?.message || 'This shared record could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, supabase]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous === null || previous <= 1) {
          window.clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const openRecord = async (mode: 'full' | 'guest') => {
    if (mode === 'full') {
      if (provider.name.trim().length < 2) {
        setAccessError('Add the name of the person viewing this record.');
        return;
      }
      if (provider.license.trim().length < 4) {
        setAccessError('Add a license or staff number so the patient can identify you.');
        return;
      }
    }

    setAccessError(null);
    setLoggingAccess(true);
    let logged = false;

    try {
      const { data, error } = await supabase.rpc('log_shared_access', {
        p_token: token,
        p_name: mode === 'full' ? provider.name.trim() : 'Anonymous visitor',
        p_role: mode === 'full' ? provider.role : 'guest',
        p_license: mode === 'full' ? provider.license.trim() : null,
        p_facility: mode === 'full' ? provider.facility.trim() || null : null,
      });
      const result = data as { ok?: boolean } | null;
      logged = Boolean(result?.ok) && !error;
    } catch {
      logged = false;
    } finally {
      setAccessLogged(logged);
      setLoggingAccess(false);
      setAccessMode(mode);
    }
  };

  const filteredRecords = records.filter((record) => {
    if (activeCategory !== 'all' && record.category !== activeCategory) return false;
    if (!recordQuery.trim()) return true;
    const haystack = `${record.title} ${record.content} ${record.facility} ${record.doctor}`.toLowerCase();
    return haystack.includes(recordQuery.trim().toLowerCase());
  });

  const initials = patient
    ? `${(patient.first_name || 'P')[0]}${(patient.last_name || '')[0] || ''}`.toUpperCase()
    : 'P';

  const accent = '#4262ff';
  const isGuest = accessMode === 'guest';
  const patientDisplay = patient
    ? `${patient.first_name || 'Patient'} ${(patient.last_name || '').charAt(0)}${patient.last_name ? '.' : ''}`
    : 'Patient';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FC] p-6 font-sora">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-500/5">
            <img src="/logo.svg" alt="Selorah" className="h-8 w-8 object-contain" />
          </div>
          <p className="text-sm font-semibold text-gray-400">Opening secure share...</p>
        </div>
      </div>
    );
  }

  if (loadError || isRevoked || isExpired) {
    const state = loadError
      ? {
          title: 'This link cannot be opened',
          body: loadError,
          icon: ExclamationTriangleIcon,
          tone: 'text-amber-500 bg-amber-50 border-amber-100',
        }
      : isRevoked
        ? {
            title: 'Access revoked',
            body: 'The patient revoked this link. Ask for a new secure share if you still need the record.',
            icon: LockClosedIcon,
            tone: 'text-red-500 bg-red-50 border-red-100',
          }
        : {
            title: 'Access expired',
            body: 'This link reached its time limit. Ask the patient to share a new link.',
            icon: ClockIcon,
            tone: 'text-red-500 bg-red-50 border-red-100',
          };
    const StateIcon = state.icon;

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FC] p-4 font-sora sm:p-6">
        <div className="w-full max-w-md rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-2xl shadow-blue-500/5 sm:p-10">
          <div
            className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${state.tone}`}
          >
            <StateIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#0A0B14]">{state.title}</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500">{state.body}</p>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="mt-8 min-h-[48px] w-full rounded-2xl bg-[#0A0B14] px-5 text-sm font-bold text-white transition-colors hover:bg-black"
          >
            Back to Selorah
          </button>
        </div>
      </div>
    );
  }

  if (accessMode === 'gate') {
    return (
      <div className="min-h-screen bg-[#F6F8FC] font-sora text-[#101217]">
        <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative overflow-hidden bg-[#05081A] px-6 py-10 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#4262ff]/30 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#14F1D9]/10 blur-3xl"
            />

            <div className="relative">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="Selorah" className="h-10 w-10 object-contain" />
                <div>
                  <p className="text-lg font-bold leading-none">Selorah Health</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    Secure patient share
                  </p>
                </div>
              </div>

              <div className="mt-12 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#6183FF] to-[#14F1D9] text-2xl font-black text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    Shared with you
                  </p>
                  <p className="mt-1 text-2xl font-black tracking-tight">{patientDisplay}</p>
                </div>
              </div>

              <p className="mt-8 max-w-sm text-sm font-medium leading-relaxed text-white/55">
                A patient chose to share their medical record with you. Access is time limited and
                every opening is added to their access log.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  { icon: ClockIcon, text: 'Access closes automatically when the timer ends' },
                  { icon: ShieldCheckIcon, text: 'Views are recorded for the patient to review' },
                  { icon: LockClosedIcon, text: 'The link is private. Do not forward it' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8FA8FF]" />
                    <p className="text-xs font-semibold leading-relaxed text-white/65">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-10 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-bold text-white/70">
                <ClockIcon className="h-3.5 w-3.5 text-[#5FFAB0]" />
                {formatTime(timeLeft)} left
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-bold text-white/70">
                <DocumentTextIcon className="h-3.5 w-3.5 text-[#8FA8FF]" />
                {patient?.singleRecord ? 'Single record' : 'Full record'}
              </span>
            </div>
          </section>

          <section className="flex items-center px-5 py-8 sm:px-10 lg:px-14">
            <div className="w-full">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4262ff]">
                Before you continue
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0A0B14] sm:text-4xl">
                Who is viewing this record?
              </h1>
              <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-gray-500">
                The patient will see your name, role, and facility in their access log. This keeps
                sharing accountable without slowing down care.
              </p>

              <form
                className="mt-7 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void openRecord('full');
                }}
              >
                <div>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                    Your role
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setProvider((previous) => ({ ...previous, role: option.id }))
                        }
                        className={`min-h-[40px] rounded-full border px-4 text-xs font-bold transition-all ${
                          provider.role === option.id
                            ? 'border-[#4262ff] bg-[#EEF2FF] text-[#4262ff]'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                      Full name
                    </span>
                    <input
                      value={provider.name}
                      onChange={(event) =>
                        setProvider((previous) => ({ ...previous, name: event.target.value }))
                      }
                      placeholder="Dr. Ada Okafor"
                      autoComplete="name"
                      className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4262ff]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                      License or staff number
                    </span>
                    <input
                      value={provider.license}
                      onChange={(event) =>
                        setProvider((previous) => ({ ...previous, license: event.target.value }))
                      }
                      placeholder="MDCN / staff ID"
                      autoComplete="off"
                      className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4262ff]"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                    Facility <span className="font-semibold normal-case tracking-normal">(optional)</span>
                  </span>
                  <input
                    value={provider.facility}
                    onChange={(event) =>
                      setProvider((previous) => ({ ...previous, facility: event.target.value }))
                    }
                    placeholder="Hospital or clinic name"
                    autoComplete="organization"
                    className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4262ff]"
                  />
                </label>

                {accessError && (
                  <p className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-700">
                    <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {accessError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loggingAccess}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#4262ff] px-5 text-base font-bold text-white shadow-xl shadow-blue-500/20 transition-colors hover:bg-[#3252DF] disabled:opacity-60"
                >
                  {loggingAccess ? 'Opening record...' : 'Open patient record'}
                  {!loggingAccess && <ChevronRightIcon className="h-5 w-5" />}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-300">
                  or
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={() => void openRecord('guest')}
                disabled={loggingAccess}
                className="min-h-[48px] w-full rounded-2xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-600 transition-colors hover:border-gray-300 hover:text-[#101217] disabled:opacity-60"
              >
                Continue with emergency preview
              </button>

              <p className="mt-4 text-center text-[11px] font-medium leading-relaxed text-gray-400">
                Emergency preview shows blood group, genotype, allergies, and emergency contacts
                only. Clinical history stays hidden.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] font-sora text-[#101217] print:bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.svg" alt="Selorah" className="h-8 w-8 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none text-[#0A0B14]">
                Selorah Health
              </p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#4262ff]">
                Shared access
              </p>
            </div>
            <span className="ml-1 hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500 sm:inline-flex">
              <ClockIcon className="h-3.5 w-3.5 text-[#4262ff]" />
              {formatTime(timeLeft)} left
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-[11px] font-bold text-gray-600 transition-colors hover:border-gray-300 hover:text-[#101217] sm:px-4"
            >
              <PrinterIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            {accessMode === 'full' && (
              <button
                type="button"
                onClick={() => setShowVisitReportModal(true)}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full bg-[#4262ff] px-3.5 text-[11px] font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-[#3252DF] sm:px-4"
              >
                <DocumentPlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add visit report</span>
                <span className="sm:hidden">Report</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:px-0 print:py-0">
        {isGuest && (
          <div className="flex flex-col gap-3 rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-900">Emergency preview only</p>
                <p className="mt-0.5 text-xs font-medium leading-relaxed text-amber-700">
                  Clinical history is hidden. Confirm your provider details to open the full record.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAccessMode('gate')}
              className="min-h-[40px] shrink-0 rounded-full bg-amber-500 px-4 text-[11px] font-bold text-white transition-colors hover:bg-amber-600"
            >
              Open full record
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-xl shadow-blue-500/5">
          <div className="relative h-24 bg-gradient-to-r from-[#EEF2FF] via-[#F5F7FF] to-[#E8FBF7] sm:h-28">
            <div
              aria-hidden
              className="absolute right-6 top-4 h-24 w-24 rounded-full border border-white/60 bg-white/30 backdrop-blur-sm sm:h-32 sm:w-32"
            />
          </div>

          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] border-4 border-white bg-gradient-to-tr from-[#6183FF] to-[#14F1D9] text-2xl font-black text-white shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                  {initials}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-black tracking-tight text-[#0A0B14] sm:text-3xl">
                      {patient?.full_name}
                    </h1>
                    {patient?.singleRecord && (
                      <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#4262ff]">
                        Single record
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-gray-400">
                    Patient ID {patient?.patientId}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pb-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                    accessLogged
                      ? 'border-green-100 bg-green-50 text-green-700'
                      : 'border-amber-100 bg-amber-50 text-amber-700'
                  }`}
                >
                  {accessLogged ? (
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  )}
                  {accessLogged ? 'Access logged' : 'Session not logged'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-500">
                  <UserIcon className="h-3.5 w-3.5 text-[#4262ff]" />
                  {accessMode === 'guest'
                    ? 'Guest preview'
                    : `${ROLE_LABELS[provider.role] || 'Provider'}${
                        provider.name ? `: ${provider.name.trim()}` : ''
                      }`}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Blood group', value: patient?.bloodGroup, tone: 'text-[#4262ff]' },
                { label: 'Genotype', value: patient?.genotype, tone: 'text-[#0A0B14]' },
                {
                  label: 'Age',
                  value: patient?.age != null ? `${patient.age} years` : 'Not recorded',
                  tone: 'text-[#0A0B14]',
                },
                {
                  label: 'Sex',
                  value: patient?.gender || 'Not recorded',
                  tone: 'text-[#0A0B14]',
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#F8F9FE] px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-base font-black ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {patient?.allergies?.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-500">
                    Allergy alert
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies.map((allergy: string) => (
                    <span
                      key={allergy}
                      className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-red-600"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {isGuest ? (
              <section className="rounded-[28px] border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4262ff]">
                  <LockClosedIcon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-black tracking-tight text-[#0A0B14]">
                  Clinical history is hidden
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-gray-500">
                  Confirm your provider details to view lab results, imaging, prescriptions, and
                  visit reports.
                </p>
                <button
                  type="button"
                  onClick={() => setAccessMode('gate')}
                  className="mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#4262ff] px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-[#3252DF]"
                >
                  Open full record
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </section>
            ) : (
              <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-[#0A0B14]">
                      Clinical records
                    </h2>
                    <p className="mt-1 text-xs font-medium text-gray-400">
                      {filteredRecords.length} of {records.length} records
                    </p>
                  </div>

                  <label className="relative block w-full sm:w-64">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                    <input
                      value={recordQuery}
                      onChange={(event) => setRecordQuery(event.target.value)}
                      placeholder="Search records"
                      className="min-h-[42px] w-full rounded-full border border-gray-200 bg-[#F8F9FE] pl-10 pr-4 text-xs font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4262ff] focus:bg-white"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 rounded-2xl bg-[#F8F9FE] p-1.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'lab', label: 'Labs' },
                    { id: 'rad', label: 'Imaging' },
                    { id: 'pres', label: 'Prescriptions' },
                    { id: 'visit', label: 'Visits' },
                  ].map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id as 'all' | RecordCategory)}
                      className={`min-h-[34px] flex-1 rounded-xl px-2 text-[10px] font-black uppercase tracking-[0.08em] transition-all ${
                        activeCategory === category.id
                          ? 'bg-white text-[#4262ff] shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  {filteredRecords.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center">
                      <DocumentTextIcon className="mx-auto h-7 w-7 text-gray-200" />
                      <p className="mt-3 text-sm font-bold text-gray-500">No records to show</p>
                      <p className="mt-1 text-xs font-medium text-gray-400">
                        {recordQuery
                          ? 'Try a different search term or category.'
                          : 'This patient has not added a record in this category yet.'}
                      </p>
                    </div>
                  )}

                  {filteredRecords.map((record) => {
                    const Icon = CATEGORY_ICONS[record.category] || DocumentTextIcon;
                    const isTextData = (record.file_url || '').startsWith('data:text/plain');
                    return (
                      <article
                        key={record.id}
                        className="group rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[#4262ff]/25 hover:shadow-lg hover:shadow-blue-500/5 sm:p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4262ff]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <h3 className="font-bold leading-snug text-[#0A0B14]">
                                {record.title}
                              </h3>
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
                                {record.date}
                              </span>
                            </div>

                            <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs font-medium leading-relaxed text-gray-500">
                              {record.content}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                                {record.facility}
                              </span>
                              {record.doctor && record.doctor !== 'Not recorded' && (
                                <span className="rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                                  {record.doctor}
                                </span>
                              )}
                              {record.file_url && !isTextData && (
                                <a
                                  href={record.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-[#4262ff] hover:underline"
                                >
                                  Open document
                                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#4262ff]">
                <HeartIcon className="h-4 w-4" />
                Physical vitals
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Height', value: patient?.height },
                  { label: 'Weight', value: patient?.weight },
                  { label: 'Blood group', value: patient?.bloodGroup },
                  { label: 'Genotype', value: patient?.genotype },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[#F8F9FE] px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-400">
                      {item.label}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-[#0A0B14]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-500">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Allergies
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {patient?.allergies?.length ? (
                  patient.allergies.map((allergy: string) => (
                    <span
                      key={allergy}
                      className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600"
                    >
                      {allergy}
                    </span>
                  ))
                ) : (
                  <p className="text-xs font-medium text-gray-400">None recorded</p>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#4262ff]">
                <UserPlusIcon className="h-4 w-4" />
                Emergency contacts
              </h2>
              <div className="mt-4 space-y-3">
                {patient?.emergencyContacts?.length ? (
                  patient.emergencyContacts.map((contact: any, index: number) => (
                    <div
                      key={`${contact.name}-${index}`}
                      className="rounded-xl border-l-2 border-[#4262ff] bg-[#F8F9FE] px-3 py-2.5"
                    >
                      <p className="text-xs font-bold text-[#0A0B14]">
                        {contact.name || 'Contact'}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-gray-400">
                        {contact.relationship}
                      </p>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone.replace(/\s/g, '')}`}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#4262ff]"
                        >
                          <PhoneIcon className="h-3.5 w-3.5" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-gray-400">None recorded</p>
                )}
              </div>
            </section>

            {!isGuest && (
              <section className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#4262ff]">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  Medical history
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                      Family history
                    </p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-gray-600">
                      {patient?.familyHistory}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                      Medication history
                    </p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-gray-600">
                      {patient?.medicationHistory}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </aside>
        </div>

        <footer className="pb-8 print:hidden">
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              Encrypted share, audited access
            </div>
            <p className="text-[10px] font-medium text-gray-400">
              Powered by Selorah Health. The patient can revoke this link at any time.
            </p>
          </div>
        </footer>
      </main>

      {showVisitReportModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#05081A]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visit-report-title"
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7 sm:py-5">
              <div>
                <h2
                  id="visit-report-title"
                  className="text-lg font-black tracking-tight text-[#0A0B14] sm:text-xl"
                >
                  Add visit report
                </h2>
                <p className="mt-0.5 text-xs font-medium text-gray-400">
                  Saved to {patient?.first_name || 'the patient'}&apos;s record after you submit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVisitReportModal(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    Facility
                  </span>
                  <input
                    value={visitFacility}
                    onChange={(event) => setVisitFacility(event.target.value)}
                    placeholder={provider.facility || 'Hospital or clinic'}
                    className="min-h-[46px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4262ff]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    Doctor or clinician
                  </span>
                  <input
                    value={visitDoctor}
                    onChange={(event) => setVisitDoctor(event.target.value)}
                    placeholder={provider.name || 'Name of the clinician'}
                    className="min-h-[46px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4262ff]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Observations and notes
                </span>
                <textarea
                  value={visitNotes}
                  onChange={(event) => setVisitNotes(event.target.value)}
                  placeholder="Diagnosis, observations, treatment, and follow up."
                  rows={7}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#4262ff]"
                />
              </label>

              <p className="flex items-start gap-2 rounded-xl bg-[#F8F9FE] px-3 py-2.5 text-[10px] font-medium leading-relaxed text-gray-500">
                <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4262ff]" />
                This report is added to the patient&apos;s medical record and appears in their
                access history.
              </p>
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={() => setShowVisitReportModal(false)}
                className="min-h-[46px] rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!visitNotes.trim()) {
                    warning('Add observations before submitting.');
                    return;
                  }
                  setSubmittingReport(true);
                  try {
                    const { data, error } = await supabase.rpc('add_shared_visit_report', {
                      p_token: token,
                      p_facility: visitFacility || provider.facility || 'Clinic',
                      p_doctor: visitDoctor || provider.name || 'Doctor',
                      p_notes: visitNotes.trim(),
                    });

                    if (error) throw error;

                    const result = data as {
                      ok?: boolean;
                      message?: string;
                      record?: {
                        id: string;
                        title: string;
                        file_url: string;
                        created_at: string;
                        notes?: string;
                      };
                    } | null;

                    if (!result?.ok || !result.record) {
                      throw new Error(result?.message || 'The report was not saved.');
                    }

                    const saved = result.record;
                    setRecords((previous) => [
                      {
                        id: saved.id,
                        title: saved.title || 'Visit report',
                        category: 'visit',
                        facility: visitFacility || provider.facility || 'Clinic',
                        doctor: visitDoctor || provider.name || 'Doctor',
                        date: saved.created_at
                          ? new Date(saved.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : new Date().toLocaleDateString(),
                        content: visitNotes.trim(),
                        file_url: saved.file_url,
                      },
                      ...previous,
                    ]);

                    setVisitNotes('');
                    setShowVisitReportModal(false);
                    success('Visit report added to the patient record.');
                  } catch (error) {
                    console.error(error);
                    toastError(
                      error instanceof Error ? error.message : 'The report could not be saved.',
                      'Report not saved'
                    );
                  } finally {
                    setSubmittingReport(false);
                  }
                }}
                disabled={submittingReport}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#4262ff] px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-[#3252DF] disabled:opacity-60"
              >
                {submittingReport ? 'Saving...' : 'Submit report'}
                {!submittingReport && <ChevronRightIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
