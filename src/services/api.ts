/**
 * API Service - Production-grade centralized API client.
 * Handles auth failures, token refresh, and concurrent request coordination.
 */

import { auth } from './auth';
import { MOCK_VOICES } from '@/data/mockVoices';
import { MOCK_TRACKS } from '@/data/mockMusic';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Re-export auth for consumers that need session
export { auth };

// --- Auth error for consumers to handle redirects ---
export class ApiAuthError extends Error {
  readonly status = 401;
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'ApiAuthError';
  }
}

// --- Refresh coordination: only one refresh in flight, others wait ---
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  const { data } = await auth.getSession();
  const session = data.session;
  if (!session?.refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, refreshToken: session.refreshToken }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return false;
    const accessToken = json.issueTokens?.accessToken;
    const refreshToken = json.issueTokens?.refreshToken;
    if (!accessToken || !refreshToken) return false;
    await auth.updateTokensFromRefresh(accessToken, refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function ensureValidToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = attemptTokenRefresh();
  try {
    const ok = await refreshPromise;
    return ok;
  } finally {
    refreshPromise = null;
  }
}

export type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
};

/** Core authenticated request - handles 401, refresh, and retry. Use for protected endpoints. */
export async function request<T = unknown>(
  path: string,
  config: RequestConfig = {}
): Promise<{ data: T | null; error: Error | null }> {
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    skipAuth = false,
    skipRefreshRetry = false,
  } = config;

  const { data } = await auth.getSession();
  const token = data.session?.accessToken;
  console.log('token', token);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (!skipAuth && token) headers['Authorization'] = `Bearer ${token}`;

  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const doFetch = async (): Promise<Response> =>
    fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && !skipAuth && !skipRefreshRetry) {
    const refreshed = await ensureValidToken();
    if (!refreshed) {
      await auth.signOut();
      throw new ApiAuthError('Session expired. Please sign in again.');
    }
    const { data: next } = await auth.getSession();
    const nextToken = next.session?.accessToken;
    if (nextToken) headers['Authorization'] = `Bearer ${nextToken}`;
    res = await doFetch();
  }

  const text = await res.text();
  let data_: T | null = null;
  if (text) {
    try {
      data_ = JSON.parse(text) as T;
    } catch {
      data_ = text as unknown as T;
    }
  }

  if (!res.ok) {
    const errMsg = (data_ as { message?: string })?.message ?? `Request failed: ${res.status}`;
    return { data: null, error: new Error(errMsg) };
  }
  return { data: data_, error: null };
}

// --- Dummy data ---

const MOCK_CAMPAIGNS = [
  {
    id: 'mock-1',
    name: 'Ramadan Brand Awareness',
    status: 'active',
    campaign_type: 'awareness',
    start_date: '2026-02-01',
    end_date: '2026-03-15',
    budget: 5000,
    actual_spend: 2340,
    actual_impressions: 187200,
    reach: 45800,
    ltr: 78,
    currency: 'USD',
    ad_id: 'ad-1',
    user_id: 'user-1',
  },
  {
    id: 'mock-2',
    name: 'Summer Product Launch',
    status: 'active',
    campaign_type: 'awareness',
    start_date: '2026-01-20',
    end_date: '2026-02-28',
    budget: 3000,
    actual_spend: 1870,
    actual_impressions: 112500,
    reach: 31200,
    ltr: 82,
    currency: 'USD',
    ad_id: 'ad-2',
    user_id: 'user-1',
  },
  {
    id: 'mock-3',
    name: 'Podcast Sponsorship Q1',
    status: 'active',
    campaign_type: 'engagement',
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    budget: 8000,
    actual_spend: 4150,
    actual_impressions: 320000,
    reach: 89000,
    ltr: 71,
    currency: 'USD',
    ad_id: 'ad-3',
    user_id: 'user-1',
  },
];

const MOCK_ADS = [
  {
    id: 'ad-1',
    product_name: 'Ramadan Promo Ad',
    brand_name: 'NextAds Demo',
    audio_url: 'https://example.com/audio1.mp3',
    created_at: new Date().toISOString(),
    status: 'completed',
    duration_seconds: 30,
    tone: 'friendly',
    user_id: 6,
  },
  {
    id: 'ad-2',
    product_name: 'Summer Launch Ad',
    brand_name: 'NextAds Demo',
    audio_url: 'https://example.com/audio2.mp3',
    created_at: new Date().toISOString(),
    status: 'completed',
    duration_seconds: 15,
    tone: 'professional',
    user_id: 4,
  },
  {
    id: 'ad-2',
    product_name: 'Summer Launch Ad',
    brand_name: 'NextAds Demo',
    audio_url: 'https://example.com/audio2.mp3',
    created_at: new Date().toISOString(),
    status: 'completed',
    duration_seconds: 15,
    tone: 'professional',
    user_id: 3,
  }
];

