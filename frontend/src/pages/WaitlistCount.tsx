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

      // Prefer RPC so emails stay private (see migrations/007_waitlist_stats_rpc.sql)
      const { data, error: rpcErr } = await supabase.rpc('waitlist_stats');

      if (!rpcErr && data) {
        const payload = data as { total?: number; by_role?: RoleBreakdown };
        setTotal(typeof payload.total === 'number' ? payload.total : 0);
        setByRole(payload.by_role || {});
        setUpdatedAt(new Date());
        return;
      }

      // Fallback: direct count (needs SELECT policy; may return 0 under RLS)
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
    <div className="min-h-screen bg-[#0A0B14] text-white font-sora flex flex-col items-center justify-center px-6 py-16">
      <SEOTitle title="Waitlist Count" />
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2 opacity-80 hover:opacity-100">
            <img src="/logo.svg" alt="Selorah" className="w-8 h-8" />
            <span className="font-bold tracking-tight">Selorah</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="text-xs font-bold uppercase tracking-widest text-[#6183FF] hover:underline"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
            Waitlist signups
          </p>

          {loading && total === null ? (
            <div className="py-12">
              <div className="w-8 h-8 border-2 border-[#6183FF]/30 border-t-[#6183FF] rounded-full animate-spin mx-auto" />
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm py-8">{error}</p>
          ) : (
            <>
              <p className="text-6xl sm:text-7xl font-black tracking-tight text-white mb-2 tabular-nums">
                {total?.toLocaleString() ?? 0}
              </p>
              <p className="text-white/40 text-sm mb-8">total</p>

              {Object.keys(byRole).length > 0 && (
                <div className="border-t border-white/10 pt-6 space-y-2 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                    By role
                  </p>
                  {Object.entries(byRole)
                    .sort((a, b) => b[1] - a[1])
                    .map(([role, n]) => (
                      <div key={role} className="flex justify-between text-sm">
                        <span className="text-white/70 capitalize">{role}</span>
                        <span className="font-bold tabular-nums">{n}</span>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        {updatedAt && !error && (
          <p className="text-center text-white/30 text-xs mt-6">
            Updated {updatedAt.toLocaleTimeString()} · auto-refresh every 15s
          </p>
        )}
      </div>
    </div>
  );
}
