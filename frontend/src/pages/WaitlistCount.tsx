import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import SEOTitle from '../components/SEOTitle';

type RoleBreakdown = Record<string, number>;

export default function WaitlistCount() {
  const [total, setTotal] = useState<number | null>(null);
  const [byRole, setByRole] = useState<RoleBreakdown>({});
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError(null);
    try {
      const supabase = createClient();

      const { data, error: rpcErr } = await supabase.rpc('waitlist_stats');

      if (!rpcErr && data) {
        const payload = data as { total?: number; by_role?: RoleBreakdown };
        setTotal(typeof payload.total === 'number' ? payload.total : 0);
        setByRole(payload.by_role || {});
        setUpdatedAt(new Date());
        return;
      }

      const { count, error: countErr } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      if (countErr) {
        throw rpcErr || countErr;
      }

      setTotal(count ?? 0);
      setByRole({});
      setUpdatedAt(new Date());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load count';
      setError(
        /function .* does not exist|PGRST202/i.test(msg)
          ? 'Run migrations/007_waitlist_stats_rpc.sql in Supabase, then refresh.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  const roleEntries = Object.entries(byRole).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef3fb] via-[#f5f8fc] to-[#e8eef8] font-sans flex flex-col items-center justify-center px-4 sm:px-6 py-16">
      <SEOTitle title="Waitlist Count" />

      <div className="w-full max-w-lg">
        {/* Single elevated card */}
        <div className="bg-white rounded-[1.75rem] shadow-[0_20px_60px_rgba(66,98,255,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-white/80 px-6 sm:px-8 pt-6 pb-8 sm:pb-10">
          {/* Top bar: brand + refresh */}
          <div className="flex items-center justify-between gap-3 mb-10">
            <Link
              to="/"
              className="flex items-center gap-2.5 min-w-0 text-gray-900 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.svg" alt="" className="w-8 h-8 shrink-0" />
              <span className="font-bold text-[15px] sm:text-base tracking-tight truncate">
                Selorah Health
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-[#4262FF] hover:text-[#2f4fd6] transition-colors shrink-0"
            >
              Refresh
            </button>
          </div>

          {/* Count block */}
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
              Waitlist signups
            </p>

            {loading && total === null ? (
              <div className="py-10">
                <div className="w-8 h-8 border-2 border-[#4262FF]/25 border-t-[#4262FF] rounded-full animate-spin mx-auto" />
              </div>
            ) : error ? (
              <p className="text-red-500 text-sm py-8 px-2">{error}</p>
            ) : (
              <>
                <p className="text-[4.5rem] sm:text-[5.5rem] leading-none font-black tracking-tight text-[#4262FF] tabular-nums">
                  {total?.toLocaleString() ?? 0}
                </p>
                <p className="text-gray-400 text-sm mt-2 mb-8">total</p>
              </>
            )}
          </div>

          {/* By role */}
          {!error && !loading && roleEntries.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-3 px-1">
                By role
              </p>
              <ul className="space-y-2">
                {roleEntries.map(([role, n]) => (
                  <li
                    key={role}
                    className="flex items-center justify-between gap-3 bg-gray-50 rounded-full px-5 py-3"
                  >
                    <span className="text-sm font-medium text-gray-800 capitalize truncate">
                      {role === 'unknown' ? 'Unknown' : role}
                    </span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">
                      {n}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {updatedAt && !error && (
          <p className="text-center text-gray-400 text-xs mt-6">
            Updated {updatedAt.toLocaleTimeString()} · auto-refresh every 15s
          </p>
        )}
      </div>
    </div>
  );
}
