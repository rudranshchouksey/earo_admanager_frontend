import { useState, useRef } from 'react';
import { Upload, Play, Pause, X, FileAudio } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const MAX_SIZE_MB = 10;
const MAX_DURATION_SEC = 60;
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg'];

interface UploadAdFormProps {
  onSaved: () => void;
}

export default function UploadAdForm({ onSaved }: UploadAdFormProps) {
  const { t } = useTranslation();
  const [adName, setAdName] = useState('');
  const [goal, setGoal] = useState('sales');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError(t('ad_creator.upload.unsupported_format'));
      return;
    }

    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t('ad_creator.upload.file_too_large', { max: String(MAX_SIZE_MB) }));
      return;
    }

    // Check duration
    const url = URL.createObjectURL(selected);
    const tempAudio = new Audio(url);
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration > MAX_DURATION_SEC) {
        setError(t('ad_creator.upload.duration_error', { max: String(MAX_DURATION_SEC), actual: String(Math.round(tempAudio.duration)) }));
        URL.revokeObjectURL(url);
        return;
      }
      setFile(selected);
      setAudioUrl(url);
      setDuration(Math.round(tempAudio.duration));
      if (!adName) setAdName(selected.name.replace(/\.[^.]+$/, ''));
    });
    tempAudio.addEventListener('error', () => {
      setError(t('ad_creator.upload.read_error'));
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
    if (!file || !adName.trim()) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await api.auth.getSession();
      if (!session) {
        toast({ title: t('ad_creator.not_authenticated'), variant: 'destructive' });
        return;
      }

      const path = `${session.user.id}/${Date.now()}.mp3`;
      await api.uploadAudio(path, file);
      const finalAudioUrl = audioUrl || api.getPublicUrl(path).publicUrl;

      const { error: dbError } = await api.createAd({
        product_name: adName.trim(),
        brand_name: adName.trim(),
        audio_url: finalAudioUrl,
        duration_seconds: duration,
        status: 'completed',
        source_type: 'upload',
        user_id: session.user.id,
      });
      if (dbError) throw dbError;

      toast({ title: t('ad_creator.ad_saved_success') });
      onSaved();
    } catch (err) {
      console.error('Save error:', err);
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
        <Label>{t('ad_creator.upload.ad_name')}</Label>
        <Input
          value={adName}
          onChange={(e) => setAdName(e.target.value)}
          placeholder={t('ad_creator.upload.ad_name_placeholder')}
        />
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

      {/* Save */}
      <Button
        className="w-full h-12"
        onClick={handleSave}
        disabled={!file || !adName.trim() || isSaving}
      >
        {isSaving ? t('ad_creator.upload.saving') : t('ad_creator.upload.save_ad')}
      </Button>
    </div>
  );
}
