import CampaignGoal, {
  campaignGoalTooltip,
  goalPlaceholders,
} from "@/components/sdui/blocks/CampaignGoal";
import { Label } from "@/components/ui/label";
import { MyTooltip } from "@/components/ui/MyTooltip";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/contexts/TranslationContext";
import Editor from "@/components/sdui/Editor";
import {
  CircleHelp,
  InfoIcon,
  LightbulbIcon,
  Loader2,
  Mic,
  MicOff,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Recommendation, VoxifyPollResponse, VoxifyVoice, VoxifyTrack } from "@/services/ads";
import InlineAudioPlayer from "./InlineAudioPlayer";
import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectValue,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { DialogContent, Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import BusinessHelperModal from "@/components/modals/BusinessHelperModal";
import VoiceLibrary from "./VoiceLibrary";
import MusicLibrary from "./MusicLibrary";


interface VoxifyFormProps {
  type: "PROMPT" | "SCRIPT";
  goal: string;
  onGoalChange: (goal: string) => void;
  description: string;
  setPlainText: (plainText: string) => void;
  onDescriptionChange: (description: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  ad: VoxifyPollResponse["data"]["result"] | null;
  generateVoxifyAd: (recommendIndex: number) => void;
  regenerateVoxifyAd: (recommendIndex: number, voice: object, track: object, musicVolume: number, voiceVolume: number) => void;
  updateScript: (recommendIndex: number, script: { text_plain: string, text: string }) => void;
  handleSaveAd: (id: string, name: string, index: number) => Promise<void>;
}

function GeneratingAdLoader() {
  return (
    <div className="flex flex-col gap-2 border bg-card text-card-foreground shadow-sm rounded-2xl border-border p-6">
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" />
        <p className="text-sm text-muted-foreground">Generating...</p>
      </div>
    </div>
  );
}

function GeneratingAdSteps() {
  const LOADING_STEPS = [
    {
      title: "Writing your script",
      subtitle: "Reading your brief and scripting the first version…",
    },
    {
      title: "Selecting a voice",
      subtitle: "Matching voice to your language, tone, and goal…",
    },
    {
      title: "Adding music",
      subtitle: "Choosing a track and mixing your audio ad…",
    },
    {
      title: "Finishing up",
      subtitle: "Almost there — your ad is being produced…",
    },
    {
      title: "Your ad is ready",
      subtitle: "Listen to the first version below.",
    },
  ];
  const [activeStep, setActiveStep] = useState(0);
  const INTERVAL_TIME = 7000 + Math.random() * 10000;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeStep === LOADING_STEPS.length - 1) {
      clearInterval(timerRef.current!);
    }
  }, [activeStep]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, INTERVAL_TIME);
    return () => clearInterval(timerRef.current!);
  }, []);

  const step = LOADING_STEPS[activeStep];

  return (
    <div>
      <div className="flex items-start gap-3 rounded-lg px-3 py-3 text-left bg-primary/10">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center mt-0.5">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {step.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {step.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

interface VoiceFilterControlsProps {
  gender: string;
  age: string;
  onGenderChange: (gender: string) => void;
  onAgeChange: (age: string) => void;
}

function VoiceFilterControls({
  gender,
  age,
  onGenderChange,
  onAgeChange,
}: VoiceFilterControlsProps) {
  const availableGenders = ["any", "female", "male"];
  const availableAges = [
    "any",
    "kids",
    "teens",
    "young",
    "middle-aged",
    "mature",
  ];
  return (
    <div className="flex items-center gap-2">
      <Select value={gender} onValueChange={onGenderChange}>
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          {availableGenders.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={age} onValueChange={onAgeChange}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="Age" />
        </SelectTrigger>
        <SelectContent>
          {availableAges.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const MusicCard = ({ track, isSelected, onSelect }: { track: VoxifyTrack, isSelected: boolean, onSelect: () => void }) => {
  return (
    <div key={track?.track_id} className="w-full">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
          isSelected
            ? "bg-primary/10 border border-primary/30"
            : "bg-muted/30 border border-transparent hover:bg-muted/50",
        )}
      >
        <span
          className={cn(
            "aspect-square h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors",
            isSelected
              ? "border-primary"
              : "border-muted-foreground/40",
          )}
          onClick={() => {
            onSelect();
          }}
        >
          {isSelected && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </span>
        <div className="h-11 w-11 shrink-0 rounded-md bg-muted flex items-center justify-center">
          <Music className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:gap-2 min-w-0">
            <span className="text-xs font-medium text-foreground shrink-0">
              {track?.title}
            </span>
            <p className="text-[10px] max-w-[200px] text-muted-foreground truncate capitalize">
              {`${track?.genres.join(" · ")}`}
            </p>
          </div>
          <p className="hidden md:block text-[10px] text-muted-foreground truncate capitalize">
            {track?.artist_name}
          </p>
        </div>
        <div
          className="shrink-0"
          onClick={(e) => e.preventDefault()}
        >
          <InlineAudioPlayer
            audioUrl={track?.preview_url}
            playerWidthFull={true}
          />
        </div>
      </div>
    </div>
  )
}

const VoiceCard = ({ voice, isSelected, onSelect }: { voice: VoxifyVoice, isSelected: boolean, onSelect: () => void }) => {
  return (
    <div key={voice?.voice_id} className="w-full">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
          isSelected
            ? "bg-primary/10 border border-primary/30"
            : "bg-muted/30 border border-transparent hover:bg-muted/50",
        )}
      >
        <span
          className={cn(
            "aspect-square h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors",
            isSelected
              ? "border-primary"
              : "border-muted-foreground/40",
          )}
          onClick={() => {
            onSelect();
          }}
        >
          {isSelected && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </span>
        <Avatar className="h-11 w-11 shrink-0 rounded-lg bg-transparent [&_img]:mix-blend-multiply">
          <AvatarImage
            src={null}
            alt={voice?.name}
            className="object-cover bg-transparent"
          />
          <AvatarFallback className="text-[10px] font-medium bg-transparent text-foreground rounded-lg">
            {voice?.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:gap-2 min-w-0">
            <span className="text-xs font-medium text-foreground shrink-0">
              {voice?.name}
            </span>
            <p className="hidden md:block text-[10px] text-muted-foreground max-w-[200px] truncate capitalize">
              {`${voice?.labels.gender} · ${voice?.labels.age} · ${voice?.labels.accent}`}
            </p>
          </div>
          <p className="hidden md:block text-[10px] text-muted-foreground max-w-[200px] truncate capitalize">
            {voice?.labels.description}
          </p>
        </div>
        <div
          className="shrink-0"
          onClick={(e) => e.preventDefault()}
        >
          <InlineAudioPlayer
            audioUrl={voice?.preview_url}
            playerWidthFull={true}
          />
        </div>
      </div>
    </div>

  );
}

function RecommendationCard({ type, recommendation, index, editMode, handleEdit, handleCancelEdit, generateVoxifyAd, regenerateVoxifyAd, updateScript, handleSaveAd }: { type: "PROMPT" | "SCRIPT", recommendation: Recommendation, index: number, editMode: boolean, handleEdit: () => void, handleCancelEdit: () => void, generateVoxifyAd: () => void, regenerateVoxifyAd: (voice: object, track: object, musicVolume: number, voiceVolume: number) => void, updateScript: (script: { text_plain: string, text: string }) => void, handleSaveAd: (id: string, name: string, index: number) => Promise<void> }) {
  const [voiceVolume, setVoiceVolume] = useState(-20);
  const [musicVolume, setMusicVolume] = useState(-28);
  const { t } = useTranslation();
  const sanitizeAdName = (value: string) => value.replace(/[^A-Za-z0-9 &_\-]/g, '');


  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(recommendation.voice?.voice_id);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(recommendation.track?.track_id);

  const [currentVoice, setCurrentVoice] = useState<VoxifyVoice | null>(recommendation.voice);
  const [currentTrack, setCurrentTrack] = useState<VoxifyTrack | null>(recommendation.track);


  const [showSaveModal, setShowSaveModal] = useState(false);
  const [adName, setAdName] = useState(sanitizeAdName(recommendation.script.name.replace(/\.[^.]+$/, '')));
  const [isSaving, setIsSaving] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [showVoiceLibraryModal, setShowVoiceLibraryModal] = useState(false);
  const [showMusicLibraryModal, setShowMusicLibraryModal] = useState(false);

  const [voicePickFromLibrary, setvoicePickFromLibrary] = useState<VoxifyVoice | null>(null);
  const [musicPickFromLibrary, setmusicPickFromLibrary] = useState<VoxifyTrack | null>(null);




  const handleConfirmSave = () => {
    setIsSaving(true);
    setShowSaveModal(false);
    handleSaveAd(recommendation.id, adName, index);
    setIsSaving(false);
    setAdName("");
  }

  useEffect(() => {
    setSelectedVoiceId(recommendation.voice?.voice_id ?? null);
    setCurrentVoice(recommendation.voice ?? null);
    setSelectedTrackId(recommendation.track?.track_id ?? null);
    setCurrentTrack(recommendation.track ?? null);
    setVoiceVolume( Math.round(Number(recommendation?.clips[0]?.vocal?.["rms-dbfs"])) || -20);
    setMusicVolume( Math.round(Number(recommendation?.clips[0]?.music?.["rms-dbfs"])) || -28);



    const _tags = [];
    const campaignGoal = recommendation.script?.classification?.campaign_goal?.name;
    const category = recommendation.script?.classification?.tone_of_voice?.category?.name;
    const targetAudience = recommendation.script?.classification?.target_audience?.name;
    const callToAction = recommendation.script?.classification?.call_to_action?.name;
    const specificDateEvent = recommendation.script?.classification?.specific_date_event?.name;


    if(campaignGoal){
      _tags.push(campaignGoal);
    }
    if(category){
      _tags.push(category);
    }
    
    if(targetAudience){
      _tags.push(targetAudience);
    }
    if(callToAction){
      _tags.push(callToAction);
    }
    if(specificDateEvent){
      _tags.push(specificDateEvent);
    }
    setTags(_tags.filter((f,i) => i < 4));





  }, [recommendation.voice?.voice_id, recommendation.track?.track_id]);

  const handleScriptChange = (
    content: string,
    delta: any,
    source: string,
    editor: any,
  ) => {
    if(content === "") {
      updateScript({
        text_plain: "",
        text: ""
      })      
      return;
    }
    const plainText = editor.getText();
    updateScript({
      text_plain: plainText,
      text: content
    })
  };

  const showVoiceLibrary = () => {
    setShowVoiceLibraryModal(true);
  };

  const showMusicLibrary = () => {
    setShowMusicLibraryModal(true);
  };

  return (
    <div key={index}>
    {recommendation.generated ? (
      <div className="border bg-card text-card-foreground shadow-sm relative rounded-2xl border-border p-6">
        {
          index === 0 && type === "PROMPT" && (
            <div className="inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent absolute -top-3 left-6 bg-foreground text-background hover:bg-foreground rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase">
              Best match for your brand
            </div>
          )
        }
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-semibold text-foreground">
            {recommendation.script.name}
          </h2>
          <div className="flex flex-col md:flex-row gap-5">
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {
                  recommendation.script.classification && <span className="text-sm font-semibold text-foreground">
                  Script
                </span>

                }
                {tags?.map(
                  (tag) => (
                    <div key={tag} className="capitalize inline-flex items-center px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted/30 text-foreground hover:bg-muted/30 rounded-sm font-medium border border-border">
                      {tag}
                    </div>
                  ),
                )}
              </div>
              <div className="space-y-1.5">
                {
                  editMode ? <Editor value={recommendation.script.text} onChange={handleScriptChange} /> : <div className="p-2 text-md" dangerouslySetInnerHTML={{ __html: recommendation.script.text }}></div>
                }
                
              </div>
            </div>
            {!editMode && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-foreground">
                  Listen to this version
                </p>
                <InlineAudioPlayer
                  audioUrl={recommendation.sourceUrl}
                  playerWidthFull={true}
                />
                <div className="flex gap-2 md:max-w-sm">
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-sans text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 flex-1"
                  >
                    Edit ad
                  </button>
                  <button onClick={() => setShowSaveModal(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-sans text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all h-10 px-4 py-2 flex-1">
                    Save ad
                  </button>
                </div>
              </div>
            )}
          </div>

          {editMode ? (
            <div className="hidden sm:grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">

                <div className="flex items-center gap-1.5">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                    Current voice
                  </label>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap">
                  <VoiceCard voice={currentVoice} isSelected={selectedVoiceId === currentVoice?.voice_id} onSelect={() => {
                    setSelectedVoiceId(currentVoice?.voice_id);
                  }} />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                      Recommended voices
                    </label>
                    <MyTooltip infoText="Voices are filtered to match your script's language and dialect. The top result is our recommended match for your goal and tone — preview any voice by pressing play. Only voices compatible with your selected language are shown." />
                  </div>
                </div>
                <div className="space-y-3 justify-between">
                  {recommendation.voices?.filter((voice) => voice.voice_id !== currentVoice?.voice_id).map((voice) => (
                    <VoiceCard voice={voice} isSelected={selectedVoiceId === voice.voice_id} onSelect={() => {
                      setSelectedVoiceId(voice.voice_id);
                    }} />
                  ))}
                </div>


                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap mt-5">
                {
                  voicePickFromLibrary && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                          Voice from library
                        </label>
                      </div>
                        <VoiceCard voice={voicePickFromLibrary} isSelected={selectedVoiceId === voicePickFromLibrary?.voice_id} onSelect={() => {
                          setSelectedVoiceId(voicePickFromLibrary?.voice_id ?? null);
                        }} />
                    </div>
                  )
                }
                    <Button
                      type="button"
                      onClick={showVoiceLibrary}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      More voice options
                    </Button>
                </div>
              </div>

              <div className="space-y-2">

                <div className="flex items-center gap-1.5">
                  <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                    Current music
                  </label>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap">
                  <MusicCard track={currentTrack} isSelected={true} onSelect={() => {
                    setSelectedTrackId(currentTrack?.track_id ?? null);
                  }} />


                </div>



                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                      Recommended music
                    </label>
                    <MyTooltip infoText="Tracks are matched to your script's emotional tone and pacing. Background music works best for brand-building and awareness ads — for short, direct-response ads, voice-only is often clearer and more effective." />
                  </div>
                </div>
                <div className="space-y-3">
                  <div
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
                      null === selectedTrackId
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/30 border border-transparent hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "aspect-square h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors",
                        null === selectedTrackId
                          ? "border-primary"
                          : "border-muted-foreground/40",
                      )}
                      onClick={() => {
                        setSelectedTrackId(null);
                        setCurrentTrack(null);
                      }}
                    >
                      {null === selectedTrackId && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <div className="h-11 w-11 shrink-0 rounded-md bg-primary flex items-center justify-center">
                      <MicOff className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          No music - Voice only
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">
                      Just your script, with no background track. Recommended for 15-second ads and direct-response goals where clarity is the priority.
                      </p>
                    </div>
                  </div>

                  {recommendation.tracks?.filter((track) => track.track_id !== currentTrack?.track_id).map((track) => (
                    <MusicCard track={track} isSelected={selectedTrackId === track.track_id} onSelect={() => {
                      setSelectedTrackId(track.track_id);
                    }} />
                  ))}
                </div>



                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap mt-5">
                {
                  musicPickFromLibrary && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap w-full">
                      <div className="flex items-center gap-1.5">
                        <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                          Music from library
                        </label>
                      </div>
                        <MusicCard track={musicPickFromLibrary} isSelected={selectedTrackId === musicPickFromLibrary?.track_id} onSelect={() => {
                          setSelectedTrackId(musicPickFromLibrary?.track_id ?? null);
                          setCurrentTrack(musicPickFromLibrary ?? null);
                        }} />
                    </div>
                  )
                }
                    <Button
                      type="button"
                      onClick={showMusicLibrary}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      More music options
                    </Button>
                </div>
              </div>

              <div className="space-y-4 col-span-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Volume mix
                  </Label>
                  <MyTooltip infoText="Adjust the relative volume of the voice and background music. These are mixing levels, not absolute loudness — the final ad is normalised before export. Recommended: voice at -4 dB, music at -15 dB. Raising music too high will obscure the spoken message." />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      ["Voice Volume", voiceVolume, setVoiceVolume],
                      ["Music Volume", musicVolume, setMusicVolume],
                    ] as const
                  ).map(([label, value, setValue]) => {
                    const formatted = `${(value + 15) > 0 ? "+" : (value + 15) < 0 ? "−" : ""}${Math.abs(value + 15)} dB`;
                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{label}</Label>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatted}
                          </span>
                        </div>
                        <div className="relative">
                          <Slider
                            value={[value+ 15]}
                            onValueChange={([nv]) => setValue(nv - 15)}
                            min={-15}
                            max={15}
                            step={1}
                          />
                          <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                          <span>−15</span>
                          <span>0</span>
                          <span>+15</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 col-span-2 flex flex-col md:flex-row gap-2 items-end justify-end">
                <Button onClick={handleCancelEdit} variant="outline">Cancel</Button>
                <Button onClick={() => {
                  handleCancelEdit();
                  regenerateVoxifyAd(currentVoice, currentTrack, voiceVolume, musicVolume)
                }} variant="default">Regenerate ad</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 border border-border">
                <div className="h-11 w-11 shrink-0 rounded-md bg-muted flex items-center justify-center">
                  <Mic className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-foreground shrink-0 flex items-center gap-2">
                      Voice: {recommendation?.voice?.name} <MyTooltip infoText="This voice was selected to match your script's language, tone, and goal. You can choose a different voice in the Edit step." />
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate capitalize">
                    {recommendation?.voice?.labels?.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 bg-muted/30 border border-border">
                <div className="h-11 w-11 shrink-0 rounded-md flex items-center justify-center bg-muted">
                  <Music className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-foreground truncate flex items-center gap-2">
                      Music: {recommendation?.track?.title} <MyTooltip infoText="This track was selected to complement the script's pacing and emotional tone. You can swap it in the Edit step, or remove it entirely." />
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate capitalize">
                    {recommendation?.track?.genres?.join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="border bg-card text-card-foreground shadow-sm rounded-2xl border-border p-6">
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-semibold text-foreground">
            {recommendation.script.name}
          </h2>
          <div className="flex flex-col md:flex-row gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Script
                </span>
                {tags?.map(
                  (tag) => (
                    <div key={tag} className="capitalize inline-flex items-center px-2.5 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted/30 text-foreground hover:bg-muted/30 rounded-sm font-medium border border-border">
                      {tag}
                    </div>
                  ),
                )}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground/70 italic whitespace-pre-wrap line-clamp-6">
                {recommendation.script.text_plain}
              </p>
            </div>
            <div className="flex flex-col gap-3 justify-end">
              {recommendation.generating ? (
                <GeneratingAdLoader />
              ) : (
                <button
                  onClick={generateVoxifyAd}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] font-sans text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all h-10 px-4 py-2 w-full"
                >
                  Generate ad
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}


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

    <VoiceLibrary
      open={showVoiceLibraryModal}
      onOpenChange={setShowVoiceLibraryModal}
      onSelect={(voice) => {
        setSelectedVoiceId(voice.voice_id);
        setCurrentVoice(voice);
        setShowVoiceLibraryModal(false);
        setvoicePickFromLibrary(voice);
      }}
    />

    <MusicLibrary
      open={showMusicLibraryModal}
      onOpenChange={setShowMusicLibraryModal}
      selectedTrackId={selectedTrackId}
      onSelect={(track) => {
        setSelectedTrackId(track.track_id);
        setShowMusicLibraryModal(false);
        setmusicPickFromLibrary(track);
      }}
    />
  </div>
  );
}

export default function VoxifyForm({
  type,
  goal,
  onGoalChange,
  description,
  onDescriptionChange,
  setPlainText,
  onGenerate,
  isGenerating,
  ad,
  generateVoxifyAd,
  regenerateVoxifyAd,
  updateScript,
  handleSaveAd,

}: VoxifyFormProps) {
  const { t } = useTranslation();

  const [editMode, setEditMode] = useState([false, false, false]);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0);
  const [showBusinessHelperModal, setShowBusinessHelperModal] = useState(false);


  const handleChange = (
    content: string,
    delta: any,
    source: string,
    editor: any,
  ) => {
    if(content === "") {
      onDescriptionChange("");
      setPlainText("");
      return;
    }
    const plainText = editor.getText();
    onDescriptionChange(content);
    setPlainText(plainText);
  };

  const handleEdit = (index: number) => {
    setEditMode((prevState) => {
      const newEditMode = [...prevState];
      newEditMode[index] = true;
      return newEditMode;
    });
  };

  const handleCancelEdit = (index: number) => {
    setEditMode((prevState) => {
      const newEditMode = [...prevState];
      newEditMode[index] = false;
      return newEditMode;
    });
  };

  return (
    <div className="w-full">
      {isGenerating ? (
        <div className="flex flex-col gap-4 space-y-2">
          {
            type === "PROMPT" && (
              <h6 className="text-sm text-muted-foreground">Your prompt is being turned into 3 different ad variations — different voices, music, and creative direction, so you have options to choose and start from.</h6>
            )
          }
          <GeneratingAdSteps />
          {
            type === "PROMPT" && <GeneratingAdSteps />
          }
          {
            type === "PROMPT" && <GeneratingAdSteps />
          }
        </div>
      ) : ad ? (
        <div className="flex flex-col gap-4 space-y-2">
          {ad.recommendations.map(
            (recommendation: Recommendation, index: number) => (
              <RecommendationCard 
                type={type}
                recommendation={recommendation} 
                key={index}
                index={index} 
                editMode={editMode[index]} 
                handleEdit={() => handleEdit(index)} 
                handleCancelEdit={() => handleCancelEdit(index)} 
                generateVoxifyAd={() => generateVoxifyAd(index)} 
                regenerateVoxifyAd={(voice: object, track: object, musicVolume: number, voiceVolume: number) => regenerateVoxifyAd(index, voice, track, musicVolume, voiceVolume)} 
                updateScript={(script: { text_plain: string, text: string }) => updateScript(index, script)} 
                handleSaveAd={(id: string, name: string, index: number) => handleSaveAd(id, name, index)}
              />

            ),
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 space-y-2">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              What Are You Advertising?{" "}
              <MyTooltip infoText="This section provides the AI with the information it needs to write your ad script. The more specific you are, the better the output." />
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
            Your goal shapes the script. Tell us what this ad is trying to achieve — we'll build the right structure and prompt template around it.
              <MyTooltip infoText="Your campaign goal tells the AI what the ad needs to accomplish. It adjusts the script's opening, structure, offer framing, and call to action — a Sales script leads with an offer and urgency signal, while an Awareness script leads with a brand moment and emotional takeaway." />
            </p>
          </div>

          {type === "PROMPT" && (
            <div className="space-y-2">
              <Label className="flex flex-row gap-2 justify-start items-center w-full">
                {t("ad_creator.campaign_goal")}
                <MyTooltip html={campaignGoalTooltip} />
              </Label>
              <CampaignGoal goal={goal} onGoalChange={onGoalChange} />
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex flex-row gap-2 justify-between items-center w-full">
              <div className="flex flex-row gap-2 justify-between items-center">
              <span>
                {type === "PROMPT"
                  ? "Your Prompt"
                  : t("ad_creator.ad_script")}
                <sup>*</sup>
              </span>
              <MyTooltip infoText="This is the brief you give the AI. The template gives you a starting point — edit anything in brackets, delete lines you don't need, or clear everything and write your own. The more specific your inputs, the more tailored the script." />
              </div>
            </Label>
            <div className="relative">
              {/* <Textarea
              placeholder={
              type === "PROMPT"
                  ? goalPlaceholders[goal] || "Tell us about your business..."
                  : "Your ad script will appear here..."
              }
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={10}
          /> */}
              <div className="relative">
               <Editor value={description} onChange={handleChange} maxLength={1000} showPromptHelpButton={type === "PROMPT"} onShowPromptHelpButtonClick={() => setShowBusinessHelperModal(true)} /> 
              </div>
              
              <div className="p-3 flex items-start gap-2 text-sm text-muted-foreground">
                <LightbulbIcon className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                Edit anything in [brackets], delete what you don't need, or clear everything to write your own prompt.
                </p>
              </div>

              <Button
                className="w-full h-12"
                onClick={onGenerate}
                disabled={description?.split(" ").length < 8}
                // disabled={!canSubmit || !selectedVoice || (showMusicOptions && !selectedMusic) || isGenerating}
              >
                {
                  // !canSubmit || !selectedVoice || (showMusicOptions && !selectedMusic) || isGenerating ? "Complete the details above to generate your ad" : "Generate My Ad"
                  "Generate My Ad"
                }

                <MyTooltip
                  iconClassName="text-white-50 hover:text-white"
                  infoText="The AI will write three script versions from your prompt. The first will be fully produced — voice and music included — and ready to preview straight away. The other two are script-only alternatives."
                />
              </Button>
              <h6 className="text-xs text-muted-foreground text-center w-full">
                {
                  description?.split(" ").length < 8 ? "Please enter at least 8 words" : ""
                }
              </h6>
            </div>
          </div>
        </div>
      )}
      <BusinessHelperModal
        open={showBusinessHelperModal}
        onOpenChange={setShowBusinessHelperModal}
        goal={goal}
        onApply={(text: string) => onDescriptionChange(text.replace(/(\[[^\]]+\])/g, '<strong>$1</strong>').replace(/\.\s/g, '. <br />'))}
      />
    </div>
  );
}
