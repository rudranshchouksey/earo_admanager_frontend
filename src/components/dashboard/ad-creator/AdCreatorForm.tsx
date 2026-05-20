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
import { MyTooltip } from "@/components/ui/MyTooltip";

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
  isEditing: boolean
}
const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "ar", label: "Arabic" },
];



const campaignGoalTooltip = `<div class="p-2">
Choose the primary outcome you want this ad to drive. The goal shapes the AI's script tone and the platform's default conversion tracking settings.
<br />
<br />
<b>Sales</b><br />
Drive listeners to make a purchase directly. The AI writes an urgent, offer-led script that names the deal clearly and pushes the listener to act right now.
<br />
<br />

<b>Leads</b>
<br />
Encourage listeners to take a low-friction first step — request a quote, fill in a form, or book a call. The AI builds credibility and makes contacting you feel effortless and risk-free.
<br />
<br />

<b>Website Traffic</b>
<br />
Drive listeners to visit a specific URL. The AI creates a curiosity-driven script that makes visiting your site feel like a natural next step — without a hard sell or pricing pressure.
<br />
<br />

<b>Product & Brand Consideration</b>
<br />
Move listeners from awareness into active consideration. The AI builds preference through an informative, confident script — educating rather than selling, and ending with a soft invitation to find out more.
<br />
<br />

<b>Brand Awareness & Reach</b>
<br />
Build recognition and emotional connection — no immediate action required. The AI writes a brand storytelling script that creates a feeling and a memory, not a sales pitch.
<br />
<br />

<b>App Promotion</b>
<br />
Drive listeners to download or re-engage with your mobile app. The AI creates a scenario-driven script that puts the listener inside a real moment where the app solves a problem — then closes with a specific proof point and both app store names.
<br />
<br />

<b>Local Store Visits & Promotions</b>
<br />
Drive foot traffic to a physical location. The AI creates an urgency-and-location script that makes the listener feel they will miss out if they do not visit — and tells them exactly where to go and when.
<br />
</div>


`;


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

      <Label className="text-xs text-muted-foreground">Available voices</Label>
      <div
        ref={scrollRef}
        className={`space-y-1 max-h-[250px] overflow-y-auto`}
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!musicsHasMore) return;
    if (!onLoadMoreMusics) return;
    const el = scrollRef.current;
    const target = sentinelRef.current;
    if (!el || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreMusics();
      },
      { root: el, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [musicsHasMore, onLoadMoreMusics]);

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

  return (
    <div className="">
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
      <Label className="text-xs text-muted-foreground">Available music</Label>
      <div
        ref={scrollRef}
        className="max-h-[250px] overflow-y-auto"
      >
        {tracks &&
          tracks.length > 0 &&
          tracks.map((track, index) => (
              <div key={index} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 mt-1.5">
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
          ))}
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
    </div>
  );
}

