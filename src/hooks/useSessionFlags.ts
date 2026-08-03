import { useState, useEffect } from 'react';
import { auth, AuthSession, getStoredSession } from '@/services/auth';

const STORAGE_KEY = 'nextads_dev_flags';

export type Plan = 'express' | 'pro' | 'agency';

/**
 * Synchronously derives the current plan from the stored session.
 * Use for one-shot side effects (e.g. analytics) where the async
 * `useSessionFlags` hook may not have resolved yet.
 */
export function getPlanFromSession(): Plan {
  const session = getStoredSession();
  const meta = session?.user?.app_metadata;
  const org = meta?.organizations?.find((o) => o.orgId === session?.currentOrganizationId);
  if (org?.orgType === 'AGENCY') return 'agency';
  return meta?.isPro ? 'pro' : 'express';
}

export interface SessionFlags {
  isPro: boolean;
  isNewUser: boolean;
  isAgency: boolean;
  isSuperAdmin: boolean;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'EDITOR_RESTRICTED' | 'VIEWER_RESTRICTED';
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
        isSuperAdmin: false,
        role: parsed.role as 'ADMIN' | 'EDITOR' | 'VIEWER' | 'EDITOR_RESTRICTED' | 'VIEWER_RESTRICTED'
      };
    }
  } catch {}
  return { isPro: false, isNewUser: false, isAgency: false, isSuperAdmin: false, role: 'VIEWER_RESTRICTED' };
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
      const organizationId = session?.currentOrganizationId;
      const organization = meta?.organizations?.find((org) => org.orgId === organizationId);

      if (meta) {
        const isAgency = Boolean(organization?.orgType === 'AGENCY');
        setFlags({
          isPro: isAgency || meta.isPro,
          isNewUser: meta.userState === 'new',
          isSuperAdmin: meta.isSuperAdmin,
          // Prefer canonical boolean; fall back to orgType match for older sessions.
          isAgency: isAgency,
          role: organization?.role as 'ADMIN' | 'EDITOR' | 'VIEWER' | 'EDITOR_RESTRICTED' | 'VIEWER_RESTRICTED' || 'VIEWER_RESTRICTED'
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
