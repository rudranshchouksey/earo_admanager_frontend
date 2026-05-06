import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileWarning, Info, Loader2, TriangleAlert, X } from 'lucide-react';

const DAILY_BASELINES: Record<string, number> = { Streaming: 80000, Podcast: 30000, Radio: 40000 };

interface ForecastProps {
  isLoading: boolean;
  totalAvailableImpressions: number;
  budget: number;
  cpm?: number;
  noOfDays?: number | string;
}

export function formatCompactNumber(value: number, locale: string = 'en-US'): string {
  if (value < 100000)
    return value.toFixed(0).toString();

  const formatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  });

  return formatter.format(value);
}


export default function ForecastSidebar({ isLoading, totalAvailableImpressions, budget, cpm=18, noOfDays=1 }: ForecastProps) {
  const [showGuide, setShowGuide] = useState(false);

  if(isLoading) {
    return (
      <Card className="border-[#E6F4EA]">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center min-h-[200px] justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const frequency = 3;
  const estimatedAdsPlayed = ((budget / cpm)*1000);
  const uniqueListeners = (estimatedAdsPlayed / frequency);

  console.log({budget, frequency, estimatedAdsPlayed, uniqueListeners})
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

            <div>
              <p className="flex gap-2 items-center text-lg font-semibold text-foreground leading-tight">{formatCompactNumber(totalAvailableImpressions)} {totalAvailableImpressions < estimatedAdsPlayed ? <span className='text-destructive text-xs' title='Low inventory'><TriangleAlert size={16} /> </span> : <></>} </p>
              <p className="text-xs text-muted-foreground">Total Available Impressions</p>
            </div>

          <div className="border-b border-border" />

            <p className="text-xs text-muted-foreground">
              With a budget of USD {budget * Number(noOfDays)} we estimate you will achieve:
            </p>

            <div>
              <p className="text-lg font-semibold text-foreground leading-tight">{(estimatedAdsPlayed).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Estimated ads played</p>
            </div>


            <div>
              <p className="text-lg font-semibold text-foreground leading-tight">{uniqueListeners.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Estimated unique listeners</p>
            </div>

            <div>
              <p className="text-lg font-semibold text-foreground leading-tight">{frequency.toFixed(0)}x</p>
              <p className="text-xs text-muted-foreground">Estimated frequency</p>
            </div>



        </div>
          {/* <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Based on ${budget.toLocaleString()}/day over {durationDays} days across {inventoryCount} channel{inventoryCount > 1 ? 's' : ''}
          </p> */}
      </CardContent>
    </Card>
  );
}
