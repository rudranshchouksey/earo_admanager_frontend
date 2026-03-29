import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Play, Loader2, Search } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { adsApi } from '@/services/ads';
import type { Voice } from '@/data/mockVoices';
import type { MusicTrack } from '@/data/mockMusic';

export interface ProVoiceSettings {
  voiceId: string;
  language: string;
  accent: string;
  gender: string;
  useCase: string;
  characteristics: string;
  age: string;
}

export interface ProMusicSettings {
  musicId: string;
  useCase: string;
  mood: string;
  genre: string;
  instrument: string;
  rhythm: string;
}

export interface ProContentSettings {
  fadeInMs: number;
  fadeOutMs: number;
  startMs: number;
  endMs: number;
  volume: number;
}

interface ProCustomizationsProps {
  trackingPixel: string;
  onTrackingPixelChange: (v: string) => void;
  voiceSettings: ProVoiceSettings;
  onVoiceSettingsChange: (v: ProVoiceSettings) => void;
  musicSettings: ProMusicSettings;
  onMusicSettingsChange: (v: ProMusicSettings) => void;
  contentSettings: ProContentSettings;
  onContentSettingsChange: (v: ProContentSettings) => void;
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <Separator className="mb-2" />
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProCustomizations({
  trackingPixel, onTrackingPixelChange,
  voiceSettings, onVoiceSettingsChange,
  musicSettings, onMusicSettingsChange,
  contentSettings, onContentSettingsChange,
}: ProCustomizationsProps) {
  const { t } = useTranslation();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState<string>('');
  const [accentFilter, setAccentFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [musicList, setMusicList] = useState<MusicTrack[]>([]);
  const [musicLoading, setMusicLoading] = useState(true);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('');
  const [rhythmFilter, setRhythmFilter] = useState('');
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);

  useEffect(() => {
    adsApi.getVoices().then((res) => {
      if (res.data?.voices) setVoices(res.data.voices);
      setVoicesLoading(false);
    });
  }, []);

  useEffect(() => {
    adsApi.getMusic().then((res) => {
      if (res.data?.tracks) setMusicList(res.data.tracks);
      setMusicLoading(false);
    });
  }, []);

  const filterOptions = useMemo(() => {
    const langs = [...new Set(voices.map((v) => v.language).filter(Boolean))].sort();
    const accents = [...new Set(voices.flatMap((v) => v.accents || []).filter(Boolean))].sort();
    const genders = [...new Set(voices.map((v) => v.gender).filter(Boolean))].sort();
    const ages = [...new Set(voices.map((v) => v.age).filter(Boolean))].sort();
    return { langs, accents, genders, ages };
  }, [voices]);

  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          v.name.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      if (langFilter && v.language !== langFilter) return false;
      if (accentFilter && (!v.accents || !v.accents.includes(accentFilter))) return false;
      if (genderFilter && v.gender !== genderFilter) return false;
      if (ageFilter && v.age !== ageFilter) return false;
      return true;
    });
  }, [voices, searchQuery, langFilter, accentFilter, genderFilter, ageFilter]);

  const musicFilterOptions = useMemo(() => {
    const moods = [...new Set(musicList.flatMap((m) => m.moods || []).filter(Boolean))].sort();
    const genres = [...new Set(musicList.flatMap((m) => m.genres || []).filter(Boolean))].sort();
    const instruments = [...new Set(musicList.flatMap((m) => m.instruments || []).filter(Boolean))].sort();
    const rhythms = [...new Set(musicList.flatMap((m) => m.rhythms || []).filter(Boolean))].sort();
    return { moods, genres, instruments, rhythms };
  }, [musicList]);

  const filteredMusic = useMemo(() => {
    return musicList.filter((m) => {
      if (musicSearchQuery) {
        const q = musicSearchQuery.toLowerCase();
        const matchesSearch =
          m.title.toLowerCase().includes(q) ||
          (m.artist && m.artist.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      if (moodFilter && (!m.moods || !m.moods.includes(moodFilter))) return false;
      if (genreFilter && (!m.genres || !m.genres.includes(genreFilter))) return false;
      if (instrumentFilter && (!m.instruments || !m.instruments.includes(instrumentFilter))) return false;
      if (rhythmFilter && (!m.rhythms || !m.rhythms.includes(rhythmFilter))) return false;
      return true;
    });
  }, [musicList, musicSearchQuery, moodFilter, genreFilter, instrumentFilter, rhythmFilter]);

  const updateVoice = (key: keyof ProVoiceSettings, value: string) =>
    onVoiceSettingsChange({ ...voiceSettings, [key]: value });

  const selectVoice = (voice: Voice) => {
    onVoiceSettingsChange({
      ...voiceSettings,
      voiceId: voice.id,
      language: voice.language || voiceSettings.language,
      accent: voice.accents?.[0] || voiceSettings.accent,
      gender: voice.gender || voiceSettings.gender,
      age: voice.age || voiceSettings.age,
    });
  };

  const formatLabel = (val: string | null | undefined) =>
    val ? String(val).charAt(0).toUpperCase() + String(val).slice(1).replace(/-/g, ' ') : '—';
  const selectedVoiceName = voices.find((v) => v.id === voiceSettings.voiceId)?.name ?? '—';
  const selectedMusicName = musicList.find((m) => m.id === musicSettings.musicId)?.title ?? '—';

  const selectMusic = (track: MusicTrack) => {
    onMusicSettingsChange({
      ...musicSettings,
      musicId: track.id,
      mood: track.moods?.[0] || musicSettings.mood,
      genre: track.genres?.[0] || musicSettings.genre,
      instrument: track.instruments?.[0] || musicSettings.instrument,
      rhythm: track.rhythms?.[0] || musicSettings.rhythm,
    });
  };
  const updateMusic = (key: keyof ProMusicSettings, value: string) =>
    onMusicSettingsChange({ ...musicSettings, [key]: value });
  const updateContent = (key: keyof ProContentSettings, value: boolean | number) =>
    onContentSettingsChange({ ...contentSettings, [key]: value });

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">{t('pro.settings')}</Label>

      {/* Voice */}
      <Section title={`${t('pro.voice')}: ${selectedVoiceName}`}>
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('wizard.targeting.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[100px]"
            >
              <option value="">{t('pro.language')}</option>
              {filterOptions.langs.map((lang) => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
            <select
              value={accentFilter}
              onChange={(e) => setAccentFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[120px]"
            >
              <option value="">{t('pro.accent')}</option>
              {filterOptions.accents.map((a) => (
                <option key={a} value={a}>{formatLabel(a)}</option>
              ))}
            </select>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[100px]"
            >
              <option value="">{t('pro.gender')}</option>
              {filterOptions.genders.map((g) => (
                <option key={g} value={g}>{formatLabel(g)}</option>
              ))}
            </select>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[110px]"
            >
              <option value="">{t('pro.age')}</option>
              {filterOptions.ages.map((a) => (
                <option key={a} value={a}>{formatLabel(a)}</option>
              ))}
            </select>
          </div>

          {/* Voices table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr className="border-b border-border">
                    <th className="w-10 px-3 py-2.5"></th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('wizard.targeting.name')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.language')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.accent')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.gender')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.age')}</th>
                    <th className="w-12 px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {voicesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredVoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        {t('pro.no_voices')}
                      </td>
                    </tr>
                  ) : (
                    filteredVoices.map((voice) => {
                      const selected = voiceSettings.voiceId === voice.id;
                      return (
                        <tr
                          key={voice.id}
                          onClick={() => selectVoice(voice)}
                          className="cursor-pointer transition-colors hover:bg-accent/50 data-[selected]:bg-primary/5"
                          data-selected={selected ? '' : undefined}
                          style={selected ? { backgroundColor: 'hsl(var(--primary) / 0.05)' } : undefined}
                        >
                          <td className="px-3 py-2.5" onClick={(e) => { e.stopPropagation(); selectVoice(voice); }}>
                            <Checkbox checked={selected} tabIndex={-1} />
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground">{voice.name}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{voice.language?.toUpperCase() ?? '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{voice.accents?.join(', ') ?? '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{formatLabel(voice.gender)}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{formatLabel(voice.age)}</td>
                          <td className="px-3 py-2.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (playingId === voice.id) {
                                  setPlayingId(null);
                                  return;
                                }
                                const audio = new Audio(voice.audio_url);
                                audio.play();
                                setPlayingId(voice.id);
                                audio.onended = () => setPlayingId(null);
                              }}
                            >
                              {playingId === voice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      {/* Music */}
      <Section title={`${t('pro.music')}: ${selectedMusicName}`}>
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('wizard.targeting.search_placeholder')}
              value={musicSearchQuery}
              onChange={(e) => setMusicSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Filter dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[100px]"
            >
              <option value="">{t('pro.mood')}</option>
              {musicFilterOptions.moods.map((m) => (
                <option key={m} value={m}>{formatLabel(m)}</option>
              ))}
            </select>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[100px]"
            >
              <option value="">{t('pro.genre')}</option>
              {musicFilterOptions.genres.map((g) => (
                <option key={g} value={g}>{formatLabel(g)}</option>
              ))}
            </select>
            <select
              value={instrumentFilter}
              onChange={(e) => setInstrumentFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[110px]"
            >
              <option value="">{t('pro.instrument')}</option>
              {musicFilterOptions.instruments.map((i) => (
                <option key={i} value={i}>{formatLabel(i)}</option>
              ))}
            </select>
            <select
              value={rhythmFilter}
              onChange={(e) => setRhythmFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[100px]"
            >
              <option value="">{t('pro.rhythm')}</option>
              {musicFilterOptions.rhythms.map((r) => (
                <option key={r} value={r}>{formatLabel(r)}</option>
              ))}
            </select>
          </div>

          {/* Music table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr className="border-b border-border">
                    <th className="w-10 px-3 py-2.5"></th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('wizard.targeting.name')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.mood')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.genre')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.instrument')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('pro.rhythm')}</th>
                    <th className="w-12 px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {musicLoading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredMusic.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        {t('pro.no_music')}
                      </td>
                    </tr>
                  ) : (
                    filteredMusic.map((track) => {
                      const selected = musicSettings.musicId === track.id;
                      return (
                        <tr
                          key={track.id}
                          onClick={() => selectMusic(track)}
                          className="cursor-pointer transition-colors hover:bg-accent/50"
                          style={selected ? { backgroundColor: 'hsl(var(--primary) / 0.05)' } : undefined}
                        >
                          <td className="px-3 py-2.5" onClick={(e) => { e.stopPropagation(); selectMusic(track); }}>
                            <Checkbox checked={selected} tabIndex={-1} />
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground">{track.title}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{track.moods?.slice(0, 2).map(formatLabel).join(', ') ?? '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{track.genres?.slice(0, 2).map(formatLabel).join(', ') ?? '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{track.instruments?.slice(0, 2).map(formatLabel).join(', ') ?? '—'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{track.rhythms?.slice(0, 2).map(formatLabel).join(', ') ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (playingMusicId === track.id) {
                                  setPlayingMusicId(null);
                                  return;
                                }
                                const audio = new Audio(track.audio_url);
                                audio.play();
                                setPlayingMusicId(track.id);
                                audio.onended = () => setPlayingMusicId(null);
                              }}
                            >
                              {playingMusicId === track.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      {/* Content Settings */}
      <Section title={t('pro.content_settings')}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('pro.fade_in')}</Label>
              <p className="text-xs text-muted-foreground">{t('pro.fade_in_desc')}</p>
              <Input
                type="number"
                min={0}
                value={contentSettings.fadeInMs}
                onChange={(e) => updateContent('fadeInMs', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('pro.fade_out')}</Label>
              <p className="text-xs text-muted-foreground">{t('pro.fade_out_desc')}</p>
              <Input
                type="number"
                min={0}
                value={contentSettings.fadeOutMs}
                onChange={(e) => updateContent('fadeOutMs', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('pro.start_ms')}</Label>
              <Input
                type="number"
                min={0}
                value={contentSettings.startMs}
                onChange={(e) => updateContent('startMs', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('pro.end_ms')}</Label>
              <Input
                type="number"
                min={0}
                value={contentSettings.endMs}
                onChange={(e) => updateContent('endMs', parseInt(e.target.value) || 0)}
                placeholder="30000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t('pro.volume')}</Label>
              <span className="text-xs text-muted-foreground">{Math.round(contentSettings.volume * 100)}%</span>
            </div>
            <Slider
              value={[contentSettings.volume]}
              onValueChange={([v]) => updateContent('volume', v)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      </Section>

      {/* Tracking Pixel — after Content Settings */}
      <div className="space-y-2">
        <Label className="text-sm">{t('pro.tracking_pixel')}</Label>
        <Input
          value={trackingPixel}
          onChange={(e) => onTrackingPixelChange(e.target.value)}
          placeholder={t('pro.tracking_pixel_placeholder')}
          type="url"
        />
        <p className="text-xs text-muted-foreground">{t('pro.tracking_pixel_hint')}</p>
      </div>
    </div>
  );
}
