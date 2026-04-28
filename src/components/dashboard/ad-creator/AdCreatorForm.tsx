import { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  Loader2,
  Share2,
  RefreshCw,
  Search,
  MusicIcon,
} from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdStatusResponse, MusicTrack, Voice, Music } from "@/services/ads";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { GeneratedAd } from "@/types/landing";
import InlineAudioPlayer from "./InlineAudioPlayer";
// import { VOICES, LANGUAGES } from './voiceData';
// import { TRACKS, MUSIC_STYLE_TO_MOOD } from './musicData';
import ProCustomizations, {
  type ProVoiceSettings,
  type ProMusicSettings,
  type ProContentSettings,
} from "./ProCustomizations";
import { musicDefaults, voiceDefaults } from "@/lib/defaults";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface AdCreatorFormProps {
  type: "PROMPT" | "SCRIPT";
  age: string;
  onAgeChange: (v: string) => void;
  useCase: string;
  onUseCaseChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  goal: string;
  onGoalChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;

  musicMood: string;
  onMusicMoodChange: (v: string) => void;
  musicGenre: string;
  onMusicGenreChange: (v: string) => void;
  musicInstrument: string;
  onMusicInstrumentChange: (v: string) => void;
  musicRhythm: string;
  onMusicRhythmChange: (v: string) => void;
  musicUseCase: string;
  onMusicUseCaseChange: (v: string) => void;

  language: string;
  onLanguageChange: (v: string) => void;
  accent: string;
  onAccentChange: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generatedAd: AdStatusResponse | null;
  editedScript: string;
  onScriptChange: (s: string) => void;
  onSaved: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  isPro?: boolean;
  trackingPixel?: string;
  onTrackingPixelChange?: (v: string) => void;
  proVoiceSettings?: ProVoiceSettings;
  onProVoiceSettingsChange?: (v: ProVoiceSettings) => void;
  proMusicSettings?: ProMusicSettings;
  onProMusicSettingsChange?: (v: ProMusicSettings) => void;
  proContentSettings?: ProContentSettings;
  onProContentSettingsChange?: (v: ProContentSettings) => void;
  voices: Voice[];
  voicesLoading: boolean;
  voicesLoadingMore?: boolean;
  voicesHasMore?: boolean;
  onLoadMoreVoices?: () => void;
  musics: Music[];
  musicsLoading: boolean;
  musicsLoadingMore?: boolean;
  musicsHasMore?: boolean;
  onLoadMoreMusics?: () => void;
  gender: string;
  onGenderChange: (v: string) => void;
  handleSaveAd: (adName: string) => Promise<void>;
  selectedVoice: string;
  onSelectedVoiceChange: (v: string) => void;
  selectedMusic: string;
  onSelectedMusicChange: (v: string) => void;
  currentVoice: Voice | null;
  currentMusic: Music | null;
  onQueryChange: (q: string) => void;
  onMusicQueryChange: (q: string) => void;
}
const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ar", label: "Arabic" },
];

