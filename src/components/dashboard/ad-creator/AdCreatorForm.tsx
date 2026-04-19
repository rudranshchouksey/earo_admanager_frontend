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
import { AdStatusResponse, Music, Voice } from '@/services/ads';
import { toast } from '@/hooks/use-toast';
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
  getVoices: (gender: string, language: string, tone: string) => void;
  voicesLoading: boolean;
  musics: Music[];
  getMusics: (mood: string) => void;
  musicsLoading: boolean;
  gender: string;
  onGenderChange: (v: string) => void;
  language: string;
  onLanguageChange: (v: string) => void;
  handleSaveAd: (adName: string) => Promise<void>;
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


const ExpressCustomizations = ({ gender, onGenderChange, language, onLanguageChange, voices, voicesLoading, musics, musicsLoading, tone, onToneChange, music, onMusicChange }: { gender: string, onGenderChange: (v: string) => void, language: string, onLanguageChange: (v: string) => void, voices: Voice[], voicesLoading: boolean, musics: Music[], musicsLoading: boolean, tone: string, onToneChange: (v: string) => void, music: string, onMusicChange: (v: string) => void }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
    <Label className="text-base font-semibold">{t('ad_creator.customization_voice')}</Label>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label className="text-sm">{t('ad_creator.gender')}</Label>
        <Select value={gender} onValueChange={onGenderChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="female">{t('ad_creator.gender_female')}</SelectItem>
            <SelectItem value="male">{t('ad_creator.gender_male')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">{t('ad_creator.language')}</Label>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t('ad_creator.language_en')}</SelectItem>
            <SelectItem value="ar">{t('ad_creator.language_ar')}</SelectItem>
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

    </div>
    {voicesLoading ? (
      <div className="flex items-center justify-center h-12">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    ) : (
      voices.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 overflow-hidden shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:flex-row items-center">
          <div className="relative mx-auto w-full max-w-[100px] shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:mx-0 sm:max-h-[60px] sm:max-w-[60px]">
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

    <div className="space-y-4">
      <Label className="text-base font-semibold">{t('ad_creator.customization_music')}</Label>
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

    {
      musicsLoading ? (
        <div className="flex items-center justify-center h-12">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        musics.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 overflow-hidden shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:flex-row items-center" >
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
  );
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
  gender, onGenderChange, language, onLanguageChange,
  handleSaveAd,
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
  const [adDuration, setAdDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  // Reset dirty flag when a new ad is generated
  useEffect(() => {
    if (generatedAd) {
      setScriptDirty(false);
      setAdName('Ad');
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

    // Set src first; duration is only available after metadata loads.
    audio.preload = 'metadata';
    audio.src = generatedAd?.url || '';

    const syncDuration = () => {
      const dur = audio.duration;
      setAdDuration(Number.isFinite(dur) ? Math.round(dur) : 0);
    };

    const onTime = () => {
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      setProgress((audio.currentTime / dur) * 100);
    };
    const onEnd = () => { setIsPlaying(false); setProgress(0); };
    const onMeta = () => syncDuration();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);

    // If metadata is already available (cached), sync immediately.
    syncDuration();
    return () => { 
      audio.removeEventListener('timeupdate', onTime); 
      audio.removeEventListener('ended', onEnd); 
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
    };
  }, [generatedAd?.url]);

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
    console.log("handleScriptChange here ", {value});
    onScriptChange(value);
    setScriptDirty(value !== generatedAd?.script);
  };

  const handleCopyLink = () => {
    if (generatedAd?.url) {
      navigator.clipboard.writeText(generatedAd?.url);
      toast({ title: t('ad_creator.link_copied') });
    }
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await handleSaveAd(adName);
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
    getVoices(gender, language, tone);
  }, [gender, language, tone]);

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
            <ExpressCustomizations
              gender={gender}
              onGenderChange={onGenderChange}
              language={language}
              onLanguageChange={onLanguageChange}
              voices={voices}
              voicesLoading={voicesLoading}
              musics={musics}
              musicsLoading={musicsLoading}
              tone={tone}
              onToneChange={onToneChange}
              music={music}
              onMusicChange={onMusicChange}
            />

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
            <audio ref={audioRef} src={generatedAd.url} preload="auto" />

            {/* Audio Player */}
            <div className="rounded-lg border bg-muted/30 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{ 'Ad'}</h3>
                  <Badge variant="secondary" className="mt-1">{adDuration}s</Badge>
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
                    <ExpressCustomizations
                      gender={gender}
                      onGenderChange={onGenderChange}
                      language={language}
                      onLanguageChange={onLanguageChange}
                      voices={voices}
                      voicesLoading={voicesLoading}
                      musics={musics}
                      musicsLoading={musicsLoading}
                      tone={tone}
                      onToneChange={onToneChange}
                      music={music}
                      onMusicChange={onMusicChange}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 leading-relaxed">
                  {generatedAd?.script}
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
