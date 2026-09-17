import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DashboardHeroAction {
  label: string;
  onClick: () => void;
}

interface DashboardHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subcopy: ReactNode;
  primaryAction: DashboardHeroAction;
  secondaryAction?: DashboardHeroAction;
  rightCard: ReactNode;
  belowCard?: ReactNode;
  accentClassName?: string;
  /** Hide the CTA row for read-only viewers while still showing the informational copy/card. Defaults to true. */
  showActions?: boolean;
}

/**
 * Shared two-column shell for the DashboardHome landing states: a light rounded
 * container, a left copy column (eyebrow/headline/subcopy/CTA row), and a
 * right-side white card slot. All three landing states share this skeleton.
 */
export default function DashboardHero({
  eyebrow,
  title,
  subcopy,
  primaryAction,
  secondaryAction,
  rightCard,
  belowCard,
  accentClassName,
  showActions = true,
}: DashboardHeroProps) {
  return (
    <div className={cn('bg-muted/50 rounded-[32px] p-6 overflow-hidden', accentClassName)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-3">
          {eyebrow && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-foreground leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{subcopy}</p>
          {showActions && (
            <div className="flex items-center gap-4 pt-1">
              <Button className="h-11 px-5" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
              {secondaryAction && (
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="space-y-3">
          {rightCard}
          {belowCard}
        </div>
      </div>
    </div>
  );
}