const MOCK_USER_PROFILE = {
  phone: '',
  first_name: 'Demo',
  last_name: 'User',
  company_name: 'Demo Company',
  company_type: 'sme',
  industry: '',
  language: 'en',
  newsletter_opt_in: true,
  referral_code: 'DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
};

// --- API functions ---

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export const api = {
  auth,

  async getSession() {
    return auth.getSession();
  },

  async login(email: string, password: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: new Error(json.message ?? 'Login failed') };
      }
      return json;
    } catch {
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  async signup(email: string, password: string, confirmPassword: string, orgType: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword, orgType }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: new Error(json.message ?? 'Signup failed') };
      }
      return json;
    } catch {
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  async verifyOtp(email: string, otp: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/verifyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || res.status === 400 || json.status === 400) {
        return { data: null, error: new Error(json.message || json.error || 'OTP verification failed') };
      }
      return json;
    } catch {
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  async resendOtp(email: string) {
    try {
      const res = await request(`${BASE_URL}/api/v1/auth/resendVerifyEmail?email=${email}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = res.data as { status?: number; message?: string };
      console.log({data})
      if (res.error || (data && data.status === 400)) {
        return { data: null, error: new Error(res.error?.message || data?.message || 'OTP sending failed') };
      }
      return { data: res.data, error: null };
    } catch (error) {
      console.log({error})
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  async refreshToken(userId: string, refreshToken: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, refreshToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: new Error(json.message ?? 'Token refresh failed') };
      }
      return { data: json.data ?? json, error: null };
    } catch {
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  async resetPassword(email: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/forgotPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || res.status === 400 || json.status === 400) {
        return { data: null, error: new Error(json.message || json.error || 'Reset password failed') };
      }
      return { data: json.data ?? json, error: null };
    } catch {
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  /**
   * Reset password using a reset token from URL.
   * Expected backend: POST /api/v1/auth/resetPassword
   * Body: { token: string, password: string }
   */
  async resetPasswordWithToken(token: string, password: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/resetPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { data: null, error: new Error(json.message || json.error || 'Reset password failed') };
      }
      return { data: json.data ?? json, error: null };
    } catch {
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  async signInWithGoogle(token: string, role: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, role }),
      });
    
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: new Error(json.message ?? 'Google login failed') };
    }
    return json;
    } catch {
      return { data: null, error: new Error('Network error or server unreachable') };
    }
  },

  request,

  // Campaigns (mock; when real: return request('/api/v1/campaigns'))
  async getCampaigns() {
    await delay();
    return { data: MOCK_CAMPAIGNS, error: null };
  },

  async createCampaign(payload: {
    ad_id: string;
    name: string;
    user_id: string;
    start_date: string;
    end_date: string;
    budget: number;
    currency?: string;
    status?: string;
    campaign_type?: string;
  }) {
    await delay();
    const campaign = {
      id: crypto.randomUUID(),
      ...payload,
      actual_spend: 0,
      actual_impressions: 0,
      reach: 0,
      ltr: null,
      created_at: new Date().toISOString(),
    };
    return { data: campaign, error: null };
  },

  // Ads
  async getAds(userId: string) {
    await delay();
    console.log('userId', userId);
    return { data: MOCK_ADS.filter((a) => String(a.user_id) === String(userId) || !userId), error: null };
  },

  async getCampaignsForAds(userId: string) {
    await delay();
    return { data: MOCK_CAMPAIGNS, error: null };
  },

  async createAd(payload: Record<string, unknown>) {
    await delay();
    const ad = {
      id: crypto.randomUUID(),
      ...payload,
      created_at: new Date().toISOString(),
    };
    return { data: ad, error: null };
  },

  async deleteAd(id: string) {
    await delay();
    return { error: null };
  },

  // Storage (mock - returns blob URL for uploaded files)
  async uploadAudio(path: string, file: File): Promise<{ error: Error | null }> {
    await delay(500);
    return { error: null };
  },

  getPublicUrl(path: string): { publicUrl: string } {
    return { publicUrl: `blob:https://example.com/${path}` };
  },

  // User profile (authenticated; uses request for 401/refresh handling)
  async getUserProfile(userId: string) {
    const { data, error } = await request<typeof MOCK_USER_PROFILE>(
      `/api/v1/users/${userId}/profile`,
      { method: 'GET' }
    );
    if (error) return { data: null, error };
    return { data: data ?? { ...MOCK_USER_PROFILE }, error: null };
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<typeof MOCK_USER_PROFILE>
  ) {
    await delay();
    return { error: null };
  },

  // Voices
  async getVoices() {
    await delay();
    return {
      status: 'success',
      data: {
        voices: MOCK_VOICES,
        pagination: { hasMore: false, total: MOCK_VOICES.length },
      },
      error: null,
    } as const;
  },

  // Music
  async getMusic() {
    await delay();
    return {
      status: 'success',
      data: {
        tracks: MOCK_TRACKS,
        pagination: { hasMore: false, total: MOCK_TRACKS.length, limit: 100, offset: 0 },
      },
      error: null,
    } as const;
  },

  // Edge functions (mocked)
  async invokeAnalyzeBrand(body: {
    input?: { type: string; prompt?: string; url?: string };
    tone?: string;
    length?: number;
    emphasis?: string;
  }) {
    await delay(1500);
    return {
      data: {
        brandName: body.input?.type === 'manual' ? 'Demo Brand' : 'Demo Brand',
        category: 'Retail',
        tone: body.tone || 'friendly',
        script: 'This is a demo audio ad script. Replace with real generation.',
        audioUrl: 'https://example.com/demo-audio.mp3',
        voiceId: 'voice-1',
        musicId: 'music-1',
        duration: body.length || 30,
        targetAudience: 'General consumers',
      },
      error: null,
    };
  },

  async invokeTranslate(body: {
    texts?: string[];
    targetLanguage?: string;
  }) {
    await delay();
    const texts = body.texts || [];
    const translations: Record<string, string> = {};
    texts.forEach((t) => (translations[t] = t)); // Return same text for dummy
    return { data: { translations }, error: null };
  },

  async invokeGeoDetect() {
    await delay();
    return {
      data: {
        city: 'Dubai',
        country: 'United Arab Emirates',
        countryCode: 'AE',
        language: 'en',
        currency: { code: 'AED', symbol: 'د.إ' },
        listenerCount: '10 million',
        minPrice: '50',
      },
      error: null,
    };
  },

  async invokeEvents(body: { events: unknown[] }) {
    await delay();
    return { error: null };
  },

  async invokeExperimentExposure(body: {
    experiment_id: string;
    variant_id: string;
  }) {
    await delay();
    return { error: null };
  },

  // Tables
  async getSystemAlerts() {
    await delay();
    return { data: [], error: null };
  },

  async dismissAlert(id: string) {
    await delay();
    return { error: null };
  },

  async insertNudgeImpression(payload: Record<string, unknown>) {
    await delay();
    return { error: null };
  },

  async updateNudgeImpression(
    updates: Record<string, unknown>,
    match: Record<string, string>
  ) {
    await delay();
    return { error: null };
  },

  // Dashboard stats
  async getCampaignStats() {
    await delay();
    return {
      data: [
        { actual_impressions: 124500, actual_spend: 2340, reach: 48200 },
      ],
      error: null,
    };
  },

  // Reports
  async getReportsData() {
    await delay();
    return { data: MOCK_CAMPAIGNS, error: null };
  },

  // UI Config (SDUI) - replaces Supabase edge function
  async getUIConfig(_screenId: string, _country?: string, _anonymousId?: string) {
    await delay();
    return {
      screen_id: 'landing',
      version: '2025-02-05',
      persona: 'express',
      layout: 'single_column',
      blocks: [],
      features: {
        enable_wondercraft_tts: true,
        enable_whatsapp_share: true,
        enable_campaign_map: true,
      },
      locale: {
        country: 'United States',
        country_code: 'US',
        currency: { code: 'USD', symbol: '$' },
        language: 'en',
        payment_methods: ['card', 'apple_pay'],
        payment_logos: ['/logos/visa.svg', '/logos/mastercard.svg'],
        min_budget: 50,
        cultural_copy: {},
      },
      experiments: {},
      defaults: {
        suggested_budget: 500,
        suggested_tone: 'friendly',
        suggested_duration: 15,
        suggested_cities: [],
      },
      nudges: [],
    };
  },
};
