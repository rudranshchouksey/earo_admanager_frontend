import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Settings, CalendarDays, Radio, Target, DollarSign } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

interface SummaryItem {
  key: string;
  label: string;
  value: string;
  icon: React.ElementType;
}

interface CampaignSummaryProps {
  items: SummaryItem[];
}

const iconMap: Record<string, React.ElementType> = {
  setup: Settings,
  schedule: CalendarDays,
  inventory: Radio,
  targeting: Target,
  budget: DollarSign,
};

export default function CampaignSummary({ items }: CampaignSummaryProps) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <Card className="border-primary/20 animate-fade-in mt-4">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t('wizard.review.summary')}</h3>
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = iconMap[item.key] || CheckCircle2;
            return (
              <div key={item.key} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
