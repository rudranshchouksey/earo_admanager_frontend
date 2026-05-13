import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin, ChevronDown, Target, Rocket } from 'lucide-react';
import LaunchForecast from './LaunchForecast';

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

interface LaunchPanelProps {
  city: string;
  currencySymbol: string;
  onLaunch: (budget: number) => void;
  isLaunching?: boolean;
}

export default function LaunchPanel({ city, currencySymbol, onLaunch, isLaunching }: LaunchPanelProps) {
  const [budget, setBudget] = useState(60);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [gender, setGender] = useState('all');
  const [selectedAges, setSelectedAges] = useState<string[]>(AGE_RANGES);

  const reach = Math.round((budget / 8) * 1000 * 0.6 * 30);

  return (
    <Card className="rounded-[16px] shadow-md border-border/50">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Launch your campaign</h2>
        </div>

        {/* Budget Slider */}
        <div className="space-y-4">
          <div>
            <p className="text-4xl font-semibold text-foreground">{currencySymbol}{budget}<span className="text-lg font-normal text-muted-foreground">/day</span></p>
            <p className="text-sm text-muted-foreground mt-1">Reach ~{reach.toLocaleString()} listeners in {city}</p>
          </div>
          <Slider
            value={[budget]}
            onValueChange={(v) => setBudget(v[0])}
            min={20}
            max={10000}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currencySymbol}20</span>
            <span>{currencySymbol}10,000+</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center justify-between rounded-[10px] bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{city}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-primary h-auto p-1">Edit</Button>
        </div>

        {/* Audience (collapsed) */}
        <Collapsible open={audienceOpen} onOpenChange={setAudienceOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full rounded-[10px] bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {gender === 'all' && selectedAges.length === AGE_RANGES.length
                    ? 'Broad audience'
                    : 'Custom audience'}
                </span>
                {gender === 'all' && selectedAges.length === AGE_RANGES.length && (
                  <span className="text-xs text-muted-foreground">(recommended)</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${audienceOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age Range</Label>
              <div className="grid grid-cols-3 gap-2">
                {AGE_RANGES.map((age) => {
                  const checked = selectedAges.includes(age);
                  return (
                    <label
                      key={age}
                      className="flex items-center gap-2 rounded-[8px] border border-border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setSelectedAges(v
                            ? [...selectedAges, age]
                            : selectedAges.filter((a) => a !== age)
                          );
                        }}
                      />
                      <span className="text-sm text-foreground">{age}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Forecast */}
        <div className="border-t border-border pt-4">
          <LaunchForecast budget={budget} city={city} />
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">You're ready to go live</p>
          <Button
            className="w-full h-14 rounded-[14px] text-base font-semibold"
            onClick={() => onLaunch(budget)}
            disabled={isLaunching}
          >
            <Rocket className="w-5 h-5 mr-2" />
            Go Live Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
