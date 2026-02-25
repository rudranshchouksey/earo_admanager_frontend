import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Clock, TrendingDown, TrendingUp, Play, CalendarCheck, FileEdit, LayoutGrid } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  campaign_type: string;
  start_date: string;
  end_date: string;
  budget: number;
  actual_spend: number | null;
  actual_impressions: number | null;
  reach: number | null;
  ltr: number | null;
  currency: string | null;
}

const TODAY = new Date('2026-02-17');

function classifyCampaign(c: Campaign, today: Date): string {
  const start = new Date(c.start_date);
  const end = new Date(c.end_date);
  const daysToEnd = (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  const daysFromEnd = (today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24);

  if (c.status === 'draft') return 'Drafts';
  if ((c.status === 'active' || c.status === 'draft') && start > today) return 'Starting Soon';
  if (c.status === 'active' && daysToEnd >= 0 && daysToEnd <= 5) return 'Almost Ending';
  if (c.status === 'active' && (c.ltr ?? 0) >= 75) return 'Doing Well';
  if (c.status === 'active' && (c.ltr ?? 0) < 50) return 'Underperforming';
  if ((c.status === 'completed' || end < today) && daysFromEnd >= 0 && daysFromEnd <= 10) return 'Ended Last 10 Days';

  return 'Other';
}

const GROUP_META: Record<string, { icon: ReactNode; color: string }> = {
  'Almost Ending': { icon: <Clock className="size-3.5" />, color: 'text-amber-600' },
  'Underperforming': { icon: <TrendingDown className="size-3.5" />, color: 'text-destructive' },
  'Doing Well': { icon: <TrendingUp className="size-3.5" />, color: 'text-green-600' },
  'Starting Soon': { icon: <Play className="size-3.5" />, color: 'text-blue-600' },
  'Ended Last 10 Days': { icon: <CalendarCheck className="size-3.5" />, color: 'text-muted-foreground' },
  'Drafts': { icon: <FileEdit className="size-3.5" />, color: 'text-muted-foreground' },
  'Other': { icon: <LayoutGrid className="size-3.5" />, color: 'text-muted-foreground' },
};

const GROUP_ORDER = ['Almost Ending', 'Underperforming', 'Doing Well', 'Starting Soon', 'Ended Last 10 Days', 'Drafts', 'Other'];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-primary/10 text-primary',
};

const mockCampaigns: Campaign[] = [
  { id: 'da-1', name: 'Ramadan Flash Push', status: 'active', campaign_type: 'awareness', start_date: '2026-02-01', end_date: '2026-02-19', budget: 4000, actual_spend: 3200, actual_impressions: 180000, reach: 42000, ltr: 65, currency: 'USD' },
  { id: 'da-2', name: 'Brand Awareness Q1', status: 'active', campaign_type: 'awareness', start_date: '2026-01-15', end_date: '2026-03-15', budget: 8000, actual_spend: 4100, actual_impressions: 320000, reach: 89000, ltr: 82, currency: 'USD' },
  { id: 'da-3', name: 'Podcast Sponsorship', status: 'active', campaign_type: 'engagement', start_date: '2026-01-01', end_date: '2026-03-31', budget: 6000, actual_spend: 3100, actual_impressions: 210000, reach: 55000, ltr: 78, currency: 'USD' },
  { id: 'da-4', name: 'App Install Drive', status: 'active', campaign_type: 'conversions', start_date: '2026-01-20', end_date: '2026-03-20', budget: 5000, actual_spend: 2800, actual_impressions: 65000, reach: 12000, ltr: 32, currency: 'USD' },
  { id: 'da-5', name: 'Loyalty Re-engage', status: 'active', campaign_type: 'engagement', start_date: '2026-02-01', end_date: '2026-03-01', budget: 3000, actual_spend: 1900, actual_impressions: 40000, reach: 8000, ltr: 44, currency: 'USD' },
  { id: 'da-6', name: 'Spring Collection Launch', status: 'active', campaign_type: 'awareness', start_date: '2026-02-25', end_date: '2026-03-25', budget: 7000, actual_spend: null, actual_impressions: null, reach: null, ltr: null, currency: 'USD' },
  { id: 'da-7', name: 'Valentine Promo', status: 'completed', campaign_type: 'conversions', start_date: '2026-01-25', end_date: '2026-02-14', budget: 3500, actual_spend: 3480, actual_impressions: 195000, reach: 48000, ltr: 79, currency: 'USD' },
  { id: 'da-8', name: 'Weekend Flash Sale', status: 'completed', campaign_type: 'engagement', start_date: '2026-02-07', end_date: '2026-02-09', budget: 1500, actual_spend: 1490, actual_impressions: 72000, reach: 19000, ltr: 71, currency: 'USD' },
  { id: 'da-9', name: 'Eid Campaign Draft', status: 'draft', campaign_type: 'awareness', start_date: '2026-03-20', end_date: '2026-04-05', budget: 10000, actual_spend: null, actual_impressions: null, reach: null, ltr: null, currency: 'USD' },
];

