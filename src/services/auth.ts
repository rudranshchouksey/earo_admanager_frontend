/**
 * Mock Auth Service
 * Replaces Supabase auth with localStorage-based dummy auth for development.
 * Replace with real auth when connecting to a backend.
 */

export interface AuthUser {
  id: number;
  email: string;
  app_metadata?: {
    isPro: boolean;
    userState: 'new' | 'existing';
    isAgency: boolean;
  };
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  expires_at?: number;
}

const STORAGE_KEY = 'nextads_auth_session';
const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo123456';

/** Test users: password is "test123" for all */
const TEST_USERS = [
  {
    id: 1,
    name: "New Express",
    email: 'new_express@test.com',
    password: 'test123',
    isAgency: false,
    isPro: false,
    userType: 'new',
  },
  {
    id: 2,
    name: "New Pro",
    email: 'new_pro@test.com',
    password: 'test123',
    isAgency: false,
    isPro: true,
    userType: 'new',
  },
  {
    id: 3,
    name: "Old Express",
    email: 'old_express@test.com',
    password: 'test123',
    isAgency: false,
    isPro: false,
    userType: 'existing',
  },
  {
    id: 4,
    name: "Old Pro",
    email: 'old_pro@test.com',
    password: 'test123',
    isAgency: false,
    isPro: true,
    userType: 'existing',
  },
  {
    id: 5,
    name: "Agency",
    email: 'new_agency@test.com',
    password: 'test123',
    isAgency: true,
    isPro: true,
    userType: 'new',
  },
  {
    id: 6,
    name: "Agency",
    email: 'old_agency@test.com',
    password: 'test123',
    isAgency: true,
    isPro: true,
    userType: 'existing',
  }
] as const;

const TEST_PASSWORD = 'test123';

function getTestUserMetadata(email: string): AuthUser['app_metadata'] | undefined {
  const normalized = email.toLowerCase().trim();
  const user = TEST_USERS.find(user => user.email.toLowerCase() === normalized);
  if (!user) return undefined;
  const isPro = user.isPro;
  const isAgency = user.isAgency;
  const userState = user.userType;
  return { isPro, userState, isAgency };
}

type AuthListener = (event: string, session: AuthSession | null) => void;

const listeners: Set<AuthListener> = new Set();

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.expires_at && parsed.expires_at < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const toStore = { ...session, expires_at: expiresAt };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
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
    const testUser = TEST_USERS.find(user => user.email.toLowerCase() === email);

    // Test users: must use password "test123"
    if (testUser) {
      if (params.password !== TEST_PASSWORD) {
        return {
          data: null,
          error: new Error('Invalid login credentials'),
        };
      }
      const metadata = getTestUserMetadata(params.email)!;
      const session: AuthSession = {
        user: {
          id: testUser.id,
          email: params.email.trim(),
          app_metadata: metadata,
        },
        access_token: `mock_${crypto.randomUUID()}`,
      };
      setStoredSession(session);
      notifyListeners('SIGNED_IN', session);
      return { data: { session }, error: null };
    }

    // Demo or any other email (password >= 6 chars)
    if (params.email === DEMO_EMAIL && params.password === DEMO_PASSWORD) {
      const session: AuthSession = {
        user: {
          id: testUser.id,
          email: params.email,
        },
        access_token: `mock_${crypto.randomUUID()}`,
      };
      setStoredSession(session);
      notifyListeners('SIGNED_IN', session);
      return { data: { session }, error: null };
    }

    return {
      data: null,
      error: new Error('Invalid login credentials'),
    };
  },
  signUp: async (params: {
    email: string;
    password: string;
    options?: { emailRedirectTo?: string };
  }): Promise<{ data: { session: AuthSession } | null; error: Error | null }> => {
    const email = params.email.trim().toLowerCase();
    const testUser = TEST_USERS.find(user => user.email.toLowerCase() === email);

    if (testUser) {
      return {
        data: null,
        error: new Error('User already exists'),
      };
    }

    if (params.password.length < 6) {
      return {
        data: null,
        error: new Error('Password must be at least 6 characters'),
      };
    }
    const session: AuthSession = {
      user: {
        id: Math.floor(Math.random() * 1000000),
        email: params.email,
      },
      access_token: `mock_${crypto.randomUUID()}`,
    };
    setStoredSession(session);
    notifyListeners('SIGNED_IN', session);
    return { data: { session }, error: null };
  },

  signOut: async () => {
    const session = getStoredSession();
    setStoredSession(null);
    notifyListeners('SIGNED_OUT', null);
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

  setSession: async (tokens: { access_token: string; refresh_token?: string }) => {
    const session: AuthSession = {
      user: { id: crypto.randomUUID(), email: 'oauth@example.com' },
      access_token: tokens.access_token,
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
