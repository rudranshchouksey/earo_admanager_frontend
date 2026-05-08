import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sparkles, Upload } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import AdCreatorForm from "@/components/dashboard/ad-creator/AdCreatorForm";
import AdGeneratingModal from "@/components/dashboard/ad-creator/AdGeneratingModal";
import UploadAdForm from "@/components/dashboard/ad-creator/UploadAdForm";
import type { GeneratedAd } from "@/types/landing";
import type {
  ProVoiceSettings,
  ProMusicSettings,
  ProContentSettings,
} from "@/components/dashboard/ad-creator/ProCustomizations";
import { useSessionFlags } from "@/hooks/useSessionFlags";
import { auth, AuthSession, getStoredSession } from "@/services/auth";
import { Advertiser, advertiserApi } from "@/services/advertiser";
import { Ad, adsApi, AdStatusResponse, Music, Voice } from "@/services/ads";

const PAGE_SIZE = 5;

type AdMode = "ai" | "upload";

const DEFAULT_PRO_VOICE: ProVoiceSettings = {
  language: "",
  accent: "neutral",
  gender: "female",
  useCase: "commercial",
  characteristics: "warm",
  age: "young",
};
const DEFAULT_PRO_MUSIC: ProMusicSettings = {
  useCase: "commercial",
  mood: "uplifting",
  genre: "pop",
  instrument: "any",
  rhythm: "steady",
};
const DEFAULT_PRO_CONTENT: ProContentSettings = {
  fadeIn: true,
  fadeOut: true,
  startMs: 0,
  endMs: 30000,
  volume: 0.8,
};

