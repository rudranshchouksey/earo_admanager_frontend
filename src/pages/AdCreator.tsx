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
import { auth, AuthSession } from "@/services/auth";
import { Advertiser, advertiserApi } from "@/services/advertiser";
import { Ad, adsApi, AdStatusResponse, Music, Voice } from "@/services/ads";

type AdMode = "ai" | "upload";

const DEFAULT_PRO_VOICE: ProVoiceSettings = {
  voiceId: "",
  language: "",
  accent: "neutral",
  gender: "female",
  useCase: "commercial",
  characteristics: "warm",
  age: "young",
};
const DEFAULT_PRO_MUSIC: ProMusicSettings = {
  musicId: "",
  useCase: "commercial",
  mood: "uplifting",
  genre: "pop",
  instrument: "any",
  rhythm: "steady",
};
const DEFAULT_PRO_CONTENT: ProContentSettings = {
  fadeInMs: 500,
  fadeOutMs: 500,
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
  const [voice, setVoice] = useState("female-en");
  const [tone, setTone] = useState("friendly");
  const [music, setMusic] = useState("happy");
  const [language, setLanguage] = useState("en");
  const [gender, setGender] = useState("female");

  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);

  const [musics, setMusics] = useState<Music[]>([]);
  const [musicsLoading, setMusicsLoading] = useState(true);


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
        }
      }else {
        setTimeout(() => {
          getAdStatus(jobId);
        }, 5000);
      }
    }
  };


  const handleRegenerate = useCallback(async () => {

    console.log("handleRegenerated here ", {editedScript});
    if(!editedScript){
      toast({ title: "Error regenerating ad", description: "No script to regenerate", variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {

        console.log("handleRegenerated here ", {description, goal, gender, language, tone, music});
        const {error, status, message, data} = await adsApi.createAd({
          type: 2,
          campaignGoal: goal,
          advertiserId: advertiserId,
          prompt: editedScript,
          tone: tone,
          voiceId: voices[0].externalId,
          musicId: musics[0].externalId
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
      //setGeneratedAd(ad);
      // setEditedScript(ad.script);
      getAdStatus(data.data.jobId)
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
  }, [description, goal, t]);


  const handleSaveAd = useCallback(async (adName: string) => {
    await adsApi.updateAdStatus(jobId, adName);
  }, [jobId]);


  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {

        console.log("handleGenerated here ", {description, goal, gender, language, tone, music});
        const {error, status, message, data} = await adsApi.createAd({
          type: 1,
          campaignGoal: goal,
          advertiserId: advertiserId,
          prompt: description,
          tone: tone,
          voiceId: voices[0].externalId,
          musicId: musics[0].externalId
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
  }, [description, goal, t]);

  const getMusics = async (mood) => {
    setMusicsLoading(true);
    const {status, error, message, data} = await adsApi.getMusics({
      page: 1,
      limit: 1,
      mood: mood
    });
    console.log("loadMusics here ", {status, error, message, data});
    if(status != 200){
      toast({ title: "Error loading music", description: message, variant: 'destructive' });
    }else {
      setMusics(data.data);
      setMusicsLoading(false);
    }
  };
  const getVoices = async (gender: string, language: string, tone: string) => {
    setVoicesLoading(true);
    console.log("getVoices here ", {gender, language, tone});
    const {status, error, message, data} = await adsApi.getVoices({
      page: 1,
      limit: 1,
      gender: gender,
      language: language,
      characteristic: tone,
    });
    console.log("loadVoices here ", {status, error, message, data});
    if(status != 200){
      toast({ title: t('ad_creator.error_loading_voices'), description: message, variant: 'destructive' });
    }else {
      setVoices(data.data);
      setVoicesLoading(false);
    }
  };

  const handleSaved = () => navigate("/dashboard/ads");

  useEffect(() => {
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
          auth.setCurrentAdvertiserId(advertisers[0].id);
          setAdvertiserId(advertisers[0].id);
        }
      }else {
        setAdvertiserId(session.currentAdvertiserId);
      }

    };
    load();
  }, []);


  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("ad_creator.title")}
        </h1>
        <p className="text-muted-foreground">{t("ad_creator.subtitle")}</p>
      </div>

      {/* Mode Switcher — Pro only */}
      {isPro && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("ai")}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
              mode === "ai"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40",
            )}
          >
            <Sparkles
              className={cn(
                "h-5 w-5 shrink-0",
                mode === "ai" ? "text-primary" : "text-muted-foreground",
              )}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("ad_creator.ai_mode_title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("ad_creator.ai_mode_desc")}
              </p>
            </div>
          </button>
          <button
            onClick={() => setMode("upload")}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
              mode === "upload"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40",
            )}
          >
            <Upload
              className={cn(
                "h-5 w-5 shrink-0",
                mode === "upload" ? "text-primary" : "text-muted-foreground",
              )}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("ad_creator.upload_mode_title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("ad_creator.upload_mode_desc")}
              </p>
            </div>
          </button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {mode === "ai" ? (
            <AdCreatorForm
              description={description}
              onDescriptionChange={setDescription}
              goal={goal}
              onGoalChange={setGoal}
              language={language}
              onLanguageChange={setLanguage}
              gender={gender}
              onGenderChange={setGender}
              voice={voice}
              onVoiceChange={setVoice}
              tone={tone}
              onToneChange={setTone}
              music={music}
              onMusicChange={setMusic}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              generatedAd={generatedAd}
              editedScript={editedScript}
              onScriptChange={setEditedScript}
              onSaved={handleSaved}
              onRegenerate={handleRegenerate}
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
              getVoices={getVoices}
              voicesLoading={voicesLoading}
              musics={musics}
              getMusics={getMusics}
              musicsLoading={musicsLoading}
              handleSaveAd={handleSaveAd}
            />
          ) : (
            <UploadAdForm onSaved={handleSaved} />
          )}
        </CardContent>
      </Card>

      {mode === "ai" && (
        <AdGeneratingModal
          open={isGenerating}

          onCancel={() => setIsGenerating(false)}
        />
      )}
    </div>
  );
}
