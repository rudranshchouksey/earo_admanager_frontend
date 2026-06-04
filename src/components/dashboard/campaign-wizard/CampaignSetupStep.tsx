import { useEffect, useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { ChevronDown, Play, Pause, Search } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { AdData, adsApi } from '@/services/ads';
import { auth, AuthSession } from '@/services/auth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MyTooltip } from '@/components/ui/MyTooltip';

interface CampaignSetupData {
  audioId: string;
  campaignName: string;
  adName?: string;
  externalCampaignId?: string;
}

interface Props {
  data: CampaignSetupData;
  onChange: (data: CampaignSetupData) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  campaignNameRef: React.RefObject<HTMLInputElement>;
  audioAdRef: React.RefObject<HTMLDivElement>;
  disabled: boolean;
}

let activeAudioEl: HTMLAudioElement | null = null;

function PlayCell({ audioUrl }: { audioUrl: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (playing) {
      audio.pause();
      if (activeAudioEl === audio) activeAudioEl = null;
      setPlaying(false);
      return;
    }

    // Ensure only one audio plays at a time.
    if (activeAudioEl && activeAudioEl !== audio) {
      activeAudioEl.pause();
    }
    activeAudioEl = audio;
    audio.play();
    setPlaying(true);
  }, [playing, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      if (activeAudioEl && activeAudioEl !== audio) {
        activeAudioEl.pause();
      }
      activeAudioEl = audio;
      setPlaying(true);
    };
    const onPause = () => {
      if (activeAudioEl === audio) activeAudioEl = null;
      setPlaying(false);
    };
    const onEnd = () => {
      if (activeAudioEl === audio) activeAudioEl = null;
      setPlaying(false);
    };
    const onError = () => {
      if (activeAudioEl === audio) activeAudioEl = null;
      setPlaying(false);
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onError);
      if (activeAudioEl === audio) activeAudioEl = null;
    };
  }, []);

  if (!audioUrl) return <span className="text-muted-foreground">—</span>;

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="none" />
      <Button variant="dark" size="icon" className="h-6 w-6 bg-[#0f1729] text-white hover:bg-[#0f1729]/90 rounded-full" onClick={toggle}>
        {playing ? <Pause className="h-3 w-3 p-1" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </Button>
    </>
  );
}

