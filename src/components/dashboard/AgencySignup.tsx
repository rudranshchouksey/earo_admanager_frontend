import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  LayoutGrid,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { auth } from "@/services/auth";
import { organizationApi } from "@/services/organization";
import { logger } from "@/lib/logger";

export type OnboardingRole = "AGENCY" | "SME";

type AgencySignupProps = {
  open: boolean;
  /** Called when the dialog should close (X, overlay, Esc, or “Not now”). */
  onOpenChange?: (open: boolean) => void;
  className?: string;
  onRequested?: (hasRequested: boolean) => void;
};

const agencyFeatures: {
  icon: typeof Users;
  title: string;
  description: string;
}[] = [
    {
      icon: Building2,
      title: "Multiple advertisers",
      description: "Manage separate brands and billing in one workspace.",
    },
    {
      icon: Users,
      title: "Team collaboration",
      description: "Invite teammates and align on campaigns and assets.",
    },
    {
      icon: LayoutGrid,
      title: "Unified campaigns",
      description: "Plan and launch audio campaigns across accounts.",
    },
    {
      icon: BarChart3,
      title: "Reporting & insights",
      description: "Centralized performance and spend visibility.",
    },
  ];

export const AgencySignup = ({
  open,
  onOpenChange,
  className,
  onRequested
}: AgencySignupProps) => {
  const [loading, setLoading] = useState(false);

  const handleSelectRole = async (role: OnboardingRole) => {
    setLoading(true);
    try {
      const { error, status, message } = await onSelectRole(role);
      if (error || status !== 200) {
        toast({
          title: "Failed to select role",
          description: message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Success",
        description: message || "Organization type selected successfully",
        variant: "default",
      });
      onOpenChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const onRequestToUpgradeToAgency = async () => {
    const {data: {session: sessionData}} = await auth.getSession();
    if (!sessionData) {
      logger.error("Not authenticated");
      return;
    }
    setLoading(true);

    const { error, status, message } = await organizationApi.requestToUpgradeToAgency(sessionData?.user?.id, sessionData?.currentOrganizationId ?? '');
    if (error || status !== 200) {
      toast({
        title: "Failed to request to upgrade to agency",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: message || "Requested to upgrade to agency successfully",
        variant: "default",
      });
    }
    setLoading(false);
    onRequested?.(true);
  }

return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-lg",
          className,
        )}
      >
        <div className="relative border-b border-border/80 bg-gradient-to-br from-primary/[0.12] via-background to-background px-6 pb-6 pt-8 sm:px-8">
          <div className="flex flex-col items-center text-center">
            <Badge
              variant="secondary"
              className="mb-3 gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              Upgrade
            </Badge>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-4 ring-primary/15">
              <Users className="h-7 w-7" aria-hidden />
            </div>
            <DialogHeader className="space-y-2 sm:text-center">
              <DialogTitle className="text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
                Upgrade to Agency
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                Move from a single-brand workspace to an Agency account built for
                teams, multiple advertisers, and scalable audio advertising.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6 sm:px-8">
          <p className="text-sm font-medium text-foreground">
            What you get with Agency
          </p>
          <ul className="grid gap-3 ">
            {agencyFeatures.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex gap-3 rounded-xl border border-border/80 bg-muted/30 p-3.5 transition-colors hover:bg-muted/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-start gap-2 text-sm font-semibold text-foreground">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {title}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-muted-foreground sm:order-1"
              disabled={loading}
              onClick={() => onOpenChange?.(false)}
            >
              Not now
            </Button>
            <Button
              className="w-full rounded-xl sm:order-2 sm:w-auto sm:min-w-[200px]"
              type="button"
              disabled={loading}
              onClick={onRequestToUpgradeToAgency}
            >
              {loading ? "Upgrading…" : "Request to upgrade to Agency"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
