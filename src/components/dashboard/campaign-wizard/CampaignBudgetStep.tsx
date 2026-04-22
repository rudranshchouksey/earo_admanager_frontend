import { Slider } from '@/components/ui/slider';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
const BUDGET_PRESETS = [25, 50, 100, 250, 500];

export default function CampaignBudgetStep({ data, onChange, durationDays = 7 }: Props) {
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
        <span className="text-4xl font-semibold text-foreground">${dailyValue.toLocaleString()}</span>
        <span className="text-lg text-muted-foreground">/day</span>
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
        Total budget: <span className="font-semibold text-foreground">${totalBudget.toLocaleString()}</span> over {durationDays} day{durationDays !== 1 ? 's' : ''}
      </p>

      {/* Budget presets */}
      <div className="flex flex-wrap gap-2">
        {BUDGET_PRESETS.map(amount => {
          const selected = dailyValue === amount;
          return (
            <div
              key={amount}
              onClick={() => handleSliderChange([amount])}
              className={cn(
                'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                  selected
                    ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                    : 'border-border hover:border-[#C8E6C9]'
              )}
            >
              {selected && (
                <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-foreground" />
                </div>
              )}
              <span className="text-sm font-medium">${amount}/day</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
