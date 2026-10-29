import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CameraIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CreditCardIcon,
  HeartIcon,
  IdentificationIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import { isValidNin, readLocalSession, writeLocalSession } from '../../lib/auth/session';
import { readProState, type ProState } from '../../lib/pro';
import { markReleaseSeen, readSeenRelease } from '../../lib/releases';
import WhatsNewModal from './WhatsNewModal';

interface ProfileProps {
  user: any;
  avatarGradient: string;
  isPro?: boolean;
}

type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
};

const AVATAR_PRESETS = [
  '/avatars/avatar-01.svg',
  '/avatars/avatar-02.svg',
  '/avatars/avatar-03.svg',
  '/avatars/avatar-04.svg',
  '/avatars/avatar-05.svg',
  '/avatars/avatar-06.svg',
];

function ageFromDob(value: string) {
  if (!value) return null;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const month = now.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

function normalizeContacts(value: unknown): EmergencyContact[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      name: String(item.name || ''),
      relationship: String(item.relationship || ''),
      phone: String(item.phone || ''),
    }))
    .slice(0, 10);
}

export default function Profile({ user, avatarGradient, isPro: isProProp }: ProfileProps) {
  const [phone, setPhone] = useState('');
  const [nin, setNin] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPanelOpen, setAvatarPanelOpen] = useState(false);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const [proState, setProState] = useState<ProState>(() => readProState());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [genotype, setGenotype] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioMessage, setBioMessage] = useState<string | null>(null);
  const [bioTone, setBioTone] = useState<'success' | 'error'>('success');
  const [releaseSeen, setReleaseSeen] = useState(() => readSeenRelease());
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const navigate = useNavigate();
  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isPro = Boolean(isProProp || proState.active);
  const age = ageFromDob(dateOfBirth);
  const contactLimit = isPro ? 10 : 3;

  const loadProfile = useCallback(async () => {
    const local = readLocalSession();
    if (local?.nin) setNin(local.nin);
    if (local?.phone) setPhone(local.phone);
    if (local?.avatar_url) setAvatarUrl(local.avatar_url);

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    if (authUser.user_metadata?.avatar_url) setAvatarUrl(authUser.user_metadata.avatar_url);
    const metaFirst = String(authUser.user_metadata?.first_name || '');
    const metaLast = String(authUser.user_metadata?.last_name || '');
    if (metaFirst) setFirstName(metaFirst);
    if (metaLast) setLastName(metaLast);

    const { data } = await supabase
      .from('patient_profiles')
      .select(
        'full_name, date_of_birth, gender, height, weight, blood_group, genotype, allergies, emergency_medical_info, emergency_contacts, phone, nin, avatar_url'
      )
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (data?.full_name) {
      const parts = String(data.full_name).trim().split(/\s+/);
      setFirstName((current) => current || parts[0] || '');
      setLastName((current) => current || parts.slice(1).join(' '));
    }
    if (data?.date_of_birth) setDateOfBirth(String(data.date_of_birth).slice(0, 10));
    if (data?.gender) setGender(data.gender);
    if (data?.height) setHeight(String(data.height));
    if (data?.weight) setWeight(String(data.weight));
    if (data?.blood_group) setBloodGroup(data.blood_group);
    if (data?.genotype) setGenotype(data.genotype);
    if (Array.isArray(data?.allergies)) setAllergies(data.allergies.join(', '));
    if (data?.emergency_medical_info) setMedicalConditions(data.emergency_medical_info);
    if (data?.emergency_contacts) setEmergencyContacts(normalizeContacts(data.emergency_contacts));
    if (data?.phone) setPhone(data.phone);
    if (data?.nin) setNin(data.nin);
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
      writeLocalSession({ avatar_url: data.avatar_url });
    }
  }, [supabase]);

  useEffect(() => {
    loadProfile();
    const refreshPro = () => setProState(readProState());
    window.addEventListener('selorah:pro-updated', refreshPro);
    window.addEventListener('storage', refreshPro);
    return () => {
      window.removeEventListener('selorah:pro-updated', refreshPro);
      window.removeEventListener('storage', refreshPro);
    };
  }, [loadProfile]);

  useEffect(() => {
    if (releaseSeen) return;
    const timer = window.setTimeout(() => setWhatsNewOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, [releaseSeen]);

  const saveContactDetails = async () => {
    setMessage(null);

    if (nin && !isValidNin(nin)) {
      setMessageTone('error');
      setMessage('NIN must be exactly 11 digits.');
      return;
    }

    if (phone && phone.replace(/[^\d]/g, '').length < 10) {
      setMessageTone('error');
      setMessage('Enter a valid phone number with at least 10 digits.');
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setMessageTone('error');
        setMessage('Please log in to save your details.');
        return;
      }

      const { error } = await supabase
        .from('patient_profiles')
        .update({ phone: phone || null, nin: nin || null })
        .eq('user_id', authUser.id);

      if (error) throw error;

      writeLocalSession({ phone, nin });

      try {
        await supabase.auth.updateUser({ data: { phone: phone || null } });
      } catch {
        // Metadata is optional.
      }

      setMessageTone('success');
      setMessage('Contact details saved. You can now log in with your phone or NIN.');
    } catch (err) {
      setMessageTone('error');
      setMessage(err instanceof Error ? err.message : 'Could not save your details.');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessageTone('error');
      setMessage('Choose a PNG, JPG, WEBP, or GIF image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessageTone('error');
      setMessage('Profile photos must be 2 MB or smaller.');
      return;
    }

    setAvatarUploading(true);
    setMessage(null);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error('Sign in again to change your photo.');

      const extension = (file.name.split('.').pop() || 'jpg')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const path = `${authUser.id}/avatar-${Date.now()}.${extension || 'jpg'}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = publicUrlData.publicUrl;

      // Metadata keeps the photo available in every portal. The patient
      // profile copy is what a shared record can read without a session.
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      await supabase.from('patient_profiles').update({ avatar_url: url }).eq('user_id', authUser.id);

      writeLocalSession({ avatar_url: url });
      setAvatarUrl(url);
      window.dispatchEvent(new CustomEvent('selorah:avatar-updated', { detail: url }));

      setMessageTone('success');
      setMessage('Profile photo updated.');
    } catch (err) {
      setMessageTone('error');
      setMessage(err instanceof Error ? err.message : 'The photo could not be uploaded.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const chooseAvatar = async (url: string) => {
    setAvatarUploading(true);
    setMessage(null);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Sign in again to change your photo.');

      await supabase.auth.updateUser({ data: { avatar_url: url } });
      await supabase.from('patient_profiles').update({ avatar_url: url }).eq('user_id', authUser.id);

      writeLocalSession({ avatar_url: url });
      setAvatarUrl(url);
      setAvatarPanelOpen(false);
      setConfirmRemoveAvatar(false);
      window.dispatchEvent(new CustomEvent('selorah:avatar-updated', { detail: url }));

      setMessageTone('success');
      setMessage('Profile photo updated.');
    } catch (err) {
      setMessageTone('error');
      setMessage(err instanceof Error ? err.message : 'The avatar could not be saved.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarUploading(true);
    setMessage(null);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Sign in again to remove your photo.');

      // Remove uploaded files, then clear the profile reference.
      const { data: files } = await supabase.storage.from('avatars').list(authUser.id);
      if (files?.length) {
        await supabase.storage
          .from('avatars')
          .remove(files.map((file) => `${authUser.id}/${file.name}`));
      }

      await supabase.auth.updateUser({ data: { avatar_url: null } });
      await supabase.from('patient_profiles').update({ avatar_url: null }).eq('user_id', authUser.id);

      writeLocalSession({ avatar_url: '' });
      setAvatarUrl('');
      setConfirmRemoveAvatar(false);
      setAvatarPanelOpen(false);
      window.dispatchEvent(new CustomEvent('selorah:avatar-updated', { detail: '' }));

      setMessageTone('success');
      setMessage('Profile photo removed.');
    } catch (err) {
      setMessageTone('error');
      setMessage(err instanceof Error ? err.message : 'The photo could not be removed.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const savePersonalDetails = async () => {
    setBioMessage(null);

    if (!firstName.trim()) {
      setBioTone('error');
      setBioMessage('Add your first name before saving.');
      return;
    }
    if (dateOfBirth && !ageFromDob(dateOfBirth)) {
      setBioTone('error');
      setBioMessage('Enter a valid date of birth.');
      return;
    }

    setBioSaving(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Sign in again to save your details.');

      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      const allergyList = allergies
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
      const contacts = emergencyContacts
        .filter((contact) => contact.name.trim() || contact.phone.trim())
        .slice(0, contactLimit);

      const payload = {
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        height: height || null,
        weight: weight || null,
        blood_group: bloodGroup || null,
        genotype: genotype || null,
        allergies: allergyList,
        emergency_medical_info: medicalConditions || null,
        emergency_contacts: contacts,
      };

      const { error } = await supabase
        .from('patient_profiles')
        .update(payload)
        .eq('user_id', authUser.id);
      if (error) throw error;

      await supabase.auth.updateUser({
        data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: fullName },
      });

      writeLocalSession({ first_name: firstName.trim(), last_name: lastName.trim() });
      setEmergencyContacts(contacts);
      setBioTone('success');
      setBioMessage('Personal and health details saved.');
    } catch (err) {
      setBioTone('error');
      setBioMessage(err instanceof Error ? err.message : 'Could not save your details.');
    } finally {
      setBioSaving(false);
    }
  };

  const addEmergencyContact = () => {
    if (emergencyContacts.length >= contactLimit) return;
    setEmergencyContacts((current) => [...current, { name: '', relationship: '', phone: '' }]);
  };

  const updateEmergencyContact = (
    index: number,
    field: keyof EmergencyContact,
    value: string
  ) => {
    setEmergencyContacts((current) =>
      current.map((contact, itemIndex) =>
        itemIndex === index ? { ...contact, [field]: value } : contact
      )
    );
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const closeWhatsNew = () => {
    markReleaseSeen();
    setReleaseSeen(true);
    setWhatsNewOpen(false);
  };

  const local = readLocalSession();
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.user_metadata?.first_name ||
    local?.first_name ||
    user?.email?.split('@')[0] ||
    'Your';
  const email = user?.email || local?.email || 'No email on file';

  return (
    <div className="space-y-6 font-sora">
      <WhatsNewModal open={whatsNewOpen} onClose={closeWhatsNew} />

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
          Profile and settings
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-400">
          Manage your identity, login methods, and plan.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setWhatsNewOpen(true)}
        className="flex w-full items-center gap-3 rounded-[24px] border border-gray-50 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#6183FF]/25"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6183FF]/10 text-[#6183FF]">
          <SparklesIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#101217]">What&apos;s new in Selorah</span>
            {!releaseSeen && (
              <span className="rounded-full bg-[#6183FF] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-white">
                New
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
            See the latest improvements and fixes.
          </span>
        </span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
      </button>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div
              className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full p-[3px] shadow-sm"
              style={{
                backgroundImage: "url('/assets/custom-profile-icon-ring.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${displayName} profile photo`}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className={`h-full w-full rounded-full ${avatarGradient}`} />
              )}
              {isPro && (
                <span className="absolute bottom-0 right-0 z-10 rounded-full border-2 border-white bg-[#DCE4FF] px-2 py-0.5 text-[8px] font-black uppercase text-[#6183FF]">
                  Pro
                </span>
              )}
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void uploadAvatar(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -left-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#6183FF] text-white shadow-md transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
            >
              {avatarUploading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <CameraIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold text-[#101217] sm:text-2xl">
              {displayName}
            </h3>
            <p className="truncate text-sm font-medium text-gray-400">{email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                  isPro
                    ? 'border-[#6183FF] bg-[#6183FF] text-white'
                    : 'border-gray-200 bg-white text-gray-400'
                }`}
              >
                {isPro ? 'Pro member' : 'Free account'}
              </span>
              {!isPro && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/upgrade')}
                  className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#6183FF] transition-colors hover:bg-[#6183FF]/15"
                >
                  Upgrade
                </button>
              )}
              <button
                type="button"
                onClick={() => setAvatarPanelOpen((value) => !value)}
                disabled={avatarUploading}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF] disabled:opacity-60"
              >
                {avatarUploading ? 'Saving...' : avatarUrl ? 'Change photo' : 'Add photo'}
              </button>
              {avatarUrl && !confirmRemoveAvatar && (
                <button
                  type="button"
                  onClick={() => setConfirmRemoveAvatar(true)}
                  disabled={avatarUploading}
                  className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-red-500 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  Remove
                </button>
              )}
              {confirmRemoveAvatar && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
                  Remove photo?
                  <button
                    type="button"
                    onClick={() => void removeAvatar()}
                    disabled={avatarUploading}
                    className="rounded-full bg-red-500 px-2 py-0.5 font-black text-white disabled:opacity-60"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveAvatar(false)}
                    className="rounded-full px-1.5 py-0.5 font-black text-red-400"
                  >
                    No
                  </button>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard/billing')}
            className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-full border border-gray-200 px-4 text-[11px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
          >
            <CreditCardIcon className="h-3.5 w-3.5" />
            Billing
          </button>
        </div>

        {avatarPanelOpen && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#101217]">Choose an avatar</p>
                <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                  Pick a preset or upload your own photo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#101217] px-3 text-[9px] font-black uppercase tracking-[0.1em] text-white disabled:opacity-60"
              >
                <CameraIcon className="h-3.5 w-3.5" />
                Upload
              </button>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-2 sm:max-w-sm">
              {AVATAR_PRESETS.map((preset) => {
                const selected = avatarUrl === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => void chooseAvatar(preset)}
                    disabled={avatarUploading}
                    aria-label="Use this avatar"
                    aria-pressed={selected}
                    className={`overflow-hidden rounded-2xl border-2 p-0.5 transition-all disabled:opacity-60 ${
                      selected
                        ? 'border-[#6183FF] ring-2 ring-[#6183FF]/20'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <img src={preset} alt="" className="h-full w-full rounded-xl" />
                  </button>
                );
              })}
            </div>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setConfirmRemoveAvatar(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-red-500 hover:text-red-600"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Remove current photo
              </button>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAFBF2] text-[#15955C]">
            <UserCircleIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#101217]">Personal and health details</h3>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-400">
              Keep the profile clinicians see accurate. Age is calculated from your date of birth.
            </p>
          </div>
          <span className="hidden rounded-full bg-[#F8F9FE] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400 sm:inline">
            {isPro ? 'Up to 10 contacts' : 'Up to 3 contacts'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              First name
            </span>
            <input
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Ada"
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Last name
            </span>
            <input
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Okafor"
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              Date of birth
            </span>
            <input
              type="date"
              autoComplete="bday"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-[#6183FF]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Age
            </span>
            <input
              type="text"
              readOnly
              value={age != null ? `${age} years` : ''}
              placeholder="Set date of birth"
              className="min-h-[48px] w-full cursor-default rounded-xl border border-gray-100 bg-[#F8F9FE] px-4 text-sm font-semibold text-gray-500 outline-none placeholder:font-medium placeholder:text-gray-300"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Gender
            </span>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-[#6183FF]"
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Height
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              placeholder="cm"
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Weight
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="kg"
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Blood group
            </span>
            <select
              value={bloodGroup}
              onChange={(event) => setBloodGroup(event.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-[#6183FF]"
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
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Genotype
            </span>
            <select
              value={genotype}
              onChange={(event) => setGenotype(event.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-[#6183FF]"
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

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Allergies
            </span>
            <textarea
              rows={3}
              value={allergies}
              onChange={(event) => setAllergies(event.target.value)}
              placeholder="Penicillin, peanuts, latex"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Medical conditions
            </span>
            <textarea
              rows={3}
              value={medicalConditions}
              onChange={(event) => setMedicalConditions(event.target.value)}
              placeholder="Asthma, hypertension, sickle cell"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
            />
          </label>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HeartIcon className="h-4 w-4 text-[#6183FF]" />
              <h4 className="text-xs font-black uppercase tracking-[0.12em] text-[#101217]">
                Emergency contacts
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-gray-400">
              {emergencyContacts.length} of {contactLimit}
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="rounded-2xl border border-gray-100 bg-[#F8F9FE] p-3.5">
                <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(event) => updateEmergencyContact(index, 'name', event.target.value)}
                    placeholder="Full name"
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
                  />
                  <input
                    type="text"
                    value={contact.relationship}
                    onChange={(event) =>
                      updateEmergencyContact(index, 'relationship', event.target.value)
                    }
                    placeholder="Relationship"
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
                  />
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(event) => updateEmergencyContact(index, 'phone', event.target.value)}
                    placeholder="Phone number"
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold outline-none placeholder:text-gray-300 focus:border-[#6183FF]"
                  />
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(index)}
                    aria-label="Remove emergency contact"
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-300 transition-colors hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {emergencyContacts.length < contactLimit && (
              <button
                type="button"
                onClick={addEmergencyContact}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
              >
                <PlusIcon className="h-4 w-4" />
                Add emergency contact
              </button>
            )}
            {!isPro && emergencyContacts.length >= 3 && (
              <button
                type="button"
                onClick={() => navigate('/dashboard/upgrade')}
                className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#EEF2FF] text-[10px] font-black uppercase tracking-[0.1em] text-[#6183FF]"
              >
                <StarIcon className="h-3.5 w-3.5" />
                Unlock up to 10 contacts with Pro
              </button>
            )}
          </div>
        </div>

        {bioMessage && (
          <p
            className={`mt-4 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed ${
              bioTone === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {bioTone === 'success' && <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            {bioMessage}
          </p>
        )}

        <button
          type="button"
          onClick={() => void savePersonalDetails()}
          disabled={bioSaving}
          className="mt-5 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
        >
          {bioSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </>
          ) : (
            'Save personal details'
          )}
        </button>
      </section>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
            <IdentificationIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[#101217]">Login details</h3>
            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-gray-400">
              Add a phone number or 11-digit NIN so you can log in without email.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Phone number
            </span>
            <span className="relative block">
              <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0801 234 5678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              National Identification Number
            </span>
            <span className="relative block">
              <IdentificationIcon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                placeholder="11-digit NIN"
                value={nin}
                onChange={(event) =>
                  setNin(event.target.value.replace(/\D/g, '').slice(0, 11))
                }
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
              />
            </span>
          </label>
        </div>

        {message && (
          <p
            className={`mt-3 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed ${
              messageTone === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {messageTone === 'success' && <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={saveContactDetails}
          disabled={saving}
          className="mt-5 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </>
          ) : (
            'Save login details'
          )}
        </button>
      </section>

      {isPro ? (
        <section className="relative overflow-hidden rounded-[28px] border border-[#6183FF]/15 bg-[#EEF2FF] p-6">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#6183FF]/20 blur-2xl"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/25">
                <StarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-[#101217]">Selorah Pro is active</p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                  {proState.expiresAt
                    ? `Active until ${new Date(proState.expiresAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}.`
                    : 'All Pro features are unlocked on this account.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/billing')}
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-bold text-[#6183FF] shadow-sm"
            >
              Manage billing
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-[28px] bg-[#020924] p-6 text-white">
          <div
            aria-hidden
            className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[#6183FF]/30 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#5FFAB0]">
                <StarIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Go Pro from ₦2,000 a month</p>
                <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-white/50">
                  Up to 10 emergency contacts, priority verification, family sharing, and an
                  ad-free dashboard.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/upgrade')}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white shadow-lg shadow-[#6183FF]/25"
            >
              Unlock Pro
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Security',
            subtitle: 'Password and sessions',
            icon: ShieldCheckIcon,
            path: '/dashboard/security',
          },
          {
            title: 'Billing',
            subtitle: 'Plan and receipts',
            icon: CreditCardIcon,
            path: '/dashboard/billing',
          },
          {
            title: 'Family',
            subtitle: 'Manage members',
            icon: UserGroupIcon,
            path: '/dashboard/family',
          },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => navigate(item.path)}
            className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-[#6183FF]/30 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] text-gray-400 transition-colors group-hover:text-[#6183FF]">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#101217]">{item.title}</span>
              <span className="mt-0.5 block text-[10px] font-medium text-gray-400">
                {item.subtitle}
              </span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
