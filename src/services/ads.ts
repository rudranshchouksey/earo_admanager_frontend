import { request } from './api';

export interface Ad {
  id: string;
  type?: number;
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
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  accent: string;
  gender: string;
  age: string;
  audioUrl: string;
  imageUrl: string;
}

export interface VoiceResponse {
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

export interface MusicResponse {
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
export interface Music {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  tracks: MusicTrack[];
}
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
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
}

export interface voiceFilter {
  page?: number;
  limit?: number;
  gender?: string;
  language?: string;
  characteristic?: string;
}

export const adsApi = {
  /** Fetches ads for a specific user */
  getAds: (userId: string) => 
    request<Ad[]>(`/api/v1/ads`, { params: { userId } }),

  /** Standard ad creation */
  createAd: (payload: Partial<Ad>) => 
    request<Ad>('/api/v1/creatives/createAds', { method: 'POST', body: {...payload, voice: payload.voiceId, music: payload.musicId} }),

  checkAdStatus: (jobId: string) =>
    request<Ad>('/api/v1/creatives/checkAdStatus', { method: 'POST', body: { jobId: jobId } }),

  updateAd: (jobId: string, payload: Partial<Ad>) =>
    request<Ad>('/api/v1/creatives/updateAd', { method: 'POST', body: { id: jobId, ...payload } }),

  uploadAudioAd: (payload: Partial<Ad>) =>
    request<Ad>('/api/v1/creatives/uploadAudioAd', { method: 'POST', body: payload }),

  getVoices: (filter: voiceFilter) => request<VoiceResponse>('/api/v1/creatives/searchVoice', {method: "POST", body: filter}),

  getMusics: (filter: musicFilter) => request<MusicResponse>('/api/v1/creatives/searchMusic', {method: "POST", body: filter}),

};