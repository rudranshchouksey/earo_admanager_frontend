import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { userApi } from "@/services/user";
import { useNavigate } from "react-router-dom";

export interface SetupMFAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  length?: number;
  onComplete?: (value: { error: Error | null, status: number, message: string, data: any }) => void;
  onChange?: (value: string) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  showSubmitButton?: boolean;
  loading?: boolean;
  className?: string;
  qrCode?: string;
  errorMessage?: string;
  defaultStep?: "scan" | "verify";
  /** Back to method picker (e.g. MfaSelector) from QR step */
  onScanBack?: () => void;
  methodBackLabel?: string;
  userId: string;
}

export function SetupMFAModal({
  open,
  onOpenChange,
  length = 6,
  onComplete,
  onChange,
  submitLabel = "Verify",
  showSubmitButton = true,
  loading = false,
  className,
  qrCode,
  errorMessage,
  defaultStep = "scan",
  onScanBack,
  methodBackLabel = "Back",
  userId,
}: SetupMFAModalProps) {
  const [value, setValue] = React.useState("");
  const [step, setStep] = React.useState<"scan" | "verify">(defaultStep);
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!open) {
      setStep(defaultStep);
      setValue("");
    }
  }, [open, defaultStep]);


  console.log({userId});

  const handleComplete = (otpValue: string) => {
    if (otpValue.length === length && onComplete) {
      verify2FA(otpValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length === length && onComplete) {
      verify2FA(value);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setValue("");
      setStep(defaultStep);
    }
    onOpenChange(next);
  };


  const verify2FA = async (code: string) => {
    const { error, status, message, data } = await userApi.verify2fa(userId, code);
    if (error || status !== 200) {
      onComplete({error, status, message, data });
      return;
    }
    onComplete({error: null, status, message, data });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-md min-h-[200px]", className)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Setup MFA</DialogTitle>
            <DialogDescription>
              {step === "scan"
                ? "Scan the QR code with your authenticator app"
                : "Enter the code from your authenticator app"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-2">
            {step === "scan" ? (
              <>
                {qrCode ? (
                  <img src={qrCode} alt="MFA QR Code" width={200} height={200} className="rounded-md border border-border" />
                ) : (
                  <p className="text-sm text-muted-foreground">QR code not available</p>
                )}
                <Button type="button" className="w-full max-w-xs" disabled={!qrCode} onClick={() => setStep("verify")}>
                  I have scanned the QR code
                </Button>
                {onScanBack && (
                  <Button type="button" variant="ghost" className="w-full max-w-xs" onClick={onScanBack}>
                    {methodBackLabel}
                  </Button>
                )}
              </>
            ) : (
              <>
                <InputOTP
                  maxLength={length}
                  value={value}
                  onChange={(v) => {
                    setValue(v);
                    onChange?.(v);
                  }}
                  onComplete={handleComplete}
                  containerClassName="gap-2"
                  disabled={loading}
                >
                  <InputOTPGroup className="gap-1.5">
                    {Array.from({ length }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {errorMessage && (
                  <p className="text-sm text-destructive text-center">{errorMessage}</p>
                )}
                {showSubmitButton && (
                  <DialogFooter className="flex w-full max-w-xs flex-col gap-2 sm:flex-col">
                    <Button type="submit" className="w-full" disabled={loading || value.length !== length}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        submitLabel
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      disabled={loading}
                      onClick={() => {
                        setValue("");
                        setStep("scan");
                      }}
                    >
                      Back
                    </Button>
                  </DialogFooter>
                )}
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
