import * as React from "react";
import { Mail, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OtpModal } from "@/components/auth/otp-modal";
import { SetupMFAModal } from "@/components/auth/mfa-modal";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/TranslationContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type MfaPhase = "select" | "email" | "authenticator";

export interface MfaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode?: string;
  length?: number;
  className?: string;
  otpLoading?: boolean;
  otpErrorMessage?: string;
  authenticatorLoading?: boolean;
  authenticatorErrorMessage?: string;
  email: string;
  onComplete: (type: string, value: { error: Error | null, status: number, message: string, data: any }) => void;
  userId: string;
}

export function MfaSelector({
  open,
  onOpenChange,
  qrCode,
  length = 6,
  className,
  onComplete,
  otpLoading,
  otpErrorMessage,
  authenticatorLoading,
  authenticatorErrorMessage,
  email,
  userId,
}: MfaSelectorProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = React.useState<MfaPhase>("select");
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!open) setPhase("select");
  }, [open]);

  const goBackToSelect = () => setPhase("select");

  const handleSelectorOpenChange = (next: boolean) => {
    if (!next) {
      setPhase("select");
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open && phase === "select"} onOpenChange={handleSelectorOpenChange}>
        <DialogContent className={cn("sm:max-w-md", className)}>
          <DialogHeader>
            <DialogTitle>{t("auth.mfa_selector_title")}</DialogTitle>
            <DialogDescription>{t("auth.mfa_selector_desc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto flex-col items-start gap-1 py-4 text-left"
              onClick={() => setPhase("email")}
            >
              <span className="flex w-full items-center gap-2 font-semibold">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                {t("auth.mfa_option_email")}
              </span>
              <span className="w-full pl-7 text-sm font-normal text-muted-foreground">
                {t("auth.mfa_option_email_desc")}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto flex-col items-start gap-1 py-4 text-left"
              onClick={() => setPhase("authenticator")}
            >
              <span className="flex w-full items-center gap-2 font-semibold">
                <Shield className="h-5 w-5 shrink-0 text-primary" />
                {t("auth.mfa_option_authenticator")}
              </span>
              <span className="w-full pl-7 text-sm font-normal text-muted-foreground">
                {t("auth.mfa_option_authenticator_desc")}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OtpModal
        open={open && phase === "email"}
        onOpenChange={(next) => {
          if (!next) goBackToSelect();
        }}
        length={length}
        sentToEmail
        loading={otpLoading}
        errorMessage={otpErrorMessage}
        onComplete={onComplete}
        title={t("auth.mfa_email_otp_title")}
        description={t("auth.mfa_email_otp_desc")}
        onBack={goBackToSelect}
        backLabel={t("auth.mfa_back")}
        email={email}
        userId={userId}
      />

      <SetupMFAModal
        open={open && phase === "authenticator"}
        onOpenChange={(next) => {
          if (!next) goBackToSelect();
        }}
        length={length}
        qrCode={qrCode}
        loading={authenticatorLoading}
        errorMessage={authenticatorErrorMessage}
        onComplete={onComplete}
        onScanBack={goBackToSelect}
        methodBackLabel={t("auth.mfa_back")}
        defaultStep="verify"
        userId={userId}
      />
    </>
  );
}
