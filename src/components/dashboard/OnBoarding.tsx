import { Check, Headphones, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export type OnboardingRole = "AGENCY" | "SME";

type OnBoardingProps = {
  open: boolean;
  onSelectRole: (
    role: OnboardingRole,
  ) => Promise<{ error: any; status: number; message: string }>;
  className?: string;
};

export const OnBoarding = ({
  open,
  onSelectRole,
  className,
}: OnBoardingProps) => {

    const [loading, setloading] = useState(false);

  const handleSelectRole = async (role: OnboardingRole) => {
    setloading(true);
    const { error, status, message } = await onSelectRole(role);
    if (error || status !== 200) {
      toast({
        title: "Failed to select role",  
        description: message,
        variant: "destructive",
      });
      return;
    }
    setloading(false);
    toast({
      title: "Success",
      description: message || "Organization type selected successfully",
      variant: "default",
    });
    setloading(false);
  };

  return (
    <Dialog open={open} modal>
      <DialogContent
        hideCloseButton
        className={cn("sm:max-w-2xl p-0 overflow-hidden", className)}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="relative p-6 sm:p-8">
            <DialogHeader className="text-center items-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Headphones className="h-7 w-7" aria-hidden />
              </div>
              <DialogTitle className="mt-3 text-2xl sm:text-3xl">
                Choose your role
              </DialogTitle>
              <DialogDescription className="max-w-xl">
                We'll tailor your dashboard, settings, and workflows based on
                how you use the platform.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div
                className={cn(
                  "group relative rounded-2xl border border-border bg-background p-5 text-left shadow-sm transition",
                  "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
              >
                <div className="flex flex-col items-start gap-3">
                  <div className="flex flex-row items-center gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Store className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col items-start justify-center ">
                        <p className="text-lg font-semibold text-foreground">
                          SME
                        </p>
                        <span className="rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          Best for brands
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create and run audio campaigns for your own business.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    "Simple setup to launch faster",
                    "Create ads and campaigns in one flow",
                    "Track performance and spend",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 text-primary"
                        aria-hidden
                      />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <Button className="w-full rounded-xl" type="button" disabled={loading} onClick={() => handleSelectRole("SME")}>
                    Continue as SME
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "group relative rounded-2xl border border-border bg-background p-5 text-left shadow-sm transition",
                  "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
              >
                <div className="flex flex-col items-start gap-3">
                  <div className="flex flex-row items-center gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Users className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col items-start justify-center ">
                        <p className="text-lg font-semibold text-foreground">
                          Agency
                        </p>
                        <span className="rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          Best for teams
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage multiple advertisers and campaigns across accounts.
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    "Switch advertisers with ease",
                    "Collaborate with teammates",
                    "Centralized billing & reporting",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 text-primary"
                        aria-hidden
                      />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <Button
                    className="w-full rounded-xl"
                    type="button"
                    variant="secondary"
                    disabled={loading}
                    onClick={() => handleSelectRole("AGENCY")}
                  >
                    Continue as Agency
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
