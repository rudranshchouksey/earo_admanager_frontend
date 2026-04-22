import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface InlineAudioPlayerProps {
  audioUrl: string;
}

export default function InlineAudioPlayer({ audioUrl }: InlineAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.preload = 'metadata';
    audio.src = audioUrl;
    audio.load();
    audio.currentTime = 0;
    setProgress(0);
    setCurrentSec(0);


    const syncTotal = () => {
      const dur = audio.duration;
      setTotalSec(Number.isFinite(dur) && dur > 0 ? Math.round(dur) : 0);
      setDuration(Number.isFinite(dur) && dur > 0 ? Math.round(dur) : 0);
    };

    const onTimeUpdate = () => {
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      setCurrentSec(Math.floor(audio.currentTime));
      setProgress(Math.min((audio.currentTime / dur) * 100, 100));
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentSec(0);
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener('loadedmetadata', syncTotal);
    audio.addEventListener('durationchange', syncTotal);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    syncTotal();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', syncTotal);
      audio.removeEventListener('durationchange', syncTotal);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [audioUrl]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    console.log('audio', audio);
    if (!audio) return;
    if (!audioUrl) return;

    if (audio.paused) {
      const p = audio.play();
      if (p && typeof (p as Promise<void>).catch === 'function') {
        (p as Promise<void>).catch(() => {
          // Keep UI consistent if autoplay is blocked or media fails.
          setIsPlaying(false);
        });
      }
      return;
    }

    audio.pause();
  }, []);

  return (
    <div
      className="flex items-center gap-2 bg-muted/60 rounded-full px-2 py-1 shrink-0 cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 rounded-full p-0 hover:bg-transparent"
        onClick={toggle}
      >
        {isPlaying ? (
          <Pause className="h-3 w-3 text-foreground" />
        ) : (
          <Play className="h-3 w-3 text-foreground ml-px" />
        )}
      </Button>
      <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-7">
        {isPlaying
          ? `0:${String(currentSec).padStart(2, '0')}`
          : `0:${String(totalSec).padStart(2, '0')}`}
      </span>
    </div>
  );
}
