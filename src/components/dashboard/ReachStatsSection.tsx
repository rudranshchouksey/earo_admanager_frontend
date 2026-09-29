import { cn } from '@/lib/utils';
import PartnerPills from '@/components/shared/PartnerPills';

const STATS = [
  { value: '50K+', title: 'Podcasts & radio stations' },
  { value: '100M+', title: 'Monthly listeners' },
];

interface ReachStatsSectionProps {
  heading?: string;
}

// Grey stats panel styled after admanager_landing's StatsPanel (bg-secondary, divider
// between columns), with the landing site's "Available on" partner pills underneath.
export default function ReachStatsSection({ heading = 'Your reach on Earo' }: ReachStatsSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
        {heading}
      </p>
      <div className="bg-secondary rounded-[32px] p-6 space-y-6">
        <div className="grid grid-cols-2">
          {STATS.map((s, i) => (
            <div key={s.title} className={cn('px-3', i > 0 && 'border-s border-border')}>
              <p className="text-3xl font-bold tracking-tight text-foreground leading-none">{s.value}</p>
              <p className="text-sm font-semibold text-foreground mt-3 leading-snug">{s.title}</p>
            </div>
          ))}
        </div>
        <PartnerPills />
      </div>
    </div>
  );
}
