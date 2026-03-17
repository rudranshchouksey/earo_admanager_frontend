import { api } from "./api";
import Cookies from "js-cookie";

export interface AuthUser {
  id: string;
  email: string;
  app_metadata?: {
    isPro: boolean;
    userState: 'new' | 'existing';
    isAgency: boolean;
    status: string;
    mfaEnabled: boolean;
    mfaSkipUntil: string;
  };
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expires_at?: number;
}

const STORAGE_KEY = 'nextads_auth_session';

type AuthListener = (event: string, session: AuthSession | null) => void;

const listeners: Set<AuthListener> = new Set();

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);

    if (user?.expires_at && user.expires_at < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      user,
      accessToken: Cookies.get("accessToken"),
      refreshToken: Cookies.get("refreshToken")
    };
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    Cookies.remove("refreshToken", { path: '/' });
    return;
  }
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  Cookies.set("accessToken", session.accessToken, {
    expires: 1, // 15 minutes
    secure: window.location.protocol === 'https:',
    sameSite: 'strict',
    path: '/'
  });

  if (session.refreshToken) {
    Cookies.set("refreshToken", session.refreshToken, {
      expires: 7, // 30 days
      secure: window.location.protocol === 'https:', // Only over HTTPS
      sameSite: 'strict', // Protects against CSRF
      path: '/'
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({...session.user, expires_at: expiresAt}));
}

function notifyListeners(event: string, session: AuthSession | null) {
  listeners.forEach((cb) => cb(event, session));
}

export const auth = {
  getSession: async (): Promise<{ data: { session: AuthSession | null } }> => {
    const session = getStoredSession();
    return { data: { session } };
  },

  signInWithPassword: async (params: {
    email: string;
    password: string;
  }): Promise<{ data: { session: AuthSession } | null; error: Error | null }> => {
    const email = params.email.trim().toLowerCase();
    const password = params.password.trim();
  
    if (!email || !password) {
      return { data: null, error: new Error('Email and password are required') };
    }
  
    try {
      const response = await api.login(email, password);
      if (response.error || !response.tokens) {
        return {
          data: null,
          error: new Error(response.message ?? 'Invalid login credentials'),
        };
      }

      const data = response.data as { id?: string; email?: string; status?: string, mfaEnabled?: boolean, mfaSkipUntil?: string };
      const tokens = response.tokens as { accessToken?: string; refreshToken?: string };
      const session: AuthSession = {
        user: {
          id: data.id ?? '',
          email: data.email ?? email,
          app_metadata: {
            isPro: false,
            userState: 'existing',
            isAgency: false,
            status: data.status ?? 'active',
            mfaEnabled: data.mfaEnabled ?? false,
            mfaSkipUntil: data.mfaSkipUntil ?? '',
          },
        },
        accessToken: tokens.accessToken ?? '',
        refreshToken: tokens.refreshToken,
      };
  
      await setStoredSession(session); 
      notifyListeners('SIGNED_IN', session);
  
      return { data: { session }, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e : new Error('Unknown login error') };
    }
  },

  signInWithGoogle: async (token: string, role: string): Promise<{ data: { session: AuthSession } | null; error: Error | null }> => {
    const response = await api.signInWithGoogle(token, role);
    if (response.error || !response.data) {
      return { data: null, error: new Error(response.message ?? 'Google login failed') };
    }
    if (response.error || !response.data) {
      return { data: null, error: new Error(response.message ?? 'Signup failed') };
    }

    const data = response.data as { id?: string; email?: string; accessToken?: string; refreshToken?: string };
    const session: AuthSession = {
      user: {
        id: data.id ?? '',
        email: data.email,
        app_metadata: {
          isPro: false,
          userState: 'existing',
          isAgency: false,
        },
      },
      accessToken: data.accessToken ?? '',
      refreshToken: data.refreshToken,
    };
    setStoredSession(session);
    notifyListeners('SIGNED_IN', session);
    return { data: { session }, error: null };


  },
  
  signUpWithPassword: async (params: {
    email: string;
    password: string;
    confirmPassword: string;
    orgType: string;
  }): Promise<{ data: { session: AuthSession } | null; error: Error | null }> => {
    const email = params.email.trim().toLowerCase();
    const password = params.password.trim();
    const confirmPassword = params.confirmPassword.trim();
    const orgType = params.orgType.trim();

    if (!email || !password || !confirmPassword || !orgType) {
      return { data: null, error: new Error('All fields are required') };
    }

    if (password.length < 8) {
      return {
        data: null,
        error: new Error('Password must be at least 8 characters'),
      };
    }

    if (password !== confirmPassword) {
      return {
        data: null,
        error: new Error('Passwords do not match'),
      };
    }

    const response = await api.signup(email, password, confirmPassword, orgType);
    if (response.error || !response.tokens) {
      return { data: null, error: new Error( response?.error?.message || response?.message ||  'Signup failed') };
    }

    const data = response.data as { id?: string; status?: string; mfaEnabled?: boolean; mfaSkipUntil: string;};
    const tokens = response.tokens as { accessToken?: string; refreshToken?: string };
    const session: AuthSession = {
      user: {
        id: data.id ?? '',
        email,
        app_metadata: {
          isPro: false,
          userState: 'existing',
          isAgency: orgType === "AGENCY",
          status: data.status,
          mfaEnabled: data.mfaEnabled,
          mfaSkipUntil: data.mfaSkipUntil
        },
      },
      accessToken: tokens.accessToken ?? '',
      refreshToken: tokens.refreshToken,
    };
    setStoredSession(session);
    notifyListeners('SIGNED_IN', session);
    return { data: { session }, error: null };
  },

  verifySignupOtp: async (email: string, otp: string): Promise<{ data: { session: AuthSession } | null; error: Error | null }> => {
    const response = await api.verifyOtp(email, otp);
    if (response.error) {
      return { data: null, error: new Error(response.error?.message ?? 'OTP verification failed') };
    }

    const session = getStoredSession();
    session.user.app_metadata.status = 'ACTIVE';
    setStoredSession(session);
    notifyListeners('USER_UPDATED', session);
    return { data: { session: null }, error: null };
  },

  sendSignupOtp: async (email: string): Promise<{ data: { session: AuthSession } | null; error: Error | null }> => {
    const response = await api.resendOtp(email);
    if (response.error) {
      if(response.error?.message === "Email already verified"){
        const session = getStoredSession();
        session.user.app_metadata.status = 'ACTIVE';
        setStoredSession(session);
        notifyListeners('USER_UPDATED', session);
      } 
      return { data: null, error: new Error(response.error?.message ?? 'OTP sending failed') };
    }
    return { data: { session: null }, error: null };
  },

  signOut: async () => {
    setStoredSession(null);
    notifyListeners('SIGNED_OUT', null);
  },

  /** Updates only tokens after refresh - keeps user, notifies listeners */
  updateTokensFromRefresh: async (accessToken: string, refreshToken?: string) => {
    const session = getStoredSession();
    if (!session) return;
    const updated: AuthSession = { ...session, accessToken, refreshToken };
    setStoredSession(updated);
    notifyListeners('TOKEN_REFRESHED', updated);
  },

  updateUser: async (params: { password?: string }): Promise<{
    data: { user: AuthUser } | null;
    error: Error | null;
  }> => {
    const session = getStoredSession();
    if (!session) return { data: null, error: new Error('Not authenticated') };
    if (params.password && params.password.length < 6) {
      return {
        data: null,
        error: new Error('Password must be at least 6 characters'),
      };
    }
    return { data: { user: session.user }, error: null };
  },

  setSession: async (tokens: { accessToken: string; refreshToken?: string }, userId: string, email: string) => {
    const session: AuthSession = {
      user: { id: userId, email: email },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
    setStoredSession(session);
    notifyListeners('SIGNED_IN', session);
  },

  onAuthStateChange: (callback: AuthListener) => {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => listeners.delete(callback),
        },
      },
    };
  },
};
