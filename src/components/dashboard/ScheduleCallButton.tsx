import { useEffect, useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const SCHEDULE_CALL_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1BxiO5AXDsZc314HB2PSw0JZqtLKQ2tN5olAsxXjULC_my-kq3EM2AlEKL4GVjJp-A7ZDrT8X4?gv=true';

// Below this distance (px) from the bottom of the page, the button fades out
// entirely so it never sits over a page's own bottom CTA (e.g. Pay & Launch,
// Generate My Ad) — it fades back in once scrolled away from the bottom.
const NEAR_BOTTOM_PX = 320;

export default function ScheduleCallButton() {
  const [open, setOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const checkPosition = () => {
      const distanceFromBottom =
        document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      // Require the user to have actually scrolled — on a page whose content isn't much
      // taller than the viewport, distanceFromBottom can already be under the threshold
      // at scrollY 0, which would hide the button before it's ever seen.
      const nearBottom = window.scrollY > 0 && distanceFromBottom < NEAR_BOTTOM_PX;
      setHidden(nearBottom);
    };

    checkPosition();
    window.addEventListener('scroll', checkPosition, { passive: true });
    window.addEventListener('resize', checkPosition);
    return () => {
      window.removeEventListener('scroll', checkPosition);
      window.removeEventListener('resize', checkPosition);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setIframeLoaded(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-4 right-0 sm:bottom-6 z-40 pb-[env(safe-area-inset-bottom)] transition-opacity duration-300',
          hidden ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
      >
        <Button
          onClick={() => setOpen(true)}
          aria-label="Schedule call"
          className="h-14 w-14 justify-center rounded-l-full rounded-r-none p-0 pl-3 shadow-lg sm:h-11 sm:w-auto sm:gap-2 sm:pl-5 sm:pr-4"
        >
          <PhoneCall className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Schedule call</span>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex h-[90vh] w-[95vw] flex-col overflow-hidden p-0 sm:h-[85vh] sm:max-w-3xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Schedule a call</DialogTitle>
          </DialogHeader>
          <div className="relative flex-1">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col gap-3 p-6">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-full w-full" />
              </div>
            )}
            <iframe
              src={SCHEDULE_CALL_URL}
              title="Schedule a call"
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
