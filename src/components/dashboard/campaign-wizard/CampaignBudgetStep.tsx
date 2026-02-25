import { Slider } from '@/components/ui/slider';
import { useTranslation } from '@/contexts/TranslationContext';

interface BudgetData {
  dailyBudget: string;
  totalBudget: string;
  currency: string;
}

interface Props {
  data: BudgetData;
  onChange: (data: BudgetData) => void;
  durationDays?: number;
  inventoryCount?: number;
}

const MIN_BUDGET = 25;
const MAX_BUDGET = 10000;
const STEP = 25;

export default function CampaignBudgetStep({ data, onChange, durationDays = 7 }: Props) {
  const { t } = useTranslation();
  const dailyValue = Number(data.dailyBudget) || MIN_BUDGET;
  const totalBudget = dailyValue * durationDays;

  const handleSliderChange = (values: number[]) => {
    const daily = values[0];
    const total = daily * durationDays;
    onChange({ ...data, dailyBudget: String(daily), totalBudget: String(total) });
  };

  return (
    <div className="space-y-8">
      {/* Big budget display */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-bold text-foreground">${dailyValue.toLocaleString()}</span>
        <span className="text-lg text-muted-foreground">{t('wizard.budget.per_day')}</span>
      </div>

      {/* Slider */}
      <div className="w-full">
        <Slider
          value={[dailyValue]}
          onValueChange={handleSliderChange}
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          step={STEP}
          className="w-full"
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">${MIN_BUDGET}</span>
          <span className="text-xs text-muted-foreground">${MAX_BUDGET.toLocaleString()}+</span>
        </div>
      </div>

      {/* Total + duration summary */}
      <p className="text-sm text-muted-foreground">
        {t('wizard.budget.total_over', { total: totalBudget.toLocaleString(), days: String(durationDays) })}
      </p>
    </div>
  );
}
