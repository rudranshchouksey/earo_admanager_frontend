import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { PauseIcon, PlayIcon } from '@/components/shared/PlayPauseIcons';
import { pauseOtherWaveSurfers, registerWaveSurferPlayer, unregisterWaveSurferPlayer } from '@/lib/waveSurferGlobal';
import { trackPlayAudio } from '@/lib/gtm';
import { cn, formatCompactNumber } from '@/lib/utils';

/*
 * Ported from admanager_landing/src/components/shared/AudioCardPlayer.tsx -- the player the
 * landing site uses for sample ads and the generated-ad result -- so audio looks and behaves
 * the same before and after signup. Keep the markup/styling in sync with the landing copy.
 *
 * Differences from the landing version (app-specific plumbing only):
 * - Audio loads directly with CORS (like ad-creator/InlineAudioPlayer) instead of through the
 *   landing site's Next.js /api/audio-proxy route, which doesn't exist here.
 * - Play tracking goes through this app's GTM helper (trackPlayAudio); no PostHog in this app.
 * - `reach` is optional (the dashboard has no reach figure per ad).
 * - Optional `action` slot (dashboard-only): rendered inside the card on the right, e.g. an
 *   "Edit ad" button. Omit it and the card is identical to the landing version.
 */

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioCardPlayer({
  sample,
  className = '',
  action,
}: {
  sample: {
    id?: string;
    title: string;
    reach?: string;
    audioUrl: string;
  };
  className?: string;
  action?: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [isNearViewport, setIsNearViewport] = useState(false);

  const audioUrl = sample.audioUrl?.trim() ?? '';
  const canPlay = audioUrl.length > 0;

  // WaveSurfer's init does its own canvas/layout measurement (a forced-reflow trigger) --
  // defer creating it until the card is about to scroll into view.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canPlay || !isNearViewport || !containerRef.current) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDurationSec(0);
      return;
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: audioUrl,
      height: 24,
      waveColor: '#D1D5DC',
      progressColor: '#36AB45',
      cursorColor: '#36AB45',
      cursorWidth: 2,
      barWidth: 1,
      barGap: 1,
      barRadius: 1,
      dragToSeek: true,
      normalize: true,
      fetchParams: { mode: 'cors', credentials: 'omit' },
    });

    wavesurferRef.current = ws;
    registerWaveSurferPlayer(ws);

    ws.on('play', () => {
      pauseOtherWaveSurfers(ws);
      setIsPlaying(true);
      trackPlayAudio({ adId: sample.id, adName: sample.title });
    });
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));
    ws.on('ready', (d) => setDurationSec(d));
    ws.on('timeupdate', (t) => setCurrentTime(t));

    return () => {
      unregisterWaveSurferPlayer(ws);
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl, canPlay, isNearViewport, sample.id, sample.title]);

  const togglePlay = useCallback(() => {
    if (!wavesurferRef.current) return;
    void wavesurferRef.current.playPause();
  }, []);

  const timeLabel =
    durationSec > 0 ? `${formatTime(currentTime)} / ${formatTime(durationSec)}` : formatTime(currentTime);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'w-full max-w-full lg:max-w-[320px] flex flex-row items-center justify-start rounded-[16px] p-4 gap-4 bg-white border border-[#D8D9DB] min-w-0',
        className,
      )}
    >
      <button
        type="button"
        disabled={!canPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={togglePlay}
        className={cn(
          'shrink-0 rounded-full p-0.5 text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#36AB45] focus-visible:ring-offset-1',
          canPlay && 'hover:opacity-80',
          !canPlay && 'cursor-not-allowed opacity-40',
        )}
      >
        {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
      </button>

      <div className="w-full flex flex-col gap-2 min-w-0 flex-1">
        {(sample.title || sample.reach) && (
          <div className="w-full flex flex-row items-center justify-between gap-1">
            {sample.title && <span className="text-[#111827] font-bold text-sm truncate">{sample.title}</span>}
            {sample.reach && (
              <span className="bg-[#E6F4EA] text-[#36AB45] font-bold text-[10px] leading-[15px] py-0.5 px-2 rounded-[4px] shrink-0">
                +{formatCompactNumber(+sample.reach, 'en-US')} reach
              </span>
            )}
          </div>
        )}
        <div className="w-full flex flex-row items-center justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0 max-h-[36px]">
            {canPlay && isNearViewport ? (
              <div ref={containerRef} className="w-full" role="img" aria-label={`Waveform for ${sample.title}`} />
            ) : (
              <div className="w-full h-9 flex items-end justify-center gap-0.5 opacity-50" aria-hidden>
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 rounded-full bg-[#D1D5DC]"
                    style={{ height: `${8 + ((i * 13) % 20)}px` }}
                  />
                ))}
              </div>
            )}
          </div>
          <span className="text-[#9CA3AF] text-[10px] leading-[15px] font-[450] shrink-0 tabular-nums">{timeLabel}</span>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
