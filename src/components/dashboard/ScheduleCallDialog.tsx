import { useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SCHEDULE_CALL_URL =
  'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0cLnmNAROdF9lCgMvUkjuSU6tmb5GnLstqwEQ1hM2cFyXBVWgVYg59ZBugPM7_C-yXY9ojMR11?gv=true';

interface ScheduleCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Google Calendar booking page in a dialog. Opened from the sidebar's
// "Schedule call" button and from the Contact support page.
export default function ScheduleCallDialog({ open, onOpenChange }: ScheduleCallDialogProps) {
  const { t } = useTranslation();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setIframeLoaded(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[90vh] w-[95vw] flex-col overflow-hidden p-0 sm:h-[85vh] sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{t('layout.schedule_call_title')}</DialogTitle>
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
            title={t('layout.schedule_call_title')}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
