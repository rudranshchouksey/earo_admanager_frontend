import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DraftChecklist } from '@/lib/campaignCompletion';

const ITEMS: { key: keyof DraftChecklist; label: string }[] = [
  { key: 'audioDone', label: 'Audio ad attached' },
  { key: 'budgetDone', label: 'Budget set' },
  { key: 'datesDone', label: 'Start and end dates set' },
  { key: 'targetingDone', label: 'Choose your audience' },
];

interface DraftCampaignCardProps {
  checklist: DraftChecklist;
}

export default function DraftCampaignCard({ checklist }: DraftCampaignCardProps) {
  const firstIncompleteKey = ITEMS.find((item) => !checklist[item.key])?.key;

  return (
    <Card className="border-0 shadow-none rounded-[24px] bg-card">
      <CardContent className="p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What&apos;s left</p>
        <div className="space-y-2.5">
          {ITEMS.map((item) => {
            const done = checklist[item.key];
            const isNextUp = item.key === firstIncompleteKey;
            return (
              <div key={item.key} className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-foreground shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    done ? 'text-foreground' : isNextUp ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
