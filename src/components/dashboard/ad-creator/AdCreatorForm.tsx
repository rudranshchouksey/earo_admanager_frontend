import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Pencil, Loader2, Share2, RefreshCw, Mic2, MusicIcon } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { auth } from '@/services/auth';
import { adsApi, Music, Voice } from '@/services/ads';
import { toast } from '@/hooks/use-toast';
import type { GeneratedAd } from '@/types/landing';
import ProCustomizations, {
  type ProVoiceSettings,
  type ProMusicSettings,
  type ProContentSettings,
} from './ProCustomizations';

interface AdCreatorFormProps {
  description: string;
  onDescriptionChange: (v: string) => void;
  goal: string;
  onGoalChange: (v: string) => void;
  voice: string;
  onVoiceChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;
  music: string;
  onMusicChange: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generatedAd: GeneratedAd | null;
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
  getVoices: (gender: string, language: string, tone: string) => void;
  voicesLoading: boolean;
  musics: Music[];
  getMusics: (mood: string) => void;
  musicsLoading: boolean;
}

const goalPlaceholders: Record<string, string> = {
  sales: 'Share what makes your brand unique, who it\'s for, and the call-to-action you\'d like listeners to take after hearing the ad.\n\nFor example, https://luigispizza.com -- Family pizza restaurant in Dubai Marina. 20% off first online order. Promote our new seafood menu.',
  leads: 'Share what makes your brand unique, who it\'s for, and the call-to-action you\'d like listeners to take after hearing the ad.\n\nFor example, https://acmerealestate.com/listings -- Premium villas in Palm Jumeirah. Free property valuation for new enquiries. Target investors.',
  traffic: 'Share what makes your brand unique, who it\'s for, and the call-to-action you\'d like listeners to take after hearing the ad.\n\nFor example, https://myblog.com/latest -- Tech review blog covering latest gadgets. Drive readers to our new AI tools comparison article.',
  consideration: 'Share what makes your brand unique, who it\'s for, and the call-to-action you\'d like listeners to take after hearing the ad.\n\nFor example, https://brandx.com/product-page -- Launching a new organic skincare line. Highlight dermatologist-approved ingredients and 5-star reviews.',
  awareness: 'Share what makes your brand unique, who it\'s for, and the call-to-action you\'d like listeners to take after hearing the ad.\n\nFor example, https://newbrand.ae -- We\'re a new sustainable fashion label in the UAE. Build recognition among 25-40 year old professionals.',
  app: 'Share what makes your brand unique, who it\'s for, and the call-to-action you\'d like listeners to take after hearing the ad.\n\nFor example, https://apps.apple.com/myapp -- Fitness tracking app with AI coaching. Free 30-day trial. Available on iOS and Android.',
  local: 'Share what makes your brand unique, who it\'s for, and the call-to-action you\'d like listeners to take after hearing the ad.\n\nFor example, https://maps.google.com/myshop -- Boutique coffee shop in JLT. Grand opening weekend, free pastry with every coffee. Walk-ins welcome.',
};

