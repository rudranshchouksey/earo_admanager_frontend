/**
 * Auth Service - Centralized Session & Identity Management
 * Handles JWT storage, OTP verification, and authentication state listeners.
 */
import Cookies from "js-cookie";
import { BASE_URL, request } from "./api";

export interface Organizations {
  orgId: string;
  role: string;
  name: string;
  orgType: string;
}

export interface AuthUser {
  id: string;
  email: string;
  app_metadata?: {
    isPro: boolean;
    userState: 'new' | 'existing';
    isAgency: boolean;
    status: string;
    mfaEnabled?: boolean;
    mfaSkipUntil?: string;
    organizations?: Organizations[];
  };
}

export interface AuthSession {
  user: AuthUser;
  currentOrganizationId: string;
  currentAdvertiserId: string;
  accessToken: string;
  refreshToken?: string;
}

export const STORAGE_KEY = 'nextads_auth_session';
type AuthListener = (event: string, session: AuthSession | null) => void;
const listeners = new Set<AuthListener>();

// --- Internal Helpers ---

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    
    return {
      user,
      currentOrganizationId: user.currentOrganizationId,
      currentAdvertiserId: user.currentAdvertiserId,
      accessToken: Cookies.get("accessToken") || '',
      refreshToken: Cookies.get("refreshToken")
    };
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    Cookies.remove("accessToken", { path: '/' });
    Cookies.remove("refreshToken", { path: '/' });
    return;
  }

  // Access Token (Short-lived, usually 15m - 1h)
  Cookies.set("accessToken", session.accessToken, {
    expires: 1/96, // 15 minutes
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
    path: '/'
  });

  // Refresh Token (Long-lived, 7+ days)
  if (session.refreshToken) {
    Cookies.set("refreshToken", session.refreshToken, {
      expires: 7,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
      path: '/'
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session.user, currentOrganizationId: session.currentOrganizationId, currentAdvertiserId: session.currentAdvertiserId }));

}
export function createSessionAndNotify(data: any) {
  const currentOrganizationId = data.data.organizations[0].orgId;
  const orgType = data.data.organizations[0].orgType;

  console.log({ currentOrganizationId });

  const session: AuthSession = {
    user: {
      id: data.data.id,
      email: data.data.email,
      app_metadata: {
        isPro: false,
        userState: 'existing',
        isAgency:  orgType === 'AGENCY',
        status: data.data.status,
        mfaEnabled: data.data.mfaEnabled,
        mfaSkipUntil: data.data.mfaSkipUntil,
        organizations: data.data.organizations ?? []
      }
    },
    currentOrganizationId: currentOrganizationId,
    currentAdvertiserId: "",
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken
  };

  setStoredSession(session);
  notify('SIGNED_IN', session);
}

const notify = (event: string, session: AuthSession | null) => 
  listeners.forEach(cb => cb(event, session));

// --- Auth Exports ---

