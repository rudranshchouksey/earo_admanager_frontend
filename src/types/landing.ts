export interface GeoData {
  locale: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  language: string;
  currency: string;
  currencySymbol: string;
  ip:string;
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
