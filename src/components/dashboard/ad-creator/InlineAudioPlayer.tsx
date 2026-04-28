import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

interface InlineAudioPlayerProps {
  audioUrl: string;
}

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  
  // Only show hours if the audio is at least 1 hour long
  if (hrs > 0) {
    parts.push(hrs.toString());
  }
  
  // Always show minutes and seconds, padded with a leading zero
  parts.push(mins.toString().padStart(hrs > 0 ? 2 : 1, '0'));
  parts.push(secs.toString().padStart(2, '0'));

  return parts.join(':');
};

export default function InlineAudioPlayer({ audioUrl }: InlineAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec, setTotalSec] = useState(0);
  const [waveError, setWaveError] = useState<string | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const waveformElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = waveformElRef.current;
    if (!container) return;

    waveSurferRef.current?.destroy();
    waveSurferRef.current = null;

    setProgress(0);
    setCurrentSec(0);
    setTotalSec(0);
    setIsPlaying(false);
    setWaveError(null);

    if (!audioUrl) return;

    const ws = WaveSurfer.create({
      container,
      url: audioUrl,
      height: 24,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 0,
      normalize: true,
      waveColor: 'rgba(100, 116, 139, 0.55)', // slate-ish
      progressColor: 'rgba(15, 23, 42, 0.95)', // near-foreground
      interact: false,
      fetchParams: {
        mode: "cors",
        credentials: "omit"
      }
    });
    waveSurferRef.current = ws;

    const unsubscribers: Array<() => void> = [];

    unsubscribers.push(
      ws.on('ready', () => {
        const dur = ws.getDuration();
        setTotalSec(Number.isFinite(dur) && dur > 0 ? Math.round(dur) : 0);
      })
    );

    unsubscribers.push(ws.on('play', () => setIsPlaying(true)));
    unsubscribers.push(ws.on('pause', () => setIsPlaying(false)));
    unsubscribers.push(
      ws.on('finish', () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentSec(0);
      })
    );

    unsubscribers.push(
      ws.on('timeupdate', (time: number) => {
        const dur = ws.getDuration();
        if (!Number.isFinite(dur) || dur <= 0) return;
        setCurrentSec(Math.floor(time));
        setProgress(Math.min((time / dur) * 100, 100));
      })
    );

    unsubscribers.push(
      ws.on('error', (err: unknown) => {
        // Usually CORS/network/decoding errors.
        setWaveError(typeof err === 'string' ? err : '!');
      })
    );

    return () => {
      unsubscribers.forEach((u) => u());
      ws.destroy();
      if (waveSurferRef.current === ws) waveSurferRef.current = null;
    };
  }, [audioUrl]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioUrl) return;
    const ws = waveSurferRef.current;
    if (!ws) return;
    ws.playPause();
  }, []);

  return (
    <div
      className="flex items-center gap-2 bg-muted/60 rounded-full px-2 py-1 shrink-0 cursor-default w-auto max-w-[80px] md:max-w-full  md:w-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 rounded-full p-0 hover:bg-transparent"
        onClick={toggle}
      >
        {isPlaying ? (
          <Button variant="dark" size="icon" className="h-7 w-7 shrink-0 rounded-full p-0 pl-0.5 flex items-center justify-center">
          <Pause className="h-3 w-3 text-white" />
          </Button>
        ) : (
          <Button variant="dark" size="icon" className="h-7 w-7 shrink-0 rounded-full p-0 pl-0.5 flex items-center justify-center">
            <Play className="h-3 w-3 text-white" />
          </Button>
        )}
      </Button>
      <div className="hidden md:block w-full md:w-16 h-6 rounded-md overflow-hidden">
        <div ref={waveformElRef} className="w-full h-full" />
      </div>
      <span className="hidden md:block text-[10px] text-muted-foreground tabular-nums w-7">
        {isPlaying
          ? formatTime(currentSec)
          : formatTime(totalSec)}
      </span>
      {waveError ? (
        <span className="text-[10px] text-destructive/80 whitespace-nowrap">
          {waveError}
        </span>
      ) : null}
    </div>
  );
}