export default function AdCreator() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();

  const [mode, setMode] = useState<AdMode>("ai");
  const [generatedAd, setGeneratedAd] = useState<AdStatusResponse | null>(null);
  const [editedScript, setEditedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("sales");
  const [query, setQuery] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [accent, setAccent] = useState("");
  const [tone, setTone] = useState("friendly");
  const [selectedMusic, setSelectedMusic] = useState("");

  const [language, setLanguage] = useState("en");
  const [gender, setGender] = useState("female");
  const [age, setAge] = useState("");
  const [useCase, setUseCase] = useState("");

  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesLoadingMore, setVoicesLoadingMore] = useState(false);
  const [voicesPage, setVoicesPage] = useState(1);
  const [voicesTotalPages, setVoicesTotalPages] = useState(1);

  const [musics, setMusics] = useState<Music[]>([]);
  const [musicsLoading, setMusicsLoading] = useState(true);
  const [musicsLoadingMore, setMusicsLoadingMore] = useState(false);
  const [musicsPage, setMusicsPage] = useState(1);
  const [musicsTotalPages, setMusicsTotalPages] = useState(1);



  const [musicMood, setMusicMood] = useState("happy");
  const [musicGenre, setMusicGenre] = useState("");
  const [musicInstrument, setMusicInstrument] = useState("");
  const [musicRhythm, setMusicRhythm] = useState("");
  const [musicUseCase, setMusicUseCase] = useState("");
  const [musicQuery, setMusicQuery] = useState("");


  const [type, setType] = useState<"PROMPT" | "SCRIPT">("PROMPT");

  const [currentVoice, setCurrentVoice] = useState<Voice | null>(null);
  const [currentMusic, setCurrentMusic] = useState<Music | null>(null);

  // Pro-only state
  const [trackingPixel, setTrackingPixel] = useState("");
  const [proVoice, setProVoice] = useState<ProVoiceSettings>(DEFAULT_PRO_VOICE);
  const [proMusic, setProMusic] = useState<ProMusicSettings>(DEFAULT_PRO_MUSIC);
  const [proContent, setProContent] =
    useState<ProContentSettings>(DEFAULT_PRO_CONTENT);
  const [advertiserId, setAdvertiserId] = useState<string | null>(null);


  const getAdStatus = async (jobId: string) => {
    const {status, error, message, data} = await adsApi.checkAdStatus(jobId);
    console.log("getAdStatus here ", {status, error, message, data});
    if(status != 200){
      toast({ title: "Error checking ad status", description: message, variant: 'destructive' });
      setIsGenerating(false);
    }else {
      if(data.data.finished){
        if(data.data.error){
          toast({ title: "Error checking ad status", description: "Unable to check Ad Status", variant: 'destructive' });
          setIsGenerating(false);
        }else {
          setIsGenerating(false);
          setGeneratedAd(data.data);
          setEditedScript(data.data.script);
          setType("SCRIPT");
        }
      }else {
        setTimeout(() => {
          getAdStatus(jobId);
        }, 5000);
      }
    }
  };


  const handleSaveAd = useCallback(async (adName: string) => {
    await adsApi.updateAdStatus(jobId, adName);
  }, [jobId]);


  const handleGenerate = useCallback(async () => {
    console.log("handleGenerated here ", {selectedVoice});
    if(!selectedVoice){
      toast({ title: "Error generating ad", description: "No voice selected", variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {

        console.log("handleGenerated here ", {description, goal, gender, language, tone, selectedMusic});


        const contentSettings: Record<string, any> = {};

        if(isPro) {
          contentSettings["volume"] = proContent.volume;
          contentSettings["audioFadeIn"] = proContent.fadeIn;
          contentSettings["audioFadeOut"] = proContent.fadeOut;
          contentSettings["playbackStart"] = proContent.startMs;
          contentSettings["playbackEnd"] = proContent.endMs;
          contentSettings["pixelUrl"] = trackingPixel;

        }

        const {error, status, message, data} = await adsApi.createAd({
          type,
          campaignGoal: goal,
          advertiserId: advertiserId,
          prompt: type === "SCRIPT" && !generatedAd ? description : type === "PROMPT" ? description : editedScript,
          tone: tone,
          voiceId: selectedVoice,
          musicId: selectedMusic || musics[0].externalId,
          ...contentSettings
        });
        console.log("createAd here ", {error, status, message, data});
        if(status != 200){
          toast({
            title: t("ad_creator.generation_failed"),
            description: message,
            variant: "destructive",
          });
          return;
        }
      if (error) throw error;
      const ad = data;
      // setGeneratedAd(ad);
      // setEditedScript(ad.script);
      getAdStatus(data.data.jobId)
      setJobId(data.data.id);
    } catch (err) {
      console.error("Generate error:", err);
      toast({
        title: t("ad_creator.generation_failed"),
        description: t("ad_creator.generation_failed_desc"),
        variant: "destructive",
      });
    } finally {
      //setIsGenerating(false);
    }
  }, [
    advertiserId,
    description,
    goal,
    musics,
    selectedMusic,
    selectedVoice,
    t,
    tone,
  ]);

  const fetchMusicsPage = async (opts: { mood: string; genre: string; instrument: string; rhythm: string; useCase: string; query: string; page: number; reset?: boolean }) => {
    if (!opts.mood) return;
    if (opts.reset) {
      setMusicsLoading(true);
      setMusics([]);
      setMusicsPage(1);
      setMusicsTotalPages(1);
      setSelectedMusic("");
    } else {
      setMusicsLoadingMore(true);
    }

    const { status, error, message, data } = await adsApi.getMusics({
      page: opts.page,
      limit: isPro ? PAGE_SIZE : 3,
      mood: opts.mood,
      genre: opts.genre,
      instrument: opts.instrument,
      rhythm: opts.rhythm,
      use_case: opts.useCase,
      query: opts.query,
    });

    if (status !== 200 || error) {
      toast({ title: "Error loading music", description: message, variant: "destructive" });
      setMusicsLoading(false);
      setMusicsLoadingMore(false);
      return;
    }

    const next = data.data ?? [];
    setMusics((prev) => (opts.page === 1 ? next : [...prev, ...next]));
    setMusicsPage(data.pagination?.page ?? opts.page);
    setMusicsTotalPages(data.pagination?.totalPages ?? 1);
    setMusicsLoading(false);
    setMusicsLoadingMore(false);
  };

  const fetchVoicesPage = async (opts: { gender: string; language: string; tone: string; accent: string; age: string; useCase: string; page: number; reset?: boolean; query?: string }) => {
    if (!opts.gender || !opts.language || !opts.tone) return;
    if (opts.reset) {
      setVoicesLoading(true);
      setVoices([]);
      setVoicesPage(1);
      setVoicesTotalPages(1);
      setSelectedVoice("");
    } else {
      setVoicesLoadingMore(true);
    }

    const { status, error, message, data } = await adsApi.getVoices({
      page: opts.page,
      limit: isPro ? PAGE_SIZE : 3,
      gender: opts.gender,
      language: opts.language,
      characteristic: opts.tone,
      accent: opts.accent,
      age: opts.age,
      useCase: opts.useCase,
      query: opts.query,
    });

    if (status !== 200 || error) {
      toast({ title: t("ad_creator.error_loading_voices"), description: message, variant: "destructive" });
      setVoicesLoading(false);
      setVoicesLoadingMore(false);
      return;
    }

    const next = data.data ?? [];
    setVoices((prev) => (opts.page === 1 ? next : [...prev, ...next]));
    setVoicesPage(data.pagination?.page ?? opts.page);
    setVoicesTotalPages(data.pagination?.totalPages ?? 1);
    setVoicesLoading(false);
    setVoicesLoadingMore(false);
  };

  const loadMoreVoices = useCallback(() => {
    if (!isPro) return;
    if (voicesLoading || voicesLoadingMore) return;
    if (voicesPage >= voicesTotalPages) return;
    void fetchVoicesPage({ gender, language, tone, accent, age, useCase, page: voicesPage + 1 });
  }, [accent, gender, isPro, language, tone, voicesLoading, voicesLoadingMore, voicesPage, voicesTotalPages]);

  const loadMoreMusics = useCallback(() => {
    if (!isPro) return;
    if (musicsLoading || musicsLoadingMore) return;
    if (musicsPage >= musicsTotalPages) return;
    void fetchMusicsPage({ mood: musicMood, genre: musicGenre, instrument: musicInstrument, rhythm: musicRhythm, useCase: musicUseCase, query: musicQuery, page: musicsPage + 1 });
  }, [isPro, musicMood, musicGenre, musicInstrument, musicRhythm, musicUseCase, musicsLoading, musicsLoadingMore, musicsPage, musicsTotalPages, musicQuery]);

  const handleSaved = async () => {
  
    // const session = getStoredSession();
    // if (!session) {
    //   toast({ title: "Session not found", variant: "destructive" });
    //   return;
    // }

    // const { status, error, message } = await adsApi.uploadFile(file);


    // const { status, error, message } = await adsApi.uploadAudioAd({
    //   type: 1,
    //   campaignGoal: goal,
    //   advertiserId: advertiserId,
    //   prompt: description,
    //   tone: tone,
    //   voiceId: selectedVoice,
    //   musicId: selectedMusic || musics[0].externalId
    // });
    navigate("/dashboard/ads")
  };

  useEffect(() => {
    if (gender && language && tone) {
      void fetchVoicesPage({ gender, language, tone, accent, age, useCase, page: 1, reset: true, query });
    }
  }, [gender, language, tone, accent, query, age, useCase]);

  useEffect(() => {
      void fetchMusicsPage({ mood: musicMood, genre: musicGenre, instrument: musicInstrument, rhythm: musicRhythm, useCase: musicUseCase, query: musicQuery, page: 1, reset: true });
  }, [musicMood, musicGenre, musicInstrument, musicRhythm, musicUseCase, musicQuery]);

  useEffect(() => {
    const getAdFromParams = async () => {
      const adId = new URLSearchParams(window.location.search).get('ad');
      const session = await auth.getSession();
      if(!session) return;

      if(adId){
        const {data} = await adsApi.getAd(adId, session.data.session.currentAdvertiserId);
        console.log("getAdFromParams here ", {data});
        if(data){
          setDescription(data.data.generatedScript);
          setGoal(data.data.campaignGoal);
          setType("SCRIPT");

          const {status: voiceStatus, error: voiceError, message: voiceMessage, data: voiceData} = await adsApi.getVoice(data.data.voiceId)
          console.log("getVoiceData here ", {voiceStatus, voiceError, voiceMessage, voiceData});
          if(voiceStatus != 200){
            toast({ title: "Error loading current voice", description: voiceMessage, variant: 'destructive' });
          }else {
            setCurrentVoice(voiceData.data);
            setSelectedVoice(voiceData.data.externalId);
          }

          const {status: musicStatus, error: musicError, message: musicMessage, data: musicData} = await adsApi.getMusic(data.data.musicId)
          console.log("getMusicData here ", {musicStatus, musicError, musicMessage, musicData});
          if(musicStatus != 200){
            toast({ title: "Error loading current music", description: musicMessage, variant: 'destructive' });
          }else {
            setCurrentMusic(musicData.data);
            setSelectedMusic(musicData.data.externalId);
          }
        }
      }
    };

    getAdFromParams();

    const load = async () => {
      const {
        data: { session },
      } = await auth.getSession();
      if (!session) return;

      if(!session.currentAdvertiserId){
        const {status, error, message, data} = await advertiserApi.getAdvertisers(session.currentOrganizationId);
        if(status != 200){
          toast({
            title: t("ad_creator.error_loading_advertisers"),
            description: message,
            variant: "destructive",
          });
          return;
        }
        const advertisers = data.data;
        if(advertisers.length > 0){
          auth.setCurrentAdvertiserId(advertisers[0].id, advertisers[0].isPro);
          setAdvertiserId(advertisers[0].id);
        }
      }else {
        setAdvertiserId(session.currentAdvertiserId);
      }

    };
    load();
  }, []);


  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("ad_creator.title")}</h1>
          <p className="text-muted-foreground">{t("ad_creator.subtitle")}</p>
      </div>

      {/* Mode Switcher — Pro only */}
      {isPro && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('ai')}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
              mode === 'ai'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/40'
            )}
          >
            <Sparkles className={cn('h-5 w-5 shrink-0', mode === 'ai' ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <p className="text-sm font-medium text-foreground">{t("ad_creator.ai_mode_title")}</p>
              <p className="text-xs text-muted-foreground">{t("ad_creator.ai_mode_desc")}</p>
            </div>
          </button>
          <button
            onClick={() => setMode('upload')}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
              mode === 'upload'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/40'
            )}
          >
            <Upload className={cn('h-5 w-5 shrink-0', mode === 'upload' ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <p className="text-sm font-medium text-foreground">{t("ad_creator.upload_mode_title")}</p>
              <p className="text-xs text-muted-foreground">{t("ad_creator.upload_mode_desc")}</p>
            </div>
          </button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {mode === "ai" ? (
            <AdCreatorForm
              age={age}
              onAgeChange={setAge}
              useCase={useCase}
              onUseCaseChange={setUseCase}
              onQueryChange={setQuery}
              description={description}
              onDescriptionChange={setDescription}
              goal={goal}
              onGoalChange={setGoal}
              language={language}
              onLanguageChange={setLanguage}
              gender={gender}
              onGenderChange={setGender}
              accent={accent}
              onAccentChange={setAccent}
              tone={tone}
              onToneChange={setTone}

              type={type}
              
              musicMood={musicMood}
              onMusicMoodChange={setMusicMood}
              musicGenre={musicGenre}
              onMusicGenreChange={setMusicGenre}
              musicInstrument={musicInstrument}
              onMusicInstrumentChange={setMusicInstrument}
              musicRhythm={musicRhythm}
              onMusicRhythmChange={setMusicRhythm}
              musicUseCase={musicUseCase}
              onMusicUseCaseChange={setMusicUseCase}
              onMusicQueryChange={setMusicQuery}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              generatedAd={generatedAd}
              editedScript={editedScript}
              onScriptChange={setEditedScript}
              onSaved={handleSaved}
              onRegenerate={handleGenerate}
              isRegenerating={isGenerating}
              isPro={isPro}
              trackingPixel={trackingPixel}
              onTrackingPixelChange={setTrackingPixel}
              proVoiceSettings={proVoice}
              onProVoiceSettingsChange={setProVoice}
              proMusicSettings={proMusic}
              onProMusicSettingsChange={setProMusic}
              proContentSettings={proContent}
              onProContentSettingsChange={setProContent}
              voices={voices}
              voicesLoading={voicesLoading}
              voicesLoadingMore={voicesLoadingMore}
              voicesHasMore={isPro ? voicesPage < voicesTotalPages : false}
              onLoadMoreVoices={loadMoreVoices}
              musics={musics}
              musicsLoading={musicsLoading}
              musicsLoadingMore={musicsLoadingMore}
              musicsHasMore={isPro ? musicsPage < musicsTotalPages : false}
              onLoadMoreMusics={loadMoreMusics}
              handleSaveAd={handleSaveAd}
              selectedVoice={selectedVoice}
              selectedMusic={selectedMusic}
              onSelectedVoiceChange={setSelectedVoice}
              onSelectedMusicChange={setSelectedMusic}
              currentVoice={currentVoice}
              currentMusic={currentMusic}
            />
          ) : (
            <UploadAdForm onSaved={handleSaved} />
          )}
        </CardContent>
      </Card>

      {mode === 'ai' && (
        <AdGeneratingModal open={isGenerating} onCancel={() => setIsGenerating(false)} />
      )}
    </div>
  );
}
