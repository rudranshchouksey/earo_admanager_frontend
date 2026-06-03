import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type SharePayload = {
  adName?: string | null;
};

export type ShareModalProps = {
  open: boolean;
  payload?: SharePayload | null;
  ids: string[];
  onClose: () => void;
};

export default function ShareModal({ open, payload, ids, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);


  const shareUrl = `${import.meta.env.VITE_APP_URL}/share?ids=${ids.join(',')}`;

  const shareText = useMemo(() => {
    const name = payload?.adName?.trim();
    if (name) return `${name}\n${shareUrl}`;
    return shareUrl;
  }, [payload?.adName, shareUrl]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setCopyError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const closeShareModal = () => onClose();

  const onCopy = async () => {
    try {
      setCopyError(null);
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Could not copy link. Please copy it manually.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={closeShareModal}
      />
      <div className="relative w-full max-w-[520px] rounded-[20px] bg-white p-6 md:p-8 shadow-xl border border-[#E5E7EB]">
        <button
          type="button"
          onClick={closeShareModal}
          className="absolute top-4 end-4 rounded-lg p-2 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2
              id="share-modal-title"
              className="text-[#111827] font-bold text-[22px] leading-tight tracking-[-0.02em]"
            >
              Share your ad{ids.length > 1 ? 's' : ''}
            </h2>
            <p className="text-[#6B7280] text-sm md:text-base font-[450]">
              Share this unique link. Anyone with the link can open it.
            </p>
          </div>

          {copyError && (
            <p className="text-[#B91C1C] text-sm font-medium" role="alert">
              {copyError}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mobile primary: WhatsApp. Desktop primary: Copy link. */}
            <a
              className={cn(buttonVariants({ variant: "default", size: "md" }), "md:hidden")}
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <a
              className={cn(buttonVariants({ variant: "secondary", size: "md" }), "hidden md:inline-flex")}
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <a
              className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
              href={`mailto:?subject=${encodeURIComponent(
                payload?.adName?.trim() ? `Ad: ${payload.adName}` : "My ad",
              )}&body=${encodeURIComponent(shareText)}`}
            >
              Email
            </a>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "secondary", size: "md" }), "md:hidden")}
              onClick={onCopy}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "default", size: "md" }), "hidden md:inline-flex")}
              onClick={onCopy}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

