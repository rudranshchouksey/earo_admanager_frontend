import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Upload, X, Image, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/TranslationContext';

const IAB_DIMENSIONS = [
  { value: '300x250', label: '300×250 — Medium Rectangle' },
  { value: '728x90', label: '728×90 — Leaderboard' },
  { value: '160x600', label: '160×600 — Wide Skyscraper' },
  { value: '320x50', label: '320×50 — Mobile Banner' },
  { value: '300x600', label: '300×600 — Half Page' },
  { value: '970x250', label: '970×250 — Billboard' },
];

interface BannerSlot {
  dimension: string;
  fileName: string | null;
  preview: string | null;
}

export interface AudienceExtensionData {
  enabled: boolean;
  banners: BannerSlot[];
  impressionPixel: string;
}

interface Props {
  data: AudienceExtensionData;
  onChange: (data: AudienceExtensionData) => void;
  dailyBudget: number;
}

export default function AudienceExtensionStep({ data, onChange, dailyBudget }: Props) {
  const { t } = useTranslation();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const budgetIncrease = data.enabled ? Math.round(dailyBudget * 0.2) : 0;

  const updateBanner = (index: number, update: Partial<BannerSlot>) => {
    const next = [...data.banners];
    next[index] = { ...next[index], ...update };
    onChange({ ...data, banners: next });
  };

  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    updateBanner(index, { fileName: file.name, preview });
  };

  const removeBanner = (index: number) => {
    updateBanner(index, { fileName: null, preview: null });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <Label className="text-base font-semibold">{t('wizard.audience_ext.retarget_title')}</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('wizard.audience_ext.retarget_desc')}
          </p>
        </div>
        <Switch
          checked={data.enabled}
          onCheckedChange={(checked) => onChange({ ...data, enabled: checked })}
        />
      </div>

      {data.enabled && (
        <>
          {/* Budget impact */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              {t('wizard.audience_ext.budget_increase')}: <span className="font-semibold text-foreground">+20%</span>
              {dailyBudget > 0 && (
                <span className="text-muted-foreground"> (+${budgetIncrease}/day → ${dailyBudget + budgetIncrease}/day total)</span>
              )}
            </p>
          </div>

          {/* Banner Uploads */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              {t('wizard.audience_ext.iab_banners')}
            </Label>

            {data.banners.map((banner, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{t('wizard.audience_ext.banner', { n: String(index + 1) })}</span>
                  {banner.fileName && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeBanner(index)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Dimension Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('wizard.audience_ext.dimension')}</Label>
                    <Select
                      value={banner.dimension}
                      onValueChange={(v) => updateBanner(index, { dimension: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('wizard.audience_ext.select_size')} />
                      </SelectTrigger>
                      <SelectContent>
                        {IAB_DIMENSIONS.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Upload */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('wizard.audience_ext.creative')}</Label>
                    <input
                      ref={el => { fileInputRefs.current[index] = el; }}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      onChange={(e) => handleFileUpload(index, e)}
                      className="hidden"
                    />
                    {banner.fileName ? (
                      <div className="flex items-center gap-2 text-sm text-foreground border rounded-md px-3 py-2">
                        <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{banner.fileName}</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRefs.current[index]?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('wizard.audience_ext.upload')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {banner.preview && (
                  <div className="bg-muted rounded-md p-2 flex items-center justify-center">
                    <img
                      src={banner.preview}
                      alt={`Banner ${index + 1} preview`}
                      className="max-h-24 object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Impression Pixel */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('wizard.audience_ext.impression_pixel')}
            </Label>
            <Input
              placeholder={t('wizard.audience_ext.pixel_placeholder')}
              value={data.impressionPixel}
              onChange={(e) => onChange({ ...data, impressionPixel: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {t('wizard.audience_ext.pixel_hint')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
