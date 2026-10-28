import { useEffect, useState } from 'react';
import {
  BeakerIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import { createClient } from '../../lib/supabase/client';

const OPT_IN_KEY = 'selorah_research_opt_in';

export default function Research() {
  const { success, info, error: toastError } = useToast();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [optedIn, setOptedIn] = useState(() => {
    try {
      return localStorage.getItem(OPT_IN_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const stored = user?.user_metadata?.research_opt_in;
        if (typeof stored === 'boolean') {
          setOptedIn(stored);
          localStorage.setItem(OPT_IN_KEY, stored ? '1' : '0');
        }
      } catch {
        // The local preference still applies.
      }
    };
    void loadPreference();
  }, [supabase]);

  const toggleOptIn = async () => {
    const next = !optedIn;
    const previous = optedIn;
    setOptedIn(next);
    setSaving(true);

    try {
      localStorage.setItem(OPT_IN_KEY, next ? '1' : '0');
      const { error } = await supabase.auth.updateUser({
        data: { research_opt_in: next },
      });
      if (error) throw error;

      if (next) {
        success(
          'You are on the research list. We will notify you when a study matches your profile.',
          'Research matching on'
        );
      } else {
        info('Research matching is off. Your data will not be matched to studies.');
      }
    } catch (error) {
      setOptedIn(previous);
      toastError(
        error instanceof Error ? error.message : 'Could not save your research preference.',
        'Preference not saved'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
            Clinical research
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Contribute to science on your terms, and get paid when your data is used.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleOptIn}
          disabled={saving}
          aria-pressed={optedIn}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-xs font-bold transition-all disabled:opacity-60 ${
            optedIn
              ? 'bg-[#EAFBF2] text-[#15955C]'
              : 'bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/20 hover:bg-[#4D6ED6]'
          }`}
        >
          {optedIn ? (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              Research matching on
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              {saving ? 'Saving...' : 'Enable research matching'}
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Matching studies',
            value: '00',
            icon: BeakerIcon,
            color: 'text-[#6183FF]',
            bg: 'bg-[#EEF2FF]',
          },
          {
            label: 'Active participation',
            value: '00',
            icon: ChartBarIcon,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
          },
          {
            label: 'Research earnings',
            value: '₦0',
            icon: CurrencyDollarIcon,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
            >
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#101217]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-gray-50 bg-white p-6 shadow-sm sm:p-10">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
            <BeakerIcon className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-xl font-bold tracking-tight text-[#101217]">
            {optedIn ? 'You are ready for the next study' : 'No studies are open yet'}
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
            {optedIn
              ? 'We will match your profile against approved studies. You will always see the study, the reward, and exactly what data is requested before you consent.'
              : 'Research partners are being verified. Turn on matching to be considered when the first ethical studies open.'}
          </p>

          <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
            {[
              {
                icon: SparklesIcon,
                title: 'Matched',
                body: 'We compare your profile to study criteria privately.',
              },
              {
                icon: ChartBarIcon,
                title: 'Consent',
                body: 'You see what is shared and approve it first.',
              },
              {
                icon: CurrencyDollarIcon,
                title: 'Rewarded',
                body: 'Approved participation pays into your Selorah balance.',
              },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl bg-[#F8F9FE] p-4">
                <step.icon className="h-4 w-4 text-[#6183FF]" />
                <p className="mt-2 text-xs font-bold text-[#101217]">{step.title}</p>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
            <LockClosedIcon className="h-3.5 w-3.5" />
            Your identity is never included in a dataset.
          </div>
        </div>
      </div>
    </div>
  );
}
