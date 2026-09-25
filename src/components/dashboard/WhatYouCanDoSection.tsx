import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import UpgradePlanModal from '@/components/dashboard/UpgradePlanModal';
import { useSessionFlags } from '@/hooks/useSessionFlags';

export interface FeatureRow {
  title: string;
  description: string;
  // Set when the feature is usable: the whole row becomes a button to this route. Absolute
  // http(s) URLs open in a new tab (e.g. the help centre).
  href?: string;
  // Alternative to href: run an action (e.g. open a modal) when the row is clicked.
  onClick?: () => void;
  // Shown on the right instead of a chevron while the feature is still locked.
  lockedLabel?: string;
}

// One grouped card with divider rows, kept deliberately neutral (no brand-green links) so
// the Getting Started checklist's single next action stays the only green on the page.
export function FeatureListCard({ heading = 'What you can do', rows }: { heading?: string; rows: FeatureRow[] }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">{heading}</p>
      <Card className="rounded-[24px] border border-border bg-card overflow-hidden divide-y divide-border">
        {rows.map((row) => {
          const isClickable = Boolean(row.href || row.onClick);
          const handleClick = () => {
            if (row.onClick) return row.onClick();
            if (!row.href) return;
            if (/^https?:\/\//.test(row.href)) window.open(row.href, '_blank', 'noopener,noreferrer');
            else navigate(row.href);
          };
          const content = (
            <>
              <div className="min-w-0 flex-1">
                <h3 className={isClickable ? 'text-sm font-semibold text-foreground' : 'text-sm font-semibold text-muted-foreground'}>
                  {row.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{row.description}</p>
              </div>
              {isClickable ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
              ) : (
                row.lockedLabel && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                    <Lock className="h-3 w-3" /> {row.lockedLabel}
                  </span>
                )
              )}
            </>
          );
          return isClickable ? (
            <button
              key={row.title}
              type="button"
              onClick={handleClick}
              className="flex w-full items-center gap-3 px-5 py-4 text-start transition-colors hover:bg-muted/50"
            >
              {content}
            </button>
          ) : (
            <div key={row.title} className="flex items-center gap-3 px-5 py-4">
              {content}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

const HELP_CENTER_URL = 'https://help.earo.ai'; // same link as the sidebar's Help & Support

export default function WhatYouCanDoSection() {
  const { isPro } = useSessionFlags();
  const [showPlans, setShowPlans] = useState(false);

  return (
    <>
      <FeatureListCard
        rows={[
          {
            title: 'Express vs Pro account',
            description: 'See what Pro adds, like more voices, advanced targeting and scheduling.',
            onClick: () => setShowPlans(true),
          },
          {
            title: 'Need more information',
            description: 'Guides and answers to common questions in our help centre.',
            href: HELP_CENTER_URL,
          },
          {
            title: 'Manage your account',
            description: 'Update your profile, billing details and payment methods.',
            href: '/dashboard/account',
          },
        ]}
      />
      {showPlans && (
        // Same plan comparison the sidebar's "Upgrade" button opens (DashboardLayout).
        <UpgradePlanModal
          open={showPlans}
          onOpenChange={(open) => !open && setShowPlans(false)}
          currentPlan={isPro ? 'Pro' : 'Express'}
        />
      )}
    </>
  );
}
