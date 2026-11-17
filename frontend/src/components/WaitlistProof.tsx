import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { waitlistProofLabel } from '../lib/waitlist';

let cachedTotal: number | null = null;
let pending: Promise<number | null> | null = null;

async function loadWaitlistTotal(): Promise<number | null> {
  if (cachedTotal !== null) return cachedTotal;
  if (pending) return pending;

  pending = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('waitlist_stats');

      if (!error && data) {
        const payload = data as { total?: number };
        if (typeof payload.total === 'number') {
          cachedTotal = payload.total;
          return cachedTotal;
        }
      }

      const { count, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      if (!countError && typeof count === 'number') {
        cachedTotal = count;
        return cachedTotal;
      }
    } catch {
      // The proof is decorative. Fall back to the conservative default.
    } finally {
      pending = null;
    }

    return null;
  })();

  return pending;
}

export default function WaitlistProof({
  className = '',
  showAvatars = true,
  tone = 'light',
}: {
  className?: string;
  showAvatars?: boolean;
  tone?: 'light' | 'dark' | 'inherit';
}) {
  const [label, setLabel] = useState(() =>
    cachedTotal === null ? '100+' : waitlistProofLabel(cachedTotal)
  );

  useEffect(() => {
    let active = true;

    void loadWaitlistTotal().then((total) => {
      if (!active || total === null) return;
      setLabel(waitlistProofLabel(total));
    });

    return () => {
      active = false;
    };
  }, []);

  const textTone =
    tone === 'dark'
      ? 'text-white/60'
      : tone === 'inherit'
        ? 'text-current opacity-70'
        : 'text-[#4B5563]';
  const strongTone =
    tone === 'dark'
      ? 'text-white'
      : tone === 'inherit'
        ? 'font-semibold text-current'
        : 'text-[#101217]';

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-live="polite">
      {showAvatars && (
        <img
          src="/landing/hero-avatar.png"
          alt=""
          width={280}
          height={40}
          decoding="async"
          loading="lazy"
          className="h-8 w-auto max-w-[160px] object-contain sm:h-9 sm:max-w-none"
        />
      )}
      <span className={`text-xs font-medium sm:text-sm ${textTone}`}>
        Join <span className={`font-semibold ${strongTone}`}>{label}</span> on the waitlist
      </span>
    </div>
  );
}
