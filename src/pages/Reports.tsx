import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/services/api';
import { useTranslation } from '@/contexts/TranslationContext';
import StatCard from '@/components/dashboard/StatCard';
import { Eye, Users, Target, DollarSign, TrendingUp, BarChart3, Percent, Download, CalendarIcon } from 'lucide-react';
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, type ICellRendererParams } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { cn } from '@/lib/utils';
import { format, startOfWeek, startOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDataCards, MobileStatRow } from '@/components/ui/mobile-data-card';

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
}

interface DailyData {
  date: string;
  impressions: number;
  reach: number;
  conversions: number;
  spent: number;
  campaignName: string;
  campaignStatus: string;
  campaignGoal: string;
  startDate: string;
  endDate: string;
  dailyBudget: number;
  totalBudget: number;
  ltr: number;
}

interface DemographicSlice { name: string; value: number; }

type MetricMode = 'bar' | 'line' | 'off';
type Granularity = 'daily' | 'weekly' | 'monthly' | 'custom';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(340, 65%, 50%)',
  'hsl(45, 80%, 50%)',
  'hsl(280, 60%, 55%)',
  'hsl(30, 70%, 50%)',
  'hsl(180, 50%, 45%)',
  'hsl(0, 65%, 50%)',
];

const METRIC_COLORS: Record<string, string> = {
  impressions: 'hsl(var(--primary))',
  reach: 'hsl(210, 70%, 55%)',
  conversions: 'hsl(150, 60%, 45%)',
  spent: 'hsl(45, 80%, 50%)',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-primary/10 text-primary',
};

