import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/contexts/TranslationContext';

interface CampaignLaunchModalProps {
  open: boolean;
  onDone: () => void;
}

export default function CampaignLaunchModal({ open, onDone }: CampaignLaunchModalProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [open, onDone]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDone(); }}>
      <DialogContent className="max-w-sm text-center [&>button]:hidden">
        <div className="flex flex-col items-center gap-4 py-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <DialogTitle className="text-xl font-semibold">
            {t('wizard.launch_modal.title')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{t('wizard.launch_modal.redirect')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
