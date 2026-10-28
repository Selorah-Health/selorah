import { useEffect, useRef, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import {
  readLocalSession,
  resolvePortalAccess,
  homeForRole,
  normalizeRole,
} from '../lib/auth/session';

interface RoleGuardProps {
  children: ReactNode;
  /** When true, unauthenticated users are sent to /login */
  requireAuth?: boolean;
}

const CHECK_TIMEOUT_MS = 7000;

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Access check timed out.')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Wraps portal routes. Checks local session + Supabase user once on entry,
 * then enforces role to portal mapping. Client side navigation inside a portal
 * does not trigger another check, which keeps page changes instant.
 */
export default function RoleGuard({ children, requireAuth = true }: RoleGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const supabase = createClient();
  const entryPath = useRef(location.pathname);

  useEffect(() => {
    let cancelled = false;

    // Never leave the portal behind a spinner if the network stalls.
    const fallback = window.setTimeout(() => {
      if (cancelled) return;
      const local = readLocalSession();
      if (requireAuth && !local) {
        navigate('/login', { replace: true, state: { from: entryPath.current } });
        return;
      }
      setReady(true);
    }, CHECK_TIMEOUT_MS);

    async function check() {
      const local = readLocalSession();
      let role = local?.role ? normalizeRole(local.role) : null;
      let hasSession = !!local;

      try {
        const {
          data: { user },
        } = await withTimeout(supabase.auth.getUser(), CHECK_TIMEOUT_MS);

        if (user) {
          hasSession = true;
          // Prefer profile role when available.
          const { data: profile } = await withTimeout(
            supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
            CHECK_TIMEOUT_MS
          );

          if (profile?.role) {
            role = normalizeRole(profile.role);
          } else if (user.user_metadata?.role) {
            role = normalizeRole(user.user_metadata.role);
          } else if (!role) {
            role = 'patient';
          }
        }
      } catch {
        // Offline or a slow network: fall back to the local session.
      }

      if (cancelled) return;
      window.clearTimeout(fallback);

      if (requireAuth && !hasSession) {
        navigate('/login', { replace: true, state: { from: entryPath.current } });
        return;
      }

      if (hasSession && role) {
        const access = resolvePortalAccess(role, entryPath.current);
        if (!access.allowed) {
          navigate(access.redirectTo || homeForRole(role), { replace: true });
          return;
        }
      }

      setReady(true);
    }

    void check();
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [navigate, requireAuth, supabase]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-[#4262FF] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
