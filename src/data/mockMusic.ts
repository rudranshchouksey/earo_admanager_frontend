export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration_ms: number;
  audio_url: string;
  image_url: string | null;
  genres: string[];
  moods: string[];
  use_cases: string[];
  instruments: string[];
  rhythms: string[];
}

// Mock tracks matching getMusic API response structure (subset of real API data)
export const MOCK_TRACKS: MusicTrack[] = [
  {
    id: 'ea5b6070-b89a-477e-8d0d-28f8ab3bcd02',
    title: 'In Pursuit of Success',
    artist: 'Wondercraft Originals',
    duration_ms: 140000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/ea5b6070-b89a-477e-8d0d-28f8ab3bcd02.mp3',
    image_url: null,
    genres: ['electronic', 'instrumental', 'downtempo', 'chillwave', 'ambient', 'new age'],
    moods: ['relaxed', 'calm', 'peaceful', 'dreamy', 'ethereal', 'atmospheric', 'chill', 'uplifting'],
    use_cases: ['background music', 'relaxation', 'wellness', 'spa', 'focus', 'content creation'],
    instruments: ['piano', 'electronic drums', 'synthesizer', 'pads', 'bass'],
    rhythms: ['steady', 'rhythmic', 'flowing', 'upbeat', 'mellow', 'gentle', 'laid-back']
  },
  {
    id: 'ec62ec1c-8376-40e3-a84d-c716712183af',
    title: 'Gritty Toon Tedium',
    artist: 'Wondercraft Originals',
    duration_ms: 167920,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/ec62ec1c-8376-40e3-a84d-c716712183af.mp3',
    image_url: null,
    genres: ['instrumental', 'rock', 'pop', 'instrumental rock', 'commercial audio'],
    moods: ['upbeat', 'energetic', 'playful', 'cheerful', 'lively', 'happy', 'groovy'],
    use_cases: ['background music', 'commercial', 'content creation', 'advertising', 'corporate videos'],
    instruments: ['drums', 'bass guitar', 'electric guitar', 'keyboard', 'percussion'],
    rhythms: ['steady', 'driving', 'rhythmic', 'danceable', 'groovy', 'upbeat']
  },
  {
    id: '48919484-c8a6-4099-9965-36a177ddefad',
    title: 'Midnight Hustle',
    artist: 'Wondercraft Originals',
    duration_ms: 240000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/48919484-c8a6-4099-9965-36a177ddefad.mp3',
    image_url: null,
    genres: ['electronic', 'dance', 'pop', 'instrumental rock'],
    moods: ['energetic', 'upbeat', 'lively', 'happy', 'joyful', 'playful', 'driving'],
    use_cases: ['background music', 'party', 'dancing', 'workout', 'advertising', 'content creation'],
    instruments: ['electronic drums', 'bass guitar', 'electric guitar', 'synthesizer', 'keyboard'],
    rhythms: ['steady', 'groovy', 'driving', 'syncopated', 'danceable']
  },
  {
    id: 'bfea1d8b-03db-4e83-bf60-279adfcac1fa',
    title: 'Dreamy Daybreak',
    artist: 'Wondercraft Originals',
    duration_ms: 4120,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/bfea1d8b-03db-4e83-bf60-279adfcac1fa.mp3',
    image_url: null,
    genres: ['new age', 'ambient', 'solo instrumental', 'downtempo'],
    moods: ['calm', 'relaxed', 'soothing', 'serene', 'reflective', 'peaceful', 'meditative', 'dreamy'],
    use_cases: ['relaxation', 'spa/wellness', 'background music', 'study', 'focus', 'contemplation'],
    instruments: ['acoustic guitar', 'pads'],
    rhythms: ['slow', 'gentle', 'beatless', 'flowing', 'ambient']
  },
  {
    id: '687e46d2-1c17-4d78-a97b-f0b06e6e8d3c',
    title: 'Eternal Embrace',
    artist: 'Wondercraft Originals',
    duration_ms: 120000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/687e46d2-1c17-4d78-a97b-f0b06e6e8d3c.mp3',
    image_url: null,
    genres: ['rock', 'alternative rock'],
    moods: ['energetic', 'powerful', 'driving', 'uplifting', 'intense', 'motivational'],
    use_cases: ['action', 'sports', 'workout', 'motivation', 'film scoring', 'commercials'],
    instruments: ['electric guitar', 'drums', 'bass guitar', 'vocals'],
    rhythms: ['driving', 'steady', 'upbeat', 'fast-paced', 'rhythmic']
  },
  {
    id: '39318e6b-8407-4144-91f3-6c40df4a5eb6',
    title: 'Cue the Laughter',
    artist: 'Wondercraft Originals',
    duration_ms: 240000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/39318e6b-8407-4144-91f3-6c40df4a5eb6.mp3',
    image_url: null,
    genres: ['classical', 'cinematic', 'film score', 'instrumental', 'new age', 'ambient'],
    moods: ['calm', 'serene', 'peaceful', 'reflective', 'uplifting', 'emotional', 'dramatic'],
    use_cases: ['film score', 'cinematic', 'relaxation', 'documentary', 'background music'],
    instruments: ['piano', 'strings', 'orchestral', 'pads', 'percussion'],
    rhythms: ['slow', 'flowing', 'sustained', 'ambient', 'gentle']
  },
  {
    id: '007cfe96-d4ce-42b1-98c7-73d33b7de4ec',
    title: 'Melancholic Meadows',
    artist: 'Wondercraft Originals',
    duration_ms: 240000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/007cfe96-d4ce-42b1-98c7-73d33b7de4ec.mp3',
    image_url: null,
    genres: ['instrumental', 'folk', 'neo-classical', 'new age', 'wellness'],
    moods: ['calm', 'peaceful', 'serene', 'reflective', 'soothing', 'melancholy', 'intimate', 'hopeful'],
    use_cases: ['relaxation', 'background music', 'contemplation', 'spa', 'film score'],
    instruments: ['acoustic guitar', 'cello', 'strings'],
    rhythms: ['slow', 'gentle', 'flowing', 'sustained', 'ambient']
  },
  {
    id: '67da2a09-00ce-4f2b-abc1-f8671b1bdf7e',
    title: 'Melodies of the Heart',
    artist: 'Wondercraft Originals',
    duration_ms: 240000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/67da2a09-00ce-4f2b-abc1-f8671b1bdf7e.mp3',
    image_url: null,
    genres: ['solo instrumental', 'folk', 'ambient', 'new age'],
    moods: ['calm', 'peaceful', 'relaxed', 'serene', 'reflective', 'dreamy', 'mellow'],
    use_cases: ['relaxation', 'spa', 'wellness', 'yoga', 'background music', 'study', 'focus'],
    instruments: ['acoustic guitar', 'synth pad'],
    rhythms: ['gentle', 'flowing', 'sustained', 'atmospheric', 'mellow']
  },
  {
    id: '51aed983-acfa-4b71-aa1f-e44c0cf97e31',
    title: 'Velvet Parade',
    artist: 'Wondercraft Originals',
    duration_ms: 240000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/51aed983-acfa-4b71-aa1f-e44c0cf97e31.mp3',
    image_url: null,
    genres: ['swing', 'jazz', 'big band', 'instrumental'],
    moods: ['energetic', 'lively', 'upbeat', 'joyful', 'dramatic', 'celebratory', 'happy', 'playful'],
    use_cases: ['dancing', 'party', 'entertainment', 'background music', 'commercial audio'],
    instruments: ['drums', 'bass guitar', 'trumpet', 'saxophone', 'trombone', 'brass section'],
    rhythms: ['swing', 'driving', 'syncopated', 'danceable', 'rhythmic', 'upbeat']
  },
  {
    id: '43b719a4-575c-44e6-b9f8-ba848ebdd646',
    title: 'Down by the River',
    artist: 'Wondercraft Originals',
    duration_ms: 120000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/43b719a4-575c-44e6-b9f8-ba848ebdd646.mp3',
    image_url: null,
    genres: ['country', 'bluegrass', 'folk', 'instrumental'],
    moods: ['upbeat', 'energetic', 'joyful', 'lively', 'cheerful', 'optimistic'],
    use_cases: ['travel vlogs', 'background music', 'content creation', 'commercial', 'advertising'],
    instruments: ['banjo', 'acoustic guitar', 'drums', 'percussion'],
    rhythms: ['fast-paced', 'steady', 'driving', 'rhythmic', 'upbeat']
  },
  {
    id: '64e11084-2a05-479b-849a-521ddba47146',
    title: 'Electric Pulse',
    artist: 'Wondercraft Originals',
    duration_ms: 120000,
    audio_url: 'https://wondercraft-podcast-assets.s3.amazonaws.com/generated_songs/64e11084-2a05-479b-849a-521ddba47146.mp3',
    image_url: null,
    genres: ['electronic', 'dance'],
    moods: ['energetic', 'upbeat', 'danceable', 'motivational', 'joyful'],
    use_cases: ['workout', 'dancing', 'party', 'content creation', 'entertainment', 'motivation'],
    instruments: ['electronic drums', 'synthesizer', 'bass', 'percussion', 'pads', 'electronic'],
    rhythms: ['steady', 'driving', 'danceable', 'rhythmic']
  }
];