export const auth = {
  /** Initialize session on app load */
  initialize: () => {
    const session = getStoredSession();
    if (session?.accessToken) {
      notify('INITIALIZED', session);
      return session;
    }
    return null;
  },

  getSession: async () => ({ data: { session: getStoredSession() } }),

  setCurrentOrganizationId: (organizationId: string) => {
    const session = getStoredSession();
    if (!session) return;
    session.currentOrganizationId = organizationId;
    setStoredSession(session);
    notify('ORGANIZATION_CHANGED', session);
  },

  setOrganizationType: (organizationType: string) => {
    const session = getStoredSession();
    if (!session) return;
    if(organizationType === "AGENCY") {
      session.user.app_metadata!.isAgency = true;
      session.user.app_metadata!.isPro = true;
    } else {
      session.user.app_metadata!.isAgency = false;
      session.user.app_metadata!.isPro = false;
    }
    setStoredSession(session);
    notify('USER_UPDATED', session);
  },

  setCurrentAdvertiserId: (advertiserId: string, isPro: boolean = false) => {
    console.log("setCurrentAdvertiserId here ", {advertiserId, isPro});
    const session = getStoredSession();
    if (!session) return;
    session.currentAdvertiserId = advertiserId;
    session.user.app_metadata!.isPro = isPro;
    console.log("session here ", {session});
    setStoredSession(session);
    notify('ADVERTISER_CHANGED', session);
  },

  userUpgradedToAgency: () => {
    const session = getStoredSession();
    if (!session) return;
    session.user.app_metadata!.isAgency = true;
    setStoredSession(session);
    notify('USER_UPDATED', session);
  },

  /** Standard Login */
  signInWithPassword: async (email: string, password: string) => {
    const { data, error, status, message } = await request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password: password.trim() },
      skipAuth: true
    });

    if (error || !data?.tokens) return { data, error, status, message };

    createSessionAndNotify(data);
    return { data, error: null, status, message };
  },

  /** Google OAuth */
  signInWithGoogle: async (token: string) => {
    const { data, error, status, message } = await request<any>('/api/v1/auth/google', {
      method: 'POST',
      body: { token },
      skipAuth: true
    });

    console.log("signInWithGoogle", { data, error, status, message });

    if (error || status !== 200 || !data?.tokens) return { data: null, error, status, message };

    createSessionAndNotify(data);
    return { data, error: null, status: 200, message };
  },

  /** Registration */
  signUpWithPassword: async (params: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const { data, error, status, message } = await request<any>('/api/v1/auth/signup', {
      method: 'POST',
      body: params,
      skipAuth: true
    });

    if (error || !data?.tokens) return { data: null, error, status, message };

    createSessionAndNotify(data);
    return { data, error: null, status, message };
  },

  /** OTP & Verification Flows */
  verifyEmailOtp: async (email: string, otp: string) => {
    console.log("verifySignupOtp", email, otp);
    const { error, status, message } = await request('/api/v1/auth/verifyOtp', {
      method: 'POST',
      body: { email, otp }
    });

    if (error || status !== 200) return { error, status, message };

    const session = getStoredSession();
    if (session) {
      session.user.app_metadata!.status = 'ACTIVE';
      setStoredSession(session);
      notify('USER_UPDATED', session);
    }
    return { error: null, status, message };
  },


  sendEmailVerificationOtp2fa: (userId: string, mfaToken: string) => 
    request(`/api/v1/auth/sendEmailOtp`, { body: { userId, mfaToken }, method: "POST" }),


  verifyEmailVerificationOtp2fa: async (userId: string, mfaToken: string, otp: string) => {

    const { error, status, message, data } = await request<any>(`/api/v1/auth/verifyEmailOtp`, { body: { userId, mfaToken, otp }, method: "POST" });
    if (error || status !== 200 || !data.tokens) return { error, status, message};
    const currentOrganizationId = data.data.organizations[0].orgId;

    const session: AuthSession = {
      user: {
        id: userId,
        email: data.email,
        app_metadata: {
          isPro: false,
          userState: 'new',
          isAgency: data.data.organizations[0].orgType === "AGENCY",
          status: data.data.status,
        }
      },
      currentOrganizationId: currentOrganizationId,
      currentAdvertiserId: "",
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken
    };

    setStoredSession(session);
    notify('SIGNED_IN', session);
    return { data: { session }, error: null, status, message };

  },

  verifyEmailWithToken: async (token: string) => {
    const response = await fetch(`${BASE_URL}/api/v1/auth/verifyEmail?token=${token}`, {
      method: 'GET',
    });
    const data = await response.json();
    return { data, error: null, status: response.status, message: data.message };
  },

  resendOtp: (email: string) => 
    request(`/api/v1/auth/resendVerifyEmail`, { params: { email } }),

  /** Password Recovery */
  forgotPassword: (email: string) => 
    request('/api/v1/auth/forgotPassword', { method: 'POST', body: { email }, skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    request('/api/v1/auth/resetPassword', { method: 'POST', body: { token, password }, skipAuth: true }),

  /** Token Refresh Hook (Called by api.ts) */
  updateTokensFromRefresh: async (accessToken: string, refreshToken?: string) => {
    const session = getStoredSession();
    if (!session) return;
    const updated = { ...session, accessToken, refreshToken };
    setStoredSession(updated);
    notify('TOKEN_REFRESHED', updated);
  },

  signOut: async () => {
    setStoredSession(null);
    notify('SIGNED_OUT', null);
  },

  onAuthStateChange: (callback: AuthListener) => {
    listeners.add(callback);
    return { data: {
      subscription: {
        unsubscribe: () => listeners.delete(callback),
      },
    }
   };
  }
};