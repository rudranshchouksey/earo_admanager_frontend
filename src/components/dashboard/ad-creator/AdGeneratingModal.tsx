import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PROGRESS_KEYS = [
  'modal.creating_progress_1',
  'modal.creating_progress_2',
  'modal.creating_progress_3',
  'modal.creating_progress_4',
  'modal.creating_progress_5',
  'modal.creating_progress_6',
];

interface AdGeneratingModalProps {
  open: boolean;
  onCancel: () => void;
}

export default function AdGeneratingModal({ open, onCancel }: AdGeneratingModalProps) {
  const { t } = useTranslation();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < PROGRESS_KEYS.length - 1 ? prev + 1 : prev
      );
    }, 8000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md text-center"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center">
          <div className="mx-auto mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <DialogTitle className="text-xl">{t('modal.creating_title')}</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-base text-center font-medium text-foreground transition-all duration-300">
              {t(PROGRESS_KEYS[messageIndex])}
            </span>
            <span className="block text-sm text-muted-foreground">
              {t('modal.creating_can_take')}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Button variant="outline" onClick={onCancel} className="w-full">
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
