import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';

export type KpiTone = 'green' | 'amber' | 'red' | 'blue' | 'muted';

interface CampaignKpiSummaryProps {
  loading?: boolean;
  status: { label: string; tone: KpiTone };
  asOfDate: Date;
  timezone?: string;
  impressions: { actual: number; goal: number };
  budget: { spent: number; total: number };
  reach: { value: number; impressions: number; trend: 'up' | 'down' | 'flat'; series: number[] };
  ltr: { value: number; industryAvg: number; status: 'good' | 'average' | 'low' };
  cpa: { value: number; deltaPct: number; series: number[] };
  cpm?: { value: number; deltaPct: number; series: number[] };
}

const toneClasses = (tone: KpiTone) => {
  switch (tone) {
    case 'green': return { dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' };
    case 'amber': return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
    case 'red':   return { dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10' };
    case 'blue':  return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' };
    default:      return { dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted' };
  }
};

const formatNum = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  //if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return Math.round(n).toLocaleString();
};
const formatMoney = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : `$${Math.round(n).toLocaleString()}`;

function Donut({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const v = Math.max(0, Math.min(100, pct));
  const data = [{ name: 'a', value: v }, { name: 'b', value: 100 - v }];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold text-foreground">{Math.round(v)}%</span>
      </div>
    </div>
  );
}

function Sparkline({ series, color, size = { w: 80, h: 40 } }: { series: number[]; color: string; size?: { w: number; h: number } }) {
  const data = series.length > 0 ? series.map((v, i) => ({ i, v })) : [{ i: 0, v: 0 }, { i: 1, v: 0 }];
  const id = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div className="shrink-0" style={{ width: size.w, height: size.h }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TileProps {
  label: string;
  value: string;
  children?: React.ReactNode;
  visual?: React.ReactNode;
}
function Tile({ label, value, children, visual }: TileProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 min-h-[140px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{label}</span>
          <span className="text-2xl font-bold text-foreground leading-none">{value}</span>
        </div>
        {visual}
      </div>
      {children && <div className="text-xs text-muted-foreground gap-2 flex flex-col flex-1">{children}</div>}
    </div>
  );
}

export default function CampaignKpiSummary(props: CampaignKpiSummaryProps) {
  const {
    status = { label: '—', tone: 'muted' as KpiTone },
    loading = false,
    asOfDate,
    timezone,
    impressions = { actual: 0, goal: 0 },
    budget = { spent: 0, total: 0 },
    reach = { value: 0, impressions: 0, trend: 'flat' as const, series: [] },
    ltr = { value: 0, industryAvg: 0, status: 'low' as const },
    cpa = { value: 0, deltaPct: 0, series: [] },
    cpm = { value: 0, deltaPct: 0, series: [] },
  } = props;
  const t = toneClasses(status.tone);

  const imprPct = impressions.goal > 0 ? (impressions.actual / impressions.goal) * 100 : 0;
  const budgetPct = budget.total > 0 ? (budget.spent / budget.total) * 100 : 0;
  const reachPctOfImpr = impressions.actual > 0 ? Math.round((reach.value / impressions.actual) * 100) : 0;

  const ltrTone: KpiTone = ltr.status === 'good' ? 'green' : ltr.status === 'average' ? 'amber' : 'red';
  const ltrToneCls = toneClasses(ltrTone);
  const ltrLabel = ltr.status === 'good' ? 'Good' : ltr.status === 'average' ? 'Average' : 'Low';

  const cpaImproved = cpa.deltaPct < 0; // lower CPA = better
  const cpaTone: KpiTone = cpaImproved ? 'green' : cpa.deltaPct > 0 ? 'red' : 'muted';
  const cpaToneCls = toneClasses(cpaTone);
  const cpaArrow = cpaImproved ? '↓' : cpa.deltaPct > 0 ? '↑' : '→';

  const reachTrendIcon =
    reach.trend === 'up' ? <TrendingUp className="h-3 w-3" />
    : reach.trend === 'down' ? <TrendingDown className="h-3 w-3" />
    : <Minus className="h-3 w-3" />;
  const reachTrendTone: KpiTone = reach.trend === 'up' ? 'green' : reach.trend === 'down' ? 'red' : 'muted';
  const reachTrendCls = toneClasses(reachTrendTone);
  const reachTrendLabel =
    reach.trend === 'up' ? 'Trending up over period'
    : reach.trend === 'down' ? 'Trending down over period'
    : 'Stable over period';

  const tz = timezone || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC');

  // Colors
  const colorImpr = 'hsl(var(--primary))';
  const colorBudget = 'hsl(210, 70%, 55%)';
  const colorReach = 'hsl(280, 60%, 55%)';
  const colorLtr = 'hsl(35, 90%, 55%)';
  const colorCpa = cpaImproved ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';

  return (
    <Card className="bg-card">
      <CardContent className="p-4 space-y-4">
        {/* Status banner — hidden in aggregated (All Campaigns) view */}
        {!cpm && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Campaign is <span className="font-semibold text-foreground">{Math.round(imprPct)}%</span> through impressions goal and{' '}
                <span className="font-semibold text-foreground">{Math.round(budgetPct)}%</span> through budget.
              </span>
            </div>
          </div>
        )}

        {/* Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Impressions */}
          <Tile
            label="Impressions"
            value={formatNum(impressions.actual)}
            visual={<Donut pct={imprPct} color={colorImpr} />}
          >
            {
              loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <div>of {formatNum(impressions.goal)} goal</div>
                  <Progress value={Math.min(100, imprPct)} className="h-1" />
                </>

              )

            }
          </Tile>

          {/* Budget */}
          <Tile
            label="Spend"
            value={formatMoney(budget.spent)}
            visual={<Donut pct={budgetPct} color={colorBudget} />}
          >
            {
              loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <div>of {formatMoney(budget.total)} used</div>
                  <Progress value={Math.min(100, budgetPct)} className="h-1" />
                </>
              )
            }
          </Tile>

          {/* Reach */}
          <Tile
            label="Reach"
            value={formatNum(reach.value)}
            visual={<Sparkline series={reach.series} color={colorReach} />}
          >
            {
              loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {/* <div>{reachPctOfImpr}% of impressions</div>
                  <Progress value={Math.min(100, reachPctOfImpr)} className="h-1" /> */}
                </>
              )
            }
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium self-start', reachTrendCls.bg, reachTrendCls.text)}>
              {reachTrendIcon}
              {reachTrendLabel}
            </span>
          </Tile>

          {/* LTR */}
          <Tile
            label="LTR"
            value={`${Math.round(ltr.value)}%`}
            visual={<Donut pct={ltr.value} color={colorLtr} />}
          >
            {
              loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {/* <div>{reachPctOfImpr}% of impressions</div>
                  <Progress value={Math.min(100, reachPctOfImpr)} className="h-1" /> */}
                </>
              )
            }
          </Tile>

          {/* CPA / CPM */}
            <Tile
              label="CPM"
              value={Number.isFinite(cpa.value) && cpa.value !== null && cpa.value > 0 ? `$${cpa.value.toFixed(2)}` : '—'}
              visual={<Sparkline series={[]} color={""} />}
            >
              { loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {/* <div>{reachPctOfImpr}% of impressions</div>
                  <Progress value={Math.min(100, reachPctOfImpr)} className="h-1" /> */}
                </>
              )
            }
            </Tile>
        
        </div>
      </CardContent>
    </Card>
  );
}