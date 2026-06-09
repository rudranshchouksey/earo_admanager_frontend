import { request } from './api';

export interface Ad {
  id: string;
  jobId: string;
  type?: "PROMPT" | "SCRIPT";
  adName?:string;
  advertiserId: string;
  campaignGoal: string;
  prompt: string;
  voiceId: string;
  musicId: string;
  musicMood: string;
  tone: string;
  generatedScript: string;
  genAiMetadata: string;
  sourceUrl: string;
  isFinished: boolean;
  isError: boolean;
  fileUrl?:string;
  duration?:number;
  playbackStart?: number;
  playbackEnd?: number;
  volume?: number;
  audioFadeIn?: boolean;
  audioFadeOut?: boolean;
}

export interface Voice {
  id: string;
  externalId: string;
  name: string;
  language: string;
  accent: string;
  accents: string[];
  gender: string;
  age: string;
  characteristics: string[];
  audioUrl: string;
  imageUrl: string;
}

export interface VoicesResponse {
  "status": number,
  "message": string,
  "data": Voice[],
  "pagination": {
      "total": number,
      "page": number,
      "limit": number,
      "totalPages": number
  }
}

export interface MusicsResponse {
  "status": number,
  "message": string,
  "data": Music[],
  "pagination": {
      "total": number,
      "page": number,
      "limit": number,
      "totalPages": number
  }
}


export interface VoiceResponse {
  "status": number,
  "message": string,
  "data": Voice,
}

export interface MusicResponse {
  "status": number,
  "message": string,
  "data": Music,
}

export interface Music {
  id: string;
  externalId: string;
  title: string;
  artist: string;
  audioUrl: string;
  imageUrl: string | null;
  genres: string[];
  moods: string[];
  use_cases: string[];
  instruments: string[];
  rhythms: string[];
  tracks: MusicTrack[];
}
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  image_url: string | null;
  genres: string[];
  moods: string[];
  use_cases: string[];
  instruments: string[];
  rhythms: string[];
}

export interface musicFilter {
  page?: number;
  limit?: number;
  mood?: string;
  genre?: string;
  instrument?: string;
  rhythm?: string;
  use_case?: string;
  query?: string;
}

export interface voiceFilter {
  page?: number;
  limit?: number;
  gender?: string;
  language?: string;
  characteristic?: string;
  externalId?: string;
  accent?: string;
  query?: string;
  age?: string;
  useCase?: string;
}

export interface AdStatusResponse {
  finished: boolean;
  script: string;
  url: string;
  error: boolean;
  error_details: string | null;
}

export interface getAdsPayload {

  "page": number;
  "limit": number;
  "sortBy"?: "createdAt" | "updatedAt" | "status" | "duration" | "impressions" | "clicks" | "conversions" | "revenue";
  "sortOrder"?: "asc" | "desc";
  "search"?: string;
  "status"?: "APPROVED" | "DRAFT" | "REJECTED" | "PENDING" | "COMPLETED" | "FAILED";
  "advertiserId": string;
  "isSaved"?: boolean;
}

export interface AdData {
    id: string;
    adName: string;
    advertiserId: string;
    status: string;
    campaignGoal: string;
    sourceUrl: string;
    duration: string;
    createdAt: string;
    impressions: number;
    spend: number;
    conversions: number;
    CPA: string;
    eCPM: string;
    jobId?: string;
    pixelUrl?: string;
    campaignBudget?: number;
    totalBudget?: number;
}

export interface AdsResponse {
  status: number;
  message: string;
  data: AdData[];
  adsData: {
    totalAds: number;
    totalImpressions: number;
    totalSpend: number;
    totalConversions: number;
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdResponse {
  status: number;
  message: string;
  data: Ad;
}

export const adsApi = {
  getAd: (adId: string, advertiserId: string) =>
    request<AdResponse>('/api/v1/creatives/getAd', { method: 'POST', body: { id: adId, advertiserId: advertiserId } }),

  /** Fetches ads for a specific user */
  getAds: (getAdsPayload: getAdsPayload) => 
    request<AdsResponse>(`/api/v1/creatives/getAds`, { method: 'POST', body: getAdsPayload }),

  /** Standard ad creation */
  createAd: (payload: Partial<Ad>) => 
    request<{status: number, message: string, data: Ad}>('/api/v1/creatives/createAds', { method: 'POST', body: {...payload, voice: payload.voiceId, music: payload.musicId} }),


  deleteAd: (adId: string) =>
    request<{status: number, message: string, data: Ad}>('/api/v1/creatives/deleteAd', { method: 'POST', body: { adId: adId } }),

  checkAdStatus: (jobId: string) =>
    request<{status: number, message: string, data: AdStatusResponse }>('/api/v1/creatives/checkAdStatus', { method: 'POST', body: { jobId: jobId } }),

  updateAd: (jobId: string, payload: Partial<Ad>) =>
    request<Ad>('/api/v1/creatives/updateAd', { method: 'POST', body: { id: jobId, ...payload } }),

  uploadAudioAd: (payload: Partial<Ad>) =>
    request<{status: number, message: string, data: Ad}>('/api/v1/creatives/uploadAudioAd', { method: 'POST', body: payload }),

  getVoices: (filter: voiceFilter) => request<VoicesResponse>('/api/v1/creatives/searchVoices', {method: "POST", body: filter}),

  getMusics: (filter: musicFilter) => request<MusicsResponse>('/api/v1/creatives/searchMusics', {method: "POST", body: filter}),

  getVoice: (externalId: string) => request<VoiceResponse>('/api/v1/creatives/searchVoice', {method: "POST", body: {externalId}}),

  getMusic: (externalId: string) => request<MusicResponse>('/api/v1/creatives/searchMusic', {method: "POST", body: {externalId}}),


  updateAdStatus: (jobId: string, name: string) =>
    request<AdStatusResponse>('/api/v1/creatives/updateAdStatus', { method: 'POST', body: { id: jobId, adName: name } }),

  exportAds: (advertiserId: string) =>
    request<Blob | null>('/api/v1/creatives/exportCSV', {
      method: 'POST',
      body: { advertiserId },
      headers: { Accept: 'text/csv' },
    }),


    uploadFile: (formData: FormData) => request<{status: number, message: string, data: {url: string, duration: number}}>('/api/v1/creatives/commonFileUpload', { method: 'POST', body: formData }),
};