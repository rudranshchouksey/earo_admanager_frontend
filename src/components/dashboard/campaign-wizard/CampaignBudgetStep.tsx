import { Slider } from '@/components/ui/slider';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { useState } from 'react';
import { MyTooltip } from '@/components/ui/MyTooltip';
import { toast } from '@/hooks/use-toast';

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
  const dailyValue = Number(data.dailyBudget);
  const totalBudget = Number(data.totalBudget);
  const [tab, settab] = useState('daily')
  const handleTabChange = (value: string) => {
    settab(value);
  };

  const BUDGET_PRESETS_TOTAL = [ 25 * durationDays, 50 * durationDays, 100 * durationDays, 250 * durationDays, 500 * durationDays ];

  const handleSliderChange = (value: number) => {
    if(tab === 'daily') {
      const daily = value;
      const total = parseInt(String(daily * durationDays));
      onChange({ ...data, dailyBudget: String(daily), totalBudget: String(total) });
    } else {
      const total = value;
      const daily = parseInt(String(total / durationDays));
      console.log("daily", daily, "total", total);
      onChange({ ...data, dailyBudget: String(daily), totalBudget: String(total) });
    }
  };

  const handleBlur = () => {
    const daily = Number(data.dailyBudget);
    if(daily < MIN_BUDGET) {
      onChange({ ...data, dailyBudget: String(MIN_BUDGET), totalBudget: String(MIN_BUDGET * durationDays) });
      toast({
        title:"Minimum daily budget",
        description: "Minimum daily budget is $25 per day"
      })
    }
  };

  return (
    <div className="space-y-8">

      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1" role="tablist">
        <button role="tab" aria-selected={tab === 'daily'} onClick={() => handleTabChange('daily')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tab === 'daily' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>Daily budget</button>
        <button role="tab" aria-selected={tab === 'total'} onClick={() => handleTabChange('total')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tab === 'total' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}>Total Budget</button>
      </div>

      {/* Big budget display */}
      {
        tab === 'daily' && (
          <div className="flex items-baseline gap-1.5">
            <span className='text-4xl font-semibold text-foreground'>$</span>
            <Input type="text" value={dailyValue} onBlur={handleBlur} onChange={(e) => handleSliderChange(Number(e.target.value))} min={MIN_BUDGET} step={STEP} className="flex bg-background py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-auto w-40 border-0 border-b border-border rounded-none px-0 text-4xl font-semibold focus-visible:ring-0 focus-visible:border-primary md:text-4xl" />
            <span className="text-lg text-muted-foreground"> per day</span>
          </div>
        )
      }
      {
        tab === 'total' && (
          <div className="flex items-baseline gap-1.5">
            <span className='text-4xl font-semibold text-foreground'>$</span>
            <Input type="text" value={totalBudget} onBlur={handleBlur} onChange={(e) => handleSliderChange(Number(e.target.value))} min={MIN_BUDGET*durationDays} step={STEP} className="flex bg-background py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-auto w-40 border-0 border-b border-border rounded-none px-0 text-4xl font-semibold focus-visible:ring-0 focus-visible:border-primary md:text-4xl" />
          </div>
        )
      }
      

      {/* Slider */}
      {/* <div className="w-full">
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
      </div> */}

      {/* Total + duration summary */}
      
      <p className="text-sm text-muted-foreground flex items-center ">
        Total spend: <span className="font-semibold text-foreground">${totalBudget.toLocaleString()}</span> over {durationDays} day{durationDays !== 1 ? 's' : ''}, <span className="font-semibold text-foreground flex items-center gap-2">${dailyValue.toLocaleString()} per day  </span>
      </p>
      {/* <h6 className='text-sm text-muted-foreground'>Minimum daily budget: ${MIN_BUDGET.toLocaleString()}</h6> */}
      
      {/* Budget presets */}
      {
        tab === 'daily' && (
          <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map(amount => {
            const selected = dailyValue === amount;
            return (
              <div
                key={amount}
                onClick={() => handleSliderChange(amount)}
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
                <span className="text-sm font-medium flex items-center gap-2">${amount.toLocaleString()}/day </span>
              </div>
            );
          })}
        </div>
        )
      }
            {
        tab === 'total' && (
          <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS_TOTAL.map(amount => {
            const selected = totalBudget === amount;
            return (
              <div
                key={amount}
                onClick={() => handleSliderChange(amount)}
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
                <span className="text-sm font-medium">${amount.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
        )
      }

    </div>
  );
}
