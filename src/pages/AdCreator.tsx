import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sparkles, Upload } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import AdCreatorForm from '@/components/dashboard/ad-creator/AdCreatorForm';
import AdGeneratingModal from '@/components/dashboard/ad-creator/AdGeneratingModal';
import UploadAdForm from '@/components/dashboard/ad-creator/UploadAdForm';
import type { GeneratedAd } from '@/types/landing';
import type { ProVoiceSettings, ProMusicSettings, ProContentSettings } from '@/components/dashboard/ad-creator/ProCustomizations';
import { useSessionFlags } from '@/hooks/useSessionFlags';

type AdMode = 'ai' | 'upload';

const DEFAULT_PRO_VOICE: ProVoiceSettings = {
  voiceId: '',
  language: '', accent: 'neutral', gender: 'female',
  useCase: 'commercial', characteristics: 'warm', age: 'young',
};
const DEFAULT_PRO_MUSIC: ProMusicSettings = {
  musicId: '',
  useCase: 'commercial', mood: 'uplifting', genre: 'pop',
  instrument: 'any', rhythm: 'steady',
};
const DEFAULT_PRO_CONTENT: ProContentSettings = {
  fadeInMs: 500, fadeOutMs: 500, startMs: 0, endMs: 30000, volume: 0.8,
};

export default function AdCreator() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();

  const [mode, setMode] = useState<AdMode>('ai');
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
  const [editedScript, setEditedScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('sales');
  const [voice, setVoice] = useState('female-en');
  const [tone, setTone] = useState('friendly');
  const [music, setMusic] = useState('upbeat');

  // Pro-only state
  const [trackingPixel, setTrackingPixel] = useState('');
  const [proVoice, setProVoice] = useState<ProVoiceSettings>(DEFAULT_PRO_VOICE);
  const [proMusic, setProMusic] = useState<ProMusicSettings>(DEFAULT_PRO_MUSIC);
  const [proContent, setProContent] = useState<ProContentSettings>(DEFAULT_PRO_CONTENT);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const input = { type: 'manual' as const, prompt: description.trim(), goal };
      const { data, error } = await api.invokeAnalyzeBrand({
        input,
        tone: 'friendly',
        length: 30,
        emphasis: 'brand',
      });
      if (error) throw error;
      const ad = data as GeneratedAd;
      setGeneratedAd(ad);
      setEditedScript(ad.script);
    } catch (err) {
      console.error('Generate error:', err);
      toast({ title: t('ad_creator.generation_failed'), description: t('ad_creator.generation_failed_desc'), variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }, [description, goal, t]);

  const handleSaved = () => navigate('/dashboard/ads');

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('ad_creator.title')}</h1>
        <p className="text-muted-foreground">{t('ad_creator.subtitle')}</p>
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
              <p className="text-sm font-medium text-foreground">{t('ad_creator.ai_mode_title')}</p>
              <p className="text-xs text-muted-foreground">{t('ad_creator.ai_mode_desc')}</p>
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
              <p className="text-sm font-medium text-foreground">{t('ad_creator.upload_mode_title')}</p>
              <p className="text-xs text-muted-foreground">{t('ad_creator.upload_mode_desc')}</p>
            </div>
          </button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {mode === 'ai' ? (
            <AdCreatorForm
              description={description}
              onDescriptionChange={setDescription}
              goal={goal}
              onGoalChange={setGoal}
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
