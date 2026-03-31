import * as React from "react";
import { Mail, Shield, ArrowRight } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";

type MfaPhase = "select" | "email" | "authenticator";

export interface MfaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  qrCode?: string;
  onVerifyEmail: (otp: string) => Promise<{ error: any; status: number; message: string }>;
  onResendEmail: () => Promise<{ error: any; status: number; message: string }>;
  onVerifyAuthenticator: (code: string) => Promise<{ error: any; status: number; message: string }>;
}

export function MfaSelector({
  open,
  onOpenChange,
  email,
  qrCode,
  onVerifyEmail,
  onResendEmail,
  onVerifyAuthenticator,
}: MfaSelectorProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = React.useState<MfaPhase>("select");
  const [resendTime, setResendTime] = React.useState(0);
  const [resending, setResending] = React.useState(false);
  // Track if we've already triggered the initial email for this session
  const hasSentEmail = React.useRef(false);


  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTime > 0) {
      interval = setInterval(() => {
        setResendTime((prev) => prev - 1);
      }, 1000);
    }else {
        hasSentEmail.current = false;
    }
    return () => clearInterval(interval);
  }, [resendTime]);



  // Reset when the main modal closes
  React.useEffect(() => {
    if (!open) {
      setPhase("select");
      hasSentEmail.current = false;
      setResendTime(0);
    }
  }, [open]);


  const handleSendEmail = async () => {
    setResending(true);
    if(hasSentEmail.current) return;

    hasSentEmail.current = true;
    onResendEmail().then((res) => {
      if (res.error || res.status !== 200) {
        toast({
          title: "Failed to send code",
          description: res.message,
          variant: "destructive",
        });
        // Allow retry if it failed
        hasSentEmail.current = false;
      }
      else {
          toast({
              title: "Code sent successfully",
              description: "Check your email for the code.",
              variant: "default",
          });
          setResendTime(60);
          hasSentEmail.current = true;
      }
      setResending(false);
    }).catch(() => {
      setResending(false);
    });
  }

  // Handle entering the email phase
  React.useEffect(() => {
    if (phase === "email" && !hasSentEmail.current) {
      handleSendEmail();
    }
  }, [phase, onResendEmail, t]);

  const handleBackToSelect = () => {
    setPhase("select");
  };

  return (
    <>
      {/* 1. SELECTION DIALOG */}
      <Dialog open={open && phase === "select"} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auth.mfa_selection_title") || "Two-Step Verification"}</DialogTitle>
            <DialogDescription>
              {t("auth.mfa_selection_desc") || "Choose a method to verify your identity."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => setPhase("authenticator")}
            >
              <div className="flex w-full items-center justify-between mb-1">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  {t("auth.mfa_option_authenticator") || "Authenticator App"}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground text-left ml-7">
                {t("auth.mfa_option_authenticator_desc") || "Use Google Authenticator, Authy, or similar."}
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => setPhase("email")}
            >
              <div className="flex w-full items-center justify-between mb-1">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  {t("auth.mfa_option_email") || "Email Verification"}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground text-left ml-7">
                {t("auth.mfa_option_email_desc", { email }) || `Send a code to ${email}`}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. EMAIL OTP MODAL */}
      <OtpModal
        open={open && phase === "email"}
        onOpenChange={(next) => (!next ? onOpenChange(false) : null)}
        onVerify={onVerifyEmail}
        onResend={handleSendEmail} 
        resendTime={resendTime}
        onBack={handleBackToSelect}
        title={t("auth.mfa_email_otp_title") || "Check your email"}
        description={t("auth.mfa_email_otp_desc") || "Enter the 6-digit code we sent to your inbox."}
      />

      {/* 3. AUTHENTICATOR MODAL */}
      <SetupMFAModal
        open={open && phase === "authenticator"}
        onOpenChange={(next) => (!next ? onOpenChange(false) : null)}
        qrCode={qrCode}
        onVerify={onVerifyAuthenticator}
        onScanBack={handleBackToSelect}
        title={t("auth.mfa_authenticator_title") || "Authenticator Code"}
      />
    </>
  );
}