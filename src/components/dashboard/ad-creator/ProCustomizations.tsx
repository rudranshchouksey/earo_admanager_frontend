import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import VoiceSearchPicker from './VoiceSearchPicker';
import MusicSearchPicker from './MusicSearchPicker';

export interface ProVoiceSettings {
  language: string;
  accent: string;
  gender: string;
  useCase: string;
  characteristics: string;
  age: string;
}

export interface ProMusicSettings {
  useCase: string;
  mood: string;
  genre: string;
  instrument: string;
  rhythm: string;
}

export interface ProContentSettings {
  fadeIn: boolean;
  fadeOut: boolean;
  startMs: number;
  endMs: number;
  volume: number;
}

interface ProCustomizationsProps {
  trackingPixel: string;
  onTrackingPixelChange: (v: string) => void;
  voiceSettings: ProVoiceSettings;
  onVoiceSettingsChange: (v: ProVoiceSettings) => void;
  musicSettings: ProMusicSettings;
  onMusicSettingsChange: (v: ProMusicSettings) => void;
  contentSettings: ProContentSettings;
  onContentSettingsChange: (v: ProContentSettings) => void;
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <Separator className="mb-2" />
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProCustomizations({
  trackingPixel, onTrackingPixelChange,
  voiceSettings, onVoiceSettingsChange,
  musicSettings, onMusicSettingsChange,
  contentSettings, onContentSettingsChange,
}: ProCustomizationsProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const updateContent = (key: keyof ProContentSettings, value: boolean | number) =>
    onContentSettingsChange({ ...contentSettings, [key]: value });

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Pro Settings</Label>

      {/* Voice Settings — Search Picker */}
      <Section title="Voice Settings" defaultOpen>
        <VoiceSearchPicker
          selectedVoiceId={selectedVoiceId}
          onSelect={(id, name) => {
            setSelectedVoiceId(id);
            onVoiceSettingsChange({ ...voiceSettings, characteristics: name });
          }}
        />
      </Section>

      {/* Music Settings — Search Picker */}
      <Section title="Music Settings">
        <MusicSearchPicker
          selectedTrackId={selectedTrackId}
          onSelect={(id, name) => {
            setSelectedTrackId(id);
            onMusicSettingsChange({ ...musicSettings, genre: name });
          }}
        />
      </Section>

      {/* Content Settings */}
      <Section title="Content Settings">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Fade In</Label>
              <p className="text-xs text-muted-foreground">Gradually increase volume at start</p>
            </div>
            <Switch checked={contentSettings.fadeIn} onCheckedChange={(v) => updateContent('fadeIn', v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm">Fade Out</Label>
              <p className="text-xs text-muted-foreground">Gradually decrease volume at end</p>
            </div>
            <Switch checked={contentSettings.fadeOut} onCheckedChange={(v) => updateContent('fadeOut', v)} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Start (ms)</Label>
              <Input
                type="number"
                min={0}
                value={contentSettings.startMs}
                onChange={(e) => updateContent('startMs', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">End (ms)</Label>
              <Input
                type="number"
                min={0}
                value={contentSettings.endMs}
                onChange={(e) => updateContent('endMs', parseInt(e.target.value) || 0)}
                placeholder="30000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Volume</Label>
              <span className="text-xs text-muted-foreground">{Math.round(contentSettings.volume * 100)}%</span>
            </div>
            <Slider
              value={[contentSettings.volume]}
              onValueChange={([v]) => updateContent('volume', v)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      </Section>

      {/* Tracking Pixel — after Content Settings */}
      <div className="space-y-2">
        <Label className="text-sm">Tracking Pixel URL</Label>
        <Input
          value={trackingPixel}
          onChange={(e) => onTrackingPixelChange(e.target.value)}
          placeholder="https://tracking.example.com/pixel?id=..."
          type="url"
        />
        <p className="text-xs text-muted-foreground">Add a third-party tracking pixel to measure ad impressions.</p>
      </div>
    </div>
  );
}
