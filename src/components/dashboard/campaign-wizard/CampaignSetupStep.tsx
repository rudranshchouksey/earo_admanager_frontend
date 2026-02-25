import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/services/api';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { useTranslation } from '@/contexts/TranslationContext';

interface Ad {
  id: string;
  product_name: string;
  brand_name: string | null;
  tone: string | null;
  duration_seconds: number | null;
}

interface CampaignSetupData {
  adId: string;
  campaignName: string;
  externalCampaignId?: string;
}

interface Props {
  data: CampaignSetupData;
  onChange: (data: CampaignSetupData) => void;
}

export default function CampaignSetupStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();
  const [ads, setAds] = useState<Ad[]>([]);
  const [showAllAds, setShowAllAds] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      const { data: { session } } = await api.auth.getSession();
      if (!session) return;
      const { data: adsData } = await api.getAds(session.user.id);
      if (adsData) setAds(adsData);
    };
    fetchAds();
  }, []);

  const latestAds = ads.slice(0, 3);
  const selectedAd = ads.find((a) => a.id === data.adId);
  const isSelectedInLatest = latestAds.some((a) => a.id === data.adId);

  return (
    <div className="space-y-6">
      {/* Ad Selection */}
      <div className="space-y-3">
        <Label>{t('wizard.setup.select_ad')}</Label>

        {ads.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('wizard.setup.no_ads')}</p>
        )}

        {/* Latest 3 ads as cards */}
        {latestAds.length > 0 && (
          <div className="grid gap-2">
            {latestAds.map((ad) => {
              const isSelected = data.adId === ad.id;
              return (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => onChange({ ...data, adId: ad.id })}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/40 hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-md shrink-0 bg-muted text-muted-foreground">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ad.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[ad.brand_name, ad.tone, ad.duration_seconds ? `${ad.duration_seconds}s` : null]
                        .filter(Boolean)
                        .join(' · ') || t('wizard.setup.audio_ad')}
                    </p>
                  </div>
                  <Checkbox checked={isSelected} className="shrink-0" tabIndex={-1} />
                </button>
              );
            })}
          </div>
        )}

        {/* Show select for choosing a different ad */}
        {ads.length > 3 && (
          <div>
            {!showAllAds ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowAllAds(true)}
              >
                {t('wizard.setup.choose_different', { count: String(ads.length - 3) })}
              </Button>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('wizard.setup.all_ads')}</Label>
                <Select value={data.adId} onValueChange={(v) => onChange({ ...data, adId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('wizard.setup.choose_ad_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ads.map((ad) => (
                      <SelectItem key={ad.id} value={ad.id}>{ad.product_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Show selected ad name if it's not in the latest 3 */}
        {selectedAd && !isSelectedInLatest && (
          <p className="text-xs text-muted-foreground">
            {t('wizard.setup.selected')}: <span className="font-medium text-foreground">{selectedAd.product_name}</span>
          </p>
        )}
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
