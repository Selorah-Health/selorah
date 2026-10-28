import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  access: 'Full Access' | 'Emergency Only' | 'View Only';
  phone?: string;
};

const LOCAL_KEY = 'selorah_family_members';
const ACCESS_OPTIONS: FamilyMember['access'][] = [
  'Full Access',
  'Emergency Only',
  'View Only',
];

function memberColor(index: number) {
  return ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'][
    index % 5
  ];
}

function readLocalMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMembers(members: FamilyMember[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(members));
  } catch {
    // Local storage is a fallback only.
  }
}

export default function Family() {
  const navigate = useNavigate();
  const supabase = createClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [members, setMembers] = useState<FamilyMember[]>(() => readLocalMembers());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', access: 'View Only' as FamilyMember['access'], phone: '' });

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMembers(readLocalMembers());
        return;
      }

      const { data, error } = await supabase
        .from('patient_profiles')
        .select('family_members')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (/column .* does not exist|schema cache/i.test(error.message)) {
          setMembers(readLocalMembers());
          return;
        }
        throw error;
      }

      const stored = Array.isArray(data?.family_members)
        ? (data.family_members as FamilyMember[])
        : [];
      setMembers(stored);
      writeLocalMembers(stored);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Could not load your family group.'
      );
      setMembers(readLocalMembers());
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const persistMembers = async (next: FamilyMember[]) => {
    setMembers(next);
    writeLocalMembers(next);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('patient_profiles')
      .update({ family_members: next })
      .eq('user_id', user.id);

    if (error && !/column .* does not exist|schema cache/i.test(error.message)) {
      throw error;
    }
  };

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.relation.trim()) {
      toastError('Add a name and relationship for this family member.');
      return;
    }

    setSaving(true);
    try {
      const next = [
        ...members,
        {
          id: `${Date.now()}`,
          name: form.name.trim(),
          relation: form.relation.trim(),
          access: form.access,
          phone: form.phone.trim() || undefined,
        },
      ];
      await persistMembers(next);
      setForm({ name: '', relation: '', access: 'View Only', phone: '' });
      setShowAdd(false);
      toastSuccess(`${form.name.trim()} has been added to your family group.`);
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'Could not add this family member.',
        'Family member not saved'
      );
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (member: FamilyMember) => {
    if (!window.confirm(`Remove ${member.name} from your family group?`)) return;

    try {
      await persistMembers(members.filter((item) => item.id !== member.id));
      toastSuccess(`${member.name} has been removed.`);
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'Could not remove this family member.',
        'Member not removed'
      );
    }
  };

  const inputClass =
    'min-h-[46px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]';

  return (
    <div className="space-y-8 font-sora">
      <button
        onClick={() => navigate('/dashboard/profile')}
        className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] transition-all group"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="font-bold text-sm">Back to Profile</span>
      </button>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#101217] tracking-tight">
                Family Management
              </h2>
              <p className="text-gray-400 font-medium text-sm">
                Manage emergency access and health sharing for your loved ones.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-[#6183FF] text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#4E6EEF] transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" /> Add Member
          </button>
        </div>

        <div className="p-6 sm:p-10 md:p-14">
          {loadError && (
            <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
              {loadError} Members are still saved on this device.
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[0, 1].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-[24px] bg-gray-50" />
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="p-6 bg-gray-50/50 border border-transparent hover:border-[#6183FF]/20 rounded-[32px] transition-all group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-14 h-14 ${memberColor(index)} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#101217] text-lg truncate">{member.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {member.relation}
                        </span>
                        <span className="text-gray-200">•</span>
                        <span className="text-[10px] font-black text-[#6183FF] uppercase tracking-widest">
                          {member.access}
                        </span>
                      </div>
                      {member.phone && (
                        <p className="mt-1 text-[11px] font-medium text-gray-400">{member.phone}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMember(member)}
                    aria-label={`Remove ${member.name}`}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <UserPlusIcon className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold">No family members added yet.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-6 text-[#6183FF] font-bold hover:underline"
              >
                Add your first member
              </button>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-[150] flex items-end justify-center bg-[#05081A]/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="family-add-title"
        >
          <form
            onSubmit={addMember}
            className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="family-add-title" className="text-lg font-bold text-[#101217]">
                  Add a family member
                </h3>
                <p className="mt-1 text-xs font-medium text-gray-400">
                  Choose how much of your health information they can access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Full name
                </span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Sarah Olusegun"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Relationship
                </span>
                <input
                  value={form.relation}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, relation: event.target.value }))
                  }
                  placeholder="e.g. Spouse, sibling, parent"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Phone (optional)
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="0801 234 5678"
                  className={inputClass}
                />
              </label>

              <div>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Access level
                </span>
                <div className="flex flex-wrap gap-2">
                  {ACCESS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, access: option }))}
                      className={`min-h-[38px] rounded-full border px-3.5 text-[11px] font-bold transition-all ${
                        form.access === option
                          ? 'border-[#6183FF] bg-[#6183FF]/10 text-[#6183FF]'
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add family member'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
