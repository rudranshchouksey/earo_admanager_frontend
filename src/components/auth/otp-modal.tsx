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
import { auth } from "@/services/api";
import { toast } from "@/hooks/use-toast";

export interface OtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Number of OTP digit fields (default: 6) */
  length?: number;
  /** Called when user submits/completes OTP */
  onComplete?: (type: string, value: { error: Error | null, status: number, message: string }) => void;
  /** Called on each change (optional) */
  onChange?: (value: string) => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  /** Show submit button; if false, relies on onComplete from input-otp auto-trigger */
  showSubmitButton?: boolean;
  loading?: boolean;
  className?: string;
  sentToEmail?: boolean;
  errorMessage?: string;
  /** Return to method picker (e.g. from MfaSelector) */
  onBack?: () => void;
  backLabel?: string;
  email: string;
  userId: string;
}

export function OtpModal({
  open,
  onOpenChange,
  length = 6,
  onComplete,
  onChange,
  title = "Enter verification code",
  description = "We've sent a code to your email. Enter it below.",
  submitLabel = "Verify",
  showSubmitButton = true,
  loading = false,
  className,
  sentToEmail = false,
  errorMessage,
  onBack,
  backLabel = "Back",
  email,
  userId
}: OtpModalProps) {
  const [value, setValue] = React.useState("");


  const verifyOtp = async (otp: string) => {
    console.log("verifyOtp", userId, otp);
    const { error, status, message } = await auth.verifyEmailVerificationOtp2fa(userId, otp);
    onComplete("OTP", {
      error,
      status,
      message
    })
  };

  const handleComplete = (otpValue: string) => {
    if (otpValue.length === length && onComplete) {
      verifyOtp(otpValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length === length && onComplete) {
      verifyOtp(value);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setValue("");
    onOpenChange(next);
  };


  React.useEffect(() => {

    console.log("useEffect", userId, open);
    if (userId && open) {
      const sendEmailVerificationOTP = async () => {
      const { error, status, message } = await auth.sendEmailVerificationOtp2fa(userId);
      if (error || status !== 200) {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        }
      };
      sendEmailVerificationOTP();
    }

  }, [userId, open]);


  const fallbackDescription = sentToEmail
    ? "We've sent a code to your email. Enter it below."
    : "We've sent a code to your device. Enter it below.";
  const descriptionText = description ?? fallbackDescription;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{descriptionText}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <InputOTP
              maxLength={length}
              value={value}
              onChange={(v) => {
                setValue(v);
                onChange?.(v);
              }}
              onComplete={handleComplete}
              containerClassName="gap-2"
            >
              <InputOTPGroup className="gap-1.5">
                {Array.from({ length }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {errorMessage && (
            <p className="text-sm text-destructive text-center p-2">{errorMessage}</p>
          )}
          {showSubmitButton && (
            <DialogFooter className={cn(onBack && "flex-col gap-2 sm:flex-col")}>
              <Button
                type="submit"
                disabled={value.length !== length || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
              {onBack && (
                <Button type="button" variant="ghost" className="w-full" disabled={loading} onClick={onBack}>
                  {backLabel}
                </Button>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
