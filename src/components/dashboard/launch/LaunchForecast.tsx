import { Headphones, Radio, Repeat, ShieldCheck } from 'lucide-react';

interface LaunchForecastProps {
  budget: number;
  city: string;
}

export default function LaunchForecast({ budget, city }: LaunchForecastProps) {
  const cpm = 8;
  const impressions = Math.round((budget / cpm) * 1000 * 30); // monthly
  const reach = Math.round(impressions * 0.6);
  const frequency = reach > 0 ? (impressions / reach).toFixed(1) : '0';
  const cityPopReach = Math.min(35, Math.round((reach / 1_000_000) * 100));

  const metrics = [
    { icon: Radio, label: `Your ad will play ~${impressions.toLocaleString()} times`, emphasis: false },
    { icon: Repeat, label: `Each listener hears your ad ~${frequency} times`, emphasis: false },
    { icon: Headphones, label: `Reaching ~${cityPopReach}% of listeners in ${city}`, emphasis: false },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-1">What you'll get from this campaign</h4>
      </div>

      {/* Hero metric */}
      <div className="rounded-[12px] bg-primary/5 p-4 text-center">
        <Headphones className="w-6 h-6 text-primary mx-auto mb-2" />
        <p className="text-2xl font-semibold text-foreground">~{reach.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">listeners reached</p>
        <p className="text-xs text-muted-foreground mt-1">Based on €{budget}/day</p>
      </div>

      {/* Supporting metrics */}
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-start gap-2.5">
            <m.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2 rounded-[10px] bg-green-50 p-3">
        <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
        <p className="text-xs text-green-800 font-medium">High likelihood your campaign will fully deliver</p>
      </div>
    </div>
  );
}
