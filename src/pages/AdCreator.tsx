import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Upload } from "lucide-react";
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
import {
  Ad,
  adsApi,
  AdStatusResponse,
  Music,
  Recommendation,
  Voice,
  VoxifyPollResponse,
  VoxifyVoice,
  VoxifyTrack,
  mapAssetToVoxifyResult,
} from "@/services/ads";
import { MyTooltip } from "@/components/ui/MyTooltip";
import { Helmet } from "react-helmet-async";
import VoxifyForm from "@/components/dashboard/ad-creator/VoxifyForm";
import {
  goalPlaceholders,
  goalPlaceholdersHtml,
} from "@/components/sdui/blocks/CampaignGoal";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 5;

type AdMode = "ai" | "upload" | "script" | "legacy";

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
  startMs: 2000,
  endMs: 25000,
  volume: 50,
};

export default function AdCreator() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();
  const { id } = useParams<{ id: string }>();

  const [mode, setMode] = useState<AdMode>("ai");
  const [generatedAd, setGeneratedAd] = useState<AdStatusResponse | null>(null);
  const [editedScript, setEditedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobId, setJobId] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("sales");
  const [query, setQuery] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [accent, setAccent] = useState("all");
  const [tone, setTone] = useState("upbeat");
  const [selectedMusic, setSelectedMusic] = useState("");

  const [language, setLanguage] = useState("en");
  const [gender, setGender] = useState("female");
  const [age, setAge] = useState("all");
  const [useCase, setUseCase] = useState("all");

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
  const [loadedExistingCampaign, setLoadedExistingCampaign] = useState(false);

  // Voxify state
  const [voxifyType, setVoxifyType] = useState<"PROMPT" | "SCRIPT">("PROMPT");
  const [voxifyGoal, setVoxifyGoal] = useState("sales");
  const [voxifyDescription, setVoxifyDescription] = useState("");
  const [voxifyPlainText, setVoxifyPlainText] = useState("");
  const [voxifyGenerating, setVoxifyGenerating] = useState(false);
  const [voxifyError, setVoxifyError] = useState<string | null>(null);
  // REMOVE the default job id 86814a13-c81c-4679-ba13-83a2a5c1fef1
  const [voxifyJobId, setVoxifyJobId] = useState("");
  const [voxifyAd, setVoxifyAd] = useState<
    VoxifyPollResponse["data"]["result"] | null
  >(null);

  const [hideTopOptions, setHideTopOptions] = useState(false);

  const getAdStatus = async (jobId: string) => {
    const { status, error, message, data } = await adsApi.checkAdStatus(jobId);
    console.log("getAdStatus here ", { status, error, message, data });
    if (status != 200) {
      toast({
        title: "Error checking ad status",
        description: message,
        variant: "destructive",
      });
      setIsGenerating(false);
    } else {
      if (data.data.finished) {
        if (data.data.error) {
          toast({
            title: "Error checking ad status",
            description: "Unable to check Ad Status",
            variant: "destructive",
          });
          setIsGenerating(false);
        } else {
          setIsGenerating(false);
          setGeneratedAd(data.data);
          setEditedScript(data.data.script);
          setType("SCRIPT");
        }
      } else {
        setTimeout(() => {
          getAdStatus(jobId);
        }, 5000);
      }
    }
  };

  const handleSaveAd = useCallback(
    async (adName: string) => {
      await adsApi.updateAdStatus(jobId, adName);
    },
    [jobId],
  );

  const handleGenerate = async () => {
    console.log("handleGenerated here ", { selectedVoice });
    if (!selectedVoice) {
      toast({
        title: "Error generating ad",
        description: "No voice selected",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setHideTopOptions(true);
    try {
      console.log("handleGenerated here ", {
        description,
        goal,
        gender,
        language,
        tone,
        selectedMusic,
      });

      const contentSettings: Record<string, any> = {};
      console.log("isPro here ", isPro);

      if (isPro && selectedMusic) {
        contentSettings["volume"] = proContent.volume;
        contentSettings["audioFadeIn"] = proContent.fadeIn;
        contentSettings["audioFadeOut"] = proContent.fadeOut;
        contentSettings["playbackStart"] = proContent.startMs;
        contentSettings["playbackEnd"] = proContent.endMs;
        contentSettings["pixelUrl"] = trackingPixel;
      }

      console.log("proContent here ", proContent);

      const { error, status, message, data } = await adsApi.createAd({
        type,
        campaignGoal: goal,
        advertiserId: advertiserId,
        prompt:
          type === "SCRIPT" && !generatedAd
            ? description
            : type === "PROMPT"
              ? description
              : editedScript,
        tone: tone,
        voiceId: selectedVoice,
        musicId: selectedMusic,
        ...contentSettings,
      });
      console.log("createAd here ", { error, status, message, data });
      if (status != 200) {
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
      getAdStatus(data.data.jobId);
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
  };

  const fetchMusicsPage = async (opts: {
    mood: string;
    genre: string;
    instrument: string;
    rhythm: string;
    useCase: string;
    query: string;
    page: number;
    reset?: boolean;
  }) => {
    if (!opts.mood) return;
    if (opts.reset) {
      setMusicsLoading(true);
      setMusics([]);
      setMusicsPage(1);
      setMusicsTotalPages(1);
      //setSelectedMusic("");
    } else {
      setMusicsLoadingMore(true);
    }

    const { status, error, message, data } = await adsApi.getMusics({
      page: opts.page,
      limit: isPro ? PAGE_SIZE : 10,
      mood: opts.mood === "" || opts.mood === "all" ? null : opts.mood,
      genre: opts.genre === "" || opts.genre === "all" ? null : opts.genre,
      instrument:
        opts.instrument === "" || opts.instrument === "all"
          ? null
          : opts.instrument,
      rhythm: opts.rhythm === "" || opts.rhythm === "all" ? null : opts.rhythm,
      use_case:
        opts.useCase === "" || opts.useCase === "all" ? null : opts.useCase,
      query: opts.query,
    });

    if (status !== 200 || error) {
      toast({
        title: "Error loading music",
        description: message,
        variant: "destructive",
      });
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

  const fetchVoicesPage = async (opts: {
    gender: string;
    language: string;
    tone: string;
    accent: string;
    age: string;
    useCase: string;
    page: number;
    reset?: boolean;
    query?: string;
  }) => {
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
      limit: isPro ? PAGE_SIZE : 10,
      gender: opts.gender === "" ? null : opts.gender,
      language:
        opts.language === "" || opts.language === "all" ? null : opts.language,
      characteristic:
        opts.tone === "" || opts.tone === "all" ? null : opts.tone,
      accent: opts.accent === "" || opts.accent === "all" ? null : opts.accent,
      age: opts.age === "" || opts.age === "all" ? null : opts.age,
      useCase: "",
      query: opts.query,
    });

    if (status !== 200 || error) {
      toast({
        title: t("ad_creator.error_loading_voices"),
        description: message,
        variant: "destructive",
      });
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
    void fetchVoicesPage({
      gender,
      language,
      tone,
      accent,
      age,
      useCase,
      page: voicesPage + 1,
    });
  }, [
    accent,
    gender,
    isPro,
    language,
    tone,
    voicesLoading,
    voicesLoadingMore,
    voicesPage,
    voicesTotalPages,
  ]);

  const loadMoreMusics = useCallback(() => {
    if (!isPro) return;
    if (musicsLoading || musicsLoadingMore) return;
    if (musicsPage >= musicsTotalPages) return;
    void fetchMusicsPage({
      mood: musicMood,
      genre: musicGenre,
      instrument: musicInstrument,
      rhythm: musicRhythm,
      useCase: musicUseCase,
      query: musicQuery,
      page: musicsPage + 1,
    });
  }, [
    isPro,
    musicMood,
    musicGenre,
    musicInstrument,
    musicRhythm,
    musicUseCase,
    musicsLoading,
    musicsLoadingMore,
    musicsPage,
    musicsTotalPages,
    musicQuery,
  ]);

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
    navigate("/dashboard/ads");
  };

  useEffect(() => {
    if (mode === "legacy" || mode === "ai") {
      setType("PROMPT");
      setVoxifyType("PROMPT");
      setVoxifyGoal("sales");
      setVoxifyDescription(goalPlaceholdersHtml[voxifyGoal]);
    } else if (mode === "script") {
      setType("SCRIPT");
      setVoxifyType("SCRIPT");
      setVoxifyDescription("");
    }
  }, [mode]);

  useEffect(() => {
    if (gender && language && tone) {
      void fetchVoicesPage({
        gender,
        language,
        tone,
        accent,
        age,
        useCase,
        page: 1,
        reset: true,
        query,
      });
    }
  }, [gender, language, tone, accent, query, age, useCase]);

  useEffect(() => {
    void fetchMusicsPage({
      mood: musicMood,
      genre: musicGenre,
      instrument: musicInstrument,
      rhythm: musicRhythm,
      useCase: musicUseCase,
      query: musicQuery,
      page: 1,
      reset: true,
    });
  }, [
    musicMood,
    musicGenre,
    musicInstrument,
    musicRhythm,
    musicUseCase,
    musicQuery,
  ]);

  useEffect(() => {
    if (id) {
      const loadExistingAd = async (adId: string) => {
        const session = getStoredSession();
        if (!session) {
          toast({ title: "Session not found", variant: "destructive" });
          return;
        }

        const { data } = await adsApi.getAd(adId, session.currentAdvertiserId);
        console.log("getAdFromParams here ", { data });
        if (data) {
          if (data.data.source === "V0") {
            setDescription(data.data.generatedScript);
            setGoal(data.data.campaignGoal);
            setType("SCRIPT");

            setProContent({
              ...proContent,
              startMs: data.data.playbackStart || 0,
              endMs: data.data.playbackEnd || 30000,
              volume: data.data.volume || 50,
              fadeIn: data.data.audioFadeIn || true,
              fadeOut: data.data.audioFadeOut || true,
            });

            const {
              status: voiceStatus,
              error: voiceError,
              message: voiceMessage,
              data: voiceData,
            } = await adsApi.getVoice(data.data.voiceId);
            console.log("getVoiceData here ", {
              voiceStatus,
              voiceError,
              voiceMessage,
              voiceData,
            });
            if (voiceStatus != 200) {
              toast({
                title: "Error loading current voice",
                description: voiceMessage,
                variant: "destructive",
              });
            } else {
              setCurrentVoice(voiceData.data);
              setSelectedVoice(voiceData.data.externalId);
            }

            if (data.data.musicId) {
              const {
                status: musicStatus,
                error: musicError,
                message: musicMessage,
                data: musicData,
              } = await adsApi.getMusic(data.data.musicId);
              console.log("getMusicData here ", {
                musicStatus,
                musicError,
                musicMessage,
                musicData,
              });
              if (musicStatus != 200) {
                toast({
                  title: "Error loading current music",
                  description: musicMessage,
                  variant: "destructive",
                });
              } else {
                setCurrentMusic(musicData.data);
                setSelectedMusic(musicData.data.externalId);
              }
            }

            setLoadedExistingCampaign(true);
          } else if (data.data.source === "V1") {
            setJobId(data.data.jobId);
            setVoxifyJobId(data.data.jobId);
            if (data.data.type === "PROMPT")
              pollVoxifyJob(data.data.jobId, data.data.compositionId);
            else {
              const genAiMetadata = JSON.parse(data.data.genAiMetadata || "{}");
              const voice = genAiMetadata.voice;
              const track = genAiMetadata.track;
              const voiceVolume = genAiMetadata.voiceVolume;
              const musicVolume = genAiMetadata.musicVolume;
              const classification = genAiMetadata.classification;
              let voices = [];
              let tracks = [];

              console.log({
                voice,
                track,
                musicVolume,
                voiceVolume,
                classification,
              });

              const recommendation = data.assets?.result.find(
                (item) =>
                  item.reference.composition_id === data.data.compositionId,
              );

              if (recommendation) {
                voices = recommendation.voices;
                tracks = recommendation.tracks;

                if (!voices.find((v) => v.voice_id === voice.voice_id)) {
                  voices.push(voice);
                }

                if (
                  track &&
                  !tracks.find((t) => t.track_id === track.track_id)
                ) {
                  tracks.push(track);
                }
              }

              const _voxifyAd: VoxifyPollResponse["data"]["result"] = {
                project_id: "EARO",
                product: {
                  name: "EARO",
                  description: "EARO",
                },
                duration: Math.round(data.data.duration) || 30,
                recommendations: [
                  {
                    sourceUrl: data.data.sourceUrl,
                    generated: true,
                    generating: false,
                    isEdited: false,
                    id: data.data.id,
                    script: {
                      text: data.data.generatedScript
                        ?.replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
                        .replace(/\.\s/g, ". <br />"),
                      text_plain: data.data.generatedScript,
                      name: data.data.adName,
                      classification: classification,
                    },
                    voices: voices,
                    tracks: tracks,
                    clips: [
                      {
                        vocal: {
                          start: 820,
                          end: 30000,
                          "rms-dbfs": voiceVolume,
                        },
                        music: {
                          start: 30,
                          end: 29930,
                          "rms-dbfs": musicVolume,
                        },
                      },
                    ],
                    voice: voice,
                    track: track,
                    reference: {
                      composition_id: data.data.compositionId,
                    },
                  },
                ],
              };

              setVoxifyAd({ ..._voxifyAd });
              setLoadedExistingCampaign(true);
            }
          }
        }
      };
      loadExistingAd(id);
    }

    const load = async () => {
      const {
        data: { session },
      } = await auth.getSession();
      if (!session) return;

      if (!session.currentAdvertiserId) {
        const { status, error, message, data } =
          await advertiserApi.getAdvertisers(session.currentOrganizationId);
        if (status != 200) {
          toast({
            title: t("ad_creator.error_loading_advertisers"),
            description: message,
            variant: "destructive",
          });
          return;
        }
        const advertisers = data.data;
        if (advertisers.length > 0) {
          auth.setCurrentAdvertiserId(advertisers[0].id, advertisers[0].isPro);
          setAdvertiserId(advertisers[0].id);
        }
      } else {
        setAdvertiserId(session.currentAdvertiserId);
      }
    };
    load();
  }, []);

  useEffect(() => {
    console.log("voxifyAd useEffect here ", { voxifyAd });
    if (voxifyAd) {
      const isFirstTime = !voxifyAd.recommendations.some(
        (recommendation) => recommendation.generated,
      );
      const isGenerating = voxifyAd.recommendations.some(
        (recommendation) => recommendation.generating,
      );
      if (isFirstTime && !isGenerating) {
        generateVoxifyAd(0);
      }
    }
  }, [voxifyAd]);

  const saveVoxifyAd = async (id: string, name: string, index: number) => {
    const { status, error, message, data } = await adsApi.updateAdStatus(
      id,
      name,
      voxifyAd.recommendations[index].clips[0].vocal["rms-dbfs"],
      voxifyAd.recommendations[index].clips[0].music["rms-dbfs"],
    );
    console.log("saveVoxifyAd here ", { status, error, message, data });
    if (status !== 200) {
      toast({
        title: "Error saving ad",
        description: message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Ad saved successfully",
      description: "Ad saved successfully",
      variant: "default",
    });
    //navigate("/dashboard/ads");
  };

  const updateScript = (
    recommendIndex: number,
    script: { text_plain: string; text: string },
  ) => {
    console.log("updateScript here ", { recommendIndex, script });
    const _voxifyAd = voxifyAd;
    _voxifyAd.recommendations[recommendIndex].script.text = script.text;
    _voxifyAd.recommendations[recommendIndex].script.text_plain =
      script.text_plain;
    setVoxifyAd({ ..._voxifyAd });
  };

  const regenerateVoxifyAd = async (
    recommendIndex: number,
    voice: object,
    track: object,
    voiceVolume: number,
    musicVolume: number,
  ) => {
    console.log("regenerateVoxifyAd here ", { recommendIndex, voice, track });

    const _voxifyAd = voxifyAd;
    _voxifyAd.recommendations[recommendIndex].generating = true;
    _voxifyAd.recommendations[recommendIndex].generated = false;
    _voxifyAd.recommendations[recommendIndex].voice = voice as VoxifyVoice;
    _voxifyAd.recommendations[recommendIndex].track = track as VoxifyTrack;
    _voxifyAd.recommendations[recommendIndex].isEdited = true;
    _voxifyAd.recommendations[recommendIndex].sourceUrl = "";
    _voxifyAd.recommendations[recommendIndex].clips[0].vocal["rms-dbfs"] =
      voiceVolume;
    _voxifyAd.recommendations[recommendIndex].clips[0].music["rms-dbfs"] =
      musicVolume;
    setVoxifyAd({ ..._voxifyAd });

    const { status, error, message, data } = await adsApi.regenerateAudioAd({
      adScript: voxifyAd.recommendations[recommendIndex].script.text_plain.replace(/\n/g, ' ').replace(/<strong>(.*?)<\/strong>/g, "$1").replace(/\.\s*<br\s*\/?>/g, ". "),
      compositionId:
        voxifyAd.recommendations[recommendIndex].reference.composition_id,
      jobId: voxifyJobId,
      voice: voice,
      track: track,
      voiceVolume: voiceVolume,
      musicVolume: musicVolume,
    });

    console.log("generateAudioAd here ", { status, error, message, data });

    if (status !== 200 || !data.data?.sourceUrl) {
      toast({
        title: "Error",
        content: "Error generating audio ad",
        variant: "destructive",
      });
      return;
    }

    const genAiMetadata = JSON.parse(data?.data?.genAiMetadata || "{}");

    _voxifyAd.recommendations[recommendIndex].generated = true;
    _voxifyAd.recommendations[recommendIndex].generating = false;
    _voxifyAd.recommendations[recommendIndex].sourceUrl = data.data?.sourceUrl;
    _voxifyAd.recommendations[recommendIndex].voice =
      genAiMetadata.voice as VoxifyVoice;
    _voxifyAd.recommendations[recommendIndex].track =
      genAiMetadata.track as VoxifyTrack;
    _voxifyAd.recommendations[recommendIndex].id = data.data?.id;

    setVoxifyAd({ ..._voxifyAd });

    console.log("setVoxifyAd here ", { _voxifyAd });
  };

  const generateVoxifyAd = async (
    recommendIndex: number,
    jobId?: string,
    sourceVoxifyAd?: VoxifyPollResponse["data"]["result"],
  ) => {
    const session = getStoredSession();
    if (!session) {
      toast({ title: "Session not found", variant: "destructive" });
      return;
    }

    setHideTopOptions(true);

    console.log("generateVoxifyAd here ", { recommendIndex, voxifyAd });
    const _voxifyAd = voxifyAd || sourceVoxifyAd;
    _voxifyAd.recommendations[recommendIndex].generating = true;
    console.log("setVoxifyAd here ", { _voxifyAd });
    setVoxifyAd({ ..._voxifyAd });
    const { status, error, message, data } = await adsApi.generateAudioAd({
      adScript: _voxifyAd.recommendations[recommendIndex].script.text.replace(/\n/g, ' ').replace(/<strong>(.*?)<\/strong>/g, "$1").replace(/\.\s*<br\s*\/?>/g, ". "),
      compositionId:
        _voxifyAd.recommendations[recommendIndex].reference.composition_id,
      jobId: jobId || voxifyJobId,
      advertiserId: advertiserId || session.currentAdvertiserId,
    });

    console.log("generateAudioAd here ", { status, error, message, data });

    if (status !== 200 || !data.data?.sourceUrl) {
      toast({
        title: "Error",
        content: "Error generating audio ad",
        variant: "destructive",
      });
      return;
    }

    const genAiMetadata = JSON.parse(data?.data?.genAiMetadata || "{}");

    _voxifyAd.recommendations[recommendIndex].generated = true;
    _voxifyAd.recommendations[recommendIndex].generating = false;
    _voxifyAd.recommendations[recommendIndex].sourceUrl = data.data?.sourceUrl;
    _voxifyAd.recommendations[recommendIndex].voice =
      genAiMetadata.voice as VoxifyVoice;
    _voxifyAd.recommendations[recommendIndex].track =
      genAiMetadata.track as VoxifyTrack;
    _voxifyAd.recommendations[recommendIndex].id = data.data?.id;

    console.log("setVoxifyAd here ", { _voxifyAd });

    setVoxifyAd({ ..._voxifyAd });
  };

  const pollVoxifyJob = async (jobId: string, compositionId?: string) => {
    const { status, error, message, data } = await adsApi.getVoxifyPoll(jobId);
    console.log("getVoxifyPoll here ", { status, error, message, data });
    if (status != 200) {
      toast({
        title: "Error polling voxify job",
        description: message,
        variant: "destructive",
      });
      setVoxifyGenerating(false);
      setLoadedExistingCampaign(true);
      return;
    }

    if (!data.data?.success) {
      toast({
        title: "Error polling voxify job",
        description: message,
        variant: "destructive",
      });
      setVoxifyGenerating(false);
      setLoadedExistingCampaign(true);
      return;
    }

    if (data.data?.status === "completed") {
      setVoxifyGenerating(false);
      const _voxifyAd = data?.data?.result;

      for (let i = 0; i < _voxifyAd.recommendations.length; i++) {
        _voxifyAd.recommendations[i].generated = false;
        _voxifyAd.recommendations[i].generating = false;
        _voxifyAd.recommendations[i].isEdited = false;
        _voxifyAd.recommendations[i].id =
          data.data?.result.recommendations[i].id;
        _voxifyAd.recommendations[i].script.text = _voxifyAd.recommendations[
          i
        ].script.text
          .replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
          .replace(/\.\s/g, ". <br />");
      }

      if (compositionId) {
        _voxifyAd.recommendations = _voxifyAd.recommendations.filter(
          (recommendation) =>
            recommendation.reference.composition_id === compositionId,
        );
        _voxifyAd.recommendations[0].generating = true;
      }

      setVoxifyAd({ ..._voxifyAd });

      if (compositionId) {
        setTimeout(() => {
          generateVoxifyAd(0, jobId, _voxifyAd);
        }, 2000);
      }
    } else {
      setTimeout(() => {
        pollVoxifyJob(jobId);
      }, 5000);
    }
    setLoadedExistingCampaign(true);
  };

  const handleVoxifyGenerate = async () => {
    console.log("handleVoxifyGenerate here ", { voxifyPlainText });

    setVoxifyGenerating(true);
    setHideTopOptions(true);

    try {
      console.log("handleVoxifyGenerate here ", {
        voxifyPlainText,
      });

      const { error, status, message, data } =
        await adsApi.generateRecommendation({
          campaignGoal: voxifyGoal,
          advertiserId: advertiserId,
          productDescription: voxifyPlainText.replace(/\n/g, ' '),
          type: voxifyType as "PROMPT" | "SCRIPT",
        });
      console.log("createAd with PROMPT here ", {
        error,
        status,
        message,
        data,
      });
      if (status != 200) {
        toast({
          title: t("ad_creator.generation_failed"),
          description: "Error generating ad",
          variant: "destructive",
        });
        setVoxifyGenerating(false);
        setHideTopOptions(false);
        setVoxifyError(message || "Error generating ad");
        return;
      }
      if (error) throw error;
      // const ad = data;
      // setGeneratedAd(ad);
      // setEditedScript(ad.script);
      // getAdStatus(data.data.jobId);
      // setJobId(data.data.id);
      if (voxifyType === "PROMPT") {
        setVoxifyJobId(data.data?.jobId);
        pollVoxifyJob(data.data?.jobId);
      } else {
        if (!data.assets) {
          toast({
            title: t("ad_creator.generation_failed"),
            description: message || t("ad_creator.generation_failed_desc"),
            variant: "destructive",
          });
          setVoxifyGenerating(false);
          setHideTopOptions(false);
          setVoxifyError("Error generating ad");
          return;
        }

        if (data.data?.jobId) {
          setVoxifyJobId(data.data.jobId);
        }

        setVoxifyAd(mapAssetToVoxifyResult(data.assets));
        setVoxifyGenerating(false);
        setLoadedExistingCampaign(true);
      }
    } catch (err) {
      console.error("Generate error:", err);
      toast({
        title: t("ad_creator.generation_failed"),
        description: t("ad_creator.generation_failed_desc"),
        variant: "destructive",
      });
      setVoxifyGenerating(false);
      setHideTopOptions(false);
      setVoxifyError(
        t("ad_creator.generation_failed_desc") || "Error generating ad",
      );
    } finally {
      //setIsGenerating(false);
      //setVoxifyGenerating(false);
    }
  };

  useEffect(() => {
    setVoxifyDescription(goalPlaceholdersHtml[voxifyGoal]);
  }, [voxifyGoal]);

  if (id && !loadedExistingCampaign)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin mr-2" />
        Loading ad data...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      <Helmet>
        <title>EARO | Let's build your audio ad</title>
      </Helmet>
      <div>
        {id ? (
          <h1 className="text-2xl font-semibold text-foreground">
            Edit your audio ad
          </h1>
        ) : (
          <h1 className="text-2xl font-semibold text-foreground">
            {t("ad_creator.title")}
          </h1>
        )}
      </div>
      <Card>
        {/* Mode Switcher — Pro only */}
        {isPro && !id && !hideTopOptions && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => setMode("ai")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  mode === "ai"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  AI Audio Ad Studio
                    <MyTooltip infoText="Our AI writes three script versions from your brief, then produces the first as a full audio ad — with a matched voice and music track — ready to preview straight away.." />
                  </p>
                  <div className="mt-0.5 text-[11px] leading-tight font-normal hidden sm:block text-foreground/70">
                  Describe your brand or product and we'll write the script
                  </div>
                  <div className="items-center rounded-full border py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-[10px] h-4 mt-1 hidden sm:inline-flex">
                    Powered by Sonic v1
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode("script")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  mode === "script"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 ">
                  Write your own script
                    <MyTooltip infoText="Use EARO's AI to generate a professional voiceover and music mix from a short description of your business. No audio production experience needed." />
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                  Paste or type your script and we'll produce the audio
                    <MyTooltip infoText="Already have copy? Paste your script here. We'll match a voice, select music, and produce a finished audio ad without rewriting anything." />
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
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  Upload a finished audio ad
                  <MyTooltip infoText="Upload a completed MP3 file to add directly to your ad library. No script writing or production — just upload and use." />
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                  Upload a pre-produced audio file
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("legacy")}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  mode === "legacy"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2 ">
                  Classic AI Audio Ad Studio
                    <MyTooltip infoText="The previous EARO ad builder. Use this if you prefer the original creation flow." />
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                  Original ad creation interface
                  </p>
                  <div className="items-center rounded-full border py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground text-[10px] h-4 mt-1 hidden sm:inline-flex">
                    Powered by Pulse v1
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        <CardContent className="pt-6">
          {mode === "legacy" && (
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
              isEditing={!!id}
            />
          )}

          {(mode === "ai" || mode === "script") && (
            <div className="w-full flex items-center justify-center">
              {voxifyError ? (
                <div className="flex flex-col items-center justify-center gap-6 max-w-[700px] text-center px-4 w-full">
                  <p className=" font-medium text-base text-[#B91C1C]">
                    Oops! We hear you loud and clear... 🎧
                  </p>
                  <p className="font-medium text-base">
                    ...but our system just hit a sour note. We're actively
                    tuning things up behind the scenes. Please click retry and
                    let's try that again!
                  </p>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        console.log("try again");
                        setVoxifyError("");
                      }}
                    >
                      Try again
                    </Button>
                    <Button
                      variant="default"
                      size="md"
                      onClick={() => {
                        setMode("legacy");
                        setVoxifyError("");
                      }}
                    >
                      Try Legacy
                    </Button>
                  </div>
                </div>
              ) : (
                <VoxifyForm
                  key={voxifyGoal}
                  type={voxifyType}
                  goal={voxifyGoal}
                  onGoalChange={setVoxifyGoal}
                  description={voxifyDescription}
                  onDescriptionChange={setVoxifyDescription}
                  setPlainText={setVoxifyPlainText}
                  onGenerate={handleVoxifyGenerate}
                  isGenerating={voxifyGenerating}
                  ad={voxifyAd}
                  generateVoxifyAd={generateVoxifyAd}
                  regenerateVoxifyAd={regenerateVoxifyAd}
                  updateScript={(
                    recommendIndex: number,
                    script: { text_plain: string; text: string },
                  ) => updateScript(recommendIndex, script)}
                  handleSaveAd={saveVoxifyAd}
                />
              )}
            </div>
          )}

          {mode === "script" && <></>}

          {mode === "upload" && <UploadAdForm onSaved={handleSaved} />}
        </CardContent>
      </Card>

      {mode === "legacy" && (
        <AdGeneratingModal
          open={isGenerating}
          onCancel={() => setIsGenerating(false)}
        />
      )}
    </div>
  );
}
