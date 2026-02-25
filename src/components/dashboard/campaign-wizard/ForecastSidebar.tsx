import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Radio, Repeat, Globe, Info, X } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

const DAILY_BASELINES: Record<string, number> = { Streaming: 80000, Podcast: 30000, Radio: 40000 };

interface ForecastProps {
  totalBudget: number;
  dailyBudget: number;
  inventoryTypes: string[];
  durationDays: number;
  ageRangeCount?: number;
  deviceTypeCount?: number;
  hasLocation?: boolean;
}

export default function ForecastSidebar({ totalBudget, dailyBudget, inventoryTypes, durationDays, ageRangeCount = 1, deviceTypeCount = 1, hasLocation = false }: ForecastProps) {
  const { t } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  const cpm = 8;
  const baseImpressions = totalBudget > 0 ? Math.round((totalBudget / cpm) * 1000) : 0;

  const inventoryCount = inventoryTypes.length;
  const dailyBase = inventoryTypes.reduce((sum, t) => sum + (DAILY_BASELINES[t] || 50000), 0);

  const ageMultiplier = 1 + Math.log2(Math.max(1, ageRangeCount)) * 0.15;
  const deviceMultiplier = 1 + (Math.max(1, deviceTypeCount) - 1) * 0.1;
  const durationMultiplier = durationDays > 0 ? 1 + Math.min(Math.log10(durationDays) * 0.1, 0.3) : 1;
  const locationMultiplier = hasLocation ? 0.85 : 1;

  const combinedMultiplier = ageMultiplier * deviceMultiplier * durationMultiplier * locationMultiplier;

  const totalAvailable = Math.round(dailyBase * Math.max(1, durationDays) * combinedMultiplier);

  const impressions = Math.round(baseImpressions * Math.max(1, inventoryCount) * combinedMultiplier);
  const reach = Math.round(impressions * 0.6);
  const frequency = reach > 0 ? (impressions / reach).toFixed(1) : '0';

  const highlightMetric = { label: t('wizard.forecast.total_available'), value: totalAvailable.toLocaleString(), icon: Globe };
  const estimateMetrics = [
    { label: t('wizard.forecast.ads_played'), value: Math.round(impressions * 0.85).toLocaleString(), icon: Radio },
    { label: t('wizard.forecast.unique_listeners'), value: reach.toLocaleString(), icon: Users },
    { label: t('wizard.forecast.max_frequency'), value: `${frequency}x`, icon: Repeat },
  ];

  const renderMetric = (m: { label: string; value: string; icon: React.ElementType }, highlight = false) => (
    <div key={m.label} className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${highlight ? 'bg-accent/20' : 'bg-primary/10'}`}>
        <m.icon className={`h-4 w-4 ${highlight ? 'text-accent-foreground' : 'text-primary'}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground leading-tight">{m.value}</p>
        <p className="text-xs text-muted-foreground">{m.label}</p>
      </div>
    </div>
  );

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{t('wizard.forecast.title')}</h3>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('wizard.forecast.audience_guide')}
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        {showGuide && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-xs">{t('wizard.forecast.audience_guide_title')}</span>
              <button type="button" onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p>{t('wizard.forecast.estimates_intro')}</p>
            <p><span className="font-medium text-foreground">{t('wizard.forecast.ads_played')}:</span> {t('wizard.forecast.ads_played_hint')}</p>
            <p><span className="font-medium text-foreground">{t('wizard.forecast.unique_listeners')}:</span> {t('wizard.forecast.unique_listeners_hint')}</p>
            <p><span className="font-medium text-foreground">{t('wizard.forecast.max_frequency')}:</span> {t('wizard.forecast.max_frequency_hint')}</p>
            <p><span className="font-medium text-foreground">{t('wizard.forecast.deliverability')}:</span> {t('wizard.forecast.deliverability_hint')}</p>
            <p>{t('wizard.forecast.adjust_hint')}</p>
          </div>
        )}

        <div className="space-y-3">
          {inventoryCount > 0 && renderMetric(highlightMetric, true)}
          <div className="border-b border-border" />
          {totalBudget > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('wizard.forecast.budget_estimate', { total: totalBudget.toLocaleString() })}
            </p>
          )}
          {estimateMetrics.map((m) => renderMetric(m))}
        </div>
        {totalBudget > 0 && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            {t('wizard.forecast.based_on', { daily: dailyBudget.toLocaleString(), days: String(durationDays), count: String(inventoryCount) })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
