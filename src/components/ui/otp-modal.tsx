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

export interface OtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Number of OTP digit fields (default: 6) */
  length?: number;
  /** Called when user submits/completes OTP */
  onComplete?: (value: string) => void;
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
}: OtpModalProps) {
  const [value, setValue] = React.useState("");

  const handleComplete = (otpValue: string) => {
    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setValue("");
    onOpenChange(next);
  };

  const descriptionText = sentToEmail ? "We've sent a code to your email. Enter it below." : "We've sent a code to your device. Enter it below.";

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
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
          {showSubmitButton && (
            <DialogFooter>
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
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