const goalPlaceholders: Record<string, string> = {
  sales:
    "Drive listeners to make a purchase directly. The AI writes a direct-response script with a strong offer and a clear call to action pointing to a website or online store.\n\nPrompt guidance: Include your product or offer name, the key benefit or discount, and a specific URL. Example: 'https://www.mybrand.com — Family pizza restaurant in The Mall. 20% off your first online order. Promote our new seafood menu — order tonight and use code SEAFOOD20.'",
  leads: "Encourage listeners to register interest, request a quote, fill in a form, or call. Best for service businesses where the sale happens offline. The AI writes a script that builds credibility and guides the listener to take a low-friction first step. \n\nPrompt guidance: Describe the service, the problem it solves, and the lead action (e.g. 'get a free quote', 'book a call'). Example: 'https://www.mybrand.com — Flexible renewable-energy contracts for households. No lock-in. 24/7 support. Visit yellowdoorenergy.com to get your free quote in under two minutes.'",
  traffic: "Drive listeners to visit a specific URL. The script focuses on curiosity and a single, memorable destination rather than a hard sell. Best when the website itself is the conversion point (e.g. a blog, landing page, or e-commerce homepage).\n\nPrompt guidance: Highlight what listeners will find when they visit and why it's worth their time. Example: 'https://www.mybrand.com/summer — Our summer collection is live. Discover 200+ new styles, all with free delivery this week. Visit mybrand.com/summer.'",
  consideration: "Move listeners from awareness into active consideration of your product or service. The script is designed to educate and build preference rather than demand immediate action — ideal for considered purchases (cars, insurance, B2B software, real estate).\n\n Prompt guidance: Focus on key differentiators and what sets your product apart from alternatives. Example: 'https://www.mybrand.com — Flexible car leasing for consumers. No down payment, fully insured, swap your car every 12 months. Find out why 10,000 drivers have already switched at mybrand.com.'",
  awareness: "Build recognition and top-of-mind recall without requiring any immediate listener action. The AI writes a brand storytelling script focused on who you are and what you stand for — ideal for new market entry, product launches, or brand repositioning.\n\nPrompt guidance: Describe your brand identity, mission, and target audience feeling rather than a specific offer or call to action. Example: 'My Brand — sustainability-first skincare, made in the world, inspired by the sun. We believe beauty should never cost the earth. My Brand — available at leading world pharmacies.'",
  app: "Drive listeners to download or re-engage with your mobile app. The script leads with the app's value proposition and ends with a clear 'download now' call to action, naming the app stores where it is available.\n\nPrompt guidance: Include the app name, its core benefit, and where to download it. Example: 'The My Brand app — shop 20 million products with same-day delivery across the world. Exclusive app-only deals every day. Download My Brand now on the App Store and Google Play.'",
  local: "Drive foot traffic to a physical location. The script creates urgency around a time-limited offer and gives clear location information so the listener knows exactly where to go.\n\nPrompt guidance: Include the store location, the specific promotion, and the time window. Example: 'My Brand, Main Street, London. This weekend only — buy any cake and get a free box of our signature pastries. Open Saturday and Sunday from 8am. Come in and treat yourself.'"
};
const voiceTooltip = `<div class="p-2">

Select the voice that will read your ad script. Use the filters to narrow the library by gender, language, accent, tone, age, and use case. Click the play button on any voice to hear a sample.
<br /><br />
<b>Search</b><br />
Type a voice name to find it directly — for example, type 'Charlotte' or 'Arabic' to filter the list instantly.
Filter by Male or Female voices. Leave unset to browse all genders.
<br /><br />
<b>Native Language</b><br />
Select the language the voice reads in. Arabic, English, and other regional languages are available.
<br /><br />

<b>Accent</b><br />
Refine by regional accent — for example, Standard American, Standard British, or Saudi Arabic. Only accents available for your selected language are shown.
<br /><br />

<b>Tone</b><br />
Filter voices by delivery style — Friendly, Confident, Conversational, Authoritative, or Calm. Choose a tone that matches your brand personality.
<br /><br />

<b>Age</b><br />
Filter by the perceived age of the speaker — for example, Young Adult, Middle-Aged, or Senior. Matching the speaker's perceived age to your target audience can improve listener relatability.
<br /><br />


</div>`;

const musicTooltip = `
  <div class="p-2">

  Choose a royalty-free music track to play behind your voiceover. All tracks in the library are pre-licensed for advertising use — no additional fees apply. Click the play button to preview any track.
<br /><br />
<b>Search</b><br />
Type a track name or keyword to find music directly — for example, type 'jazz' or 'Euphoric Vibes'.
<br /><br />

<b>Mood</b><br />
Filter tracks by emotional tone — for example, Happy, Energetic, Calm, or Dramatic. Choose a mood that matches the feeling you want to create in your ad.
<br /><br />

<b>Gerne</b><br />
Filter by musical style — for example, Electronic, Pop, Jazz, or Classical. Genre can reinforce your brand's personality (e.g. a tech brand might choose Electronic; a lifestyle brand might choose Acoustic).
<br /><br />

<b>Instruments</b><br />
Narrow to tracks featuring specific instruments — for example, Piano, Guitar, or Synth — if a particular sound fits your brief.
<br /><br />

<b>Tempo</b><br />
Filter by pace: Slow, Medium, or Fast. Match the music's tempo to your ad's energy — a fast-paced offer benefits from an upbeat track; a calming product suits a slower tempo.

  </div>

`;



