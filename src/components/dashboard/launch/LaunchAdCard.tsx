import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Share2, Pencil } from 'lucide-react';

interface LaunchAdCardProps {
  brandName: string;
  audioUrl: string;
  duration: number;
  onEdit?: () => void;
  onShare?: () => void;
}

export default function LaunchAdCard({ brandName, audioUrl, duration, onEdit, onShare }: LaunchAdCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress((audio.currentTime / audio.duration) * 100);
    const onEnd = () => { setIsPlaying(false); setProgress(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('ended', onEnd); };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause(); else audio.play();
    setIsPlaying(!isPlaying);
  };

  const bars = Array.from({ length: 24 }, (_, i) => ({
    height: 30 + Math.sin(i * 0.7) * 20 + Math.random() * 20,
  }));

  return (
    <Card className="rounded-[16px] shadow-sm border-border/50">
      <div className="flex items-center gap-4 px-5 py-4">
        <audio ref={audioRef} src={audioUrl} preload="auto" />

        {/* Play button */}
        <Button
          size="icon"
          className="rounded-full w-10 h-10 shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>

        {/* Brand + helper */}
        <div className="shrink-0">
          <h3 className="text-sm font-semibold text-foreground leading-tight">{brandName}</h3>
          <p className="text-xs text-muted-foreground">Your audio ad</p>
        </div>

        {/* Compact waveform */}
        <div className="flex items-center gap-px h-8 flex-1 min-w-0">
          {bars.map((bar, i) => {
            const isActive = (i / bars.length) * 100 <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${isActive ? 'bg-primary' : 'bg-primary/20'}`}
                style={{ height: `${bar.height}%` }}
              />
            );
          })}
        </div>

        {/* Duration */}
        <Badge variant="secondary" className="text-xs shrink-0">{duration}s</Badge>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShare}>
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
