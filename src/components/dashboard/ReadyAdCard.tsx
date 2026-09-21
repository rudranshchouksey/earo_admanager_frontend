import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardAdPlayer from '@/components/dashboard/DashboardAdPlayer';
import type { AdData } from '@/services/ads';

interface ReadyAdCardProps {
  ad: AdData;
  onEditAudio: () => void;
}

export default function ReadyAdCard({ ad, onEditAudio }: ReadyAdCardProps) {
  return (
    <Card className="border-0 shadow-none rounded-[24px] bg-card">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {ad.adName} — {ad.duration}s
          </h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-transparent shrink-0">
            Ready
          </Badge>
        </div>

        <DashboardAdPlayer audioUrl={ad.sourceUrl ?? ''} />

        {/* TODO(follow-up): "Duplicate ad" CTA omitted — no adsApi.duplicateAd/cloneAd exists yet. */}
        <div className="pt-1 border-t border-border">
          <Button variant="outline" className="w-full mt-3" onClick={onEditAudio}>
            Edit audio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