const musicMixTooltip = `
  <div class="p-2">
Fine-tune the technical settings of your ad's music output. These controls affect the final audio file generated — adjust them after choosing your voice and music.
<br /><br />
<b>Fade In</b><br />
When enabled, the music volume gradually increases from silence at the start rather than starting abruptly. Recommended for a polished, broadcast-quality feel.
Fade In is on by default. Turn it off only if your ad is designed to open with an immediate, high-impact sound.
<br /><br />

<b>Fade Out</b><br />
When enabled, the music  volume gradually decreases to silence at the end, creating a smooth finish.
Fade Out is on by default. Keep it on unless your creative specifically ends on a sharp cut for dramatic effect.
<br /><br />

<b>Start</b><br />
Sets the point in the music track (in milliseconds) where playback begins. Use this to skip a slow intro and start from a more energetic section. 1000 ms = 1 second. Default: 0 ms.
<br /><br />

<b>End</b><br />
Sets the point in the music track where playback stops. Use this to trim a long track to exactly the length of your ad. Default: 30,000 ms (30 seconds).
<br /><br />
<b>Volume</b><br />
Sets the overall output volume of the generated music as a percentage. 80% is the recommended default — it leaves headroom for broadcast normalisation. Increase only if the preview sounds too quiet after adjusting Fade settings.

  </div>
`;



