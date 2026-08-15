import { useEffect, useState, ReactNode } from 'react';
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

/**
 * Wraps portal routes. Checks local session + Supabase user,
 * then enforces role → portal mapping.
 */
export default function RoleGuard({ children, requireAuth = true }: RoleGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const local = readLocalSession();
      let role = local?.role ? normalizeRole(local.role) : null;
      let hasSession = !!local;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          hasSession = true;
          // Prefer profile role when available
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.role) {
            role = normalizeRole(profile.role);
          } else if (user.user_metadata?.role) {
            role = normalizeRole(user.user_metadata.role);
          } else if (!role) {
            role = 'patient';
          }
        }
      } catch {
        // offline / misconfigured env — fall back to local session
      }

      if (cancelled) return;

      if (requireAuth && !hasSession) {
        navigate('/login', { replace: true, state: { from: location.pathname } });
        return;
      }

      if (hasSession && role) {
        const access = resolvePortalAccess(role, location.pathname);
        if (!access.allowed) {
          navigate(access.redirectTo || homeForRole(role), { replace: true });
          return;
        }
      }

      setReady(true);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate, requireAuth, supabase]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-[#4262FF] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Checking access…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
