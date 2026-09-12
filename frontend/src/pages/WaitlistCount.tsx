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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50/40 font-sans flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <SEOTitle title="Waitlist Count" />

      {/* Soft ambient blobs for glass depth */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#6183FF]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#4262FF]/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-between mb-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-900 hover:opacity-80 transition-opacity min-w-0"
          >
            <img src="/logo.svg" alt="Selorah Health" className="w-8 h-8 shrink-0" />
            <span className="font-bold tracking-tight truncate">Selorah Health</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="text-xs font-bold uppercase tracking-widest text-[#6183FF] hover:underline shrink-0"
          >
            Refresh
          </button>
        </div>

        {/* Glassmorphic card */}
        <div className="rounded-3xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-[0_8px_40px_rgba(66,98,255,0.08)] p-8 sm:p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
            Waitlist signups
          </p>

          {loading && total === null ? (
            <div className="py-12">
              <div className="w-8 h-8 border-2 border-[#6183FF]/30 border-t-[#6183FF] rounded-full animate-spin mx-auto" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm py-8">{error}</p>
          ) : (
            <>
              <p className="text-6xl sm:text-7xl font-black tracking-tight text-[#6183FF] mb-2 tabular-nums">
                {total?.toLocaleString() ?? 0}
              </p>
              <p className="text-gray-400 text-sm mb-8">total</p>

              {Object.keys(byRole).length > 0 && (
                <div className="border-t border-gray-200/80 pt-6 space-y-2 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                    By role
                  </p>
                  {Object.entries(byRole)
                    .sort((a, b) => b[1] - a[1])
                    .map(([role, n]) => (
                      <div key={role} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{role}</span>
                        <span className="font-bold tabular-nums text-gray-900">{n}</span>
                      </div>
                    ))}
                </div>
              )}
            </>
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
