import { Card, CardContent } from '@/components/ui/card';

const STEPS = ['Drop your URL', 'Pick voice and music', 'Launch'];

export function NewUserGetStartedCard() {
  return (
    <Card className="border-0 shadow-none rounded-[24px] bg-card">
      <CardContent className="p-5 space-y-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-background">{i + 1}</span>
            </div>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function NewUserStatsStrip() {
  return (
    <div className="px-1 space-y-0.5">
      <p className="text-xs font-bold uppercase tracking-wide text-foreground">50K+ Podcasts &amp; Radios</p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">100M+ Listeners</p>
    </div>
  );
}
