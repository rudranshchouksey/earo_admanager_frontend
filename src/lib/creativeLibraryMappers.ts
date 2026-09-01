import type {
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
