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

interface AdCreatorFormProps {
  description: string;
  onDescriptionChange: (v: string) => void;
  goal: string;
  onGoalChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;
  music: string;
  onMusicChange: (v: string) => void;
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
  musics: Music[];
  getMusics: (mood: string) => void;
  musicsLoading: boolean;
  gender: string;
  onGenderChange: (v: string) => void;
  handleSaveAd: (adName: string) => Promise<void>;
  selectedVoice: string;
  onSelectedVoiceChange: (v: string) => void;
  selectedMusic: string;
  onSelectedMusicChange: (v: string) => void;
  currentVoice: Voice | null;
  currentMusic: Music | null;
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

/* ── Express voice preview list ── */
function ExpressVoicePreview({
  voices,
  selectedVoice,
  onSelectedVoiceChange,
  voicesLoading,
  currentVoice,
}: {
  voices: Voice[];
  selectedVoice: string;
  onSelectedVoiceChange: (v: string) => void;
  voicesLoading: boolean;
  currentVoice: Voice | null;
}) {
  console.log("selectedVoice", selectedVoice);

  if (voicesLoading)
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

  return (
    <div className="space-y-1.5">
      {currentVoice && (
        <>
          <Label className="text-xs text-muted-foreground">Current voice</Label>
          <div
            key={currentVoice.id}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30"
          >
            <Checkbox
              id="voice-preview"
              checked={selectedVoice === currentVoice.externalId}
              onCheckedChange={() =>
                onSelectedVoiceChange(currentVoice.externalId)
              }
            />
            <Avatar
              className="h-7 w-7 shrink-0"
              onClick={() => onSelectedVoiceChange(currentVoice.id)}
            >
              <AvatarImage
                src={currentVoice.imageUrl}
                alt={currentVoice.name}
                className="object-cover"
              />
              <AvatarFallback className="text-[10px] font-medium bg-muted text-foreground">
                {currentVoice.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-foreground">
                    {currentVoice.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-3.5 capitalize font-normal"
                  >
                    {currentVoice.gender}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 overflow-x-scroll md:overflow-x-hidden max-w-[100px] md:max-w-full">
                  {currentVoice.accents &&
                    currentVoice.accents.length > 0 &&
                    currentVoice.accents.map((accent) => (
                      <Badge
                        key={accent}
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-3.5 capitalize font-normal whitespace-nowrap"
                      >
                        {accent}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
            <InlineAudioPlayer audioUrl={currentVoice.audioUrl} />
          </div>
        </>
      )}

      <Label className="text-xs text-muted-foreground">Matching voices</Label>
      <div className="space-y-1">
        {voices.map((voice) => (
          <div
            key={voice.id}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30"
          >
            <Checkbox
              id="voice-preview"
              checked={selectedVoice === voice.externalId}
              onCheckedChange={() => onSelectedVoiceChange(voice.externalId)}
            />
            <Avatar
              className="h-7 w-7 shrink-0"
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
              <div className="flex flex-col md:flex-row items-center gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-foreground">
                    {voice.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 h-3.5 capitalize font-normal"
                  >
                    {voice.gender}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 overflow-x-scroll md:overflow-x-hidden max-w-[100px] md:max-w-full">
                  {voice.accents &&
                    voice.accents.length > 0 &&
                    voice.accents.map((accent) => (
                      <Badge
                        key={accent}
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-3.5 capitalize font-normal whitespace-nowrap"
                      >
                        {accent}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
            <InlineAudioPlayer audioUrl={voice.audioUrl} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Express music preview ── */
function ExpressMusicPreview({
  tracks,
  musicsLoading,
  selectedMusic,
  onSelectedMusicChange,
  currentMusic,
}: {
  tracks: Music[];
  musicsLoading: boolean;
  selectedMusic: string;
  onSelectedMusicChange: (v: string) => void;
  currentMusic: Music | null;
}) {
  console.log("tracks", tracks);

  if (musicsLoading)
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

  return (
    <div>
      {currentMusic && (
        <>
          <Label className="text-xs text-muted-foreground">Current music</Label>
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 mt-1.5">
            <Checkbox
              id="music-preview"
              checked={selectedMusic === currentMusic.externalId}
              onCheckedChange={() => onSelectedMusicChange(currentMusic.externalId)}
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
            <Label className="text-xs text-muted-foreground">
              Matching music
            </Label>
      {tracks &&
        tracks.length > 0 &&
        tracks.map((track) => (
          <>
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 mt-1.5">
            <Checkbox
              id="music-preview"
              checked={selectedMusic === track.externalId}
              onCheckedChange={() => onSelectedMusicChange(track.externalId)}
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
  gender,
  onGenderChange,
  language,
  onLanguageChange,
  accent,
  onAccentChange,
  tone,
  onToneChange,
  music,
  onMusicChange,
  voices,
  musics,
  selectedVoice,
  onSelectedVoiceChange,
  selectedMusic,
  onSelectedMusicChange,
  voicesLoading,
  musicsLoading,
  currentVoice,
  currentMusic,
  isPro = false
}: {
  gender: string;
  onGenderChange: (v: string) => void;
  language: string;
  onLanguageChange: (v: string) => void;
  accent: string;
  onAccentChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;
  music: string;
  onMusicChange: (v: string) => void;
  voices: Voice[];
  musics: Music[];
  selectedVoice: string;
  onSelectedVoiceChange: (v: string) => void;
  selectedMusic: string;
  onSelectedMusicChange: (v: string) => void;
  voicesLoading: boolean;
  musicsLoading: boolean;
  currentVoice: Voice | null;
  currentMusic: Music | null;
  isPro: boolean;
}) {
  const availableAccents = voiceDefaults.accents;
  const availableTones = voiceDefaults.characteristics;
  const availableMusics = musicDefaults.mood;
  const availableGenders = voiceDefaults.gender;

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Customization</Label>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
      </div>

      {/* Voice preview */}
      <ExpressVoicePreview
        currentVoice={currentVoice}
        voicesLoading={voicesLoading}
        voices={voices}
        selectedVoice={selectedVoice}
        onSelectedVoiceChange={onSelectedVoiceChange}
      />

      {/* Music */}
      <div className="space-y-2">
        <Label className="text-sm">Music</Label>
        <Select
          value={music || availableMusics[0]}
          onValueChange={onMusicChange}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMusics.map((m) => (
              <SelectItem key={m} value={m}>
                <span className="capitalize">{m}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {music !== "none" && (
          <ExpressMusicPreview
            tracks={musics}
            selectedMusic={selectedMusic}
            onSelectedMusicChange={onSelectedMusicChange}
            musicsLoading={musicsLoading}
            currentMusic={currentMusic}
          />
        )}
      </div>
    </div>
  );
}

export default function AdCreatorForm({
  description,
  onDescriptionChange,
  goal,
  onGoalChange,
  tone,
  onToneChange,
  music,
  onMusicChange,
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
  musicsLoading,
  handleSaveAd,
  selectedMusic,
  onSelectedMusicChange,
  currentVoice,
  currentMusic,
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
                <SelectItem value="app">{t("ad_creator.goal_app")}</SelectItem>
                <SelectItem value="local">
                  {t("ad_creator.goal_local")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("ad_creator.tell_business")}</Label>
            <Textarea
              placeholder={
                goalPlaceholders[goal] || "Tell us about your business..."
              }
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={5}
            />
          </div>

          {/* Customization: Express = simple dropdowns, Pro = full ProCustomizations */}
          {isPro &&
          proVoiceSettings &&
          proMusicSettings &&
          proContentSettings &&
          onTrackingPixelChange &&
          onProVoiceSettingsChange &&
          onProMusicSettingsChange &&
          onProContentSettingsChange ? (
            <ExpressCustomization
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
              music={music}
              onMusicChange={onMusicChange}
              voices={voices}
              musics={musics}
              selectedVoice={selectedVoice}
              onSelectedVoiceChange={onSelectedVoiceChange}
              voicesLoading={voicesLoading}
              musicsLoading={musicsLoading}
              isPro={false}
            />
          ) : (
            // <ProCustomizations
            //   trackingPixel={trackingPixel || ""}
            //   onTrackingPixelChange={onTrackingPixelChange}
            //   voiceSettings={proVoiceSettings}
            //   onVoiceSettingsChange={onProVoiceSettingsChange}
            //   musicSettings={proMusicSettings}
            //   onMusicSettingsChange={onProMusicSettingsChange}
            //   contentSettings={proContentSettings}
            //   onContentSettingsChange={onProContentSettingsChange}
            // />
            <ExpressCustomization
              isPro={false}
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
              music={music}
              onMusicChange={onMusicChange}
              voices={voices}
              musics={musics}
              selectedVoice={selectedVoice}
              onSelectedVoiceChange={onSelectedVoiceChange}
              voicesLoading={voicesLoading}
              musicsLoading={musicsLoading}
            />
          )}

          <Button
            className="w-full h-12"
            onClick={onGenerate}
            disabled={!canSubmit || !selectedVoice || isGenerating}
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
            <Separator className="mb-6" />
            <audio ref={audioRef} src={generatedAd.url} preload="auto" />

            {/* Audio Player */}
            <div className="rounded-2xl border bg-card p-5 mb-6 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {/* {generatedAd.brandName} */}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Share it or edit the ad to change the script or the voice
                  talent.
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
                <Button
                  size="icon"
                  className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90"
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
                        className={`flex-1 rounded-full transition-all duration-150 ${isActive ? "bg-primary" : "bg-primary/30"}`}
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
              />
            </div>

            {/* Customization options — always visible after generation */}
            <div className="space-y-4 mb-6">
              {isPro &&
              proVoiceSettings &&
              proMusicSettings &&
              proContentSettings &&
              onTrackingPixelChange &&
              onProVoiceSettingsChange &&
              onProMusicSettingsChange &&
              onProContentSettingsChange ? (
                <ProCustomizations
                  trackingPixel={trackingPixel || ""}
                  onTrackingPixelChange={onTrackingPixelChange}
                  voiceSettings={proVoiceSettings}
                  onVoiceSettingsChange={onProVoiceSettingsChange}
                  musicSettings={proMusicSettings}
                  onMusicSettingsChange={onProMusicSettingsChange}
                  contentSettings={proContentSettings}
                  onContentSettingsChange={onProContentSettingsChange}
                />
              ) : (
                <ExpressCustomization
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
                  music={music}
                  onMusicChange={onMusicChange}
                  voicesLoading={voicesLoading}
                  musicsLoading={musicsLoading}
                />
              )}
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
