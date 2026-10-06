import { useEffect, useId, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Cross, CrossIcon, Loader2 } from "lucide-react";
import { Close } from "@radix-ui/react-toast";
import { logger } from "@/lib/logger";

export interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mamo inline payment link URL from your backend (`link_type: inline`). */
  paymentUrl: string;
  /** Called when the user clicks Cancel (after the modal is closed). */
  onCancel?: () => void;
  /** Visible title for the dialog and accessibility. */
  title?: string;
}

export default function PaymentModal({
  open,
  onOpenChange,
  paymentUrl,
  onCancel,
  title = "Complete payment",
}: PaymentModalProps) {
  const reactId = useId();
  const mountId = useRef(`mamo-checkout-${reactId.replace(/:/g, "")}`);
  const [iframeLoading, setIframeLoading] = useState(false);

  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  useEffect(() => {
    if (!open || !paymentUrl) return;

    const elementId = mountId.current;
    const SCRIPT_URL = "https://assets.mamopay.com/stable/checkout-inline-2.0.0.min.js";
    let cancelled = false;
    let frame = 0;
    let attempts = 0;

    // `class MamoPay` is a classic-script global, not a property of globalThis.
    const mamoReady = () => typeof MamoPay !== "undefined";

    const attach = () => {
      if (cancelled || !mamoReady()) return;
      const el = document.getElementById(elementId);
      if (!el) return;
      if (el.querySelector("iframe")) {
        setIframeLoading(false);
        return;
      }
      new MamoPay().addIframeToWebsite(elementId, paymentUrl);
      setIframeLoading(false);
    };

    const waitAndAttach = () => {
      if (cancelled) return;
      const el = document.getElementById(elementId);
      // Dialog content is portaled, so the mount node can appear a frame after `open`.
      if (!el) {
        if (attempts++ < 120) frame = requestAnimationFrame(waitAndAttach);
        else setIframeLoading(false);
        return;
      }
      if (mamoReady()) {
        attach();
        return;
      }

      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => attach();
        script.onerror = () => {
          if (!cancelled) setIframeLoading(false);
          logger.error("Failed to load the Mamo Pay SDK.");
        };
        document.head.appendChild(script);
        return;
      }

      script.addEventListener("load", attach, { once: true });
      // The tag can already be loaded; `load` will not fire again.
      frame = requestAnimationFrame(attach);
    };

    setIframeLoading(true);
    frame = requestAnimationFrame(waitAndAttach);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [open, paymentUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className={cn(
          "flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-full md:max-w-[400px] flex-col gap-0 overflow-hidden p-4",
        )}
      >
        <div className="w-full flex justify-end">
        <span className="text-md font-semibold py-2 cursor-pointer"  onClick={handleCancel}>Cancel</span>
        </div>
        {paymentUrl ? (
          <div className="relative min-h-[min(70vh,640px)] w-full flex-1 bg-muted/20">
            {iframeLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              </div>
            )}
            <div id={mountId.current} className="min-h-[min(70vh,640px)] w-full mamo-checkout" />
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center px-6 py-10 text-center text-sm text-muted-foreground">
            No payment URL available.
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