const trackingPixelTooltip = `
  <div class="p-2">

If you're using Podscribe or a similar podcast attribution tool, add the pixel here so EARO impression data flows into your external reporting dashboard automatically.
<br /><br />
<b>Tracking pixel URL</b> <br />
Enter the URL of a third-party impression pixel to track how many times this ad is heard across all campaigns it's attached to. Supported providers include Podscribe and standard image/JavaScript pixel platforms.


  </div>
`;

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

  showMusicOptions,
  setShowMusicOptions,
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
  showMusicOptions: boolean;
  setShowMusicOptions: (v: boolean) => void;
}) {
  const availableAccents = voiceDefaults.accents;
  const availableTones = voiceDefaults.characteristics;
  const availableGenders = voiceDefaults.gender;
  const availableAges = voiceDefaults.age;
  const availableUseCases = voiceDefaults.use_case;
  const availableLanguages = voiceDefaults.language.map((l) => ({ id: l.code, label: l.name }));

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
    <div className="space-y-4 mt-0 pt-0">
      <Label className="text-base font-semibold flex flex-row items-center gap-2 ">
        Choose your voice
        <MyTooltip html={voiceTooltip} />
      </Label>
      <div className="space-y-2">
        {isPro && (
          <div
            className={`space-y-2 col-span-1 ${isPro ? "md:col-span-6" : "md:col-span-4"} relative`}
          >
            <Input
              type="text"
              placeholder="Search voices by name…" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      <div
        className={`flex flex-row  max-h-[80px] overflow-x-auto md:overflow-x-hidden md:grid grid-cols-1 ${isPro ? "md:grid-cols-5" : "md:grid-cols-4"} gap-4 p-1`}
      >
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">Gender </Label>
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
          <Label className="text-sm flex items-center gap-2">Native Language  </Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"all"}>
                <span className="capitalize">Any</span>
              </SelectItem>
              {availableLanguages.map((l,index) => (
                <SelectItem key={index} value={l.id}>
                  <span className="capitalize">{l.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">Accent </Label>
          <Select value={accent} onValueChange={onAccentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an accent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"all"}>
                <span className="capitalize">Any</span>
              </SelectItem>
              {availableAccents.map((a) => (
                <SelectItem key={a} value={a}>
                  <span className="capitalize">{a}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">Characteristics </Label>
          <Select value={tone} onValueChange={onToneChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"all"}>
                <span className="capitalize">Any</span>
              </SelectItem>
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
            <Label className="text-sm">Speaker Age  </Label>
            <Select value={age} onValueChange={onAgeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value={"all"}>
                <span className="capitalize">Any</span>
              </SelectItem>
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
          <div className="space-y-2 hidden">
            <Label className="text-sm">Best For  </Label>
            <Select value={useCase} onValueChange={onUseCaseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a use case" />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value={"all"}>
                <span className="capitalize">Any</span>
              </SelectItem>
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
      {
        !voicesLoading && voices.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No voices found for the selected criteria. Try adjusting your filters or search term.
          </p>
        )
      }

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
        <Label className="text-base font-semibold flex flex-row gap-2">Choose Your Background Music
          <MyTooltip html={musicTooltip}/>
          <Switch  checked={showMusicOptions} onCheckedChange={() => setShowMusicOptions(!showMusicOptions)} />
        </Label>
        {showMusicOptions && (
          <>
        <div className="space-y-2">
          {isPro && (
            <div
              className={`space-y-2 col-span-1 ${isPro ? "md:col-span-6" : "md:col-span-4"} relative`}
            >
              <Input
                type="text"
                placeholder="Search tracks by name…"
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
            <Label className="text-sm flex items-center gap-2">Mood </Label>
            <Select value={musicMood} onValueChange={onMusicMoodChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>
                  <span className="capitalize">Any</span>
                </SelectItem>
                {availableMusicMoods.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className="capitalize">{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2 ">Genre </Label>
            <Select value={musicGenre} onValueChange={onMusicGenreChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>
                  <span className="capitalize">Any</span>
                </SelectItem>
                {availableMusicGenre.map((g) => (
                  <SelectItem key={g} value={g}>
                    <span className="capitalize">{g}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">Instruments </Label>
            <Select
              value={musicInstrument}
              onValueChange={onMusicInstrumentChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>
                  <span className="capitalize">Any</span>
                </SelectItem>
                {availableMusicInstrument.map((i) => (
                  <SelectItem key={i} value={i}>
                    <span className="capitalize">{i}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">Tempo </Label>
            <Select value={musicRhythm} onValueChange={onMusicRhythmChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rhythm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>
                  <span className="capitalize">Any</span>
                </SelectItem>
                {availableMusicRhythm.map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className="capitalize">{r}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">Best For  </Label>
            <Select value={musicUseCase} onValueChange={onMusicUseCaseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a use case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"all"}>
                  <span className="capitalize">Any</span>
                </SelectItem>
                {availableMusicUseCase.map((u) => (
                  <SelectItem key={u} value={u}>
                    <span className="capitalize">{u}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        </>
        )}
      </div>

      {
        !musicsLoadingMore && musics.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No music tracks found for the selected criteria. Try adjusting your filters or search term.
          </p>
        )
      }

      {
        showMusicOptions && (
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
  
        )
      }

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
  const updateContent = (key: keyof ProContentSettings, value: boolean | number | string) =>
    onContentSettingsChange({ ...contentSettings, [key]: value });
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Music Mix Settings <MyTooltip html={musicMixTooltip} /> </Label>

      {/* Content Settings */}
      <section title="Content Settings">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm flex items-center gap-2">Fade In </Label>
              <p className="text-xs text-muted-foreground flex items-center gap-2">Start quietly and ramp up — prevents a jarring opening. </p>
            </div>
            <Switch checked={contentSettings.fadeIn} onCheckedChange={(v) => updateContent('fadeIn', v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm flex items-center gap-2">Fade Out  </Label>
              <p className="text-xs text-muted-foreground flex items-center gap-2">End smoothly — volume fades out rather than cutting off.  </p>
            </div>
            <Switch checked={contentSettings.fadeOut} onCheckedChange={(v) => updateContent('fadeOut', v)} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">Music Start Point (ms) </Label>
              <Input
                type="text"
                value={contentSettings.startMs}
                onChange={(e) => updateContent('startMs', parseInt(e.target.value) || '0')}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">Music End Point (ms) </Label>
              <Input
                type="text"
                value={contentSettings.endMs}
                onChange={(e) => updateContent('endMs', parseInt(e.target.value) || '0')}
                placeholder="30000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">Output Volume </Label>
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
        <Label className="text-base font-semibold">Tracking Pixel URL (Optional) <MyTooltip html={trackingPixelTooltip} /> </Label>
        <div className="relative">
        <Input
          value={trackingPixel}
          onChange={(e) => onTrackingPixelChange(e.target.value)}
          placeholder="https://tracking.example.com/pixel?id=YOUR_ID"
          type="url"
        />
        <span className="absolute right-2 top-2">
          <MyTooltip infoText="Paste the full pixel URL provided by your tracking platform. The pixel fires once per ad impression — it does not require a listener to take any action." />
        </span>
        </div>
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
  isEditing=false
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
  const [showMusicOptions, setShowMusicOptions] = useState(false);



  useEffect(() => {
    onSelectedMusicChange("");
  }, [showMusicOptions]);

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
      {!hasAd && !isEditing && (
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          What Are You Advertising? <MyTooltip infoText="This section provides the AI with the information it needs to write your ad script. The more specific you are, the better the output." />
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
          Describe your brand, offer, and call to action — and we'll write the script. <MyTooltip infoText="Include your website URL, what makes your offer unique, and what you want listeners to do after hearing the ad." />
          </p>
        </div>
      )}

      {!hasAd && (
        <>
          {type === "PROMPT" && (
            <div className="space-y-2">
              <Label className="flex flex-row gap-2 justify-start items-center w-full">{t("ad_creator.campaign_goal")}
                <MyTooltip html={campaignGoalTooltip} />
              </Label>
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
            <Label className="flex flex-row gap-2 justify-start items-center w-full">
              <span>{type === "PROMPT"
                ? "Describe Your Brand & Offer"
                : t("ad_creator.ad_script")}
                <sup>*</sup>
                </span>

                <MyTooltip infoText="In up to 500 characters, tell us: (1) what makes your brand unique, (2) who it's for, and (3) what you want listeners to do. Adding your website URL lets the AI pull extra context to enrich the script." />
            </Label>
            <div className="relative">
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
            
            </div>
            <div className="w-full flex items-center justify-end">
              <span
                className={`text-xs ${description.length >= 500 ? "text-destructive" : " text-muted-foreground "} flex items-center gap-2`}
              >
                {description.length || 0} / {500} characters
              </span>
            </div>
          </div>

          <div className="my-0 py-0">
            <h6 className="text-[18px] font-semibold my-0 py-0">Filter to find a voice and music track that fits your brand</h6>
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
            showMusicOptions={showMusicOptions}
            setShowMusicOptions={setShowMusicOptions}
          />

          {
            isPro && showMusicOptions && (
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
            disabled={!canSubmit || !selectedVoice || (showMusicOptions && !selectedMusic) || isGenerating}
          >
            {
              !canSubmit || !selectedVoice || (showMusicOptions && !selectedMusic) || isGenerating ? "Complete the details above to generate your ad" : "Generate My Ad"
            }
            Generate My Ad

            <MyTooltip iconClassName="text-white-50 hover:text-white" infoText="Click to generate your ad using the voice, music, and settings selected above. Generation takes under a minute. You'll be able to preview and regenerate before saving." />
          </Button>
          <div>
            
            <p className="text-sm text-muted-foreground text-center">
              {
                description.length === 0 ? "*Please enter a description" : ""
              }

            </p>
          <p className="text-sm text-muted-foreground text-center">
            {showMusicOptions && !selectedMusic ? "*Please select a music track" : ""}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            {
              !selectedVoice ? "*Please select a voice" : ""
            }
          </p>
          </div>
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
                showMusicOptions={showMusicOptions}
                setShowMusicOptions={setShowMusicOptions}
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
                isPro && showMusicOptions && (
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
