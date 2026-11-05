import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { readLocalSession } from '../lib/auth/session';
import { confirmDialog } from '../lib/dialogs';
import { useToast } from '../contexts/ToastContext';

type Flow = 'spotting' | 'light' | 'medium' | 'heavy';

type CycleEntry = {
  id: string;
  user_id?: string;
  start_date: string;
  end_date: string | null;
  flow: Flow;
  symptoms: string[];
  notes: string;
  created_at: string;
  updated_at?: string;
};

const FLOW_OPTIONS: { id: Flow; label: string }[] = [
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];

const SYMPTOM_OPTIONS = [
  'Cramps',
  'Headache',
  'Bloating',
  'Fatigue',
  'Mood changes',
  'Back pain',
  'Nausea',
  'Breast tenderness',
  'Acne',
];

const DAY_MS = 86_400_000;

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayIso() {
  return toIso(new Date());
}

function parseIso(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function addDays(value: string, days: number) {
  const date = parseIso(value);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

function daysBetween(from: string, to: string) {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / DAY_MS);
}

function formatDate(value: string) {
  return parseIso(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readLocal(key: string): CycleEntry[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CycleEntry =>
        Boolean(entry) && typeof entry.id === 'string' && typeof entry.start_date === 'string',
    );
  } catch {
    return [];
  }
}

function writeLocal(key: string, entries: CycleEntry[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(entries));
  } catch {
    // The page still works for this session when storage is blocked.
  }
}

function mergeEntries(local: CycleEntry[], remote: CycleEntry[]) {
  const byId = new Map<string, CycleEntry>();
  for (const entry of local) byId.set(entry.id, entry);
  for (const entry of remote) byId.set(entry.id, entry);
  return [...byId.values()].sort((a, b) => b.start_date.localeCompare(a.start_date));
}

