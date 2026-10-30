import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { fetchMedicalRecords, type MedicalRecord } from '../lib/records';

export default function SearchResults() {
  const supabase = createClient();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRecords(await fetchMedicalRecords(supabase));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const needle = (params.get('q') || '').trim().toLowerCase();

  const results = useMemo(() => {
    if (!needle) return [];
    return records.filter((record) => {
      const haystack = [
        record.name,
        record.record_type,
        record.date,
        record.notes,
        record.ocr_text,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [needle, records]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    setParams(next ? { q: next } : {});
  };

  return (
    <div className="space-y-6 font-sora">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
          Search results
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
          {needle ? `Results for "${params.get('q')}"` : 'Search your vault'}
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-400">
          Search record names, types, dates, notes, and scanned text.
        </p>
      </div>

      <form onSubmit={submit} className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try asthma, lab result, 2026, or a clinic name"
          autoFocus
          className="min-h-[52px] w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-12 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setParams({});
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-300 hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </form>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : !needle ? (
        <div className="rounded-[28px] border border-gray-50 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
            <MagnifyingGlassIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#101217]">Start typing to search</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
            Your search stays on this device. Nothing is shared with researchers unless you opt in.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-[28px] border border-gray-50 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F9FE] text-[#6183FF]">
            <DocumentTextIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#101217]">No matching records</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
            Try a shorter word, a record type such as prescription, or a year.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-gray-50 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
              {results.length} {results.length === 1 ? 'match' : 'matches'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard/records')}
              className="text-[11px] font-bold text-[#6183FF] hover:underline"
            >
              All records
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {results.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => navigate(`/dashboard/records/${record.id}`)}
                className="group flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-[#F8F9FE]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FE] p-1.5">
                  <img src={record.icon} alt="" className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#101217] group-hover:text-[#6183FF]">
                    {record.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium text-gray-400">
                    {record.record_type ? `${record.record_type} \u2022 ` : ''}
                    {record.date}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