const GOALS = ['awareness', 'engagement', 'conversions', 'reach'];
const SHOW_NAMES = [
  'The Morning Show', 'Tech Talk Daily', 'Culture Vibes', 'Business Insider', 'Music Hour',
  'Sports Recap', 'News Roundup', 'Comedy Club', 'Health & Wellness', 'Trending Now',
  'True Crime Files', 'Startup Stories', 'Daily Digest', 'Science Explained', 'Pop Culture Pod',
  'Finance Focus', 'Travel Tales', 'Gaming World', 'Parenting Plus', 'History Uncovered',
  'Mindful Minutes', 'Food & Flavor', 'Career Boost', 'Book Club Radio', 'Night Owl Sessions',
];
const CONTENT_TYPES = ['Podcast', 'Streaming', 'Radio'];
const DEVICE_TYPES = ['Mobile', 'Desktop', 'Smart Speaker', 'Connected TV'];
const GENDERS = ['Male', 'Female', 'Other'];
const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const PODCAST_TOPICS = ['True Crime', 'Business', 'Comedy', 'News & Politics', 'Health & Fitness', 'Technology', 'Education', 'Sports', 'Society & Culture', 'Arts'];
const PODCAST_AUDIENCES = ['Millennials', 'Gen Z', 'Gen X', 'Baby Boomers', 'Parents', 'Students', 'Professionals', 'Entrepreneurs'];
const LOCATIONS = ['Dubai', 'Abu Dhabi', 'Riyadh', 'Jeddah', 'Cairo', 'Kuwait City', 'Doha', 'Muscat', 'Manama', 'Amman', 'Beirut', 'Casablanca'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDailyData(campaign: Campaign): DailyData[] {
  const rand = seededRandom(campaign.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const days: DailyData[] = [];
  const totalImpressions = campaign.actual_impressions ?? 0;
  const totalSpend = campaign.actual_spend ?? 0;
  const totalReach = campaign.reach ?? 0;
  const goal = GOALS[Math.floor(rand() * GOALS.length)];
  const numDays = 30;
  const dailyBudget = campaign.budget / numDays;

  for (let i = 0; i < numDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (numDays - 1 - i));
    const weight = 0.5 + rand();
    days.push({
      date: date.toISOString().slice(0, 10),
      impressions: Math.round((totalImpressions / numDays) * weight),
      reach: Math.round((totalReach / numDays) * weight * 0.8),
      conversions: Math.round((totalImpressions / numDays) * weight * 0.02),
      spent: Math.round((totalSpend / numDays) * weight * 100) / 100,
      campaignName: campaign.name,
      campaignStatus: campaign.status,
      campaignGoal: goal,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      dailyBudget: Math.round(dailyBudget * 100) / 100,
      totalBudget: campaign.budget,
      ltr: campaign.ltr ?? Math.round(70 + rand() * 20),
    });
  }
  return days;
}

function generateDemographic(names: string[], total: number, seed: number): DemographicSlice[] {
  const rand = seededRandom(seed);
  const weights = names.map(() => rand());
  const sum = weights.reduce((a, b) => a + b, 0);
  return names.map((name, i) => ({ name, value: Math.round((weights[i] / sum) * total) }));
}

const formatNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

const StatusRenderer = (params: ICellRendererParams) => (
  <Badge variant="secondary" className={statusColors[params.value] || ''}>{params.value}</Badge>
);

const UtilizationRenderer = (params: ICellRendererParams) => {
  const row = params.data as DailyData;
  const util = row.totalBudget > 0 ? Math.min(100, Math.round((row.spent / row.dailyBudget) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <Progress value={util} className="h-1.5 w-16" />
      <span className="text-xs text-muted-foreground">{util}%</span>
    </div>
  );
};

// Aggregation helper
function aggregateByGranularity(
  data: { date: string; impressions: number; reach: number; conversions: number; spent: number }[],
  granularity: Granularity,
  customRange?: { from: Date | undefined; to: Date | undefined },
) {
  let filtered = data;

  if (granularity === 'custom' && customRange?.from && customRange?.to) {
    filtered = data.filter(d => {
      const dt = parseISO(d.date);
      return isWithinInterval(dt, { start: customRange.from!, end: customRange.to! });
    });
  }

  if (granularity === 'daily' || granularity === 'custom') {
    return filtered.map(d => ({
      ...d,
      label: format(parseISO(d.date), 'MMM d'),
    }));
  }

  const bucketKey = (dateStr: string) => {
    const dt = parseISO(dateStr);
    if (granularity === 'weekly') {
      const ws = startOfWeek(dt, { weekStartsOn: 1 });
      return format(ws, 'MMM d');
    }
    return format(startOfMonth(dt), 'MMM yyyy');
  };

  const map = new Map<string, { label: string; impressions: number; reach: number; conversions: number; spent: number; _sortKey: string }>();
  filtered.forEach(d => {
    const key = bucketKey(d.date);
    const existing = map.get(key) || { label: key, impressions: 0, reach: 0, conversions: 0, spent: 0, _sortKey: d.date };
    existing.impressions += d.impressions;
    existing.reach += d.reach;
    existing.conversions += d.conversions;
    existing.spent += d.spent;
    if (d.date < existing._sortKey) existing._sortKey = d.date;
    map.set(key, existing);
  });

  return Array.from(map.values()).sort((a, b) => a._sortKey.localeCompare(b._sortKey));
}

const mockCampaigns: Campaign[] = [
  { id: 'mock-1', name: 'Ramadan Brand Awareness', status: 'active', campaign_type: 'awareness', start_date: '2026-02-01', end_date: '2026-03-15', budget: 5000, actual_spend: 2340, actual_impressions: 187200, reach: 45800, ltr: 78 },
  { id: 'mock-2', name: 'Summer Product Launch', status: 'active', campaign_type: 'awareness', start_date: '2026-01-20', end_date: '2026-02-28', budget: 3000, actual_spend: 1870, actual_impressions: 112500, reach: 31200, ltr: 82 },
  { id: 'mock-3', name: 'Podcast Sponsorship Q1', status: 'active', campaign_type: 'engagement', start_date: '2026-01-01', end_date: '2026-03-31', budget: 8000, actual_spend: 4150, actual_impressions: 320000, reach: 89000, ltr: 71 },
  { id: 'mock-4', name: 'Holiday Campaign 2025', status: 'completed', campaign_type: 'awareness', start_date: '2025-12-01', end_date: '2025-12-31', budget: 4500, actual_spend: 4480, actual_impressions: 256000, reach: 62000, ltr: 85 },
  { id: 'mock-5', name: 'Back to School Promo', status: 'completed', campaign_type: 'conversions', start_date: '2025-08-15', end_date: '2025-09-15', budget: 2500, actual_spend: 2500, actual_impressions: 198000, reach: 41000, ltr: 76 },
  { id: 'mock-6', name: 'National Day Special', status: 'completed', campaign_type: 'awareness', start_date: '2025-11-15', end_date: '2025-12-05', budget: 3500, actual_spend: 3490, actual_impressions: 210000, reach: 55000, ltr: 80 },
  { id: 'mock-7', name: 'New App Install Drive', status: 'paused', campaign_type: 'conversions', start_date: '2026-01-10', end_date: '2026-02-28', budget: 6000, actual_spend: 1200, actual_impressions: 72000, reach: 18500, ltr: 68 },
  { id: 'mock-8', name: 'Weekend Flash Sale', status: 'draft', campaign_type: 'engagement', start_date: '2026-03-01', end_date: '2026-03-03', budget: 1500, actual_spend: null, actual_impressions: null, reach: null, ltr: null },
];

export default function Reports() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(searchParams.get('campaign') || 'all');
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // New state
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [chartMetrics, setChartMetrics] = useState<Record<string, MetricMode>>({
    impressions: 'bar',
    reach: 'line',
    conversions: 'off',
    spent: 'off',
  });
  const [showsMetrics, setShowsMetrics] = useState<Record<string, MetricMode>>({
    impressions: 'bar',
    reach: 'line',
    conversions: 'off',
    spent: 'off',
  });
  const [locationMetrics, setLocationMetrics] = useState<Record<string, MetricMode>>({
    impressions: 'bar',
    reach: 'line',
    conversions: 'off',
    spent: 'off',
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await api.getReportsData();
      setAllCampaigns(data && data.length > 0 ? data : mockCampaigns);
      setLoading(false);
    };
    fetchData();
  }, []);

  const campaigns = useMemo(() => {
    if (selectedCampaignId === 'all') return allCampaigns;
    return allCampaigns.filter((c) => c.id === selectedCampaignId);
  }, [allCampaigns, selectedCampaignId]);

  const selectedCampaignName = useMemo(() => {
    if (selectedCampaignId === 'all') return null;
    return allCampaigns.find((c) => c.id === selectedCampaignId)?.name || null;
  }, [allCampaigns, selectedCampaignId]);

  const handleCampaignChange = (value: string) => {
    setSelectedCampaignId(value);
    if (value === 'all') {
      searchParams.delete('campaign');
    } else {
      searchParams.set('campaign', value);
    }
    setSearchParams(searchParams);
  };

  const kpis = useMemo(() => {
    const totalImpressions = campaigns.reduce((a, c) => a + (c.actual_impressions ?? 0), 0);
    const totalReach = campaigns.reduce((a, c) => a + (c.reach ?? 0), 0);
    const totalSpent = campaigns.reduce((a, c) => a + (c.actual_spend ?? 0), 0);
    const totalBudget = campaigns.reduce((a, c) => a + c.budget, 0);
    const avgLtr = campaigns.filter(c => c.ltr != null).length > 0
      ? campaigns.reduce((a, c) => a + (c.ltr ?? 0), 0) / campaigns.filter(c => c.ltr != null).length
      : 0;
    const totalConversions = Math.round(totalImpressions * 0.02);
    const budgetUtil = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const cpa = totalConversions > 0 ? totalSpent / totalConversions : 0;

    return { totalImpressions, totalReach, totalSpent, avgLtr, totalConversions, budgetUtil, cpa };
  }, [campaigns]);

  // Raw daily data
  const rawDailyData = useMemo(() => {
    const allDays = campaigns.flatMap(c => generateDailyData(c));
    const map = new Map<string, { date: string; impressions: number; reach: number; conversions: number; spent: number }>();
    allDays.forEach(d => {
      const existing = map.get(d.date) || { date: d.date, impressions: 0, reach: 0, conversions: 0, spent: 0 };
      existing.impressions += d.impressions;
      existing.reach += d.reach;
      existing.conversions += d.conversions;
      existing.spent += d.spent;
      map.set(d.date, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [campaigns]);

  // Aggregated chart data
  const dailyChartData = useMemo(() => {
    return aggregateByGranularity(rawDailyData, granularity, customDateRange);
  }, [rawDailyData, granularity, customDateRange]);

  // Grid data (per-campaign daily, also filtered by custom range)
  const dailyGridData = useMemo(() => {
    let data = campaigns.flatMap(c => generateDailyData(c));
    if (granularity === 'custom' && customDateRange?.from && customDateRange?.to) {
      data = data.filter(d => {
        const dt = parseISO(d.date);
        return isWithinInterval(dt, { start: customDateRange.from!, end: customDateRange.to! });
      });
    }
    return data;
  }, [campaigns, granularity, customDateRange]);

  const seed = useMemo(() => campaigns.reduce((a, c) => a + c.id.split('').reduce((x, ch) => x + ch.charCodeAt(0), 0), 0), [campaigns]);
  const totalImpr = kpis.totalImpressions;

  const topShows = useMemo(() => {
    const impressions = generateDemographic(SHOW_NAMES, totalImpr, seed + 1);
    const reachTotal = kpis.totalReach;
    const convTotal = kpis.totalConversions;
    const spentTotal = kpis.totalSpent;
    const reaches = generateDemographic(SHOW_NAMES, reachTotal, seed + 10);
    const convs = generateDemographic(SHOW_NAMES, convTotal, seed + 11);
    const spents = generateDemographic(SHOW_NAMES, Math.round(spentTotal), seed + 12);
    return impressions.map((item, i) => ({
      name: item.name,
      impressions: item.value,
      reach: reaches[i].value,
      conversions: convs[i].value,
      spent: spents[i].value,
    })).sort((a, b) => b.impressions - a.impressions);
  }, [totalImpr, kpis.totalReach, kpis.totalConversions, kpis.totalSpent, seed]);
  const contentTypes = useMemo(() => generateDemographic(CONTENT_TYPES, totalImpr, seed + 2), [totalImpr, seed]);
  const deviceTypes = useMemo(() => generateDemographic(DEVICE_TYPES, totalImpr, seed + 3), [totalImpr, seed]);
  const genders = useMemo(() => generateDemographic(GENDERS, totalImpr, seed + 4), [totalImpr, seed]);
  const ageGroups = useMemo(() => generateDemographic(AGE_GROUPS, totalImpr, seed + 5), [totalImpr, seed]);
  const podcastTopics = useMemo(() => generateDemographic(PODCAST_TOPICS, totalImpr, seed + 6), [totalImpr, seed]);
  const podcastAudiences = useMemo(() => generateDemographic(PODCAST_AUDIENCES, totalImpr, seed + 7), [totalImpr, seed]);
  const locations = useMemo(() => {
    const impr = generateDemographic(LOCATIONS, totalImpr, seed + 8);
    const reaches = generateDemographic(LOCATIONS, kpis.totalReach, seed + 13);
    const convs = generateDemographic(LOCATIONS, kpis.totalConversions, seed + 14);
    const spents = generateDemographic(LOCATIONS, Math.round(kpis.totalSpent), seed + 15);
    return impr.map((item, i) => ({
      name: item.name,
      impressions: item.value,
      reach: reaches[i].value,
      conversions: convs[i].value,
      spent: spents[i].value,
    })).sort((a, b) => b.impressions - a.impressions);
  }, [totalImpr, kpis.totalReach, kpis.totalConversions, kpis.totalSpent, seed]);

  // Time of day heatmap data
  const heatmapData = useMemo(() => {
    const rand = seededRandom(seed + 9);
    return HOURS.map(hour => {
      const row: Record<string, number | string> = { hour: `${hour.toString().padStart(2, '0')}:00` };
      DAYS_OF_WEEK.forEach(day => {
        // Higher values during morning/evening commute and lunch
        const peakBoost = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20) ? 2.5 : (hour >= 12 && hour <= 13) ? 1.8 : 1;
        const nightDip = hour >= 0 && hour <= 5 ? 0.2 : 1;
        const weekendBoost = (day === 'Sat' || day === 'Fri') ? 1.3 : 1;
        row[day] = Math.round(totalImpr / 168 * peakBoost * nightDip * weekendBoost * (0.5 + rand()));
      });
      return row;
    });
  }, [totalImpr, seed]);

  // Grid columns with date
  const gridColDefs = useMemo<ColDef[]>(() => [
    { field: 'date', headerName: t('reports.date'), width: 110, sort: 'desc' },
    { field: 'campaignName', headerName: t('reports.campaign'), flex: 2, minWidth: 150 },
    { field: 'campaignStatus', headerName: t('account.status'), width: 110, cellRenderer: StatusRenderer },
    { field: 'campaignGoal', headerName: t('reports.goal'), width: 110 },
    { field: 'startDate', headerName: t('reports.start_date'), width: 110 },
    { field: 'endDate', headerName: t('reports.end_date'), width: 110 },
    { field: 'dailyBudget', headerName: t('reports.daily_budget'), width: 115, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toFixed(0)}` },
    { field: 'totalBudget', headerName: t('reports.total_budget'), width: 115, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toLocaleString()}` },
    { field: 'spent', headerName: t('reports.spent'), width: 100, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toFixed(0)}` },
    { headerName: t('campaigns.utilization'), width: 140, cellRenderer: UtilizationRenderer },
    { field: 'impressions', headerName: t('reports.impressions'), width: 120, type: 'numericColumn', valueFormatter: p => (p.value ?? 0).toLocaleString() },
    { field: 'reach', headerName: t('reports.reach'), width: 100, type: 'numericColumn', valueFormatter: p => (p.value ?? 0).toLocaleString() },
    { field: 'ltr', headerName: t('reports.ltr'), width: 80, type: 'numericColumn', valueFormatter: p => `${p.value ?? 0}%` },
  ], [t]);

  const tooltipStyle = { borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 };

  // Metric toggle handler - cycles bar -> line -> off -> bar
  const cycleMetric = (key: string) => {
    setChartMetrics(prev => {
      const next = prev[key] === 'bar' ? 'line' : prev[key] === 'line' ? 'off' : 'bar';
      return { ...prev, [key]: next };
    });
  };

  const cycleShowsMetric = (key: string) => {
    setShowsMetrics(prev => {
      const next = prev[key] === 'bar' ? 'line' : prev[key] === 'line' ? 'off' : 'bar';
      return { ...prev, [key]: next };
    });
  };

  const cycleLocationMetric = (key: string) => {
    setLocationMetrics(prev => {
      const next = prev[key] === 'bar' ? 'line' : prev[key] === 'line' ? 'off' : 'bar';
      return { ...prev, [key]: next };
    });
  };

  // Determine which metrics are active and their render type
  const activeMetrics = useMemo(() => {
    return Object.entries(chartMetrics)
      .filter(([, mode]) => mode !== 'off')
      .map(([key, mode]) => ({ key, mode }));
  }, [chartMetrics]);

  const activeShowsMetrics = useMemo(() => {
    return Object.entries(showsMetrics)
      .filter(([, mode]) => mode !== 'off')
      .map(([key, mode]) => ({ key, mode }));
  }, [showsMetrics]);

  const activeLocationMetrics = useMemo(() => {
    return Object.entries(locationMetrics)
      .filter(([, mode]) => mode !== 'off')
      .map(([key, mode]) => ({ key, mode }));
  }, [locationMetrics]);

  const hasRightAxis = activeMetrics.some(m => m.mode === 'line');
  const hasShowsRightAxis = activeShowsMetrics.some(m => m.mode === 'line');
  const hasLocationRightAxis = activeLocationMetrics.some(m => m.mode === 'line');

  // CSV Export
  const handleExport = () => {
    const headers = ['Date', 'Campaign', 'Status', 'Goal', 'Start Date', 'End Date', 'Daily Budget', 'Total Budget', 'Spent', 'Impressions', 'Reach', 'LTR'];
    const rows = dailyGridData.map(d => [
      d.date, d.campaignName, d.campaignStatus, d.campaignGoal,
      d.startDate, d.endDate, d.dailyBudget, d.totalBudget,
      d.spent, d.impressions, d.reach, d.ltr,
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPieChart = (title: string, data: DemographicSlice[]) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              style={{ fontSize: 10 }}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const METRIC_LABELS: Record<string, string> = useMemo(() => ({
    impressions: t('reports.impressions'),
    reach: t('reports.reach'),
    conversions: t('reports.conversions'),
    spent: t('reports.spent'),
  }), [t]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {selectedCampaignName || t('reports.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedCampaignName ? t('reports.title_campaign') : t('reports.title_all')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Granularity selector */}
          <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('reports.daily')}</SelectItem>
              <SelectItem value="weekly">{t('reports.weekly')}</SelectItem>
              <SelectItem value="monthly">{t('reports.monthly')}</SelectItem>
              <SelectItem value="custom">{t('reports.custom')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date pickers */}
          {granularity === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('w-[130px] justify-start text-left font-normal', !customDateRange.from && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                    {customDateRange.from ? format(customDateRange.from, 'MMM d, yyyy') : t('reports.from')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customDateRange.from} onSelect={(d) => setCustomDateRange(prev => ({ ...prev, from: d }))} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('w-[130px] justify-start text-left font-normal', !customDateRange.to && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                    {customDateRange.to ? format(customDateRange.to, 'MMM d, yyyy') : t('reports.to')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customDateRange.to} onSelect={(d) => setCustomDateRange(prev => ({ ...prev, to: d }))} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </>
          )}

          {/* Campaign selector */}
          <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder={t('reports.all_campaigns')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reports.all_campaigns')}</SelectItem>
              {allCampaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export */}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            {t('reports.export_csv')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label={t('reports.impressions')} value={formatNum(kpis.totalImpressions)} icon={Eye} />
            <StatCard label={t('reports.ltr')} value={`${kpis.avgLtr.toFixed(1)}%`} icon={TrendingUp} />
            <StatCard label={t('reports.reach')} value={formatNum(kpis.totalReach)} icon={Users} />
            <StatCard label={t('reports.conversions')} value={formatNum(kpis.totalConversions)} icon={Target} />
            <StatCard label={t('reports.spent')} value={`$${formatNum(kpis.totalSpent)}`} icon={DollarSign} />
            <StatCard label={t('reports.budget_util')} value={`${kpis.budgetUtil.toFixed(1)}%`} icon={Percent} />
            <StatCard label="CPA" value={`$${kpis.cpa.toFixed(2)}`} icon={BarChart3} />
          </div>

          {/* Composed Chart with toggles */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {t('reports.performance')} ({granularity === 'custom' ? t('reports.custom_range') : granularity === 'daily' ? t('reports.last_30_days') : granularity === 'weekly' ? t('reports.weekly') : t('reports.monthly')})
                </CardTitle>
                <div className="flex items-center gap-1">
                  {Object.entries(METRIC_LABELS).map(([key, label]) => {
                    const mode = chartMetrics[key];
                    return (
                      <Button
                        key={key}
                        variant={mode === 'off' ? 'ghost' : 'secondary'}
                        size="sm"
                        className="text-xs h-7 px-2.5 gap-1"
                        onClick={() => cycleMetric(key)}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: mode === 'off' ? 'hsl(var(--muted-foreground))' : METRIC_COLORS[key] }}
                        />
                        {label}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {mode === 'bar' ? '■' : mode === 'line' ? '—' : '○'}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval="preserveStartEnd" />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  {hasRightAxis && (
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  )}
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  {activeMetrics.map(({ key, mode }) =>
                    mode === 'bar' ? (
                      <Bar key={key} yAxisId="left" dataKey={key} name={METRIC_LABELS[key]} fill={METRIC_COLORS[key]} radius={[2, 2, 0, 0]} />
                    ) : (
                      <Line key={key} yAxisId={hasRightAxis ? 'right' : 'left'} type="monotone" dataKey={key} name={METRIC_LABELS[key]} stroke={METRIC_COLORS[key]} strokeWidth={2} dot={false} />
                    )
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 25 Shows Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base">{t('reports.top_25_shows')}</CardTitle>
                <div className="flex items-center gap-1">
                  {Object.entries(METRIC_LABELS).map(([key, label]) => {
                    const mode = showsMetrics[key];
                    return (
                      <Button
                        key={key}
                        variant={mode === 'off' ? 'ghost' : 'secondary'}
                        size="sm"
                        className="text-xs h-7 px-2.5 gap-1"
                        onClick={() => cycleShowsMetric(key)}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: mode === 'off' ? 'hsl(var(--muted-foreground))' : METRIC_COLORS[key] }}
                        />
                        {label}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {mode === 'bar' ? '■' : mode === 'line' ? '—' : '○'}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={topShows} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  {hasShowsRightAxis && (
                    <XAxis xAxisId="right" type="number" orientation="top" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  )}
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={130} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  {activeShowsMetrics.map(({ key, mode }) =>
                    mode === 'bar' ? (
                      <Bar key={key} dataKey={key} name={METRIC_LABELS[key]} fill={METRIC_COLORS[key]} radius={[0, 2, 2, 0]} />
                    ) : (
                      <Line key={key} xAxisId={hasShowsRightAxis ? 'right' : undefined} type="monotone" dataKey={key} name={METRIC_LABELS[key]} stroke={METRIC_COLORS[key]} strokeWidth={2} dot={false} />
                    )
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Time of Day Heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('reports.listening_heatmap')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {(() => {
                  const maxVal = Math.max(...heatmapData.flatMap(r => DAYS_OF_WEEK.map(d => r[d] as number)));
                  return (
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className="p-1.5 text-left text-muted-foreground font-medium w-12">{t('reports.day')}</th>
                          {HOURS.map(h => (
                            <th key={h} className="p-1.5 text-center text-muted-foreground font-medium">{h.toString().padStart(2, '0')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAYS_OF_WEEK.map(day => (
                          <tr key={day}>
                            <td className="p-1.5 text-muted-foreground font-medium">{day}</td>
                            {HOURS.map(hour => {
                              const val = heatmapData[hour][day] as number;
                              const intensity = maxVal > 0 ? val / maxVal : 0;
                              return (
                                <td key={hour} className="p-0.5">
                                  <div
                                    className="rounded-sm h-8 min-w-[2rem] flex items-center justify-center text-[9px] font-medium transition-colors"
                                    style={{
                                      backgroundColor: `hsl(var(--primary) / ${Math.max(0.05, intensity)})`,
                                      color: intensity > 0.5 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                                    }}
                                    title={`${day} ${hour.toString().padStart(2, '0')}:00 — ${formatNum(val)}`}
                                  >
                                    {formatNum(val)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Location Split */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base">{t('reports.location_split')}</CardTitle>
                <div className="flex items-center gap-1">
                  {Object.entries(METRIC_LABELS).map(([key, label]) => {
                    const mode = locationMetrics[key];
                    return (
                      <Button
                        key={key}
                        variant={mode === 'off' ? 'ghost' : 'secondary'}
                        size="sm"
                        className="text-xs h-7 px-2.5 gap-1"
                        onClick={() => cycleLocationMetric(key)}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: mode === 'off' ? 'hsl(var(--muted-foreground))' : METRIC_COLORS[key] }}
                        />
                        {label}
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {mode === 'bar' ? '■' : mode === 'line' ? '—' : '○'}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(280, locations.length * 28)}>
                <ComposedChart data={locations} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  {hasLocationRightAxis && (
                    <XAxis xAxisId="right" type="number" orientation="top" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  )}
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={100} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  {activeLocationMetrics.map(({ key, mode }) =>
                    mode === 'bar' ? (
                      <Bar key={key} dataKey={key} name={METRIC_LABELS[key]} fill={METRIC_COLORS[key]} radius={[0, 2, 2, 0]} />
                    ) : (
                      <Line key={key} xAxisId={hasLocationRightAxis ? 'right' : undefined} type="monotone" dataKey={key} name={METRIC_LABELS[key]} stroke={METRIC_COLORS[key]} strokeWidth={2} dot={false} />
                    )
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderPieChart(t('reports.content_type_impressions'), contentTypes)}
            {renderPieChart(t('reports.device_type_impressions'), deviceTypes)}
            {renderPieChart(t('reports.podcast_topics_impressions'), podcastTopics)}
            {renderPieChart(t('reports.podcast_audiences_impressions'), podcastAudiences)}
            {renderPieChart(t('reports.gender_impressions'), genders)}
            {renderPieChart(t('reports.age_impressions'), ageGroups)}
          </div>

          {/* Daily Performance Grid */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.campaign_performance_per_day')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <MobileDataCards
                  data={dailyGridData.slice(0, 30)}
                  emptyMessage={t('reports.no_performance_data')}
                  renderCard={(row) => (
                    <div key={`${row.date}-${row.campaignName}`} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground text-sm">{row.date}</p>
                        <Badge variant="secondary" className={statusColors[row.campaignStatus] || ''}>
                          {row.campaignStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{row.campaignName}</p>
                      <div className="space-y-1.5">
                        <MobileStatRow label={t('reports.impressions')} value={row.impressions.toLocaleString()} />
                        <MobileStatRow label={t('reports.spent')} value={`$${row.spent.toFixed(0)}`} />
                        <MobileStatRow label={t('reports.reach')} value={row.reach.toLocaleString()} />
                        <MobileStatRow label={t('reports.ltr')} value={`${row.ltr}%`} />
                      </div>
                    </div>
                  )}
                />
              ) : (
                <AgGridReact
                  theme={appGridTheme}
                  modules={[AllCommunityModule]}
                  rowData={dailyGridData}
                  columnDefs={gridColDefs}
                  domLayout="autoHeight"
                  suppressCellFocus
                  animateRows
                  pagination
                  paginationPageSize={30}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
