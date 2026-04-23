import { Card, CardContent } from '@/components/ui/card';
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

const keyToNumber: Record<string, number> = {
  setup: 1,
  schedule: 2,
  budget: 3,
  inventory: 4,
  targeting: 5,
};

export default function CampaignSummary({ items }: CampaignSummaryProps) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <Card className="border-[#E6F4EA] animate-fade-in">
      <CardContent className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{t('wizard.review.summary')}</h3>
      <div className="space-y-2">
          {items.map((item) => {
            const num = keyToNumber[item.key] ?? '?';
            return (
              <div key={item.key} className="flex items-start gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-semibold shrink-0 mt-0.5 bg-foreground text-background">
                  {num}
                </span>
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
