import type {
  FavTrack,
  FavVoice,
  Music,
  Voice,
  VoiceLibraryVoice,
  VoxifyTrack,
  VoxifyVoice,
} from "@/services/ads";

export function mapVoiceLibraryVoiceToVoxifyVoice(voice: VoiceLibraryVoice): VoxifyVoice {
  return {
    voice_id: voice.voice_id,
    owner_id: voice.voice_owner_id,
    name: voice.name.trim(),
    category: voice.category,
    labels: {
      accent: voice.accent,
      gender: voice.gender,
      age: voice.age,
      description: voice.description,
    },
    description: voice.description,
    preview_url: voice.preview_url,
    speech_rate: { cps: voice.speech_rate },
  };
}

export function mapFavVoiceToVoxifyVoice(voice: FavVoice): VoxifyVoice {
  return {
    voice_id: voice.voice_id,
    owner_id: voice.voice_owner_id,
    name: voice.name.trim(),
    category: voice.category ?? "",
    labels: {
      accent: voice.accent ?? "",
      gender: voice.gender ?? "",
      age: voice.age ?? "",
      description: voice.description ?? "",
    },
    description: voice.description ?? "",
    preview_url: voice.preview_url ?? "",
    speech_rate: { cps: voice.speech_rate ?? 0 },
  };
}

export function mapFavTrackToVoxifyTrack(track: FavTrack): VoxifyTrack {
  return {
    track_id: track.track_id,
    cue_in: [],
    title: track.title ?? "",
    artist_name: track.artist ?? "",
    preview_url: track.preview_url ?? "",
    duration_ms: (track.duration ?? 0) * 1000,
    genres: track.genre ? [track.genre] : [],
    moods: track.mood ? [track.mood] : [],
    tempo: track.bpm ?? 0,
    key: track.start_key || track.end_key || "",
  };
}

export function voxifyVoiceToFavPayload(voice: VoxifyVoice) {
  return {
    voice_id: voice.voice_id,
    voice_owner_id: voice.owner_id,
    name: voice.name,
    description: voice.description || voice.labels?.description || null,
    accent: voice.labels?.accent || null,
    gender: voice.labels?.gender || null,
    age: voice.labels?.age || null,
    speech_rate: voice.speech_rate?.cps ?? null,
    preview_url: voice.preview_url || null,
    category: voice.category || null,
  };
}

export function voxifyTrackToFavPayload(track: VoxifyTrack) {
  return {
    track_id: track.track_id,
    title: track.title,
    artist: track.artist_name || null,
    genre: track.genres?.[0] || null,
    mood: track.moods?.[0] || null,
    bpm: track.tempo || null,
    duration: track.duration_ms ? Math.round(track.duration_ms / 1000) : null,
    preview_url: track.preview_url || null,
    start_key: track.key || null,
  };
}

export function voiceLibraryVoiceToFavPayload(voice: VoiceLibraryVoice) {
  return {
    voice_id: voice.voice_id,
    voice_owner_id: voice.voice_owner_id || null,
    name: voice.name,
    description: voice.description || null,
    language: voice.language || null,
    accent: voice.accent || null,
    gender: voice.gender || null,
    age: voice.age || null,
    speech_style: voice.speech_style || null,
    speech_rate: voice.speech_rate ?? null,
    preview_url: voice.preview_url || null,
    category: voice.category || null,
    source: voice.source || null,
  };
}

export function musicToFavPayload(music: Music) {
  return {
    track_id: music.track_id,
    title: music.title,
    artist: music.artist_name || null,
    genre: music.genres?.[0] || null,
    mood: music.moods?.[0] || null,
    instrument: music.instruments?.[0] || null,
    tag: music.tags?.[0] || null,
    tempo_bucket: music.tempo_bucket || null,
    bpm: music.tempo || null,
    duration: music.duration_secs ?? null,
    preview_url: music.preview_url || null,
    start_key: music.start_key || null,
    end_key: music.end_key || null,
    source: music.source || null,
  };
}

export function mapVoiceToVoxifyVoice(voice: Voice): VoxifyVoice {
  return {
    voice_id: voice.externalId || voice.id,
    owner_id: null,
    name: voice.name,
    category: voice.language,
    labels: {
      accent: voice.accent,
      gender: voice.gender,
      age: voice.age,
      description: voice.characteristics?.join(", ") || "",
    },
    description: voice.characteristics?.join(", ") || "",
    preview_url: voice.audioUrl,
    speech_rate: { cps: 0 },
  };
}

export function mapMusicToVoxifyTrack(music: Music): VoxifyTrack {
  return {
    track_id: music.track_id,
    cue_in: [],
    title: music.title,
    artist_name: music.artist_name,
    preview_url: music.preview_url,
    duration_ms: music.duration_secs * 1000,
    genres: music.genres ?? [],
    moods: music.moods ?? [],
    tempo: music.tempo ?? 0,
    key: music.start_key || music.end_key || "",
  };
}
