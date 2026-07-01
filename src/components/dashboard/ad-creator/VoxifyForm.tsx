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
      title: "Creating your ad",
      subtitle: "Scripting your goal, products, and offer.",
    },
    {
      title: "Refining the creative",
      subtitle: "Selecting your language, voice, and music style.",
    },
    {
      title: "Production",
      subtitle: "Generating your broadcast-quality audio in the Earo Cloud.",
    },
    {
      title: "Mastering complete!",
      subtitle: "Your free ad is ready to hear and adjust.",
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

    console.log("setting voice volume and music volume here ", { voiceVolume, musicVolume }, recommendation.clips[0].vocal);
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
                {recommendation.script.classification?.tone_of_voice?.speech_tags.map(
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                      Best matched voices
                    </label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 hidden">
                    <VoiceFilterControls
                      gender={recommendation.voice.labels.gender}
                      age={recommendation.voice.labels.age}
                      onGenderChange={() => {}}
                      onAgeChange={() => {}}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {recommendation.voices?.map((voice) => (
                    <div key={voice.voice_id}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
                          voice.voice_id ===
                            selectedVoiceId
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/30 border border-transparent hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "aspect-square h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors",
                            voice.voice_id ===
                              selectedVoiceId
                              ? "border-primary"
                              : "border-muted-foreground/40",
                          )}
                          onClick={() => {
                            setSelectedVoiceId(voice.voice_id);
                            setCurrentVoice(voice);
                          }}
                        >
                          {voice.voice_id ===
                            selectedVoiceId && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </span>
                        <Avatar className="h-11 w-11 shrink-0 rounded-lg bg-transparent [&_img]:mix-blend-multiply">
                          <AvatarImage
                            src={null}
                            alt={voice.name}
                            className="object-cover bg-transparent"
                          />
                          <AvatarFallback className="text-[10px] font-medium bg-transparent text-foreground rounded-lg">
                            {voice.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-center md:gap-2 min-w-0">
                            <span className="text-xs font-medium text-foreground shrink-0">
                              {voice.name}
                            </span>
                            <p className="hidden md:block text-[10px] text-muted-foreground truncate capitalize">
                              {`${voice.labels.gender} · ${voice.labels.age} · ${voice.labels.accent}`}
                            </p>
                            <p className="md:hidden text-[10px] text-muted-foreground truncate capitalize">
                              {`${voice.labels.gender} · ${voice.labels.age} · ${voice.labels.accent}`}
                            </p>
                          </div>
                          <p className="hidden md:block text-[10px] text-muted-foreground truncate capitalize">
                            {voice.labels.description}
                          </p>
                        </div>
                        <div
                          className="shrink-0"
                          onClick={(e) => e.preventDefault()}
                        >
                          <InlineAudioPlayer
                            audioUrl={voice.preview_url}
                            playerWidthFull={true}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-foreground">
                      Best matched music
                    </label>
                    <InfoIcon className="w-4 h-4 text-muted-foreground" />
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
                          No music - Voice only (default)
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">
                        Just your script, no background track.
                        Recommended for short, direct ads.
                      </p>
                    </div>
                  </div>

                  {recommendation.tracks?.map((track) => (
                    <div key={track.track_id}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
                          track.track_id ===
                            selectedTrackId
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-muted/30 border border-transparent hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "aspect-square h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors",
                            track.track_id ===
                              selectedTrackId
                              ? "border-primary"
                              : "border-muted-foreground/40",
                          )}
                          onClick={() => {
                            setSelectedTrackId(track.track_id);
                            setCurrentTrack(track);
                          }}
                        >
                          {track.track_id ===
                            selectedTrackId && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </span>
                        <div className="h-11 w-11 shrink-0 rounded-md bg-muted flex items-center justify-center">
                          <Music className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-center md:gap-2 min-w-0">
                            <span className="text-xs font-medium text-foreground shrink-0">
                              {track.title}
                            </span>
                            <p className="hidden md:block text-[10px] text-muted-foreground truncate capitalize">
                              {`${track.genres.join(" · ")}`}
                            </p>
                            <p className="md:hidden text-[10px] text-muted-foreground truncate capitalize">
                              {`${track.genres.join(" · ")}`}
                            </p>
                          </div>
                          <p className="hidden md:block text-[10px] text-muted-foreground truncate capitalize">
                            {track.artist_name}
                          </p>
                        </div>
                        <div
                          className="shrink-0"
                          onClick={(e) => e.preventDefault()}
                        >
                          <InlineAudioPlayer
                            audioUrl={track.preview_url}
                            playerWidthFull={true}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 col-span-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Volume mix
                  </Label>
                  <MyTooltip infoText="0 is the baseline of the generated ad." />
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
                    <span className="text-xs font-medium text-foreground shrink-0">
                      Voice: {recommendation?.voice?.name}
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
                    <span className="text-xs font-medium text-foreground truncate">
                      Music: {recommendation?.track?.title}
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
                {recommendation.script.classification?.tone_of_voice?.speech_tags.map(
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
              Describe your brand, offer, and call to action — and we'll write
              the script.{" "}
              <MyTooltip infoText="Include your website URL, what makes your offer unique, and what you want listeners to do after hearing the ad." />
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
            <Label className="flex flex-row gap-2 justify-start items-center w-full">
              <span>
                {type === "PROMPT"
                  ? "Describe Your Brand & Offer"
                  : t("ad_creator.ad_script")}
                <sup>*</sup>
              </span>

              <MyTooltip infoText="In up to 500 characters, tell us: (1) what makes your brand unique, (2) who it's for, and (3) what you want listeners to do. Adding your website URL lets the AI pull extra context to enrich the script." />
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
               <Editor value={description} onChange={handleChange} /> 
               
               {
                type === "PROMPT" && ( 
                  <button onClick={() => setShowBusinessHelperModal(true)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-[8px] px-3 absolute bottom-2 right-2 h-8"> 
                    <CircleHelp className="w-4 h-4" />
                    <span>Need help with your prompt?</span>
                  </button>
                )
               }
               
              </div>
              
              <div className="p-3 flex items-start gap-2 text-sm text-muted-foreground">
                <LightbulbIcon className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Edit any section in brackets, delete what you don't need, or
                  clear everything to write your own prompt.
                </p>
              </div>

              <Button
                className="w-full h-12"
                onClick={onGenerate}
                // disabled={!canSubmit || !selectedVoice || (showMusicOptions && !selectedMusic) || isGenerating}
              >
                {
                  // !canSubmit || !selectedVoice || (showMusicOptions && !selectedMusic) || isGenerating ? "Complete the details above to generate your ad" : "Generate My Ad"
                  "Generate My Ad"
                }

                <MyTooltip
                  iconClassName="text-white-50 hover:text-white"
                  infoText="Click to generate your ad using the voice, music, and settings selected above. Generation takes under a minute. You'll be able to preview and regenerate before saving."
                />
              </Button>
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