function ActionButtons({ group, campaign }: { group: string; campaign: Campaign }) {
  const navigate = useNavigate();

  if (group === 'Almost Ending') {
    return (
      <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast({ title: 'Extend Campaign', description: `Campaign "${campaign.name}" extension requested.` }); }}>
        Extend Campaign
      </Button>
    );
  }
  if (group === 'Doing Well') {
    return (
      <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast({ title: 'Increase Budget', description: `Budget increase for "${campaign.name}" requested.` }); }}>
        Increase Budget
      </Button>
    );
  }
  if (group === 'Underperforming') {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); navigate('/dashboard/ads/new'); }}>
          Change Ad
        </Button>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/campaigns/${campaign.id}`); }}>
          Review Targeting
        </Button>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

export default function CampaignActionsGrid() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('All');

  const grouped = useMemo(() => {
    const map = new Map<string, Campaign[]>();
    mockCampaigns.forEach((c) => {
      const group = classifyCampaign(c, TODAY);
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(c);
    });
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, campaigns: map.get(g)! }));
  }, []);

  const tabOptions = useMemo(() => {
    const allCount = grouped.reduce((sum, g) => sum + g.campaigns.length, 0);
    return [
      { value: 'All', label: `All (${allCount})`, icon: null as ReactNode },
      ...grouped.map(({ group, campaigns }) => {
        const meta = GROUP_META[group] || GROUP_META['Other'];
        return { value: group, label: `${group} (${campaigns.length})`, icon: meta.icon };
      }),
    ];
  }, [grouped]);

  const filteredRows = useMemo(() => {
    if (activeTab === 'All') {
      return grouped.flatMap(({ group, campaigns }) => campaigns.map((c) => ({ group, campaign: c })));
    }
    const match = grouped.find((g) => g.group === activeTab);
    return match ? match.campaigns.map((c) => ({ group: match.group, campaign: c })) : [];
  }, [activeTab, grouped]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Actions</CardTitle>
      </CardHeader>

      {/* Tab bar */}
      <div className="px-4 pb-4 overflow-x-auto">
        <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1" role="tablist">
          {tabOptions.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={activeTab === opt.value}
              onClick={() => setActiveTab(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                activeTab === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              {opt.icon && <span className="inline-flex">{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <CardContent className={isMobile ? "px-3 pb-3 pt-0" : "p-0"}>
        {isMobile ? (
          /* ── Mobile: flat card list ── */
          <div className="space-y-2">
            {filteredRows.map(({ group, campaign: c }) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground text-sm truncate">{c.name}</span>
                  <Badge variant="secondary" className={`shrink-0 ${statusColors[c.status] || ''}`}>{c.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="text-foreground font-medium">${c.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spend</span>
                    <span className="text-foreground font-medium">${(c.actual_spend ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impr.</span>
                    <span className="text-foreground font-medium">{(c.actual_impressions ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LTR</span>
                    <span className="text-foreground font-medium">{c.ltr != null ? `${c.ltr}%` : '—'}</span>
                  </div>
                </div>
                <div className="pt-1 flex justify-end">
                  <ActionButtons group={group} campaign={c} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Desktop: flat table ── */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[220px]">Campaign</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[90px]">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[170px]">Dates</th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[90px]">Budget</th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[90px]">Spend</th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[100px]">Impressions</th>
                  <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[60px]">LTR</th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ group, campaign: c }) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2 font-medium text-foreground">{c.name}</td>
                    <td className="px-3 py-2"><Badge variant="secondary" className={statusColors[c.status] || ''}>{c.status}</Badge></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{c.start_date} — {c.end_date}</td>
                    <td className="px-3 py-2 text-right text-foreground">${(c.budget).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-foreground">${(c.actual_spend ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-foreground">{(c.actual_impressions ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-foreground">{c.ltr != null ? `${c.ltr}%` : '—'}</td>
                    <td className="px-3 py-2"><ActionButtons group={group} campaign={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
