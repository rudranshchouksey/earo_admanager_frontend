import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StepIcon } from '@/components/dashboard/GettingStartedCard';

const ADVERTISER_PILLS = ['Name & domain', 'Set billing', 'Assign to team'];

interface AgencyGettingStartedCardProps {
  canEdit: boolean;
}

export default function AgencyGettingStartedCard({ canEdit }: AgencyGettingStartedCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="rounded-[32px] border border-border bg-card">
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">Getting started</h2>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">1 of 4 complete</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={cn('h-1.5 w-8 rounded-full', i < 1 ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
          </div>
        </div>

        {/* Stepper rows */}
        <div className="flex flex-col">
          {/* Step 1: Create your agency account — always done */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status="done" number={1} />
              <div className="w-px flex-1 min-h-[16px] bg-border my-1" />
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-sm font-semibold text-foreground">Create your agency account</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Done</p>
            </div>
          </div>

          {/* Step 2: Add your first advertiser */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status="active" number={2} />
              <div className="w-px flex-1 min-h-[16px] bg-border my-1" />
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-sm font-semibold text-foreground">Add your first advertiser</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Each advertiser gets their own workspace — separate campaigns, budgets and reporting. You manage
                everything from one place.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {ADVERTISER_PILLS.map((label, i) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"
                  >
                    <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Button onClick={() => navigate('/dashboard/account?page=advertisers')}>Add advertiser</Button>
                  <span className="text-xs text-muted-foreground">~2 minutes</span>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Invite team members */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status="locked" number={3} />
              <div className="w-px flex-1 min-h-[16px] bg-border my-1" />
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-sm font-semibold text-muted-foreground">Invite team members</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add an advertiser first to set permissions correctly.
              </p>
            </div>
          </div>

          {/* Step 4: Launch your first campaign */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status="locked" number={4} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-muted-foreground">Launch your first campaign</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Available after you add an advertiser.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