/* ── Language search popover ── */
function LanguageSearchSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      search.trim()
        ? LANGUAGES.filter((l) =>
            l.label.toLowerCase().includes(search.toLowerCase()),
          )
        : LANGUAGES,
    [search],
  );

  const selectedLabel = LANGUAGES.find((l) => l.id === value)?.label || value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10"
        >
          <span className="truncate">{selectedLabel}</span>
          <Search className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search languages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-[240px] overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No languages found
            </p>
          )}
          {filtered.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                onChange(lang.id);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left",
                value === lang.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground",
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const InlineVoice = ({
  voice,
  selectedVoice,
  onSelectedVoiceChange,
}: {
  voice: Voice | null;
  selectedVoice: string;
  onSelectedVoiceChange: (v: string) => void;
}) => {
  if (!voice) return null;
  return (
    <div
      key={voice.id}
      className="flex flex-row items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 mb-2"
    >
      <div className="flex flex-row items-center gap-2.5 w-full">
        <Checkbox
          id="voice-preview"
          checked={selectedVoice === voice.externalId}
          onCheckedChange={() => onSelectedVoiceChange(voice.externalId)}
        />
        <Avatar
          className="h-11 w-11 shrink-0 rounded-md"
          onClick={() => onSelectedVoiceChange(voice.id)}
        >
          <AvatarImage
            src={voice.imageUrl}
            alt={voice.name}
            className="object-cover"
          />
          <AvatarFallback className="text-[10px] font-medium bg-muted text-foreground">
            {voice.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-foreground">
                {voice.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate capitalize">
                {voice.gender}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {voice.accents &&
                voice.accents.length > 0 &&
                voice.accents
                  .filter((a, index) => index < 2)
                  .map((accent, index) => (
                    <span
                      key={accent}
                      className="text-[10px] text-muted-foreground truncate capitalize"
                    >
                      {accent} {index < 1 ? "·" : ""}
                    </span>
                  ))}
              {voice.characteristics &&
                voice.characteristics.length > 0 &&
                voice.characteristics
                  .filter((c, index) => index < 3)
                  .map((characteristic, index) => (
                    <span
                      key={characteristic}
                      className="text-[10px] text-muted-foreground truncate capitalize"
                    >
                      {characteristic} {index < 2 ? "·" : ""}
                    </span>
                  ))}
            </div>
          </div>
        </div>
      </div>
      <InlineAudioPlayer audioUrl={voice.audioUrl} />
    </div>
  );
};

/* ── Express voice preview list ── */
function ExpressVoicePreview({
  voices,
  selectedVoice,
  onSelectedVoiceChange,
  voicesLoading,
  voicesLoadingMore = false,
  voicesHasMore = false,
  onLoadMoreVoices,
  currentVoice,
  isPro = false,
}: {
  voices: Voice[];
  selectedVoice: string;
  onSelectedVoiceChange: (v: string) => void;
  voicesLoading: boolean;
  voicesLoadingMore?: boolean;
  voicesHasMore?: boolean;
  onLoadMoreVoices?: () => void;
  currentVoice: Voice | null;
  isPro: boolean;
}) {
  console.log("selectedVoice", selectedVoice);

  if (voicesLoading && voices.length === 0)
    return (
      <div className="space-y-1.5">
        <div className="space-y-1 w-full flex items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      </div>
    );

  if (voices.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPro) return;
    if (!voicesHasMore) return;
    if (!onLoadMoreVoices) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreVoices();
      },
      { root, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [isPro, onLoadMoreVoices, voicesHasMore]);

  return (
    <div className="space-y-1.5">
      {currentVoice && (
        <>
          <Label className="text-xs text-muted-foreground">Current voice</Label>
          <InlineVoice
            voice={currentVoice}
            selectedVoice={selectedVoice}
            onSelectedVoiceChange={onSelectedVoiceChange}
          />
        </>
      )}

      <Label className="text-xs text-muted-foreground">Voices</Label>
      <div
        ref={scrollRef}
        className={`space-y-1 ${isPro ? "max-h-[250px] overflow-y-auto" : ""}`}
      >
        {voices &&
          voices.length > 0 &&
          voices.map((voice) => (
            <InlineVoice
              voice={voice}
              selectedVoice={selectedVoice}
              onSelectedVoiceChange={onSelectedVoiceChange}
            />
          ))}
        {isPro && (
          <div className="py-2 flex items-center justify-center">
            {voicesLoadingMore ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading more…
              </div>
            ) : voicesHasMore ? (
              <div ref={sentinelRef} className="h-1 w-full" />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Express music preview ── */
function ExpressMusicPreview({
  tracks,
  musicsLoading,
  musicsLoadingMore = false,
  musicsHasMore = false,
  onLoadMoreMusics,
  selectedMusic,
  onSelectedMusicChange,
  currentMusic,
}: {
  tracks: Music[];
  musicsLoading: boolean;
  musicsLoadingMore?: boolean;
  musicsHasMore?: boolean;
  onLoadMoreMusics?: () => void;
  selectedMusic: string;
  onSelectedMusicChange: (v: string) => void;
  currentMusic: Music | null;
}) {
  console.log("tracks", tracks);

  if (musicsLoading && tracks.length === 0)
    return (
      <div className="space-y-1.5">
        <div className="space-y-1 w-full flex items-center justify-center">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      </div>
    );
  if (!tracks || tracks.length === 0) return null;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!musicsHasMore) return;
    if (!onLoadMoreMusics) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreMusics();
      },
      { root, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [musicsHasMore, onLoadMoreMusics]);

  return (
    <div ref={scrollRef} className="">
      {currentMusic && (
        <>
          <Label className="text-xs text-muted-foreground">Current music</Label>
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 mt-1.5">
            <Checkbox
              id="music-preview"
              checked={selectedMusic === currentMusic.externalId}
              onCheckedChange={() =>
                onSelectedMusicChange(currentMusic.externalId)
              }
            />
            <div className="h-7 w-7 shrink-0 rounded-md bg-muted flex items-center justify-center">
              <MusicIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground">
                {currentMusic.title}
              </span>
              <p className="text-[10px] text-muted-foreground truncate">
                {currentMusic.genres.join(", ")}
              </p>
            </div>
            <InlineAudioPlayer audioUrl={currentMusic.audioUrl} />
          </div>
        </>
      )}
      <Label className="text-xs text-muted-foreground">Music</Label>
      <div className="max-h-[250px] overflow-y-auto">
        {tracks &&
          tracks.length > 0 &&
          tracks.map((track) => (
            <>
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 mt-1.5">
                <Checkbox
                  id="music-preview"
                  checked={selectedMusic === track.externalId}
                  onCheckedChange={() =>
                    onSelectedMusicChange(track.externalId)
                  }
                />
                <div className="h-7 w-7 shrink-0 rounded-md bg-muted flex items-center justify-center">
                  <MusicIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground">
                    {track.title}
                  </span>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {track.genres.join(", ")}
                  </p>
                </div>
                <InlineAudioPlayer audioUrl={track.audioUrl} />
              </div>
            </>
          ))}
      </div>
      <div className="py-2 flex items-center justify-center">
        {musicsLoadingMore ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading more…
          </div>
        ) : musicsHasMore ? (
          <div ref={sentinelRef} className="h-1 w-full" />
        ) : null}
      </div>
    </div>
  );
}

const goalPlaceholders: Record<string, string> = {
  sales:
    "Share what makes your brand unique, who it's for, and the call-to-action you'd like listeners to take after hearing the ad.\n\nFor example, https://luigispizza.com -- Family pizza restaurant in Dubai Marina. 20% off first online order. Promote our new seafood menu.",
  leads:
    "Share what makes your brand unique, who it's for, and the call-to-action you'd like listeners to take after hearing the ad.\n\nFor example, https://acmerealestate.com/listings -- Premium villas in Palm Jumeirah. Free property valuation for new enquiries. Target investors.",
  traffic:
    "Share what makes your brand unique, who it's for, and the call-to-action you'd like listeners to take after hearing the ad.\n\nFor example, https://myblog.com/latest -- Tech review blog covering latest gadgets. Drive readers to our new AI tools comparison article.",
  consideration:
    "Share what makes your brand unique, who it's for, and the call-to-action you'd like listeners to take after hearing the ad.\n\nFor example, https://brandx.com/product-page -- Launching a new organic skincare line. Highlight dermatologist-approved ingredients and 5-star reviews.",
  awareness:
    "Share what makes your brand unique, who it's for, and the call-to-action you'd like listeners to take after hearing the ad.\n\nFor example, https://newbrand.ae -- We're a new sustainable fashion label in the UAE. Build recognition among 25-40 year old professionals.",
  app: "Share what makes your brand unique, who it's for, and the call-to-action you'd like listeners to take after hearing the ad.\n\nFor example, https://apps.apple.com/myapp -- Fitness tracking app with AI coaching. Free 30-day trial. Available on iOS and Android.",
  local:
    "Share what makes your brand unique, who it's for, and the call-to-action you'd like listeners to take after hearing the ad.\n\nFor example, https://maps.google.com/myshop -- Boutique coffee shop in JLT. Grand opening weekend, free pastry with every coffee. Walk-ins welcome.",
};
/* ── Express customization block (language + accent + tone + music with previews) ── */
function ExpressCustomization({
  age,
  onAgeChange,
  useCase,
  onUseCaseChange,
  gender,
  onGenderChange,
  language,
  onLanguageChange,
  accent,
  onAccentChange,
  tone,
  onToneChange,

  voices,
  musics,
  selectedVoice,
  onSelectedVoiceChange,
  selectedMusic,
  onSelectedMusicChange,
  voicesLoading,
  voicesLoadingMore,
  voicesHasMore,
  onLoadMoreVoices,
  musicsLoading,
  musicsLoadingMore,
  musicsHasMore,
  onLoadMoreMusics,
  currentVoice,
  currentMusic,
  isPro = false,
  onQueryChange,
  onMusicQueryChange,

  musicMood,
  onMusicMoodChange,
  musicGenre,
  onMusicGenreChange,
  musicInstrument,
  onMusicInstrumentChange,
  musicRhythm,
  onMusicRhythmChange,
  musicUseCase,
  onMusicUseCaseChange,
}: {
  age: string;
  onAgeChange: (v: string) => void;
  useCase: string;
  onUseCaseChange: (v: string) => void;
  gender: string;
  onGenderChange: (v: string) => void;
  language: string;
  onLanguageChange: (v: string) => void;
  accent: string;
  onAccentChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;
  voices: Voice[];
  musics: Music[];
  selectedVoice: string;
  onSelectedVoiceChange: (v: string) => void;
  selectedMusic: string;
  onSelectedMusicChange: (v: string) => void;
  voicesLoading: boolean;
  voicesLoadingMore?: boolean;
  voicesHasMore?: boolean;
  onLoadMoreVoices?: () => void;
  musicsLoading: boolean;
  musicsLoadingMore?: boolean;
  musicsHasMore?: boolean;
  onLoadMoreMusics?: () => void;
  currentVoice: Voice | null;
  currentMusic: Music | null;
  isPro: boolean;
  onQueryChange: (q: string) => void;
  onMusicQueryChange: (q: string) => void;
  musicMood: string;
  onMusicMoodChange: (v: string) => void;
  musicGenre: string;
  onMusicGenreChange: (v: string) => void;
  musicInstrument: string;
  onMusicInstrumentChange: (v: string) => void;
  musicRhythm: string;
  onMusicRhythmChange: (v: string) => void;
  musicUseCase: string;
  onMusicUseCaseChange: (v: string) => void;
}) {
  const availableAccents = voiceDefaults.accents;
  const availableTones = voiceDefaults.characteristics;
  const availableGenders = voiceDefaults.gender;
  const availableAges = voiceDefaults.age;
  const availableUseCases = voiceDefaults.use_case;

  const availableMusicGenre = musicDefaults.genre;
  const availableMusicInstrument = musicDefaults.instrument;
  const availableMusicRhythm = musicDefaults.rhythm;
  const availableMusicMoods = musicDefaults.mood;
  const availableMusicUseCase = musicDefaults.use_case;

  const [query, setQuery] = useState("");
  const [musicQuery, setMusicQuery] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      onQueryChange(query);
    }, 400);

    return () => window.clearTimeout(t);
  }, [query, onQueryChange]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      onMusicQueryChange(musicQuery);
    }, 400);

    return () => window.clearTimeout(t);
  }, [musicQuery, onMusicQueryChange]);

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Customization</Label>
      <div className="space-y-2">
        {isPro && (
          <div
            className={`space-y-2 col-span-1 ${isPro ? "md:col-span-6" : "md:col-span-4"}`}
          >
            <Input
              type="text"
              placeholder="Search for a voice"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      <div
        className={`flex flex-row max-h-[80px] overflow-x-auto md:overflow-x-hidden md:grid grid-cols-1 ${isPro ? "md:grid-cols-6" : "md:grid-cols-4"} gap-4 p-1`}
      >
        <div className="space-y-2">
          <Label className="text-sm">Gender</Label>
          <Select value={gender} onValueChange={onGenderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a gender" />
            </SelectTrigger>
            <SelectContent>
              {availableGenders.map((g) => (
                <SelectItem key={g} value={g}>
                  <span className="capitalize">{g}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Language</Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  <span className="capitalize">{l.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Accent</Label>
          <Select value={accent} onValueChange={onAccentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an accent" />
            </SelectTrigger>
            <SelectContent>
              {availableAccents.map((a) => (
                <SelectItem key={a} value={a}>
                  <span className="capitalize">{a}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Tone</Label>
          <Select value={tone} onValueChange={onToneChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tone" />
            </SelectTrigger>
            <SelectContent>
              {availableTones.map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="capitalize">{t}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPro && (
          <div className="space-y-2">
            <Label className="text-sm">Age</Label>
            <Select value={age} onValueChange={onAgeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {availableAges.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="capitalize">{t}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isPro && (
          <div className="space-y-2">
            <Label className="text-sm">Use Case</Label>
            <Select value={useCase} onValueChange={onUseCaseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a use case" />
              </SelectTrigger>
              <SelectContent>
                {availableUseCases.map((t) => (
                  <SelectItem key={t} value={t}>
                    <span className="capitalize">{t}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Voice preview */}
      <ExpressVoicePreview
        currentVoice={currentVoice}
        voicesLoading={voicesLoading}
        voicesLoadingMore={voicesLoadingMore}
        voicesHasMore={voicesHasMore}
        onLoadMoreVoices={onLoadMoreVoices}
        voices={voices}
        selectedVoice={selectedVoice}
        onSelectedVoiceChange={onSelectedVoiceChange}
        isPro={isPro || false}
      />

      {/* Music */}
      <div className="space-y-2 mt-15">
        <Label className="text-sm">Music</Label>
        <div className="space-y-2">
          {isPro && (
            <div
              className={`space-y-2 col-span-1 ${isPro ? "md:col-span-6" : "md:col-span-4"}`}
            >
              <Input
                type="text"
                placeholder="Search for a music"
                value={musicQuery}
                onChange={(e) => setMusicQuery(e.target.value)}
              />
            </div>
          )}
        </div>
        <div
          className={`flex flex-row max-h-[80px] md:max-h-[100px] overflow-x-auto md:overflow-x-hidden p-1 gap-4`}
        >
          <div className="space-y-2">
            <Label className="text-sm">Moods</Label>
            <Select value={musicMood} onValueChange={onMusicMoodChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMusicMoods.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className="capitalize">{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Genres</Label>
            <Select value={musicGenre} onValueChange={onMusicGenreChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                {availableMusicGenre.map((g) => (
                  <SelectItem key={g} value={g}>
                    <span className="capitalize">{g}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Instruments</Label>
            <Select
              value={musicInstrument}
              onValueChange={onMusicInstrumentChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an instrument" />
              </SelectTrigger>
              <SelectContent>
                {availableMusicInstrument.map((i) => (
                  <SelectItem key={i} value={i}>
                    <span className="capitalize">{i}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Rhythms</Label>
            <Select value={musicRhythm} onValueChange={onMusicRhythmChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rhythm" />
              </SelectTrigger>
              <SelectContent>
                {availableMusicRhythm.map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className="capitalize">{r}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Use Cases</Label>
            <Select value={musicUseCase} onValueChange={onMusicUseCaseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a use case" />
              </SelectTrigger>
              <SelectContent>
                {availableMusicUseCase.map((u) => (
                  <SelectItem key={u} value={u}>
                    <span className="capitalize">{u}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ExpressMusicPreview
        tracks={musics}
        selectedMusic={selectedMusic}
        onSelectedMusicChange={onSelectedMusicChange}
        musicsLoading={musicsLoading}
        musicsLoadingMore={musicsLoadingMore}
        musicsHasMore={musicsHasMore}
        onLoadMoreMusics={onLoadMoreMusics}
        currentMusic={currentMusic}
      />
    </div>
  );
}

function ProCustomization({
 contentSettings,
 onContentSettingsChange,
 trackingPixel,
 onTrackingPixelChange
}: {
  contentSettings: ProContentSettings;
  onContentSettingsChange: (v: ProContentSettings) => void;
  trackingPixel: string;
  onTrackingPixelChange: (v: string) => void;
}) {
  const updateContent = (key: keyof ProContentSettings, value: boolean | number) =>
    onContentSettingsChange({ ...contentSettings, [key]: value });
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Content Settings</Label>

      {/* Content Settings */}
      <section title="Content Settings">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Fade In</Label>
              <p className="text-xs text-muted-foreground">Gradually increase volume at start</p>
            </div>
            <Switch checked={contentSettings.fadeIn} onCheckedChange={(v) => updateContent('fadeIn', v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Fade Out</Label>
              <p className="text-xs text-muted-foreground">Gradually decrease volume at end</p>
            </div>
            <Switch checked={contentSettings.fadeOut} onCheckedChange={(v) => updateContent('fadeOut', v)} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Start (ms)</Label>
              <Input
                type="number"
                min={0}
                value={contentSettings.startMs}
                onChange={(e) => updateContent('startMs', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">End (ms)</Label>
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
              <Label className="text-sm">Volume</Label>
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
      </section>

      {/* Tracking Pixel — after Content Settings */}
      <div className="space-y-2">
        <Label className="text-sm">Tracking Pixel URL</Label>
        <Input
          value={trackingPixel}
          onChange={(e) => onTrackingPixelChange(e.target.value)}
          placeholder="https://tracking.example.com/pixel?id=..."
          type="url"
        />
        <p className="text-xs text-muted-foreground">Add a third-party tracking pixel to measure ad impressions.</p>
      </div>
    </div>
  );
}

export default function AdCreatorForm({
  type,
  age,
  onAgeChange,
  useCase,
  onUseCaseChange,
  description,
  onDescriptionChange,
  goal,
  onGoalChange,
  tone,
  onToneChange,

  musicMood,
  onMusicMoodChange,
  musicGenre,
  onMusicGenreChange,
  musicInstrument,
  onMusicInstrumentChange,
  musicRhythm,
  onMusicRhythmChange,
  musicUseCase,
  onMusicUseCaseChange,

  language,
  onLanguageChange,
  accent,
  onAccentChange,
  onGenerate,
  isGenerating,
  generatedAd,
  editedScript,
  onScriptChange,
  onSaved,
  onRegenerate,
  isRegenerating,
  isPro,
  trackingPixel,
  onTrackingPixelChange,
  proVoiceSettings,
  onProVoiceSettingsChange,
  proMusicSettings,
  onProMusicSettingsChange,
  proContentSettings,
  onProContentSettingsChange,
  voices,
  musics,
  gender,
  onGenderChange,
  selectedVoice,
  onSelectedVoiceChange,
  voicesLoading,
  voicesLoadingMore,
  voicesHasMore,
  onLoadMoreVoices,
  musicsLoading,
  musicsLoadingMore,
  musicsHasMore,
  onLoadMoreMusics,
  handleSaveAd,
  selectedMusic,
  onSelectedMusicChange,
  currentVoice,
  currentMusic,
  onQueryChange,
  onMusicQueryChange,
}: AdCreatorFormProps) {
  const { t } = useTranslation();
  const canSubmit = description?.trim().length > 0;
  const hasAd = generatedAd !== null;

  // Review state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scriptDirty, setScriptDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [adName, setAdName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  // Reset dirty flag when a new ad is generated
  useEffect(() => {
    if (generatedAd) {
      setScriptDirty(false);
      setAdName("My Audio Ad");
    }
  }, [generatedAd]);

  // Scroll to review section when ad is generated
  useEffect(() => {
    if (hasAd && reviewRef.current) {
      setTimeout(() => {
        const el = reviewRef.current;
        if (!el) return;
        const scrollParent = el.closest("main") || window;
        if (scrollParent instanceof HTMLElement) {
          const parentRect = scrollParent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          scrollParent.scrollTo({
            top: scrollParent.scrollTop + elRect.top - parentRect.top - 16,
            behavior: "smooth",
          });
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [hasAd]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () =>
      setProgress((audio.currentTime / audio.duration) * 100);
    const onEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [hasAd]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const bars = Array.from({ length: 40 }, (_, i) => ({
    height: 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20,
  }));

  const handleScriptChange = (value: string) => {
    onScriptChange(value);
    setScriptDirty(value !== generatedAd?.script);
  };

  const handleCopyLink = () => {
    if (generatedAd?.url) {
      navigator.clipboard.writeText(generatedAd.url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await handleSaveAd(adName);
      setShowSaveModal(false);
      onSaved();
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: t("ad_creator.save_failed"),
        description: t("ad_creator.could_not_save"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Generate Section (hidden after ad is created) ── */}
      {!hasAd && (
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">
            What are you advertising?
          </h3>
          <p className="text-sm text-muted-foreground">
            Tell us about your business and we'll create a script for you.
          </p>
        </div>
      )}

      {!hasAd && (
        <>
          {type === "PROMPT" && (
            <div className="space-y-2">
              <Label>{t("ad_creator.campaign_goal")}</Label>
              <Select value={goal} onValueChange={onGoalChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">
                    {t("ad_creator.goal_sales")}
                  </SelectItem>
                  <SelectItem value="leads">
                    {t("ad_creator.goal_leads")}
                  </SelectItem>
                  <SelectItem value="traffic">
                    {t("ad_creator.goal_traffic")}
                  </SelectItem>
                  <SelectItem value="consideration">
                    {t("ad_creator.goal_consideration")}
                  </SelectItem>
                  <SelectItem value="awareness">
                    {t("ad_creator.goal_awareness")}
                  </SelectItem>
                  <SelectItem value="app">
                    {t("ad_creator.goal_app")}
                  </SelectItem>
                  <SelectItem value="local">
                    {t("ad_creator.goal_local")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {type === "PROMPT"
                ? t("ad_creator.tell_business")
                : t("ad_creator.ad_script")}
            </Label>
            <Textarea
              placeholder={
                type === "PROMPT"
                  ? goalPlaceholders[goal] || "Tell us about your business..."
                  : "Your ad script will appear here..."
              }
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={5}
              maxLength={500}
            />
            <div className="w-full flex items-center justify-end">
              <span
                className={`text-xs ${description.length >= 500 ? "text-destructive" : " text-muted-foreground "}`}
              >
                {description.length || 0}/{500} characters
              </span>
            </div>
          </div>

          <ExpressCustomization
            onQueryChange={onQueryChange}
            onMusicQueryChange={onMusicQueryChange}
            age={age}
            onAgeChange={onAgeChange}
            useCase={useCase}
            onUseCaseChange={onUseCaseChange}
            isPro={isPro || false}
            currentVoice={currentVoice}
            currentMusic={currentMusic}
            selectedMusic={selectedMusic}
            onSelectedMusicChange={onSelectedMusicChange}
            gender={gender}
            onGenderChange={onGenderChange}
            language={language}
            onLanguageChange={onLanguageChange}
            accent={accent}
            onAccentChange={onAccentChange}
            tone={tone}
            onToneChange={onToneChange}
            musicMood={musicMood}
            onMusicMoodChange={onMusicMoodChange}
            musicGenre={musicGenre}
            onMusicGenreChange={onMusicGenreChange}
            musicInstrument={musicInstrument}
            onMusicInstrumentChange={onMusicInstrumentChange}
            musicRhythm={musicRhythm}
            onMusicRhythmChange={onMusicRhythmChange}
            musicUseCase={musicUseCase}
            onMusicUseCaseChange={onMusicUseCaseChange}
            voices={voices}
            musics={musics}
            selectedVoice={selectedVoice}
            onSelectedVoiceChange={onSelectedVoiceChange}
            voicesLoading={voicesLoading}
            voicesLoadingMore={voicesLoadingMore}
            voicesHasMore={voicesHasMore}
            onLoadMoreVoices={onLoadMoreVoices}
            musicsLoading={musicsLoading}
            musicsLoadingMore={musicsLoadingMore}
            musicsHasMore={musicsHasMore}
            onLoadMoreMusics={onLoadMoreMusics}
          />

          {
            isPro && (
              <ProCustomization
                contentSettings={proContentSettings}
                onContentSettingsChange={onProContentSettingsChange}
                trackingPixel={trackingPixel}
                onTrackingPixelChange={onTrackingPixelChange}
              />
            )
          }

          <Button
            className="w-full h-12"
            onClick={onGenerate}
            disabled={!canSubmit || !selectedVoice || !selectedMusic || isGenerating}
          >
            {t("ad_creator.generate_ad")}
          </Button>
        </>
      )}

      {/* ── Review Section (visible after generation) ── */}
      <div
        ref={reviewRef}
        className={`transition-all duration-500 ease-out ${hasAd ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden"}`}
      >
        {hasAd && generatedAd && (
          <>
            {/* Script */}
            <div className="space-y-3 mb-6">
              <Label className="text-base font-semibold">
                {t("ad_creator.ad_script")}
              </Label>
              <Textarea
                value={editedScript}
                onChange={(e) => handleScriptChange(e.target.value)}
                rows={5}
                className="text-sm cursor-text"
                placeholder="Your ad script will appear here..."
                maxLength={500}
              />
              <div className="w-full flex items-center justify-end">
                <span
                  className={`text-xs ${editedScript.length >= 500 ? "text-destructive" : " text-muted-foreground "}`}
                >
                  {editedScript.length || 0}/{500} characters
                </span>
              </div>
            </div>

            {/* Customization options — always visible after generation */}
            <div className="space-y-4 mb-6">
              <ExpressCustomization
                age={age}
                onAgeChange={onAgeChange}
                useCase={useCase}
                onUseCaseChange={onUseCaseChange}
                onQueryChange={onQueryChange}
                isPro={isPro || false}
                selectedMusic={selectedMusic}
                onSelectedMusicChange={onSelectedMusicChange}
                currentVoice={currentVoice}
                currentMusic={currentMusic}
                voices={voices}
                musics={musics}
                selectedVoice={selectedVoice}
                onSelectedVoiceChange={onSelectedVoiceChange}
                gender={gender}
                onGenderChange={onGenderChange}
                language={language}
                onLanguageChange={onLanguageChange}
                accent={accent}
                onAccentChange={onAccentChange}
                tone={tone}
                onToneChange={onToneChange}
                voicesLoading={voicesLoading}
                musicsLoading={musicsLoading}
                musicMood={musicMood}
                onMusicMoodChange={onMusicMoodChange}
                musicGenre={musicGenre}
                onMusicGenreChange={onMusicGenreChange}
                musicInstrument={musicInstrument}
                onMusicInstrumentChange={onMusicInstrumentChange}
                musicRhythm={musicRhythm}
                onMusicRhythmChange={onMusicRhythmChange}
                musicUseCase={musicUseCase}
                onMusicUseCaseChange={onMusicUseCaseChange}
                onMusicQueryChange={onMusicQueryChange}
              />

              {
                isPro && (
                  <ProCustomization contentSettings={proContentSettings} onContentSettingsChange={onProContentSettingsChange} trackingPixel={trackingPixel} onTrackingPixelChange={onTrackingPixelChange} />
                )
              }
            </div>

            <audio ref={audioRef} src={generatedAd.url} preload="auto" />

            {/* Audio Player */}
            <div className="rounded-2xl border bg-card p-5 mb-6 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  Your Ad
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Share it or edit the ad to change the script or the voice
                  talent.
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
                <Button
                  size="icon"
                  variant="dark"
                  className="rounded-full w-10 h-10 shrink-0"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
                <div className="flex items-center gap-px h-10 flex-1 min-w-0">
                  {bars.map((bar, i) => {
                    const isActive = (i / bars.length) * 100 <= progress;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-150 ${isActive ? "bg-[#0f1729]" : "bg-[#0f1729]/30"}`}
                        style={{ height: `${bar.height}%` }}
                      />
                    );
                  })}
                </div>
                <span className="text-sm text-primary font-medium shrink-0 tabular-nums">
                  {Math.floor(audioRef.current?.duration || 0 / 60)}s
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={onRegenerate}
                disabled={!scriptDirty || isRegenerating}
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Audio Ad
                  </>
                )}
              </Button>
              <Button
                className="flex-1 h-12"
                onClick={() => setShowSaveModal(true)}
              >
                Save Ad
              </Button>
            </div>

            {/* Save Confirmation Modal */}
            <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Save your ad</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Ad Name</Label>
                    <Input
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                      placeholder={t("ad_creator.ad_name_placeholder")}
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmSave}
                    disabled={isSaving || !adName.trim()}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
