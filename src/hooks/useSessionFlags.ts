import { useState, useEffect } from 'react';
import { auth, AuthSession } from '@/services/auth';

const STORAGE_KEY = 'nextads_dev_flags';

export interface SessionFlags {
  isPro: boolean;
  isNewUser: boolean;
  isAgency: boolean;
}

function loadFallbackFlags(): SessionFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        isPro: parsed.dashboardMode === 'pro',
        isNewUser: parsed.userState === 'new',
        isAgency: parsed.proSubType === 'agency',
      };
    }
  } catch {}
  return { isPro: false, isNewUser: false, isAgency: false };
}

/**
 * Reads isPro, isNewUser, and isAgency from the session's app_metadata.
 * Falls back to localStorage for users without session metadata (e.g. demo).
 */
export function useSessionFlags(): SessionFlags {
  const [flags, setFlags] = useState<SessionFlags>(loadFallbackFlags);

  useEffect(() => {
    const applySession = (session: AuthSession | null) => {
      const meta = session?.user?.app_metadata;
      const organizationId = session.currentOrganizationId;
      const advertiserId = session.currentAdvertiserId;

      const organization = session?.user?.app_metadata?.organizations?.find((org) => org.orgId === organizationId);

      if (meta) {
        setFlags({
          isPro: meta.isPro,
          isNewUser: meta.userState === 'new',
          isAgency: organization?.orgType === "AGENCY" ? true : false,
        });
      } else {
        setFlags(loadFallbackFlags());
      }
    };

    auth.getSession().then(({ data: { session } }) => applySession(session));

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return flags;
}
