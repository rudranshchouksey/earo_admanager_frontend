import { Card, CardContent } from '@/components/ui/card';

const STATS = [
  { value: '50K+', title: 'Podcasts & Radio Stations', subtext: 'Arabic, English, Urdu, Tagalog and more' },
  { value: '100M+', title: 'Monthly Listeners', subtext: 'UAE, Saudi Arabia, Egypt and wider MENA' },
];

interface ReachStatsSectionProps {
  heading?: string;
}

export default function ReachStatsSection({ heading = 'Your reach on Earo' }: ReachStatsSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
        {heading}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STATS.map((s) => (
          <Card key={s.title} className="rounded-[24px] border border-border bg-card">
            <CardContent className="p-6 space-y-1">
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
