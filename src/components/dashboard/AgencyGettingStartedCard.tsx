import { useNavigate } from 'react-router-dom';
import { CreditCard, Globe, Users, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StepIcon } from '@/components/dashboard/GettingStartedCard';

// Same icon-pill style as GettingStartedCard's AD_PILLS.
const ADVERTISER_PILLS: { label: string; icon: LucideIcon }[] = [
  { label: 'Name & domain', icon: Globe },
  { label: 'Set billing', icon: CreditCard },
  { label: 'Assign to team', icon: Users },
];

interface AgencyGettingStartedCardProps {
  canEdit: boolean;
}

export default function AgencyGettingStartedCard({ canEdit }: AgencyGettingStartedCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">Getting started</h2>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">1 of 4 complete</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={cn('h-1.5 w-8 rounded-full', i < 1 ? 'bg-foreground' : 'bg-muted')} />
              ))}
            </div>
          </div>
        </div>

        {/* Stepper rows: each step is its own light-grey card */}
        <div className="flex flex-col gap-3">
          {/* Step 1: Create your agency account — always done */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status="done" number={1} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-muted-foreground leading-9">Create your agency account</h3>
            </div>
          </div>

          {/* Step 2: Add your first advertiser */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status="current" number={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Add your first advertiser</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Each advertiser gets their own workspace — separate campaigns, budgets and reporting. You manage
                everything from one place.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {ADVERTISER_PILLS.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-background text-foreground px-3 py-1 text-xs font-medium"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                    {label}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Button onClick={() => navigate('/dashboard/account/advertisers')}>Add advertiser</Button>
                  <span className="text-xs text-muted-foreground">~2 minutes</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Invite team members */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status="locked" number={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-muted-foreground">Invite team members</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add an advertiser first to set permissions correctly.
              </p>
            </div>
          </div>

          {/* Step 4: Launch your first campaign */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status="locked" number={4} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-muted-foreground">Launch your first campaign</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Available after you add an advertiser.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
