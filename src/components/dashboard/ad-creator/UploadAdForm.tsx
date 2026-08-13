import { useState, useRef } from 'react';
import { Upload, Play, Pause, X, FileAudio } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth } from '@/services/auth';
import { adsApi } from '@/services/ads';
import { toast } from '@/hooks/use-toast';
import { logger } from "@/lib/logger";

const MAX_SIZE_MB = 10;
const MAX_DURATION_SEC = 60;
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'];

const RIGHTS_CONFIRMATION_TEXT =
  'I confirm that I hold all necessary rights, licenses, and approvals to distribute this audio ad in the selected geographies. I guarantee that this audio does not contain unauthorized voice cloning or impersonation of a real person intended to deceive listeners.';

interface UploadAdFormProps {
  onSaved: () => void;
}

export default function UploadAdForm({ onSaved }: UploadAdFormProps) {
  const { t } = useTranslation();
  const [adName, setAdName] = useState('');
  const [adNameError, setAdNameError] = useState<string | null>(null);
  const [goal, setGoal] = useState('sales');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [aiVoiceAnswer, setAiVoiceAnswer] = useState<'no' | 'yes' | null>("no");
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sanitizeAdName = (value: string) => value.replace(/[^A-Za-z0-9 &_\-]/g, '');
  const isValidAdName = (value: string) => /^[A-Za-z0-9 &_\-]+$/.test(value);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Unsupported format. Please upload MP3, WAV, M4A, or OGG.');
      return;
    }

    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Check duration
    const url = URL.createObjectURL(selected);
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration > MAX_DURATION_SEC) {
        setError(`Audio must be ${MAX_DURATION_SEC} seconds or less. This file is ${Math.round(tempAudio.duration)}s.`);
        URL.revokeObjectURL(url);
        return;
      }
      if (tempAudio.duration < 1) {
        setError(`Audio must be 1 second or more. This file is ${Math.round(tempAudio.duration)}s.`);
        URL.revokeObjectURL(url);
        return;
      }
      setFile(selected);
      setAudioUrl(url);
      setDuration(Math.round(tempAudio.duration));
      if (!adName) {
        const sanitizedName = sanitizeAdName(selected.name.replace(/\.[^.]+$/, ''));
        setAdName(sanitizedName);
      }
    });
    tempAudio.addEventListener('error', () => {
      setError('Could not read audio file.');
      URL.revokeObjectURL(url);
    });
  };

  const removeFile = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(null);
    setAudioUrl(null);
    setDuration(null);
    setIsPlaying(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause(); else audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleSave = async () => {
    if (!file || !adName.trim() || !rightsConfirmed || !aiVoiceAnswer) return;

    const trimmedAdName = adName.trim();
    if (!isValidAdName(trimmedAdName)) {
      toast({
        title: t('Invalid Ad Name'),
        description: t('Ad name can only contain letters, numbers, spaces, -, _ and &'),
        variant: 'destructive',
      });
      return;
    }

    if(adName.length > 100){
      toast({ title: t('Ad Name must be less than 100 characters'), variant: 'destructive' });
      return;
    }
  


    setIsSaving(true);
    try {
      const { data: { session } } = await auth.getSession();
      if (!session) {
        toast({ title: 'Not authenticated', variant: 'destructive' });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const { status, error, message, data } = await adsApi.uploadFile(formData);
      if (status !== 200 || error) {
        toast({ title: message, variant: 'destructive' });
        logger.captureException(error, { context: 'Upload error:' });
        return;
      }
      const finalAudioUrl = data.data.url;

      const { error: dbError, message: uploadAdMessage } = await adsApi.uploadAudioAd({
        adName: trimmedAdName,
        advertiserId: session.currentAdvertiserId,
        fileUrl: finalAudioUrl,
        duration: duration,
        campaignGoal: goal,
        isMadeOfAI: aiVoiceAnswer,
      });
      if (dbError){
        toast({ title: 'Error uploading ad', description: uploadAdMessage, variant: 'destructive' });
        logger.captureException(dbError, { context: 'Upload ad error:' });
        return;
      }

      toast({ title: t('ad_creator.ad_saved_success') });
      onSaved();
    } catch (err) {
      logger.captureException(err, { context: 'Save error:' });
      toast({ title: t('ad_creator.save_failed'), description: t('ad_creator.could_not_save'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{t('ad_creator.upload.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('ad_creator.upload.subtitle')}</p>
      </div>

      {/* Ad Name */}
      <div className="space-y-2">
        <Label>{t('ad_creator.upload.ad_name')}<sup>*</sup> </Label>
        <Input
          value={adName}
          onChange={(e) => {
            const raw = e.target.value;
            const sanitized = sanitizeAdName(raw);
            setAdName(sanitized);
            setAdNameError(
              raw !== sanitized ? t('Only letters, numbers, spaces, -, _ and & are allowed.') : null
            );
          }}
          placeholder={t('ad_creator.upload.ad_name_placeholder')}
          maxLength={100}
          aria-invalid={Boolean(adName.trim()) && !isValidAdName(adName.trim())}
        />
        {adNameError && <p className="text-sm text-destructive">{adNameError}</p>}
        <div className="w-full flex items-center justify-between">
          <p className='text-xs text-muted-foreground'>Ad name can only contain letters, numbers, spaces, -, _ and &amp;</p>
        <span className="text-xs text-muted-foreground">{adName.length}/100</span>
        </div>
      </div>

      {/* Campaign Goal */}
      <div className="space-y-2">
        <Label>{t('ad_creator.upload.campaign_goal')}</Label>
        <Select value={goal} onValueChange={setGoal}>
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

      {/* Upload Area */}
      {!file ? (
        <div className="space-y-3">
          <Label>{t('ad_creator.upload.audio_file')}</Label>
          <label
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t('ad_creator.upload.click_to_upload')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('ad_creator.upload.formats')}</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.ogg,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/ogg"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{t('ad_creator.upload.max_size', { max: String(MAX_SIZE_MB) })}</span>
            <span>{t('ad_creator.upload.max_duration', { sec: String(MAX_DURATION_SEC) })}</span>
            <span>{t('ad_creator.upload.formats')}</span>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        /* Preview */
        <div className="space-y-3">
          <Label>{t('ad_creator.upload.uploaded_file')}</Label>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Button size="icon" variant="outline" className="rounded-full h-10 w-10 shrink-0" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{duration}s</span>
                  <span>{(file.size / (1024 * 1024)).toFixed(1)}MB</span>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                preload="auto"
                onEnded={() => setIsPlaying(false)}
              />
            )}
          </div>
        </div>
      )}


      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="upload-rights-confirmation"
            checked={rightsConfirmed}
            onCheckedChange={(checked) => setRightsConfirmed(checked === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="upload-rights-confirmation"
            className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer"
          >
            1. {RIGHTS_CONFIRMATION_TEXT}
          </Label>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            2. Does this audio contain AI-generated synthetic voices or cloned audio?
          </p>
          <RadioGroup
            value={aiVoiceAnswer ?? undefined}
            onValueChange={(value) => setAiVoiceAnswer(value as 'no' | 'yes')}
            className="space-y-3"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="no" id="ai-voice-no" className="mt-0.5" />
              <Label
                htmlFor="ai-voice-no"
                className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer"
              >
                No, this audio was created entirely without AI voice generation.
              </Label>
            </div>
            <div className="flex items-start gap-3">
              <RadioGroupItem value="yes" id="ai-voice-yes" className="mt-0.5" />
              <Label
                htmlFor="ai-voice-yes"
                className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer"
              >
                Yes, and I acknowledge that it will be publicly labeled as AI-generated in compliance
                with EU regulations.
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Save */}
      <Button
        className="w-full h-12"
        onClick={handleSave}
        disabled={
          !file ||
          !adName.trim() ||
          !isValidAdName(adName.trim()) ||
          !rightsConfirmed ||
          !aiVoiceAnswer ||
          isSaving
        }
      >
        {isSaving ? t('ad_creator.upload.saving') : t('ad_creator.upload.save_ad')}
      </Button>
    </div>
  );
}
