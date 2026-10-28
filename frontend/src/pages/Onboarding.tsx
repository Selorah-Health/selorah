import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BeakerIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  HeartIcon,
  IdentificationIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

const ROLES = [
  {
    id: 'patient',
    title: 'Patient',
    desc: 'Own and share your personal health records.',
    icon: UserIcon,
  },
  {
    id: 'hospital',
    title: 'Hospital / Clinic',
    desc: 'Manage records and patient intake.',
    icon: BuildingOffice2Icon,
  },
  {
    id: 'researcher',
    title: 'Researcher',
    desc: 'Run studies with consented data.',
    icon: BeakerIcon,
  },
  {
    id: 'insurer',
    title: 'Insurer',
    desc: 'Verify claims with patient consent.',
    icon: ShieldCheckIcon,
  },
];

const inputClass =
  'min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]';

const labelClass =
  'mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400';

function isMissingColumn(message?: string | null) {
  return Boolean(message && /column .* does not exist/i.test(message));
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const supabase = createClient();
  const { success: toastSuccess, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roleLocked, setRoleLocked] = useState(false);

  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    nin: '',
    dateOfBirth: '',
    gender: '',
    whatsappNumber: '',
    vitals: { height: '', weight: '', bloodType: '', genotype: '' },
    allergies: '',
    medicalConditions: '',
    emergencyContacts: [] as EmergencyContact[],
    orgName: '',
    licenseNumber: '',
    taxId: '',
    officialEmail: '',
    officialPhone: '',
    uploadedDocs: {} as Record<string, boolean>,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadDoc, setCurrentUploadDoc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const prefill = async () => {
      let first = '';
      let last = '';
      let orgName = '';
      let phone = '';
      let officialEmail = '';
      let roleFromSignup = '';
      let nin = '';

      try {
        const saved = localStorage.getItem('selorah_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          first = parsed.first_name || parsed.firstName || '';
          last = parsed.last_name || parsed.lastName || '';
          roleFromSignup = parsed.role || '';
          orgName = parsed.org_name || '';
          phone = parsed.phone || '';
          officialEmail = parsed.email || '';
          nin = parsed.nin || '';
          if (!first && parsed.org_name) first = parsed.org_name;
        }
      } catch {
        // Ignore malformed storage.
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          first = first || user.user_metadata.first_name || '';
          last = last || user.user_metadata.last_name || '';
          roleFromSignup = roleFromSignup || user.user_metadata.role || '';
          phone = phone || user.user_metadata.phone || '';
        }
      } catch {
        // Auth can be unavailable offline.
      }

      if (cancelled) return;

      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || first,
        lastName: prev.lastName || last,
        role: prev.role || roleFromSignup || '',
        orgName: prev.orgName || orgName,
        whatsappNumber: prev.whatsappNumber || phone,
        officialEmail: prev.officialEmail || officialEmail,
        nin: prev.nin || nin,
      }));

      if (roleFromSignup) {
        setRoleLocked(true);
        setStep(2);
      }
    };

    prefill();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const update = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData((current) => ({ ...current, [key]: value }));

  const handleUploadClick = (docType: string) => {
    setCurrentUploadDoc(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUploadDoc) {
      setFormData((prev) => ({
        ...prev,
        uploadedDocs: { ...prev.uploadedDocs, [currentUploadDoc]: true },
      }));
      toastSuccess(`${currentUploadDoc} attached. It will be reviewed with your application.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCurrentUploadDoc(null);
  };

  const isPatient = formData.role === 'patient';
  const totalSteps = isPatient ? 5 : 4;

  const stepLabels = isPatient
    ? ['Account type', 'Your details', 'Health basics', 'Emergency contacts', 'Finish']
    : ['Account type', 'Organization', 'Documents', 'Finish'];

  const nextStep = () => {
    setErrorMsg(null);

    if (step === 2) {
      if (!formData.role) {
        setErrorMsg('Choose how you want to use Selorah.');
        return;
      }
      if (isPatient) {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          setErrorMsg('First and last name are required.');
          return;
        }
        if (!formData.nin.trim() || formData.nin.length !== 11) {
          setErrorMsg('Patients must provide a valid 11-digit NIN.');
          return;
        }
      } else if (!formData.orgName.trim()) {
        setErrorMsg('Organization name is required.');
        return;
      }
    }

    if (step === 3 && isPatient && formData.vitals.height.trim()) {
      const height = Number(formData.vitals.height.replace(/[^\d.]/g, ''));
      if (Number.isFinite(height) && (height < 30 || height > 260)) {
        setErrorMsg('Height should be between 30 cm and 260 cm.');
        return;
      }
    }

    setStep(Math.min(totalSteps, step + 1));
  };

  const prevStep = () => {
    setErrorMsg(null);
    if (step <= 2 && roleLocked) return;
    setStep(Math.max(1, step - 1));
  };

  const handleFinish = async () => {
    setSaving(true);
    setErrorMsg(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const role = formData.role === 'hospital' ? 'provider' : formData.role || 'patient';
        const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
        const contacts = formData.emergencyContacts.filter(
          (contact) => contact.name.trim() || contact.phone.trim()
        );

        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          role,
        });

        try {
          await supabase.auth.updateUser({
            data: {
              first_name: formData.firstName || formData.orgName,
              last_name: formData.lastName,
              role,
              phone: formData.whatsappNumber || undefined,
              nin: formData.nin || undefined,
            },
          });
        } catch {
          // Metadata is a convenience for the header, not a hard requirement.
        }

        if (role === 'patient') {
          const basePayload = {
            user_id: user.id,
            full_name: fullName || null,
            date_of_birth: formData.dateOfBirth || null,
            phone: formData.whatsappNumber || null,
            nin: formData.nin || null,
            blood_group: formData.vitals.bloodType || null,
            genotype: formData.vitals.genotype || null,
          };
          const allergyList = formData.allergies
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter(Boolean);

          const extendedPayload = {
            ...basePayload,
            gender: formData.gender || null,
            height: formData.vitals.height || null,
            weight: formData.vitals.weight || null,
            allergies: allergyList,
            emergency_medical_info: formData.medicalConditions || null,
            emergency_contacts: contacts,
          };

          const { data: existing } = await supabase
            .from('patient_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (existing) {
            const attempt = await supabase
              .from('patient_profiles')
              .update(extendedPayload)
              .eq('user_id', user.id);

            if (attempt.error && isMissingColumn(attempt.error.message)) {
              const fallback = await supabase
                .from('patient_profiles')
                .update(basePayload)
                .eq('user_id', user.id);
              if (fallback.error) throw fallback.error;
            } else if (attempt.error) {
              throw attempt.error;
            }
          } else {
            const attempt = await supabase.from('patient_profiles').insert(extendedPayload);
            if (attempt.error && isMissingColumn(attempt.error.message)) {
              const fallback = await supabase.from('patient_profiles').insert(basePayload);
              if (fallback.error) throw fallback.error;
            } else if (attempt.error) {
              throw attempt.error;
            }
          }

          try {
            localStorage.setItem(
              'selorah_health_profile',
              JSON.stringify({
                gender: formData.gender,
                height: formData.vitals.height,
                weight: formData.vitals.weight,
                bloodType: formData.vitals.bloodType,
                genotype: formData.vitals.genotype,
                allergies: formData.allergies,
                medicalConditions: formData.medicalConditions,
                emergencyContacts: contacts,
              })
            );
          } catch {
            // Storage is optional.
          }
        } else if (role === 'provider') {
          const orgId = `ORG-${user.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
          const payload = {
            user_id: user.id,
            hospital_name: formData.orgName || null,
            email: formData.officialEmail || user.email,
            phone: formData.whatsappNumber || null,
            org_id: orgId,
          };
          const { data: existing } = await supabase
            .from('hospital_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (existing) {
            const { error } = await supabase
              .from('hospital_profiles')
              .update(payload)
              .eq('user_id', user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('hospital_profiles').insert(payload);
            if (error) throw error;
          }
        } else if (role === 'researcher') {
          const orgId = `RES-${user.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
          const payload = {
            user_id: user.id,
            full_name: fullName || formData.orgName,
            institution: formData.orgName || null,
            org_id: orgId,
          };
          const { data: existing } = await supabase
            .from('researcher_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (existing) {
            const { error } = await supabase
              .from('researcher_profiles')
              .update(payload)
              .eq('user_id', user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('researcher_profiles').insert(payload);
            if (error) throw error;
          }
        }
      }

      const savedUserStr = localStorage.getItem('selorah_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : {};
      localStorage.setItem(
        'selorah_user',
        JSON.stringify({
          ...savedUser,
          first_name: formData.firstName || formData.orgName,
          last_name: formData.lastName || '',
          role: formData.role,
          nin: formData.nin || savedUser.nin,
          phone: formData.whatsappNumber || savedUser.phone,
        })
      );

      toastSuccess('Your profile is ready.', 'Setup complete');

      if (formData.role === 'provider' || formData.role === 'hospital') {
        navigate('/hospital');
      } else if (formData.role === 'researcher') {
        navigate('/researcher');
      } else if (formData.role === 'insurer') {
        navigate('/insurer');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not save your profile. Please try again.';
      setErrorMsg(message);
      toastError(message, 'Setup could not finish');
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    if (formData.emergencyContacts.length >= 3) return;
    setFormData((current) => ({
      ...current,
      emergencyContacts: [
        ...current.emergencyContacts,
        { name: '', relationship: '', phone: '' },
      ],
    }));
  };

  const removeContact = (index: number) => {
    setFormData((current) => ({
      ...current,
      emergencyContacts: current.emergencyContacts.filter((_, i) => i !== index),
    }));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setFormData((current) => {
      const next = [...current.emergencyContacts];
      next[index] = { ...next[index], [field]: value };
      return { ...current, emergencyContacts: next };
    });
  };

  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] font-sora text-[#101217]">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Selorah" className="h-8 w-8 object-contain" />
            <span className="text-base font-bold tracking-tight sm:text-lg">Selorah Health</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 sm:inline">
              Step {step} of {totalSteps}
            </span>
            <Link
              to="/dashboard"
              className="rounded-full border border-gray-200 px-3.5 py-2 text-[11px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
            >
              Skip for now
            </Link>
          </div>
        </div>
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-[#6183FF] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-7 flex flex-wrap gap-2">
            {stepLabels.map((label, index) => {
              const number = index + 1;
              const isDone = number < step;
              const isCurrent = number === step;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-[#6183FF] text-white'
                      : isDone
                        ? 'bg-[#EAFBF2] text-[#15955C]'
                        : 'bg-white text-gray-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircleIcon className="h-3 w-3" />
                  ) : (
                    <span className={isCurrent ? 'text-white/70' : 'text-gray-300'}>
                      {String(number).padStart(2, '0')}
                    </span>
                  )}
                  {label}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-600"
            >
              {errorMsg}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf"
          />

          {step === 1 && (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-9">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                Welcome to Selorah
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                How will you use Selorah?
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                Pick the account that fits you. You can belong to the patient dashboard either way.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const selected = formData.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setFormData((current) => ({ ...current, role: role.id }));
                        setErrorMsg(null);
                        window.setTimeout(() => setStep(2), 180);
                      }}
                      className={`group flex min-h-[104px] items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? 'border-[#6183FF] bg-[#EEF2FF]'
                          : 'border-gray-200 bg-white hover:border-[#6183FF]/40 hover:shadow-sm'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected ? 'bg-[#6183FF] text-white' : 'bg-gray-50 text-[#6183FF]'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-[#101217]">
                          {role.title}
                          {selected && <CheckCircleIcon className="h-3.5 w-3.5 text-[#6183FF]" />}
                        </span>
                        <span className="mt-1 block text-[11px] font-medium leading-relaxed text-gray-400">
                          {role.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((current) => ({ ...current, role: 'patient' }));
                    setStep(totalSteps);
                  }}
                  className="text-[11px] font-bold text-gray-400 transition-colors hover:text-[#6183FF]"
                >
                  Just let me look around first
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white"
                >
                  Continue
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-9">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                {isPatient ? 'Your details' : 'Organization details'}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {isPatient ? 'Set up your health profile' : 'Tell us about your organization'}
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                {isPatient
                  ? 'This is the identity clinicians use when they look you up.'
                  : 'Official details are required before verification.'}
              </p>

              <div className="mt-6 space-y-4">
                {isPatient ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>First name</span>
                        <input
                          type="text"
                          autoComplete="given-name"
                          placeholder="Ada"
                          className={inputClass}
                          value={formData.firstName}
                          onChange={(event) => update('firstName', event.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Last name</span>
                        <input
                          type="text"
                          autoComplete="family-name"
                          placeholder="Okafor"
                          className={inputClass}
                          value={formData.lastName}
                          onChange={(event) => update('lastName', event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>Date of birth</span>
                        <input
                          type="date"
                          autoComplete="bday"
                          className={inputClass}
                          value={formData.dateOfBirth}
                          onChange={(event) => update('dateOfBirth', event.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Gender</span>
                        <select
                          className={inputClass}
                          value={formData.gender}
                          onChange={(event) => update('gender', event.target.value)}
                        >
                          <option value="">Select gender</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="non-binary">Non-binary</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </label>
                    </div>

                    <label className="block">
                      <span className={labelClass}>Phone number</span>
                      <span className="relative block">
                        <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="0801 234 5678"
                          className={`${inputClass} pl-11`}
                          value={formData.whatsappNumber}
                          onChange={(event) => update('whatsappNumber', event.target.value)}
                        />
                      </span>
                      <span className="mt-1.5 block px-1 text-[10px] font-medium text-gray-400">
                        Used for phone login and emergency contact matching.
                      </span>
                    </label>

                    <label className="block">
                      <span className={labelClass}>National Identification Number</span>
                      <span className="relative block">
                        <IdentificationIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={11}
                          placeholder="11-digit NIN"
                          className={`${inputClass} pl-11`}
                          value={formData.nin}
                          onChange={(event) =>
                            update('nin', event.target.value.replace(/\D/g, '').slice(0, 11))
                          }
                        />
                      </span>
                      <span className="mt-1.5 block px-1 text-[10px] font-medium text-gray-400">
                        Required for patients. Used for hospital lookup and NIN login. You can update
                        it later in Profile.
                      </span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block">
                      <span className={labelClass}>Organization name</span>
                      <input
                        type="text"
                        autoComplete="organization"
                        placeholder="Organization name"
                        className={inputClass}
                        value={formData.orgName}
                        onChange={(event) => update('orgName', event.target.value)}
                      />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className={labelClass}>Official email</span>
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="admin@organization.org"
                          className={inputClass}
                          value={formData.officialEmail}
                          onChange={(event) => update('officialEmail', event.target.value)}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>License number</span>
                        <input
                          type="text"
                          placeholder="Optional"
                          className={inputClass}
                          value={formData.licenseNumber}
                          onChange={(event) => update('licenseNumber', event.target.value)}
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className={labelClass}>Organization phone</span>
                      <span className="relative block">
                        <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="0801 234 5678"
                          className={`${inputClass} pl-11`}
                          value={formData.whatsappNumber}
                          onChange={(event) => update('whatsappNumber', event.target.value)}
                        />
                      </span>
                    </label>
                  </>
                )}
              </div>

              <div className="mt-7 flex gap-3">
                {!roleLocked && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={isPatient ? !formData.firstName.trim() : !formData.orgName.trim()}
                  className="flex min-h-[48px] flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-[#6183FF] text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-9">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                {isPatient ? 'Health basics' : 'Verification documents'}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {isPatient ? 'Add what keeps you safe' : 'Upload your documents'}
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                {isPatient
                  ? 'This optional context can matter in an emergency. You can skip it and add it later.'
                  : 'Proof of identity and license speed up verification.'}
              </p>

              {isPatient ? (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="block">
                      <span className={labelClass}>Height</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="cm"
                        className={inputClass}
                        value={formData.vitals.height}
                        onChange={(event) =>
                          update('vitals', { ...formData.vitals, height: event.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Weight</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="kg"
                        className={inputClass}
                        value={formData.vitals.weight}
                        onChange={(event) =>
                          update('vitals', { ...formData.vitals, weight: event.target.value })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Blood group</span>
                      <select
                        className={inputClass}
                        value={formData.vitals.bloodType}
                        onChange={(event) =>
                          update('vitals', { ...formData.vitals, bloodType: event.target.value })
                        }
                      >
                        <option value="">Select</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={labelClass}>Genotype</span>
                      <select
                        className={inputClass}
                        value={formData.vitals.genotype}
                        onChange={(event) =>
                          update('vitals', { ...formData.vitals, genotype: event.target.value })
                        }
                      >
                        <option value="">Select</option>
                        {['AA', 'AS', 'SS', 'AC', 'SC'].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className={labelClass}>Known allergies</span>
                    <textarea
                      rows={3}
                      placeholder="e.g. Penicillin, peanuts, latex"
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
                      value={formData.allergies}
                      onChange={(event) => update('allergies', event.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClass}>Medical conditions</span>
                    <textarea
                      rows={3}
                      placeholder="e.g. Asthma, hypertension, sickle cell"
                      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
                      value={formData.medicalConditions}
                      onChange={(event) => update('medicalConditions', event.target.value)}
                    />
                  </label>

                  <div className="flex items-start gap-2.5 rounded-2xl bg-[#EEF2FF]/60 px-4 py-3">
                    <HeartIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]" />
                    <p className="text-[11px] font-medium leading-relaxed text-gray-500">
                      This information is encrypted and shown to a clinician only when you share
                      your record.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {['Organization ID', 'Medical license', 'Official ID'].map((doc) => {
                    const isUploaded = formData.uploadedDocs[doc];
                    return (
                      <button
                        key={doc}
                        type="button"
                        onClick={() => handleUploadClick(doc)}
                        className={`flex w-full items-center gap-3 rounded-2xl border-2 border-dashed p-5 text-left transition-all ${
                          isUploaded
                            ? 'border-[#5FFAB0] bg-[#EAFBF2]'
                            : 'border-gray-200 bg-[#F8F9FE] hover:border-[#6183FF]/40'
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isUploaded
                              ? 'bg-white text-[#15955C]'
                              : 'bg-white text-[#6183FF]'
                          }`}
                        >
                          {isUploaded ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <CloudArrowUpIcon className="h-5 w-5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-[#101217]">
                            {isUploaded ? `${doc} attached` : `Upload ${doc}`}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
                            PDF or image. Reviewed by our verification team.
                          </span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6183FF]">
                          {isUploaded ? 'Replace' : 'Choose'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex min-h-[48px] flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-[#6183FF] text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
                >
                  Continue
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-9">
              {isPatient ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
                    Emergency contacts
                  </p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Who should we call?
                  </h1>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
                    Add up to 3 people. Free accounts get 3; Pro unlocks up to 10.
                  </p>

                  <div className="mt-6 space-y-3">
                    {formData.emergencyContacts.map((contact, index) => (
                      <div
                        key={index}
                        className="relative rounded-2xl border border-gray-100 bg-[#F8F9FE] p-4"
                      >
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          aria-label="Remove contact"
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-300 transition-colors hover:text-red-500"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                        <div className="mb-3 grid grid-cols-2 gap-3 pr-8">
                          <input
                            type="text"
                            placeholder="Full name"
                            className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
                            value={contact.name}
                            onChange={(event) => updateContact(index, 'name', event.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Relationship"
                            className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
                            value={contact.relationship}
                            onChange={(event) =>
                              updateContact(index, 'relationship', event.target.value)
                            }
                          />
                        </div>
                        <input
                          type="tel"
                          placeholder="Phone number"
                          className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
                          value={contact.phone}
                          onChange={(event) => updateContact(index, 'phone', event.target.value)}
                        />
                      </div>
                    ))}

                    {formData.emergencyContacts.length < 3 && (
                      <button
                        type="button"
                        onClick={addContact}
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-[11px] font-bold text-gray-400 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add an emergency contact
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
                    <SparklesIcon className="h-8 w-8" />
                  </div>
                  <h1 className="mt-4 text-2xl font-bold tracking-tight">Verification pending</h1>
                  <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-gray-500">
                    Our team is reviewing your documents. You can explore the provider dashboard in
                    the meantime.
                  </p>
                </div>
              )}

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  Back
                </button>
                {isPatient ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex min-h-[48px] flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-[#6183FF] text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6]"
                  >
                    Review and finish
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={saving}
                    className="flex min-h-[48px] flex-[2] items-center justify-center gap-1.5 rounded-2xl bg-[#6183FF] text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
                  >
                    {saving ? 'Saving profile...' : 'Go to dashboard'}
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 5 && isPatient && (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 text-center shadow-sm sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAFBF2] text-[#15955C]">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                You are all set, {formData.firstName || 'friend'}
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-gray-500">
                Your profile is ready. Add your first record next, or explore the dashboard and come
                back whenever you are ready.
              </p>

              <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
                {[
                  { label: 'Name', value: [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Not set' },
                  { label: 'Phone', value: formData.whatsappNumber || 'Not set' },
                  { label: 'NIN', value: formData.nin ? `•••••••${formData.nin.slice(-4)}` : 'Not set' },
                  {
                    label: 'Emergency contacts',
                    value: formData.emergencyContacts.filter((contact) => contact.name.trim()).length
                      ? `${formData.emergencyContacts.filter((contact) => contact.name.trim()).length} added`
                      : 'None yet',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl bg-[#F8F9FE] px-4 py-2.5"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                      {item.label}
                    </span>
                    <span className="ml-3 truncate text-xs font-bold text-[#101217]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/25 transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving profile...
                  </>
                ) : (
                  'Launch my dashboard'
                )}
              </button>

              <button
                type="button"
                onClick={prevStep}
                className="mt-2 min-h-[44px] w-full rounded-2xl text-xs font-bold text-gray-400 transition-colors hover:text-gray-600"
              >
                Back to emergency contacts
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
