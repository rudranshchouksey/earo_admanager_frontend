// otp-modal.tsx
import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";


export interface OtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // BUSINESS LOGIC PROPS
  onVerify: (otp: string) => Promise<{ error: any; status: number; message: string }>;
  onResend?: () => void;
  resendTime?: number;
  resending?: boolean;
  // UI PROPS
  title?: string;
  description?: string;
  length?: number;
  onBack?: () => void;
}

export function OtpModal({
  open,
  onOpenChange,
  onVerify,
  onResend,
  resendTime,
  resending,
  title = "Verify Code",
  description,
  length = 6,
  onBack,
}: OtpModalProps) {
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Performance: Clear state on close
  React.useEffect(() => {
    if (!open) {
      setValue("");
      setLocalError(null);
    }
  }, [open]);

  React.useEffect(() => {
    setLocalError("");
  }, [value]);

  const handleVerify = async (otpValue: string) => {
    if (otpValue.length !== length) return;
    setLoading(true);
    setLocalError(null);
    
    const { error, message, status } = await onVerify(otpValue);
    
    if (error || status !== 200) {
      setLocalError(message || "Invalid verification code.");
      setLoading(false);
    } else {
      setLoading(false);
      onOpenChange(false); // Success!
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-2">
          <InputOTP 
            maxLength={length} 
            value={value} 
            onChange={setValue} 
            onComplete={handleVerify}
            disabled={loading}
          >
            <InputOTPGroup className="gap-1.5">
              {Array.from({ length }).map((_, i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {localError && <p className="text-sm text-destructive text-center">{localError}</p>}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={() => handleVerify(value)} disabled={loading || value.length !== length}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Verify"}
          </Button>
          {onResend && (
            <Button variant="ghost" onClick={onResend} disabled={loading|| resending || resendTime > 0}>{resendTime > 0 ? `Resend Code in ${resendTime} seconds` : "Resend Code"}</Button>
          )}
          {onBack && <Button variant="outline" onClick={onBack}>Back</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}