export default function AdCreatorForm({
  description, onDescriptionChange, goal, onGoalChange,
  voice, onVoiceChange, tone, onToneChange, music, onMusicChange,
  onGenerate, isGenerating, generatedAd, editedScript, onScriptChange,
  onSaved, onRegenerate, isRegenerating,
  isPro, trackingPixel, onTrackingPixelChange,
  proVoiceSettings, onProVoiceSettingsChange,
  proMusicSettings, onProMusicSettingsChange,
  proContentSettings, onProContentSettingsChange,
  voices, getVoices, voicesLoading, musics, getMusics, musicsLoading,
}: AdCreatorFormProps) {
  const { t } = useTranslation();
  const canSubmit = description.trim().length > 0;
  const hasAd = generatedAd !== null;

  // Review state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [scriptDirty, setScriptDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [adName, setAdName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  // Reset dirty flag when a new ad is generated
  useEffect(() => {
    if (generatedAd) {
      setScriptDirty(false);
      setAdName(generatedAd.brandName + ' Ad');
    }
  }, [generatedAd]);

  // Scroll to review section when ad is generated
  useEffect(() => {
    if (hasAd && reviewRef.current) {
      setTimeout(() => {
        const el = reviewRef.current;
        if (!el) return;
        const scrollParent = el.closest('main') || window;
        if (scrollParent instanceof HTMLElement) {
          const parentRect = scrollParent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          scrollParent.scrollTo({
            top: scrollParent.scrollTop + elRect.top - parentRect.top - 16,
            behavior: 'smooth',
          });
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [hasAd]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress((audio.currentTime / audio.duration) * 100);
    const onEnd = () => { setIsPlaying(false); setProgress(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('ended', onEnd); };
  }, [hasAd]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause(); else audio.play();
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
    if (generatedAd?.audioUrl) {
      navigator.clipboard.writeText(generatedAd.audioUrl);
      toast({ title: t('ad_creator.link_copied') });
    }
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await auth.getSession();
      if (!session) {
        toast({ title: t('ad_creator.not_authenticated'), variant: 'destructive' });
        return;
      }
      // const { error } = await adsApi.createAd({
      //   product_name: adName.trim() || generatedAd!.brandName,
      //   brand_name: generatedAd!.brandName,
      //   script: editedScript,
      //   audio_url: generatedAd!.audioUrl,
      //   duration_seconds: generatedAd!.duration,
      //   tone: generatedAd!.tone,
      //   status: 'completed',
      //   source_type: 'dashboard',
      //   user_id: session.user.id,
      //   ai_category: generatedAd!.category,
      //   ai_target_audience: generatedAd!.targetAudience,
      //   voice_settings: { voiceId: generatedAd!.voiceId },
      //   music_settings: { musicId: generatedAd!.musicId },
      // });
      // if (error) throw error;
      setShowSaveModal(false);
      onSaved();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: t('ad_creator.save_failed'), description: t('ad_creator.could_not_save'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };



  useEffect(() => {
    getVoices(voice.split("-")[0], voice.split("-")[1], tone);
  }, [voice, tone]);

  useEffect(() => {
    getMusics(music);
  }, [music]);

  return (
    <div className="space-y-6">
      {/* ── Generate Section (hidden after ad is created) ── */}
      {!hasAd && (
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">{t('ad_creator.what_advertising')}</h3>
          <p className="text-sm text-muted-foreground">{t('ad_creator.tell_about_subtitle')}</p>
        </div>
      )}

      {!hasAd && (
        <>
          <div className="space-y-2">
            <Label>{t('ad_creator.campaign_goal')}</Label>
            <Select value={goal} onValueChange={onGoalChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">{t('ad_creator.goal_sales')}</SelectItem>
                <SelectItem value="leads">{t('ad_creator.goal_leads')}</SelectItem>
                <SelectItem value="traffic">{t('ad_creator.goal_traffic')}</SelectItem>
                <SelectItem value="consideration">{t('ad_creator.goal_consideration')}</SelectItem>
                <SelectItem value="awareness">{t('ad_creator.goal_awareness')}</SelectItem>
                <SelectItem value="app">{t('ad_creator.goal_app')}</SelectItem>
                <SelectItem value="local">{t('ad_creator.goal_local')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('ad_creator.tell_business')}</Label>
            <Textarea
              placeholder={goalPlaceholders[goal] || 'Tell us about your business...'}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={5}
            />
          </div>

          {/* Customization: Express = simple dropdowns, Pro = full ProCustomizations */}
          {isPro && proVoiceSettings && proMusicSettings && proContentSettings && onTrackingPixelChange && onProVoiceSettingsChange && onProMusicSettingsChange && onProContentSettingsChange ? (
            <ProCustomizations
              trackingPixel={trackingPixel || ''}
              onTrackingPixelChange={onTrackingPixelChange}
              voiceSettings={proVoiceSettings}
              onVoiceSettingsChange={onProVoiceSettingsChange}
              musicSettings={proMusicSettings}
              onMusicSettingsChange={onProMusicSettingsChange}
              contentSettings={proContentSettings}
              onContentSettingsChange={onProContentSettingsChange}
            />
          ) : (
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t('ad_creator.customization')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">{t('ad_creator.voice')}</Label>
                  <Select value={voice} onValueChange={onVoiceChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female-en">{t('ad_creator.voice_female_en')}</SelectItem>
                      <SelectItem value="male-en">{t('ad_creator.voice_male_en')}</SelectItem>
                      <SelectItem value="female-ar">{t('ad_creator.voice_female_ar')}</SelectItem>
                      <SelectItem value="male-ar">{t('ad_creator.voice_male_ar')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t('ad_creator.tone')}</Label>
                  <Select value={tone} onValueChange={onToneChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">{t('ad_creator.tone_friendly')}</SelectItem>
                      <SelectItem value="professional">{t('ad_creator.tone_professional')}</SelectItem>
                      <SelectItem value="excited">{t('ad_creator.tone_excited')}</SelectItem>
                      <SelectItem value="urgent">{t('ad_creator.tone_urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">{t('ad_creator.music')}</Label>
                  <Select value={music} onValueChange={onMusicChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {
                        ["ambient", "calm", "chill", "dark", "energetic", "happy", "hopeful", "optimistic", "passionate"].map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {voicesLoading ? (
                <div className="flex items-center justify-center h-12">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                voices.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 overflow-hidden shadow-sm">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
                      <div className="relative mx-auto w-full max-w-[200px] shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:mx-0 sm:max-w-[140px]">
                        <div className="aspect-square w-full">
                          {voices[0].imageUrl ? (
                            <img
                              src={voices[0].imageUrl}
                              alt={voices[0].name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <Mic2 className="h-10 w-10 text-muted-foreground/60" aria-hidden />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
                        <div className="flex flex-wrap gap-1.5">
                          {
                            voices[0].name ? (
                              <p className="text-sm font-semibold text-foreground px-2">
                                {voices[0].name}
                              </p>
                            ) : null
                          }
                          {voices[0].language ? (
                            <Badge variant="secondary" className="font-normal">
                              {voices[0].language}
                            </Badge>
                          ) : null}
                          {voices[0].accent ? (
                            <Badge variant="outline" className="font-normal">
                              {voices[0].accent}
                            </Badge>
                          ) : null}
                          {voices[0].gender ? (
                            <Badge variant="outline" className="font-normal">
                              {voices[0].gender}
                            </Badge>
                          ) : null}
                        </div>
                        <audio
                          src={voices[0].audioUrl}
                          preload="metadata"
                          controls
                          className="h-10 w-full max-w-full rounded-md bg-background/80 [&::-webkit-media-controls-panel]:bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )
              )}

              {
                musicsLoading ? (
                  <div className="flex items-center justify-center h-12">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  musics.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden shadow-sm">
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center" >
                      <div className="relative mx-auto w-full max-w-[100px] shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:mx-0 sm:max-h-[60px] sm:max-w-[60px]">
                        <div className="aspect-square w-full">
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                              <MusicIcon className="h-4 w-4 text-muted-foreground/60" aria-hidden />
                            </div>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
                        <div className="flex flex-wrap gap-1.5">
                          {
                            musics[0].title ? (
                              <p className="text-sm font-semibold text-foreground px-2">
                                {musics[0].title}
                              </p>
                            ) : null
                          }
                        </div>
                        <audio
                          src={musics[0].audio_url}
                          preload="metadata"
                          controls
                          className="h-10 w-full max-w-full rounded-md bg-background/80 [&::-webkit-media-controls-panel]:bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  )
                )
              }
            </div>
          )}

          <Button className="w-full h-12" onClick={onGenerate} disabled={!canSubmit || isGenerating}>
            {t('ad_creator.generate_ad')}
          </Button>
        </>
      )}

      {/* ── Review Section (visible after generation) ── */}
      <div
        ref={reviewRef}
        className={`transition-all duration-500 ease-out ${hasAd ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden'}`}
      >
        {hasAd && generatedAd && (
          <>
            <Separator className="mb-6" />
            <audio ref={audioRef} src={generatedAd.audioUrl} preload="auto" />

            {/* Audio Player */}
            <div className="rounded-lg border bg-muted/30 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{generatedAd.brandName}</h3>
                  <Badge variant="secondary" className="mt-1">{generatedAd.duration}s</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="rounded-full h-10 w-10" onClick={handleCopyLink}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" className="rounded-full h-12 w-12" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-0.5 h-16">
                {bars.map((bar, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      (i / bars.length) * 100 <= progress ? 'bg-primary' : 'bg-primary/20'
                    }`}
                    style={{ height: `${bar.height}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Script */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('ad_creator.ad_script')}</Label>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingScript(!isEditingScript)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  {isEditingScript ? t('ad_creator.done') : t('ad_creator.edit')}
                </Button>
              </div>
              {isEditingScript ? (
                <>
                  <Textarea
                    value={editedScript}
                    onChange={(e) => handleScriptChange(e.target.value)}
                    rows={5}
                    className="text-sm"
                  />
                  {/* Customization options when editing */}
                  {isPro && proVoiceSettings && proMusicSettings && proContentSettings && onTrackingPixelChange && onProVoiceSettingsChange && onProMusicSettingsChange && onProContentSettingsChange ? (
                    <div className="pt-3">
                      <ProCustomizations
                        trackingPixel={trackingPixel || ''}
                        onTrackingPixelChange={onTrackingPixelChange}
                        voiceSettings={proVoiceSettings}
                        onVoiceSettingsChange={onProVoiceSettingsChange}
                        musicSettings={proMusicSettings}
                        onMusicSettingsChange={onProMusicSettingsChange}
                        contentSettings={proContentSettings}
                        onContentSettingsChange={onProContentSettingsChange}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                      <div className="space-y-2">
                        <Label className="text-sm">{t('ad_creator.voice')}</Label>
                        <Select value={voice} onValueChange={onVoiceChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female-en">{t('ad_creator.voice_female_en')}</SelectItem>
                            <SelectItem value="male-en">{t('ad_creator.voice_male_en')}</SelectItem>
                            <SelectItem value="female-ar">{t('ad_creator.voice_female_ar')}</SelectItem>
                            <SelectItem value="male-ar">{t('ad_creator.voice_male_ar')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">{t('ad_creator.tone')}</Label>
                        <Select value={tone} onValueChange={onToneChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">{t('ad_creator.tone_friendly')}</SelectItem>
                            <SelectItem value="professional">{t('ad_creator.tone_professional')}</SelectItem>
                            <SelectItem value="excited">{t('ad_creator.tone_excited')}</SelectItem>
                            <SelectItem value="urgent">{t('ad_creator.tone_urgent')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">{t('ad_creator.music')}</Label>
                        <Select value={music} onValueChange={onMusicChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upbeat">{t('ad_creator.music_upbeat')}</SelectItem>
                            <SelectItem value="corporate">{t('ad_creator.music_corporate')}</SelectItem>
                            <SelectItem value="chill">{t('ad_creator.music_chill')}</SelectItem>
                            <SelectItem value="none">{t('ad_creator.music_none')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 leading-relaxed">
                  {editedScript}
                </p>
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
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('ad_creator.regenerating')}</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" />{t('ad_creator.regenerate_audio')}</>
                )}
              </Button>
              <Button className="flex-1 h-12" onClick={() => setShowSaveModal(true)}>
                {t('ad_creator.save_ad')}
              </Button>
            </div>

            {/* Save Confirmation Modal */}
            <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('ad_creator.save_modal_title')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>{t('ad_creator.ad_name')}</Label>
                    <Input
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                      placeholder={t('ad_creator.ad_name_placeholder')}
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSaveModal(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleConfirmSave} disabled={isSaving || !adName.trim()}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('ad_creator.saving')}</>
                    ) : (
                      t('ad_creator.confirm')
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