function monthCells(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export default function PeriodTracker() {
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageKey, setStorageKey] = useState('selorah_period_cycles_local');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState('');
  const [flow, setFlow] = useState<Flow>('medium');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'synced' | 'local'>('idle');
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const load = useCallback(async () => {
    let userId = readLocalSession()?.id || 'local';
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Offline sessions still use the local copy.
    }

    const key = `selorah_period_cycles_${userId}`;
    setStorageKey(key);
    const local = readLocal(key);
    setEntries(local);
    setLoading(false);

    if (userId === 'local') return;

    try {
      const { data, error } = await supabase
        .from('period_cycles')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const remote = (data || []).map((row: Record<string, any>) => ({
        id: String(row.id),
        user_id: row.user_id,
        start_date: String(row.start_date),
        end_date: row.end_date ? String(row.end_date) : null,
        flow: (row.flow || 'medium') as Flow,
        symptoms: Array.isArray(row.symptoms) ? row.symptoms.map(String) : [],
        notes: row.notes || '',
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at,
      })) as CycleEntry[];

      const merged = mergeEntries(local, remote);
      setEntries(merged);
      writeLocal(key, merged);
      if (remote.length) setSyncState('synced');
    } catch {
      // The table may not be deployed yet. The local copy remains usable.
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const sorted = [...entries]
      .filter((entry) => entry.start_date)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    const cycleLengths: number[] = [];
    for (let index = 1; index < sorted.length; index += 1) {
      const length = daysBetween(sorted[index - 1].start_date, sorted[index].start_date);
      if (length >= 21 && length <= 45) cycleLengths.push(length);
    }

    const recentCycles = cycleLengths.slice(-6);
    const averageCycle = recentCycles.length
      ? Math.round(recentCycles.reduce((sum, value) => sum + value, 0) / recentCycles.length)
      : 28;

    const periodLengths = sorted
      .map((entry) =>
        entry.end_date ? daysBetween(entry.start_date, entry.end_date) + 1 : 5,
      )
      .filter((length) => length >= 1 && length <= 14);
    const averagePeriod = periodLengths.length
      ? Math.round(periodLengths.reduce((sum, value) => sum + value, 0) / periodLengths.length)
      : 5;

    const last = sorted[sorted.length - 1];
    const today = todayIso();
    let nextPeriod = last ? addDays(last.start_date, averageCycle) : '';
    let guard = 0;
    while (nextPeriod && daysBetween(today, nextPeriod) < 0 && guard < 24) {
      nextPeriod = addDays(nextPeriod, averageCycle);
      guard += 1;
    }

    const currentCycleDay = last ? daysBetween(last.start_date, today) + 1 : 0;
    const nextInDays = nextPeriod ? daysBetween(today, nextPeriod) : 0;
    const fertileStart = nextPeriod ? addDays(nextPeriod, -16) : '';
    const fertileEnd = nextPeriod ? addDays(nextPeriod, -12) : '';
    const ovulation = nextPeriod ? addDays(nextPeriod, -14) : '';

    return {
      sorted,
      averageCycle,
      averagePeriod,
      last,
      nextPeriod,
      currentCycleDay,
      nextInDays,
      fertileStart,
      fertileEnd,
      ovulation,
      hasHistory: sorted.length > 0,
    };
  }, [entries]);

  const loggedDays = useMemo(() => {
    const days = new Set<string>();
    for (const entry of entries) {
      const end = entry.end_date || addDays(entry.start_date, stats.averagePeriod - 1);
      const length = Math.min(Math.max(daysBetween(entry.start_date, end) + 1, 1), 60);
      for (let offset = 0; offset < length; offset += 1) {
        days.add(addDays(entry.start_date, offset));
      }
    }
    return days;
  }, [entries, stats.averagePeriod]);

  const predicted = useMemo(() => {
    const periodDays = new Set<string>();
    const fertileDays = new Set<string>();
    if (!stats.nextPeriod) return { periodDays, fertileDays };

    let cycleStart = stats.nextPeriod;
    for (let cycle = 0; cycle < 3; cycle += 1) {
      for (let offset = 0; offset < stats.averagePeriod; offset += 1) {
        periodDays.add(addDays(cycleStart, offset));
      }
      const fertileStart = addDays(cycleStart, -16);
      for (let offset = 0; offset <= 4; offset += 1) {
        fertileDays.add(addDays(fertileStart, offset));
      }
      cycleStart = addDays(cycleStart, stats.averageCycle);
    }
    return { periodDays, fertileDays };
  }, [stats.averageCycle, stats.averagePeriod, stats.nextPeriod]);

  const resetForm = () => {
    setEditingId(null);
    setStartDate(todayIso());
    setEndDate('');
    setFlow('medium');
    setSymptoms([]);
    setNotes('');
    setFormOpen(false);
  };

  const openEdit = (entry: CycleEntry) => {
    setEditingId(entry.id);
    setStartDate(entry.start_date);
    setEndDate(entry.end_date || '');
    setFlow(entry.flow || 'medium');
    setSymptoms(entry.symptoms || []);
    setNotes(entry.notes || '');
    setFormOpen(true);
    window.requestAnimationFrame(() => {
      const scrollRoot = document.querySelector<HTMLElement>('[data-scroll-root]');
      if (scrollRoot) {
        scrollRoot.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      document.getElementById('cycle-start-date')?.focus({ preventScroll: true });
    });
  };

  const toggleSymptom = (symptom: string) => {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  };

  const persist = async (entry: CycleEntry): Promise<'synced' | 'local'> => {
    const next = [entry, ...entries.filter((item) => item.id !== entry.id)].sort((a, b) =>
      b.start_date.localeCompare(a.start_date),
    );
    setEntries(next);
    writeLocal(storageKey, next);

    if (storageKey.endsWith('_local')) {
      setSyncState('local');
      return 'local';
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSyncState('local');
        return 'local';
      }

      const { error } = await supabase.from('period_cycles').upsert(
        {
          id: entry.id,
          user_id: user.id,
          start_date: entry.start_date,
          end_date: entry.end_date,
          flow: entry.flow,
          symptoms: entry.symptoms,
          notes: entry.notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

      if (error) throw error;
      setSyncState('synced');
      return 'synced';
    } catch {
      setSyncState('local');
      return 'local';
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!startDate) {
      toastError('Choose the first day of your period.');
      return;
    }
    if (endDate && daysBetween(startDate, endDate) < 0) {
      toastError('The last day cannot be before the first day.');
      return;
    }

    setSaving(true);
    const existing = entries.find((entry) => entry.id === editingId);
    const entry: CycleEntry = {
      id: editingId || newId(),
      start_date: startDate,
      end_date: endDate || null,
      flow,
      symptoms,
      notes: notes.trim(),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await persist(entry);
    setSaving(false);
    resetForm();
    success(
      editingId ? 'Cycle updated.' : 'Cycle saved.',
      result === 'local' ? 'Saved on this device' : 'Saved to your record',
    );
  };

  const remove = async (entry: CycleEntry) => {
    const confirmed = await confirmDialog({
      title: 'Delete this cycle?',
      message: `${formatDate(entry.start_date)} will be removed from your cycle history. This cannot be undone.`,
      confirmLabel: 'Delete cycle',
      tone: 'danger',
    });
    if (!confirmed) return;

    const next = entries.filter((item) => item.id !== entry.id);
    setEntries(next);
    writeLocal(storageKey, next);

    if (storageKey.endsWith('_local')) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('period_cycles').delete().eq('id', entry.id).eq('user_id', user.id);
    } catch {
      // The local deletion is still applied.
    }
    info('Cycle removed.');
  };

  const cells = monthCells(cursor);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            Women&apos;s health
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[#101217] sm:text-3xl">
            Cycle tracker
          </h1>
          <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-gray-500 sm:text-sm">
            Log your period, see your average cycle, and get a private estimate of your next
            period and fertile window. Your history stays in your own record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (formOpen) resetForm();
            else {
              setFormOpen(true);
              setEditingId(null);
              setStartDate(todayIso());
            }
          }}
          className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover"
        >
          {formOpen ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          {formOpen ? 'Close' : 'Log a period'}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={submit}
          className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDaysIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#101217]">
                {editingId ? 'Edit cycle' : 'New cycle'}
              </h2>
              <p className="text-[11px] font-medium text-gray-400">
                Use the first and last day of bleeding.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                First day
              </span>
              <input
                id="cycle-start-date"
                type="date"
                value={startDate}
                max={todayIso()}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1.5 min-h-[46px] w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-primary"
                required
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                Last day (optional)
              </span>
              <input
                type="date"
                value={endDate}
                max={todayIso()}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1.5 min-h-[46px] w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Flow
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLOW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFlow(option.id)}
                  aria-pressed={flow === option.id}
                  className={`min-h-[38px] rounded-full border px-4 text-xs font-bold transition-colors ${
                    flow === option.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-primary/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Symptoms
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => {
                const selected = symptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    aria-pressed={selected}
                    className={`min-h-[36px] rounded-full border px-3.5 text-[11px] font-bold transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-primary/30'
                    }`}
                  >
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Anything you want to remember about this cycle."
              className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm font-medium text-[#101217] outline-none transition-colors placeholder:text-gray-300 focus:border-primary"
            />
          </label>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[46px] rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-gray-500 transition-colors hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              {editingId ? 'Save changes' : 'Save cycle'}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Current cycle',
            value:
              stats.hasHistory &&
              stats.currentCycleDay > 0 &&
              stats.currentCycleDay <= stats.averageCycle + 14
                ? `Day ${stats.currentCycleDay}`
                : stats.hasHistory
                  ? 'Log a new cycle'
                  : 'Not started',
            hint: stats.hasHistory ? 'Since your last period' : 'Log a cycle to begin',
          },
          {
            label: 'Average cycle',
            value: `${stats.averageCycle} days`,
            hint: 'Based on your recent logs',
          },
          {
            label: 'Next period',
            value: stats.nextPeriod ? formatDate(stats.nextPeriod) : 'Add a cycle',
            hint: stats.nextPeriod
              ? stats.nextInDays === 0
                ? 'Estimated today'
                : `In about ${stats.nextInDays} day${stats.nextInDays === 1 ? '' : 's'}`
              : 'An estimate appears after your first log',
          },
          {
            label: 'Fertile window',
            value:
              stats.fertileStart && stats.fertileEnd
                ? `${formatDate(stats.fertileStart)} to ${formatDate(stats.fertileEnd)}`
                : 'Add a cycle',
            hint: 'An estimate, not contraception',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[22px] border border-gray-50 bg-white p-4 shadow-sm"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
              {card.label}
            </p>
            <p className="mt-1.5 text-lg font-black tracking-tight text-[#101217]">{card.value}</p>
            <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-gray-400">
              {card.hint}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#101217]">Calendar</h2>
              <p className="text-[11px] font-medium text-gray-400">{monthLabel}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
                aria-label="Previous month"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-primary/30 hover:text-primary"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
                aria-label="Next month"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-primary/30 hover:text-primary"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span
                key={day}
                className="py-1 text-[9px] font-black uppercase tracking-[0.08em] text-gray-400"
              >
                {day.slice(0, 1)}
              </span>
            ))}
            {cells.map((date) => {
              const iso = toIso(date);
              const inMonth = date.getMonth() === cursor.getMonth();
              const isToday = iso === todayIso();
              const isPeriod = loggedDays.has(iso);
              const isPredicted = !isPeriod && predicted.periodDays.has(iso);
              const isFertile = !isPeriod && !isPredicted && predicted.fertileDays.has(iso);

              return (
                <div
                  key={iso}
                  className={`flex items-center justify-center rounded-full text-[11px] font-bold ${
                    inMonth ? '' : 'opacity-30'
                  } ${isPeriod ? 'h-9 w-9 bg-primary text-white' : 'h-9 w-9'}`}
                >
                  <span
                    className={
                      isPeriod
                        ? ''
                        : isPredicted
                          ? 'flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary'
                          : isFertile
                            ? 'flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600'
                            : isToday
                              ? 'flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-[#101217]'
                              : 'text-gray-500'
                    }
                  >
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-[9px] font-bold text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Logged period
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-primary/30 bg-primary/10" />
              Predicted period
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/20" />
              Fertile estimate
            </span>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-[#101217]">Your pattern</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-gray-500">Average period</span>
                <span className="font-bold text-[#101217]">{stats.averagePeriod} days</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-gray-500">Estimated ovulation</span>
                <span className="font-bold text-[#101217]">
                  {stats.ovulation ? formatDate(stats.ovulation) : 'Add a cycle'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-gray-500">Cycles logged</span>
                <span className="font-bold text-[#101217]">{entries.length}</span>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-primary/5 p-3 text-[10px] font-medium leading-relaxed text-gray-500">
              Predictions use your recent logs and a standard 14 day luteal phase. Stress,
              illness, and travel can shift a cycle. Use this as a guide, not as birth control.
            </p>
          </section>

          <section className="rounded-[28px] bg-[#06123A] p-5 text-white shadow-sm sm:p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#8FA8FF]">
              <HeartIcon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-base font-bold">Private by default</h2>
            <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-white/55">
              Your cycle history is visible only to you. It is never shared with providers or
              researchers unless you choose to share a record.
            </p>
          </section>
        </aside>
      </div>

      <section className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#101217]">Cycle history</h2>
            <p className="text-[11px] font-medium text-gray-400">
              {entries.length
                ? `${entries.length} cycle${entries.length === 1 ? '' : 's'} logged`
                : 'No cycles logged yet'}
            </p>
          </div>
          {syncState !== 'idle' && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[9px] font-bold text-primary">
              {syncState === 'synced' ? 'Synced' : 'Saved on device'}
            </span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm font-bold text-[#101217]">Start with your last period.</p>
            <p className="mx-auto mt-1 max-w-sm text-[11px] font-medium leading-relaxed text-gray-400">
              Add the first day and, if you remember it, the last day. The more cycles you log,
              the better your estimate becomes.
            </p>
            <button
              type="button"
              onClick={() => {
                setFormOpen(true);
                setEditingId(null);
                setStartDate(todayIso());
              }}
              className="mt-4 inline-flex min-h-[42px] items-center gap-2 rounded-full bg-primary px-5 text-xs font-bold text-white"
            >
              <PlusIcon className="h-4 w-4" />
              Log your first cycle
            </button>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-gray-50">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#101217]">
                      {formatDate(entry.start_date)}
                      {entry.end_date ? ` to ${formatDate(entry.end_date)}` : ''}
                    </p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-primary">
                      {entry.flow}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-gray-400">
                    {entry.end_date
                      ? `${daysBetween(entry.start_date, entry.end_date) + 1} days`
                      : 'Last day not added'}
                    {entry.symptoms.length ? ` · ${entry.symptoms.join(', ')}` : ''}
                  </p>
                  {entry.notes && (
                    <p className="mt-1 max-w-xl text-[11px] font-medium leading-relaxed text-gray-500">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(entry)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-gray-200 px-3.5 text-[11px] font-bold text-gray-500 transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(entry)}
                    aria-label={`Delete cycle starting ${formatDate(entry.start_date)}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
