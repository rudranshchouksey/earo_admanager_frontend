import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, X } from 'lucide-react';

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

  const metrics = [
    { label: 'Total Available Impressions', value: totalAvailable.toLocaleString(), highlight: true },
    { label: 'Estimated ads played', value: Math.round(impressions * 0.85).toLocaleString() },
    { label: 'Estimated unique listeners', value: reach.toLocaleString() },
    { label: 'Estimated frequency', value: `${frequency}x` },
  ];

  return (
    <Card className="border-[#E6F4EA]">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Campaign Forecast</h3>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Audience guide"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        {showGuide && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-xs">Audience Guide</span>
              <button type="button" onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p>These estimates help you understand how your targeting, budget, and settings translate into potential campaign results.</p>
            <p><span className="font-medium text-foreground">Estimated ads played:</span> The number of ad impressions you're likely to deliver with your current budget.</p>
            <p><span className="font-medium text-foreground">Estimated unique listeners:</span> The approximate number of distinct listeners your ads will reach.</p>
            <p><span className="font-medium text-foreground">Max frequency:</span> The average number of times each listener may hear your ad.</p>
            <p><span className="font-medium text-foreground">Deliverability:</span> Indicates how achievable your setup is based on targeting scope and inventory availability.</p>
            <p>Adjusting your targeting or budget can impact these estimates.</p>
          </div>
        )}

        <div className="space-y-3">
          {inventoryCount > 0 && (
            <div>
              <p className="text-lg font-semibold text-foreground leading-tight">{metrics[0].value}</p>
              <p className="text-xs text-muted-foreground">{metrics[0].label}</p>
            </div>
          )}
          <div className="border-b border-border" />
          {totalBudget > 0 && (
            <p className="text-xs text-muted-foreground">
              With a budget of USD {totalBudget.toLocaleString()} we estimate you will achieve:
            </p>
          )}
          {metrics.slice(1).map((m) => (
            <div key={m.label}>
              <p className="text-lg font-semibold text-foreground leading-tight">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        {totalBudget > 0 && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Based on ${dailyBudget.toLocaleString()}/day over {durationDays} days across {inventoryCount} channel{inventoryCount > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
