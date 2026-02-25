export interface GeoData {
  city: string;
  country: string;
  countryCode: string;
  language: string;
  currency: {
    code: string;
    symbol: string;
  };
  listenerCount: string;
  minPrice: string;
  latitude?: number;
  longitude?: number;
}

export interface GeneratedAd {
  brandName: string;
  category: string;
  tone: string;
  script: string;
  audioUrl: string;
  voiceId: string;
  musicId: string;
  duration: number;
  targetAudience?: string; // AI-derived audience segment (e.g., "pet owners", "food lovers")
}
