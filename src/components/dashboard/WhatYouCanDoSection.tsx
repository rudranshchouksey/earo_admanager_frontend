import { useNavigate } from 'react-router-dom';
import { AudioLines, Megaphone, BarChart3, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WhatYouCanDoSectionProps {
  hasAudioAd: boolean;
}

export default function WhatYouCanDoSection({ hasAudioAd }: WhatYouCanDoSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
        What you can do on Earo
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-[24px] border border-border bg-card">
          <CardContent className="p-5 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <AudioLines className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Audio Ads</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-written scripts, professional voice acting and music mixing — all from your URL. No studio needed.
            </p>
            {!hasAudioAd ? (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => navigate('/dashboard/ads/new')}
              >
                Create your first ad →
              </button>
            ) : (
              <button
                type="button"
                className="text-sm font-medium text-muted-foreground hover:underline"
                onClick={() => navigate('/dashboard/ads')}
              >
                Manage your ads
              </button>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border bg-card">
          <CardContent className="p-5 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Campaigns</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Group ads by goal, set targeting by genre, region and listener profile, and control your daily spend.
            </p>
            {hasAudioAd ? (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => navigate('/dashboard/campaigns/new')}
              >
                Create a campaign →
              </button>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Create an audio ad to unlock
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border bg-card">
          <CardContent className="p-5 space-y-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Reports</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track impressions, reach and frequency by publisher, region and time period as your campaigns run.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Available once your campaign launches
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