type SimpleColumn<T> = {
  key: keyof T & string;
  label: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

const adColumns: SimpleColumn<AdData>[] = [
  {
    key: 'sourceUrl',
    label: '',
    render: (_val, item) => <PlayCell audioUrl={item.sourceUrl} />,
    className: 'w-10',
  },
  { key: 'adName', label: 'Name' },
  { key: 'campaignGoal', label: 'Goal' },
  {
    key: 'duration',
    label: 'Duration',
    render: (val) => (val != null ? `${val}` : '—'),
  },
  {
    key: 'createdAt',
    label: 'Created',
    hideOnMobile: true,
    render: (val) => val ? new Date(String(val)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
  },
];



const campaignTooltip = `

  <div class="p-2">
<b>Campaign name </b><br />
Give this campaign a clear internal name. We recommend: [Advertiser] – [Offer] – [Market] – [Month/Year], e.g. "Energy Company – Free Quote – UK – September 2026".
<br /><br />
<b>External ID (optional)</b><br />
Link this campaign to an ID used in an external platform (e.g. a Google Analytics campaign ID or CRM reference). This ID appears in all report exports so you can join data across tools.
  </div>
`;

export default function CampaignSetupStep({ data, onChange, searchInputRef, campaignNameRef, audioAdRef, disabled }: Props) {
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();
  const [ads, setAds] = useState<AdData[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [query, setQuery] = useState('');
  const [loadingAds, setLoadingAds] = useState(false);
  const [totalAds, setTotalAds] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerWrapperRef = useRef<HTMLDivElement | null>(null);
  //const searchInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      if (!isPickerOpen) return;

      if(!session || !session.currentAdvertiserId) return;


      setLoadingAds(true);
      const { data: adsRes, error, status, message } = await adsApi.getAds({
        page: page,
        limit: limit,
        sortBy: "createdAt",
        advertiserId: session.currentAdvertiserId,
        isSaved: true,
        search: query || undefined
      });
  
      console.log("adsRes here ", {adsRes, error, status, message});
      if (status !== 200 || error) {
        toast({ title: t('common.error'), description: message ?? 'Unable to load ads', variant: 'destructive' });
        setAds([]);
        setTotalAds(0);
        setTotalPages(1);
        setLoadingAds(false);
        return;
      }
  
      const next = adsRes?.data ?? [];
      setTotalAds(adsRes?.meta?.total ?? next.length);
      setTotalPages(adsRes?.meta?.totalPages ?? 1);
      setAds((prev) => (page > 1 ? [...prev, ...next] : next));
      setLoadingAds(false);
    };
    fetchAds();
  }, [page, limit, query, t, session, isPickerOpen]);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await auth.getSession();
      setSession(data.session);
      const { data: sub } = auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });
      return () => sub.subscription.unsubscribe();
    };
    const cleanup = loadSession();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  // Debounce query -> reset paging
  useEffect(() => {
    if (!isPickerOpen) return;
    const t = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query, isPickerOpen]);

  // Infinite scroll observer (API-backed)
  useEffect(() => {
    if (!isPickerOpen) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;
    const hasMore = ads.length < totalAds;
    if (!hasMore) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (loadingAds) return;
        if (ads.length >= totalAds) return;
        setPage((p) => p + 1);
      },
      { root, rootMargin: "120px", threshold: 0 },
    );

    obs.observe(target);
    return () => obs.disconnect();
  }, [ads.length, totalAds, loadingAds, isPickerOpen]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isPickerOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!pickerWrapperRef.current) return;
      if (!pickerWrapperRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPickerOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isPickerOpen]);

  // When opening: reset paging and focus search
  useEffect(() => {
    if (!isPickerOpen) return;
    setPage(1);
    const t = setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [isPickerOpen]);

  return (
    <div className="space-y-6" ref={audioAdRef}>
      {/* Ad Selection */}
      <div className="space-y-3">
      <Label className='flex items-center gap-2'><span>Choose your audio ad <sup>*</sup></span></Label>

      <div ref={pickerWrapperRef} className="space-y-2">
        {/* Trigger bar */}
        <button
          type="button"
          onClick={() => setIsPickerOpen((o) => !o)}
          className={cn(
            'w-full flex items-center justify-between gap-3 h-10 px-3 rounded-md border border-input bg-background text-sm',
            'hover:bg-accent/30 transition-colors',
          )}
          disabled={disabled}
        >
          <span className={cn('truncate', data.audioId ? 'text-foreground' : 'text-muted-foreground')}>
            {data.audioId ? (data.adName || 'Selected ad') : 'Select audio ad...'}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isPickerOpen && 'rotate-180')} />
        </button>

        {/* Dropdown content */}
        {isPickerOpen && (
          <div className="border rounded-lg overflow-hidden bg-background">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 h-10"
                  placeholder="Search ads by name or goal..."                  
                  disabled={disabled}
                />
              </div>
            </div>

            <div
              ref={scrollRef}
              className="overflow-auto"
              style={{ maxHeight: '420px' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border sticky top-0 z-10">
                      <th className="w-10 px-3 py-2.5" />
                      {adColumns.map((col) => (
                        <th
                          key={col.key}
                          className={cn(
                            'text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap',
                            col.hideOnMobile && 'hidden md:table-cell',
                            col.className,
                          )}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {loadingAds && page === 1 ? (
                      <tr>
                        <td
                          colSpan={adColumns.length + 1}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : ads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={adColumns.length + 1}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          No ads found. Create an audio ad first. <a href="/dashboard/ads/new" className='text-foreground underline'>Create now</a>
                        </td>
                      </tr>
                    ) : (
                      ads.map((item) => {
                        const isSelected = data.audioId === item.id;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => {
                              onChange({ ...data, audioId: item.id, adName: item.adName || '' });
                              setIsPickerOpen(false);
                            }}
                            className={cn(
                              'transition-colors cursor-pointer hover:bg-accent/50',
                              isSelected && 'bg-primary/5',
                            )}
                          >
                            <td className="px-3 py-2.5">
                              <Checkbox checked={isSelected} tabIndex={-1} />
                            </td>
                            {adColumns.map((col) => (
                              <td
                                key={col.key}
                                className={cn(
                                  'px-3 py-2.5',
                                  col.hideOnMobile && 'hidden md:table-cell',
                                  col.className,
                                )}
                              >
                                {col.render
                                  ? col.render(item[col.key], item)
                                  : String(item[col.key] ?? '')}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sentinel + loading-more indicator */}
              {ads.length < totalAds && (
                <div className="py-3 text-center text-xs text-muted-foreground">
                  {loadingAds && page > 1 ? 'Loading more…' : null}
                </div>
              )}
              <div ref={sentinelRef} className="h-4" />
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Campaign Name */}
      <div className="space-y-2">
      <Label className='flex items-center gap-2'><span>Campaign name <sup>*</sup></span> <MyTooltip html={campaignTooltip} /> </Label>
      <Input
          placeholder={t('wizard.setup.campaign_name_placeholder')}
          value={data.campaignName}
          onChange={(e) => onChange({ ...data, campaignName: e.target.value })}
          maxLength={200}
          ref={campaignNameRef}
          disabled={disabled}
        />
        <div className='flex justify-end'>
          <span className='text-xs text-slate-900'>{data.campaignName.length}/200</span>
        </div>
      </div>

      {/* External Campaign ID — Pro only */}
      {isPro && (
        <div className="space-y-2" style={{marginTop: 0}}>
          <Label className='flex items-center gap-2'>External ID (optional)</Label>
          <Input
            placeholder={t('wizard.setup.external_id_placeholder')}
            value={data.externalCampaignId || ''}
            onChange={(e) => onChange({ ...data, externalCampaignId: e.target.value })}
            maxLength={50}
            disabled={disabled}
          />
          <div className='flex justify-end'>
            <span className='text-xs text-slate-900'>{(data.externalCampaignId || '').length}/50</span>
          </div>
          </div>
      )}
    </div>
  );
}
