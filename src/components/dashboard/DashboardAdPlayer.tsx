import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BARS = Array.from({ length: 40 }, (_, i) => ({
  height: 20 + Math.sin(i * 0.5) * 25 + Math.random() * 30,
}));

const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function DashboardAdPlayer({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.duration) setDuration(Math.round(audio.duration));
    const onTime = () => setProgress((audio.currentTime / audio.duration) * 100);
    const onEnd = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    if (audio.duration) setDuration(Math.round(audio.duration));
  };

  return (
    <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
      <audio ref={audioRef} src={audioUrl} preload="auto" />
      <Button
        size="icon"
        className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </Button>
      <div className="flex items-center gap-px h-10 flex-1 min-w-0">
        {BARS.map((bar, i) => {
          const isActive = (i / BARS.length) * 100 <= progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-150 ${isActive ? 'bg-primary' : 'bg-primary/30'}`}
              style={{ height: `${bar.height}%` }}
            />
          );
        })}
      </div>
      <span className="text-sm text-primary font-medium shrink-0">{formatTime(duration || 0)}</span>
    </div>
  );
}
