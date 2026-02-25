/**
 * API Service - Centralized service for all API calls.
 * Currently returns dummy/mock responses.
 * Replace the implementation with real HTTP calls when connecting to a backend.
 */

import { auth, type AuthSession } from './auth';
import { MOCK_VOICES } from '@/data/mockVoices';
import { MOCK_TRACKS } from '@/data/mockMusic';

// Re-export auth for consumers that need session
export { auth };

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
  },,
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

  // Campaigns
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
    return { data: MOCK_ADS.filter((a) => a.user_id === userId || !userId), error: null };
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

  // User profiles
  async getUserProfile(userId: string) {
    await delay();
    return { data: { ...MOCK_USER_PROFILE }, error: null };
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
