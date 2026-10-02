import { request } from "./api";

export interface Ad {
  id: string;
  jobId: string;
  type?: "PROMPT" | "SCRIPT";
  adName?: string;
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
  fileUrl?: string;
  duration?: number;
  playbackStart?: number;
  playbackEnd?: number;
  volume?: number;
  audioFadeIn?: boolean;
  audioFadeOut?: boolean;
  source: "V0" | "V1";
  compositionId: string;
  isMadeOfAI: "no" | "yes";
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

/** Voice item from POST /api/v1/creatives/searchVoices (library payload). */
export interface VoiceLibraryVoice {
  voice_id: string;
  voice_owner_id: string;
  name: string;
  description: string;
  language: string;
  accent: string;
  gender: string;
  age: string;
  speech_style: string;
  speech_rate: number;
  preview_url: string;
  category: string;
  source: string;
  is_favorite: boolean;
}

export interface VoiceLibrarySearchData {
  voices: VoiceLibraryVoice[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface VoiceLibrarySearchResponse {
  status: number;
  message: string;
  /** API returns `{ voices: [...] }`; older shapes may use a bare array. */
  data: {
    status: string;
    items: VoiceLibraryVoice[];
    total: number;
    limit: number;
    offset?: number;
  };
}

export interface VoicesResponse {
  status: number;
  message: string;
  data: Voice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MusicsResponse {
  status: number;
  message: string;
  data:   {status: string, items: Music[], total: number, limit: number, offset?: number};
}

export interface VoiceResponse {
  status: number;
  message: string;
  data: Voice;
}

export interface MusicResponse {
  status: number;
  message: string;
  data: Music;
}

export interface Music {
  track_id: string;
  title: string;
  artist_name: string;
  genres: string[];
  moods: string[];
  instruments: string[];
  tags: string[];
  tempo: number;
  tempo_bucket: string;
  start_key: string;
  end_key: string;
  duration_secs: number;
  preview_url: string;
  source: string;
  provider: string;
  is_favorite: boolean;
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

export interface SearchVoicesPayload {
  source?: string[];
  language?: string[];
  accent?: string[];
  gender?: string[];
  age?: string[];
  speech_style?: string[];
  q?: string;
  favorites?: boolean;
  facets?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface SearchMusicsPayload {
  source?: string[];
  genre?: string[];
  mood?: string[];
  instrument?: string[];
  tag?: string[];
  tempo_bucket?: string[];
  bpm_min?: number;
  bpm_max?: number;
  start_key?: string;
  end_key?: string;
  duration_min?: number;
  duration_max?: number;
  artist?: string;
  q?: string;
  favorites?: boolean;
  facets?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface GetFavVoicesPayload {
  page?: number;
  limit?: number;
  voiceId?: string;
  language?: string[];
  gender?: string[];
  /** Comma-separated accent values, e.g. "British,American" */
  accent?: string;
  ageGroup?: string[];
  style?: string[];
  source?: string;
  category?: string;
  query?: string;
}

export interface FavVoice {
  id: string;
  user_id: string;
  voice_id: string;
  voice_owner_id: string;
  name: string;
  description: string;
  language: string;
  accent: string;
  gender: string;
  age: string;
  speech_style: string;
  speech_rate: number | null;
  preview_url: string;
  category: string;
  source: string;
  last_checked?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GetFavVoicesResponse {
  status: number;
  message: string;
  data: FavVoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetFavTracksPayload {
  page?: number;
  limit?: number;
  trackId?: string;
  genre?: string[];
  /** Comma-separated mood values, e.g. "dark,epic" */
  mood?: string;
  instrument?: string[];
  /** Comma-separated tag values, e.g. "horror,trailer" */
  tag?: string;
  tempoBucket?: string[];
  source?: string[];
  query?: string;
}

export interface FavTrack {
  id: string;
  user_id: string;
  track_id: string;
  title: string;
  artist: string;
  genre?: string;
  mood?: string;
  instrument?: string;
  tag?: string;
  tempo_bucket?: string;
  bpm?: number;
  duration?: number;
  preview_url: string;
  start_key?: string;
  end_key?: string;
  source?: string;
  last_checked?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface GetFavTracksResponse {
  status: number;
  message: string;
  data: FavTrack[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ToggleFavVoicePayload {
  voice_id: string;
  voice_owner_id?: string | null;
  name?: string | null;
  description?: string | null;
  language?: string | null;
  accent?: string | null;
  gender?: string | null;
  age?: string | null;
  speech_style?: string | null;
  speech_rate?: number | null;
  preview_url?: string | null;
  category?: string | null;
  source?: string | null;
}

export interface ToggleFavVoiceResponse {
  status: number;
  message: string;
  data: (FavVoice & { isFavorite: true }) | { isFavorite: false; id: string; voice_id: string } | null;
}

export interface ToggleFavTrackPayload {
  track_id: string;
  title?: string | null;
  artist?: string | null;
  genre?: string | null;
  mood?: string | null;
  instrument?: string | null;
  tag?: string | null;
  tempo_bucket?: string | null;
  bpm?: number | null;
  duration?: number | null;
  preview_url?: string | null;
  start_key?: string | null;
  end_key?: string | null;
  source?: string | null;
}

export interface ToggleFavTrackResponse {
  status: number;
  message: string;
  data: (FavTrack & { isFavorite: true }) | { isFavorite: false; id: string; track_id: string } | null;
}

export interface GetFavVoicePayload {
  id?: string;
  voiceId?: string;
  voice_id?: string;
}

export interface GetFavVoiceResponse {
  status: number;
  message: string;
  data: FavVoice | null;
}

export interface GetFavTrackPayload {
  id?: string;
  trackId?: string;
  track_id?: string;
}

export interface GetFavTrackResponse {
  status: number;
  message: string;
  data: FavTrack | null;
}

export interface AdStatusResponse {
  finished: boolean;
  script: string;
  url: string;
  error: boolean;
  error_details: string | null;
}

export interface getAdsPayload {
  page: number;
  limit: number;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "status"
    | "duration"
    | "impressions"
    | "clicks"
    | "conversions"
    | "revenue";
  sortOrder?: "asc" | "desc";
  search?: string;
  status?:
    | "APPROVED"
    | "DRAFT"
    | "REJECTED"
    | "PENDING"
    | "COMPLETED"
    | "FAILED";
  advertiserId: string;
  isSaved?: boolean;
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
  cpm?: number;
}

export interface AdsResponse {
  status: number;
  message: string;
  data: AdData[];
  adsData: {
    TotalAds: number;
    TotalImpressions: number;
    TotalSpend: number;
    TotalConversions: number;
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
  assets?: Asset;
}

export interface AssetRecommendation {
    "voices": VoxifyVoice[],
    "tracks": VoxifyTrack[],
    "clips": Clip[],
    "reference": Reference
}
export interface Asset {
    "status": string,
    "result": AssetRecommendation[],
    "usage": {
        "cached_response": boolean,
        "original_credits": number,
        "billed_credits": number,
        "refunded_credits": 0,
        "remaining_credits": number
    },
    "cached": false,
    "success": true,
    "project_id": "EARO-b2dd5e9c-8f28-4e7c-83ef-1e2795890fa2",
    "script": {
        "text": string,
        "text_input": string,
        "text_plain": string,
        "classification": {
            "campaign_goal": {
                "id": string,
                "name": string
            },
            "tone_of_voice": {
                "category": {
                    "id": string,
                    "name": string
                },
                "speech_tags": [
                    string
                ]
            },
            "target_audience": {
                "id": string,
                "name": string
            },
            "business_activity": {
                "main": {
                    "id": string,
                    "name": string
                },
                "leaf": {
                    "id": string,
                    "name": string
                }
            }
        },
        "name": string | null,
        "rationale": null,
        "tagline": null,
        "promotion": null,
        "cta": null
    },
    "request_id": "par_6c992f4aa633482190e2272ff627bb36"
}


export interface VoxifyRecommendResponse {
  status: number;
  message: string;
  data: {
    success: boolean;
    jobId: string;
    status: string;
    created_at: string;
    updated_at: string;
    poll_url: string;
  };
  assets?: Asset
}

export interface VoxifyVoice {
  voice_id: string;
  owner_id: string | null;
  name: string;
  category: string;
  labels: {
    accent: string;
    gender: string;
    age: string;
    description: string;
  };
  description: string;
  preview_url: string;
  speech_rate: {
    cps: number;
  };
}

export interface VoxifyTrack {
  track_id: string;
  cue_in: number[];
  title: string;
  artist_name: string;
  preview_url: string;
  duration_ms: number;
  genres: string[];
  moods: string[];
  tempo: number;
  key: string;
}

export interface Classification {
  advertiser: string;
  campaign_goal: {
    id: string;
    name: string;
  };
  tone_of_voice: {
    category: {
      id: string;
      name: string;
    };
    speech_tags: string[];
  };
  target_audience: {
    id: string;
    name: string;
  };
  call_to_action: {
    id: string;
    name: string;
  };
  specific_date_event: {
    id: string;
    name: string;
  };
}

export interface Clip {
  "vocal": {
      "start": number,
      "end": number,
      "rms-dbfs": number
  },
  "music": {
      "start": number,
      "end": number,
      "rms-dbfs": number
  }
}

export interface Reference {
  composition_id: string;
  script_id?: number;
  name?: string;
  brief?: string;
}

export interface Recommendation {
  script: {
    text: string;
    text_plain: string;
    name?: string;
    classification?: Classification;
  };
  voices: VoxifyVoice[];
  tracks: VoxifyTrack[];
  reference: Reference;
  "clips": Clip[];
  sourceUrl: string;
  generated: boolean;
  generating: boolean;
  voice?: VoxifyVoice;
  track?: VoxifyTrack;
  isEdited: boolean;
  id?: string;
}

export interface VoxifyPollResponse {
  status: number;
  message: string;
  data: {
    success: boolean;
    jobId: string;
    status: string;
    created_at: string;
    updated_at: string;
    result: {
      project_id?: string;
      product?: {
        name: string;
        description: string;
      };
      duration?: number;
      locale?: string;
      recommendations: Recommendation[];
    };
  };
}

export type VoxifyAdResult = VoxifyPollResponse["data"]["result"];

function formatVoxifyScriptText(text: string): string {
  return text
    .replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />");
}

function mapAssetScriptClassification(
  classification: Asset["script"]["classification"],
): Classification {
  return {
    advertiser:
      classification.business_activity?.leaf?.name ??
      classification.business_activity?.main?.name ??
      "",
    campaign_goal: classification.campaign_goal,
    tone_of_voice: classification.tone_of_voice,
    target_audience: classification.target_audience,
  };
}

export function mapAssetToVoxifyResult(asset: Asset): VoxifyAdResult {
  const formattedScriptText = formatVoxifyScriptText(asset.script.text);

  const recommendations: Recommendation[] = asset.result.map((item, index) => ({
    script: {
      text: formattedScriptText,
      text_plain: asset.script.text_plain,
      classification: mapAssetScriptClassification(asset.script.classification),
      name: asset.script.name ?? item.reference?.name ?? `Recommendation ${index + 1}`,
      rationale: asset.script.rationale ?? "",
      tagline: asset.script.tagline,
      promotion: asset.script.promotion,
      cta: asset.script.cta ?? [],
    },
    voices: item.voices ?? [],
    tracks: item.tracks ?? [],
    clips: item.clips ?? [],
    reference: item.reference,
    sourceUrl: "",
    generated: false,
    generating: false,
    voice: item.voices?.[0],
    track: item.tracks?.[0],
    isEdited: false,
  }));

  return {
    project_id: asset.project_id,
    recommendations,
  };
}

export interface GenerateAudioAdResponse {
  status: number;
  error: any;
  data: {
    id: string;
    sourceUrl: string;
    duration: number;
    voiceId: string;
    musicId: string;
    audioFadeIn: boolean;
    audioFadeOut: boolean;
    playbackStart: number | null;
    playbackEnd: number | null;
    volume: number | null;
    mixRatio: number;
    companionImg: string | null;
    generatedScript: string;
    genAiMetadata: string;
    isFinished: boolean;
    isError: boolean;
    type: "PROMPT";
    compositionId: string;
    source: "V1";
    uploadedCreativeIdentifier: string | null;
    status: "APPROVED";
    isSaved: false;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
}

export const adsApi = {
  getAd: (adId: string, advertiserId: string, loadAssets: boolean = true) =>
    request<AdResponse>("/api/v1/creatives/getAd", {
      method: "POST",
      body: { id: adId, advertiserId: advertiserId, loadAssets: loadAssets },
    }),

  /** Fetches ads for a specific user */
  getAds: (getAdsPayload: getAdsPayload) =>
    request<AdsResponse>(`/api/v1/creatives/getAds`, {
      method: "POST",
      body: getAdsPayload,
    }),

  /** Standard ad creation */
  createAd: (payload: Partial<Ad>) =>
    request<{ status: number; message: string; data: Ad }>(
      "/api/v1/creatives/createAds",
      {
        method: "POST",
        body: { ...payload, voice: payload.voiceId, music: payload.musicId },
      },
    ),

  deleteAd: (adId: string) =>
    request<{ status: number; message: string; data: Ad }>(
      "/api/v1/creatives/deleteAd",
      { method: "POST", body: { adId: adId } },
    ),

  checkAdStatus: (jobId: string) =>
    request<{ status: number; message: string; data: AdStatusResponse }>(
      "/api/v1/creatives/checkAdStatus",
      { method: "POST", body: { jobId: jobId } },
    ),

  updateAd: (jobId: string, payload: Partial<Ad>) =>
    request<Ad>("/api/v1/creatives/updateAd", {
      method: "POST",
      body: { id: jobId, ...payload },
    }),

  uploadAudioAd: (payload: Partial<Ad>) =>
    request<{ status: number; message: string; data: Ad }>(
      "/api/v1/creatives/uploadAudioAd",
      { method: "POST", body: payload },
    ),

  getVoices: (filter: voiceFilter) =>
    request<VoicesResponse>("/api/v1/creatives/searchVoices", {
      method: "POST",
      body: filter,
    }),

  getMusics: (filter: musicFilter) =>
    request<MusicsResponse>("/api/v1/creatives/searchMusics", {
      method: "POST",
      body: filter,
    }),


  searchVoxifyVoices: (payload: SearchVoicesPayload) =>
      request<VoiceLibrarySearchResponse>("/api/v1/creatives/searchVoxifyVoices", {
        method: "POST",
        body: payload,
      }),
  

  searchVoices: (payload: SearchVoicesPayload) =>
    request<VoiceLibrarySearchResponse>("/api/v1/creatives/searchVoices", {
      method: "POST",
      body: payload,
    }),



  searchVoxifyMusics: (payload: SearchMusicsPayload) =>
    request<MusicsResponse>("/api/v1/creatives/searchVoxifyMusics", {
      method: "POST",
      body: payload,
    }),

      
  searchMusics: (payload: SearchMusicsPayload) =>
    request<MusicsResponse>("/api/v1/creatives/searchMusics", {
      method: "POST",
      body: payload,
    }),

  getFavVoices: (payload: GetFavVoicesPayload = {}) =>
    request<GetFavVoicesResponse>("/api/v1/creatives/getFavVoices", {
      method: "POST",
      body: payload,
    }),

  getFavVoice: (payload: GetFavVoicePayload) =>
    request<GetFavVoiceResponse>("/api/v1/creatives/getFavVoice", {
      method: "POST",
      body: payload,
    }),

  addFavVoice: (payload: ToggleFavVoicePayload) =>
    request<GetFavVoiceResponse>("/api/v1/creatives/addFavVoice", {
      method: "POST",
      body: payload,
    }),

  removeFavVoice: (payload: { id?: string; voiceId?: string; voice_id?: string }) =>
    request<{ status: number; message: string; data: { id: string } | null }>(
      "/api/v1/creatives/removeFavVoice",
      {
        method: "POST",
        body: payload,
      },
    ),

  toggleFavVoice: (payload: ToggleFavVoicePayload) =>
    request<ToggleFavVoiceResponse>("/api/v1/creatives/toggleFavVoice", {
      method: "POST",
      body: payload,
    }),

  getFavTracks: (payload: GetFavTracksPayload = {}) =>
    request<GetFavTracksResponse>("/api/v1/creatives/getFavTracks", {
      method: "POST",
      body: payload,
    }),

  getFavTrack: (payload: GetFavTrackPayload) =>
    request<GetFavTrackResponse>("/api/v1/creatives/getFavTrack", {
      method: "POST",
      body: payload,
    }),

  addFavTrack: (payload: ToggleFavTrackPayload) =>
    request<GetFavTrackResponse>("/api/v1/creatives/addFavTrack", {
      method: "POST",
      body: payload,
    }),

  removeFavTrack: (payload: { id?: string; trackId?: string; track_id?: string }) =>
    request<{ status: number; message: string; data: { id: string } | null }>(
      "/api/v1/creatives/removeFavTrack",
      {
        method: "POST",
        body: payload,
      },
    ),

  toggleFavTrack: (payload: ToggleFavTrackPayload) =>
    request<ToggleFavTrackResponse>("/api/v1/creatives/toggleFavTrack", {
      method: "POST",
      body: payload,
    }),

  getVoice: (externalId: string) =>
    request<VoiceResponse>("/api/v1/creatives/searchVoice", {
      method: "POST",
      body: { externalId },
    }),

  getMusic: (externalId: string) =>
    request<MusicResponse>("/api/v1/creatives/searchMusic", {
      method: "POST",
      body: { externalId },
    }),

  updateAdStatus: (jobId: string, name: string, voiceVolume?: number, musicVolume?: number) =>
    request<AdStatusResponse>("/api/v1/creatives/updateAdStatus", {
      method: "POST",
      body: { id: jobId, adName: name, voiceVolume, musicVolume },
    }),

  exportAds: (advertiserId: string) =>
    request<Blob | null>("/api/v1/creatives/exportCSV", {
      method: "POST",
      body: { advertiserId },
      headers: { Accept: "text/csv" },
    }),

  uploadFile: (formData: FormData) =>
    request<{
      status: number;
      message: string;
      data: { url: string; duration: number };
    }>("/api/v1/creatives/commonFileUpload", {
      method: "POST",
      body: formData,
    }),

  getVoxifyRecommendation: (payload: {
    prompt: string;
    voiceId: string;
    trackId: string;
  }) =>
    request<VoxifyRecommendResponse>(
      "/api/v1/creatives/getVoxifyRecommendation",
      { method: "POST", body: payload },
    ),
  getVoxifyPoll: (jobId: string) =>
    request<VoxifyPollResponse>("/api/v1/creatives/getVoxifyPoll", {
      method: "POST",
      body: { jobId },
    }),

  generateRecommendation: (payload: {
    campaignGoal: string;
    advertiserId: string;
    productDescription: string;
    type: "PROMPT" | "SCRIPT";
  }) =>
    request<VoxifyRecommendResponse>(
      "/api/v1/creatives/generateRecommendation",
      { method: "POST", body: payload },
    ),

  generateAudioAd: (payload: { adScript: string; compositionId: string; jobId: string; advertiserId: string }) =>
    request<GenerateAudioAdResponse>("/api/v1/creatives/generateAudioAd", {
      method: "POST",
      body: {
        adScript: payload.adScript,
        compositionId: payload.compositionId,
        jobId: payload.jobId,
        advertiserId: payload.advertiserId,
      },
    }),


  regenerateAudioAd: (payload: { adScript: string; compositionId: string; jobId: string; voice: object; track: object; voiceVolume: number; musicVolume: number }) =>
      request<GenerateAudioAdResponse>("/api/v1/creatives/editAudioAd", {
        method: "POST",
        body: {
          adScript: payload.adScript,
          compositionId: payload.compositionId,
          jobId: payload.jobId,
          voice: payload.voice,
          track: payload.track,
          voiceVolume: payload.voiceVolume,
          musicVolume: payload.musicVolume
        },
      }),
  

};
