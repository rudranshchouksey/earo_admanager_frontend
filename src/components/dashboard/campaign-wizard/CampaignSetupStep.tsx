import { useEffect, useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { SearchableList } from '@/components/ui/searchable-list';
import type { Column } from '@/components/ui/searchable-list';
import { Play, Pause, CirclePlay } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { useSessionFlags } from '@/hooks/useSessionFlags';
interface Ad {
  id: string;
  product_name: string;
  ai_category: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  created_at: string | null;
}

interface CampaignSetupData {
  adId: string;
  campaignName: string;
  adName?: string;
  externalCampaignId?: string;
}

interface Props {
  data: CampaignSetupData;
  onChange: (data: CampaignSetupData) => void;
}

function PlayCell({ audioUrl }: { audioUrl: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  }, [playing, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlaying(false);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, []);

  if (!audioUrl) return <span className="text-muted-foreground">—</span>;

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="none" />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggle}>
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </Button>
    </>
  );
}

const GOAL_LABELS: Record<string, string> = {
  sales: 'Sales',
  leads: 'Leads',
  traffic: 'Website Traffic',
  consideration: 'Product & Brand Consideration',
  awareness: 'Brand Awareness & Reach',
  app: 'App Promotion',
  local: 'Local Store Visits & Promotions',
};

const adColumns: Column<Ad>[] = [
  { key: 'product_name', label: 'Name', sortable: true },
  { key: 'ai_category', label: 'Goal', sortable: true, render: (val) => val ? (GOAL_LABELS[String(val)] || String(val)) : '—' },
  {
    key: 'audio_url',
    label: '',
    render: (_val, item) => <PlayCell audioUrl={item.audio_url} />,
    className: 'w-10',
  },
  {
    key: 'duration_seconds',
    label: 'Duration',
    sortable: true,
    render: (val) => (val != null ? `${val}s` : '—'),
  },
  {
    key: 'created_at',
    label: 'Created',
    sortable: true,
    hideOnMobile: true,
    render: (val) => val ? new Date(String(val)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
  },
];

export default function CampaignSetupStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    // const fetchAds = async () => {
    //   const { data: session } = await supabase.auth.getSession();
    //   if (!session.session) return;
    //   const { data: adsData } = await supabase
    //     .from('ads')
    //     .select('id, product_name, ai_category, audio_url, duration_seconds, created_at')
    //     .eq('user_id', session.session.user.id)
    //     .order('created_at', { ascending: false });
    //   if (adsData) setAds(adsData);
    // };
    // fetchAds();
  }, []);

  return (
    <div className="space-y-6">
      {/* Ad Selection */}
      <div className="space-y-3">
      <Label>{t('wizard.setup.select_ad')}</Label>
      <SearchableList<Ad>
          items={ads}
          columns={adColumns}
          selectionMode="single"
          selectedIds={data.adId ? [data.adId] : []}
          onSelectionChange={(ids) => {
            const selectedAd = ads.find(a => a.id === ids[0]);
            onChange({ ...data, adId: ids[0] || '', adName: selectedAd?.product_name || '' });
          }}
          idKey="id"
          searchPlaceholder="Search ads by name or goal..."
          searchableKeys={['product_name', 'ai_category']}
          defaultSort={{ key: 'product_name', dir: 'asc' }}
          pageSize={10}
          variant="table"
          maxHeight="300px"
          emptyMessage="No ads found. Create an audio ad first."
          collapsible
          collapsibleIcon={<CirclePlay className="h-4 w-4" />}
          collapsibleLabel="Select audio ad..."
        />
      </div>

      {/* Campaign Name */}
      <div className="space-y-2">
      <Label>{t('wizard.setup.campaign_name')}</Label>
      <Input
          placeholder={t('wizard.setup.campaign_name_placeholder')}
          value={data.campaignName}
          onChange={(e) => onChange({ ...data, campaignName: e.target.value })}
        />
      </div>

      {/* External Campaign ID — Pro only */}
      {isPro && (
        <div className="space-y-2">
          <Label>{t('wizard.setup.external_id')}</Label>
          <Input
            placeholder={t('wizard.setup.external_id_placeholder')}
            value={data.externalCampaignId || ''}
            onChange={(e) => onChange({ ...data, externalCampaignId: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">{t('wizard.setup.external_id_hint')}</p>
          </div>
      )}
    </div>
  );
}
