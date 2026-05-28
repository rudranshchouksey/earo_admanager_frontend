import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { supabase } from '@/integrations/supabase/client';
import { type StatusTone } from '@/components/dashboard/reports/CampaignStatusSummary';
import CampaignKpiSummary from '@/components/dashboard/reports/CampaignKpiSummary';
// import { usePageBreadcrumb } from '@/contexts/PageBreadcrumbContext';
import { Eye, Users, Target, DollarSign, TrendingUp, BarChart3, Percent, Download, CalendarIcon, ChevronDown, Clock } from 'lucide-react';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, type ICellRendererParams } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { cn } from '@/lib/utils';
import { format, startOfWeek, startOfMonth, isWithinInterval, parseISO, subDays, startOfDay, endOfDay, startOfYesterday, endOfYesterday, subMonths, endOfMonth, differenceInCalendarDays, isSameDay, isSameYear } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDataCards, MobileStatRow } from '@/components/ui/mobile-data-card';
import { PillTabs } from '@/components/ui/pill-tabs';
import { Campaign, campaignApi, CampaignsResponse } from '@/services/campaign';
import { auth } from '@/services/auth';
import {
  CampaignReport,
  CampaignReportCardTotals,
  CampaignReportDailyRow,
  AdDeliveryReportData,
  AdDeliveryMetricRow,
  AdPositionRow,
  ContentLanguageRow,
  DeviceOSRow,
  ImpressionsByFilteredData,
  ImpressionsFilterMetricRow,
  DeviceTypeFilterRow,
  AgeFilterRow,
  GenderFilterRow,
  PodcastTopicFilterRow,
  CampaignImpressionsShareRow,
  CampaignActionData,
  ContentInventoryReportData,
  ContentInventoryMetricRow,
  GenreDataRow,
  MediaTopicRow,
  AudienceInsightRow,
  CountryCityReportData,
  CountryReportRow,
  CityReportRow,
  reportsApi,
} from '@/services/reports';
import { appNotifications } from '@/services/appNotifications';
import { Helmet } from 'react-helmet-async';




// interface Campaign {
//   id: string;
//   name: string;
//   status: string;
//   campaign_type: string;
//   start_date: string;
//   end_date: string;
//   budget: number;
//   actual_spend: number | null;
//   actual_impressions: number | null;
//   reach: number | null;
//   ltr: number | null;
//   target_locations?: any;
// }

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

interface PieChartSlice extends DemographicSlice {
  reach?: number;
  spent?: number;
  ltr?: number;
}

type MetricMode = 'bar' | 'line' | 'off';
type MetricKey = 'impressions' | 'reach' | 'conversions' | 'spent' | 'ltr';

const METRIC_LABELS: Record<MetricKey, string> = {
  impressions: 'Impressions',
  reach: 'Reach',
  conversions: 'Conversions',
  spent: 'Spend ($)',
  ltr: 'LTR (%)',
};

const METRIC_KEYS: MetricKey[] = ['impressions', 'reach', 'conversions', 'spent'];

const formatMetric = (key: MetricKey, v: number) => {
  if (v == null || isNaN(v)) return '—';
  if (key === 'spent') return `$${Math.round(v).toLocaleString()}`;
  if (key === 'ltr') return `${Math.round(v)}%`;
  return Math.round(v).toLocaleString();
};

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
  ltr: 'hsl(280, 60%, 55%)',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-orange-100 text-orange-800',
  ready: 'bg-blue-100 text-blue-800',
  running: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-primary/10 text-primary',
  rejected: 'bg-red-100 text-red-800',
};

const formatStatus = (s: string) => {
  if (!s) return s;
  const key = s.toLowerCase();
  const map: Record<string, string> = { active: 'Running' };
  const label = map[key] ?? key;
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const GOALS = ['awareness', 'engagement', 'conversions', 'reach'];
const SHOW_NAMES = [
  'The Morning Show', 'Tech Talk Daily', 'Culture Vibes', 'Business Insider', 'Music Hour',
  'Sports Recap', 'News Roundup', 'Comedy Club', 'Health & Wellness', 'Trending Now',
  'True Crime Files', 'Startup Stories', 'Daily Digest', 'Science Explained', 'Pop Culture Pod',
  'Finance Focus', 'Travel Tales', 'Gaming World', 'Parenting Plus', 'History Uncovered',
  'Mindful Minutes', 'Food & Flavor', 'Career Boost', 'Book Club Radio', 'Night Owl Sessions',
];
const DEVICE_TYPES = ['Mobile', 'Desktop', 'Smart Speaker', 'Connected TV'];
const GENDERS = ['Male', 'Female'];
const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const PODCAST_GENRES = ['True Crime', 'Business', 'Comedy', 'News & Politics', 'Health & Fitness', 'Technology', 'Education', 'Sports', 'Society & Culture', 'Arts'];
const PODCAST_AUDIENCES = ['Millennials', 'Gen Z', 'Gen X', 'Baby Boomers', 'Parents', 'Students', 'Professionals', 'Entrepreneurs'];
const LOCATIONS = ['Dubai', 'Abu Dhabi', 'Riyadh', 'Jeddah', 'Cairo', 'Kuwait City', 'Doha', 'Muscat', 'Manama', 'Amman', 'Beirut', 'Casablanca'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CITY_TO_COUNTRY: Record<string, string> = {
  'Dubai': 'United Arab Emirates',
  'Abu Dhabi': 'United Arab Emirates',
  'Riyadh': 'Saudi Arabia',
  'Jeddah': 'Saudi Arabia',
  'Cairo': 'Egypt',
  'Kuwait City': 'Kuwait',
  'Doha': 'Qatar',
  'Muscat': 'Oman',
  'Manama': 'Bahrain',
  'Amman': 'Jordan',
  'Beirut': 'Lebanon',
  'Casablanca': 'Morocco',
};
const COUNTRY_TO_CITIES: Record<string, string[]> = {
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa'],
  'Jordan': ['Amman', 'Irbid', 'Zarqa', 'Aqaba'],
  'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Jounieh'],
  'Morocco': ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier'],
  'Iraq': ['Baghdad', 'Erbil', 'Basra', 'Sulaymaniyah'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse'],
  'Algeria': ['Algiers', 'Oran', 'Constantine'],
  'Libya': ['Tripoli', 'Benghazi', 'Misrata'],
  'Sudan': ['Khartoum', 'Omdurman', 'Port Sudan'],
  'Palestine': ['Ramallah', 'Gaza', 'Nablus', 'Hebron'],
  'Syria': ['Damascus', 'Aleppo', 'Homs'],
  'Yemen': ['Sanaa', 'Aden', 'Taiz'],
};

// New constants for additional pie charts
const AD_POSITIONS = ['Pre-roll', 'Mid-roll', 'Post-roll'];

const AD_POSITION_LABELS: Record<string, string> = {
  PRE_ROLL: 'Pre-roll',
  MID_ROLL: 'Mid-roll',
  POST_ROLL: 'Post-roll',
  UNDEFINED: 'Undefined',
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  sw: 'Swahili',
  af: 'Afrikaans',
  ru: 'Russian',
  'en-us': 'English (US)',
  es: 'Spanish',
  fr: 'French',
  hi: 'Hindi',
  fa: 'Persian',
  ur: 'Urdu',
  tr: 'Turkish',
};
const CONTENT_LANGUAGES = ['English', 'Arabic', 'French', 'Hindi', 'Urdu', 'Spanish', 'Turkish'];
const DEVICE_OS = ['Phone', 'Portable Media Player', 'Tablet', 'Desktop', 'Gaming Console', 'Smart Speaker', 'Smart TV', 'Connected Vehicle', 'Smart Watch', 'Less Common Devices'];
const MEDIA_TOPICS = ['News', 'Entertainment', 'Sports', 'Technology', 'Lifestyle', 'Finance', 'Health', 'Education'];

type Granularity = 'daily' | 'weekly' | 'monthly';

type ApiPerformanceDateRange = 'DAY' | 'WEEK' | 'MONTH';

function gridGranularityToApiDateRange(granularity: Granularity): ApiPerformanceDateRange {
  if (granularity === 'weekly') return 'WEEK';
  if (granularity === 'monthly') return 'MONTH';
  return 'DAY';
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateDailyData(campaign: Campaign): DailyData[] {
  const rand = seededRandom(campaign.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const goal = GOALS[Math.floor(rand() * GOALS.length)];
  const numDays = 30;
  const dailyBudget = campaign.budget / numDays;

  const totalImpressions = campaign.actual_impressions || Math.round(campaign.budget * (30 + rand() * 20));
  const totalSpend = campaign.actual_spend || Math.round(campaign.budget * (0.4 + rand() * 0.3) * 100) / 100;
  const totalReach = campaign.reach || Math.round(totalImpressions * (0.2 + rand() * 0.15));

  const days: DailyData[] = [];
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
  <Badge variant="secondary" className={statusColors[params.value] || ''}>{formatStatus(params.value)}</Badge>
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

// Aggregation helper with explicit granularity
function aggregateWithGranularity(
  data: { date: string; impressions: number; reach: number; conversions: number; spent: number; ltr?: number }[],
  range: { from: Date; to: Date },
  granularity: Granularity,
) {
  const filtered = data.filter(d => {
    const dt = parseISO(d.date);
    return isWithinInterval(dt, { start: startOfDay(range.from), end: endOfDay(range.to) });
  });

  if (granularity === 'daily') {
    return filtered.map(d => ({ ...d, ltr: d.ltr ?? 0, label: format(parseISO(d.date), 'MMM d') }));
  }

  const bucketKey = (dateStr: string) => {
    const dt = parseISO(dateStr);
    if (granularity === 'weekly') return format(startOfWeek(dt, { weekStartsOn: 1 }), 'MMM d');
    return format(startOfMonth(dt), 'MMM yyyy');
  };

  const map = new Map<string, { label: string; impressions: number; reach: number; conversions: number; spent: number; ltr: number; _ltrSum: number; _ltrN: number; _sortKey: string }>();
  filtered.forEach(d => {
    const key = bucketKey(d.date);
    const existing = map.get(key) || { label: key, impressions: 0, reach: 0, conversions: 0, spent: 0, ltr: 0, _ltrSum: 0, _ltrN: 0, _sortKey: d.date };
    existing.impressions += d.impressions;
    existing.reach += d.reach;
    existing.conversions += d.conversions;
    existing.spent += d.spent;
    if (d.ltr != null) {
      existing._ltrSum += d.ltr;
      existing._ltrN += 1;
    }
    if (d.date < existing._sortKey) existing._sortKey = d.date;
    map.set(key, existing);
  });

  return Array.from(map.values())
    .map(r => ({ ...r, ltr: r._ltrN > 0 ? Math.round(r._ltrSum / r._ltrN) : 0 }))
    .sort((a, b) => a._sortKey.localeCompare(b._sortKey));
}

type ChartDailyPoint = {
  date: string;
  impressions: number;
  reach: number;
  conversions: number;
  spent: number;
  ltr: number;
};

function campaignReportRowToChartPoint(row: CampaignReportDailyRow): ChartDailyPoint {
  return {
    date: row.__time.start.substring(0, 10),
    impressions: row.impressions ?? 0,
    reach: row.demandAudioReachUniqueUsers ?? 0,
    conversions: row.objectiveCountableSum ?? 0,
    spent: row.totalSpend ?? 0,
    ltr: row.ltr ?? 0,
  };
}

function aggregateCardTotalsFromDailyRows(rows: CampaignReportDailyRow[]): CampaignReportCardTotals {
  const impressions = rows.reduce((sum, r) => sum + (r.impressions ?? 0), 0);
  const totalSpend = rows.reduce((sum, r) => sum + (r.totalSpend ?? 0), 0);
  const objectiveCountableSum = rows.reduce((sum, r) => sum + (r.objectiveCountableSum ?? 0), 0);
  const demandAudioImp = rows.reduce((sum, r) => sum + (r.demandAudioImp ?? 0), 0);
  const demandAudioReachUniqueUsers = rows.reduce(
    (max, r) => Math.max(max, r.demandAudioReachUniqueUsers ?? 0),
    0,
  );
  const ltr =
    impressions > 0
      ? rows.reduce((sum, r) => sum + (r.ltr ?? 0) * (r.impressions ?? 0), 0) / impressions
      : 0;
  const demandECPM =
    impressions > 0
      ? rows.reduce((sum, r) => sum + (r.demandECPM ?? 0) * (r.impressions ?? 0), 0) / impressions
      : 0;
  const attributionCPAInUSD =
    objectiveCountableSum > 0 ? totalSpend / objectiveCountableSum : 0;

  return {
    attributionCPAInUSD,
    totalSpend,
    demandECPM,
    demandAudioReachUniqueUsers,
    impressions,
    ltr,
    objectiveCountableSum,
    demandAudioImp,
  };
}

function parseCampaignReportsPayload(payload: unknown): CampaignReport | null {
  if (!payload || typeof payload !== 'object') return null;

  if (Array.isArray(payload)) {
    if (payload.length === 0) return null;
    const dailyRows = payload as CampaignReportDailyRow[];
    return {
      cardTotals: aggregateCardTotalsFromDailyRows(dailyRows),
      PerformanceTotals: dailyRows,
      data: [],
    };
  }

  const record = payload as Record<string, unknown>;

  // Nested wrapper: { data: { cardTotals, data: [...] } }
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    const nested = parseCampaignReportsPayload(record.data);
    if (nested) return nested;
  }

  const dailyRows = Array.isArray(record.data)
    ? (record.data as CampaignReportDailyRow[])
    : Array.isArray(record.PerformanceTotals)
      ? (record.PerformanceTotals as CampaignReportDailyRow[])
      : null;

  if (!dailyRows || dailyRows.length === 0) return null;

  const cardTotals =
    (record.cardTotals as CampaignReportCardTotals | undefined) ??
    aggregateCardTotalsFromDailyRows(dailyRows);

  return { cardTotals, PerformanceTotals: dailyRows, data: record.data as CampaignReportDailyRow[] };
}

type LocationChartRow = {
  name: string;
  country?: string;
  impressions: number;
  reach: number;
  conversions: number;
  spent: number;
  ltr?: number;
};

function formatLocationLabel(value?: string): string {
  if (!value?.trim()) return 'Unknown';
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function resolveReportCampaignIds(allCampaigns: Campaign[], selectedCampaignId: string): number[] {
  if (selectedCampaignId === 'all') {
    return allCampaigns.map((c) => Number(c.externalRefId)).filter((id) => !Number.isNaN(id));
  }
  return allCampaigns
    .filter((c) => c.id === selectedCampaignId)
    .map((c) => Number(c.externalRefId))
    .filter((id) => !Number.isNaN(id));
}

function mapCountryToChartRow(row: CountryReportRow): LocationChartRow {
  return {
    name: row.countryName,
    impressions: row.impressions ?? 0,
    reach: row.reach ?? 0,
    conversions: 0,
    spent: row.totalSpend ?? 0,
  };
}

function formatAdPositionLabel(position: string): string {
  return AD_POSITION_LABELS[position] ?? formatLocationLabel(position.replace(/_/g, ' '));
}

function formatLanguageLabel(language: string): string {
  return LANGUAGE_LABELS[language.toLowerCase()] ?? language.toUpperCase();
}

function mapImpressionsFilteredToPieSlices<T extends ImpressionsFilterMetricRow>(
  rows: T[],
  getName: (row: T) => string,
): PieChartSlice[] {
  return rows
    .map((row) => ({
      name: getName(row),
      value: row.impressions ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function parseReportBudget(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function mapCampaignPerformanceToGridRow(row: CampaignActionData): DailyData {
  const reportDate = row.start?.substring(0, 10) ?? '';
  const flightStart = row.startDate
    ? (() => {
        const d = parseISO(row.startDate);
        return Number.isNaN(d.getTime()) ? row.startDate : format(d, 'MMM d, yyyy');
      })()
    : '';
  const flightEnd = row.endDate
    ? (() => {
        const d = parseISO(row.endDate);
        return Number.isNaN(d.getTime()) ? row.endDate : format(d, 'MMM d, yyyy');
      })()
    : '';

  return {
    date: reportDate,
    impressions: row.impressions ?? 0,
    reach: row.demandAudioReachUniqueUsers ?? 0,
    conversions: row.objectiveCountableSum ?? 0,
    spent: 0,
    campaignName: row.campaignName ?? '',
    campaignStatus: (row.status ?? '').toLowerCase(),
    campaignGoal: row.campaignDB ?? '',
    startDate: flightStart,
    endDate: flightEnd,
    dailyBudget: parseReportBudget(row.dailyCap),
    totalBudget: parseReportBudget(row.totalBudget),
    ltr: Math.round(row.ltr ?? 0),
  };
}

function aggregatePerformanceGridRows(rows: DailyData[], gridGranularity: Granularity): DailyData[] {
  if (gridGranularity === 'daily') {
    return [...rows].sort((a, b) => b.date.localeCompare(a.date));
  }

  const bucketKey = (dateStr: string) => {
    const dt = parseISO(dateStr);
    if (gridGranularity === 'weekly') return format(startOfWeek(dt, { weekStartsOn: 1 }), 'MMM d, yyyy');
    return format(startOfMonth(dt), 'MMM yyyy');
  };

  const map = new Map<string, DailyData & { _ltrSum: number; _n: number; _sortKey: string }>();
  rows.forEach((d) => {
    const key = `${d.campaignName}__${bucketKey(d.date)}`;
    const ex = map.get(key);
    if (ex) {
      ex.impressions += d.impressions;
      ex.reach += d.reach;
      ex.conversions += d.conversions;
      ex.spent += d.spent;
      ex._ltrSum += d.ltr;
      ex._n += 1;
      if (d.date < ex._sortKey) ex._sortKey = d.date;
    } else {
      map.set(key, {
        ...d,
        date: bucketKey(d.date),
        _sortKey: d.date,
        _ltrSum: d.ltr,
        _n: 1,
      });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b._sortKey.localeCompare(a._sortKey))
    .map(({ _ltrSum, _n, _sortKey, ...rest }) => ({
      ...rest,
      ltr: _n > 0 ? Math.round(_ltrSum / _n) : 0,
    }));
}

function mapPodcastTopicsToBarRows(
  rows: PodcastTopicFilterRow[],
  totals: { totalReach: number; totalConversions: number; totalSpent: number },
): LocationChartRow[] {
  const totalImpressions = rows.reduce((sum, row) => sum + (row.impressions ?? 0), 0);

  return rows
    .map((row) => {
      const share = totalImpressions > 0 ? (row.impressions ?? 0) / totalImpressions : 0;
      return {
        name: row.podcastTopicLabel,
        impressions: row.impressions ?? 0,
        reach: Math.round(totals.totalReach * share),
        conversions: Math.round(totals.totalConversions * share),
        spent: totals.totalSpent * share,
      };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

function mapAdDeliveryToPieSlices<T extends AdDeliveryMetricRow>(
  rows: T[],
  getName: (row: T) => string,
): PieChartSlice[] {
  return rows
    .map((row) => ({
      name: getName(row),
      value: row.impressions ?? 0,
      reach: row.uniqueUsers ?? 0,
      spent: row.totalSpend ?? 0,
      ltr: row.ltr ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function mapContentInventoryToPieSlices<T extends ContentInventoryMetricRow>(
  rows: T[],
  getName: (row: T) => string,
): PieChartSlice[] {
  return rows
    .map((row) => ({
      name: getName(row),
      value: row.impressions ?? 0,
      reach: row.uniqueUsers ?? 0,
      spent: row.totalSpend ?? 0,
      ltr: row.ltr ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function mapCityToChartRow(row: CityReportRow): LocationChartRow {
  return {
    name: formatLocationLabel(row.city),
    impressions: row.impressions ?? 0,
    reach: row.uniqueUsers ?? 0,
    conversions: 0,
    spent: row.totalSpend ?? 0,
  };
}

function dailyRowsToChartPoints(rows: CampaignReportDailyRow[]): ChartDailyPoint[] {
  const map = new Map<string, ChartDailyPoint & { _ltrSum: number; _ltrN: number }>();

  rows.forEach((row) => {
    const point = campaignReportRowToChartPoint(row);
    const existing = map.get(point.date) ?? {
      ...point,
      impressions: 0,
      reach: 0,
      conversions: 0,
      spent: 0,
      ltr: 0,
      _ltrSum: 0,
      _ltrN: 0,
    };
    existing.impressions += point.impressions;
    existing.reach += point.reach;
    existing.conversions += point.conversions;
    existing.spent += point.spent;
    if (point.ltr != null) {
      existing._ltrSum += point.ltr;
      existing._ltrN += 1;
    }
    map.set(point.date, existing);
  });

  return Array.from(map.values())
    .map(({ _ltrSum, _ltrN, ...rest }) => ({
      ...rest,
      ltr: _ltrN > 0 ? Math.round(_ltrSum / _ltrN) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function chartLabelFromDate(dateStr: string, granularity: Granularity): string {
  const dt = parseISO(dateStr);
  if (granularity === 'weekly') return format(startOfWeek(dt, { weekStartsOn: 1 }), 'MMM d');
  if (granularity === 'monthly') return format(startOfMonth(dt), 'MMM yyyy');
  return format(dt, 'MMM d');
}

function chartPointsToLabeledBuckets(
  points: ChartDailyPoint[],
  range: { from: Date; to: Date },
  granularity: Granularity,
  fromApi: boolean,
) {
  const filtered = points.filter((d) => {
    const dt = parseISO(d.date);
    return isWithinInterval(dt, { start: startOfDay(range.from), end: endOfDay(range.to) });
  });

  if (fromApi) {
    return filtered
      .map((d) => ({
        ...d,
        ltr: d.ltr ?? 0,
        label: chartLabelFromDate(d.date, granularity),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return aggregateWithGranularity(filtered, range, granularity);
}


// ─── Date Range Picker ───────────────────────
type Preset = { label: string; getRange: () => { from: Date; to: Date } };

const PRESETS: Preset[] = [
  { label: 'Today', getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Yesterday', getRange: () => ({ from: startOfYesterday(), to: endOfYesterday() }) },
  { label: 'Last 7 days', getRange: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: 'This month', getRange: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last month', getRange: () => {
    const lm = subMonths(new Date(), 1);
    return { from: startOfMonth(lm), to: endOfMonth(lm) };
  } },
  { label: 'Last 90 days', getRange: () => ({ from: startOfDay(subDays(new Date(), 89)), to: endOfDay(new Date()) }) },
];

function matchPreset(range: { from: Date; to: Date }): string {
  for (const p of PRESETS) {
    const r = p.getRange();
    if (isSameDay(r.from, range.from) && isSameDay(r.to, range.to)) return p.label;
  }
  return 'Custom';
}

function DateRangePicker({
  value,
  onChange,
  isMobile,
  tzLabel,
}: {
  value: { from: Date; to: Date };
  onChange: (r: { from: Date; to: Date }) => void;
  isMobile: boolean;
  tzLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [staged, setStaged] = useState<DateRange>({ from: value.from, to: value.to });

  useEffect(() => {
    if (open) setStaged({ from: value.from, to: value.to });
  }, [open, value.from, value.to]);

  const activePreset = matchPreset(value);
  const stagedPreset = staged.from && staged.to
    ? matchPreset({ from: staged.from, to: staged.to })
    : 'Custom';

  const apply = () => {
    if (staged.from && staged.to) {
      onChange({ from: staged.from, to: staged.to });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 justify-start text-left font-normal gap-2">
          {activePreset !== 'Custom' && (
            <span className="inline-flex items-center rounded-md bg-muted text-muted-foreground text-[11px] font-medium px-1.5 py-0.5">
              {activePreset}
            </span>
          )}
          <span className="text-xs sm:text-sm">
            {isSameDay(value.from, value.to)
              ? format(value.to, 'MMM d, yyyy')
              : isSameYear(value.from, value.to)
              ? `${format(value.from, 'MMM d')} – ${format(value.to, 'MMM d, yyyy')}`
              : `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn('p-0 pointer-events-auto', isMobile ? 'w-[320px]' : 'w-auto max-w-[720px]')}
      >
        <div className={cn('flex', isMobile ? 'flex-col' : 'flex-row')}>
          <div
            className={cn(
              'flex shrink-0 border-border',
              isMobile
                ? 'flex-row overflow-x-auto border-b p-2 gap-1'
                : 'flex-col w-[180px] border-r py-2',
            )}
          >
            {[{ label: 'Custom' } as { label: string }, ...PRESETS].map(p => {
              const isActive = (open ? stagedPreset : activePreset) === p.label;
              const isCustom = p.label === 'Custom';
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    if (isCustom) {
                      setStaged({ from: undefined, to: undefined });
                      return;
                    }
                    const r = (p as Preset).getRange();
                    setStaged({ from: r.from, to: r.to });
                  }}
                  className={cn(
                    'text-left text-sm whitespace-nowrap transition-colors',
                    isMobile
                      ? 'px-3 py-1.5 rounded-md shrink-0'
                      : 'px-4 py-2',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col">
            <div className="flex gap-2 px-3 pt-3 pb-1">
              <div className="flex-1 rounded-md border border-input px-2 py-1">
                <div className="text-[10px] text-muted-foreground">Start date</div>
                <div className="text-sm">{staged.from ? format(staged.from, 'MMM d, yyyy') : '—'}</div>
              </div>
              <div className="flex-1 rounded-md border border-input px-2 py-1">
                <div className="text-[10px] text-muted-foreground">End date</div>
                <div className="text-sm">{staged.to ? format(staged.to, 'MMM d, yyyy') : '—'}</div>
              </div>
            </div>
            <Calendar
              mode="range"
              selected={staged}
              onSelect={(r, selectedDay) => {
                if (staged.from && staged.to && selectedDay) {
                  setStaged({ from: startOfDay(selectedDay), to: undefined });
                  return;
                }
                setStaged(r ?? { from: undefined, to: undefined });
              }}
              numberOfMonths={isMobile ? 1 : 2}
              defaultMonth={staged.from ?? value.from}
              className="p-3 pointer-events-auto"
            />
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              {tzLabel ? (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Times shown in {tzLabel}
                </span>
              ) : <span />}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={apply} disabled={!staged.from || !staged.to}>Apply</Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Per-chart metric dropdown ───
function MetricDropdown({
  value,
  onChange,
  extraKeys,
}: {
  value: MetricKey;
  onChange: (v: MetricKey) => void;
  extraKeys?: MetricKey[];
}) {
  const keys = extraKeys && extraKeys.length ? [...METRIC_KEYS, ...extraKeys] : METRIC_KEYS;
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MetricKey)}>
      <SelectTrigger className="w-52 h-9 focus:ring-0 focus:ring-offset-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {keys.map((k) => (
          <SelectItem key={k} value={k}>
            {METRIC_LABELS[k]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Shared tooltip that shows ALL metrics for a data point ───
function AllMetricsTooltip({ active, payload, label, selectedMetric }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload as Record<string, any>;
  const baseKeys: MetricKey[] = [...METRIC_KEYS, ...(row.ltr != null ? ['ltr' as MetricKey] : [])];
  const orderedKeys = selectedMetric && baseKeys.includes(selectedMetric)
    ? [selectedMetric as MetricKey, ...baseKeys.filter(k => k !== selectedMetric)]
    : baseKeys;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <div className="font-semibold text-foreground mb-1.5">{label}</div>}
      {row.name && !label && <div className="font-semibold text-foreground mb-1.5">{row.name}</div>}
      <div className="space-y-1">
        {orderedKeys.map((k) => (
          <div key={k} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: METRIC_COLORS[k] }}
              />
              {METRIC_LABELS[k]}
            </span>
            <span className="tabular-nums font-medium text-foreground">
              {formatMetric(k, row[k] as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tooltip used in the stacked "All Campaigns" Campaign Report chart
function StackedCampaignTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const items = [...payload].sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <div className="font-semibold text-foreground mb-1.5">{label}</div>}
      <div className="space-y-1">
        {items.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color || p.fill }}
              />
              {p.name}
            </span>
            <span className="tabular-nums font-medium text-foreground">
              {formatMetric(metric as MetricKey, p.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal bar chart card (reusable) ───
function HorizontalBarChartCard({ title, data, selectedMetric, onMetricChange, extraKeys }: {
  title: string;
  data: any[];
  selectedMetric: MetricKey;
  onMetricChange: (v: MetricKey) => void;
  extraKeys?: MetricKey[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">{title}</CardTitle>
          <MetricDropdown value={selectedMetric} onChange={onMetricChange} extraKeys={extraKeys} />
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 1 ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-foreground">{data[0].name}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...METRIC_KEYS, ...((extraKeys ?? []).filter(k => (data[0] as any)[k] != null))].map((key) => {
                const value = (data[0] as any)[key] as number;
                return (
                  <div key={key} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: METRIC_COLORS[key] }} />
                      <span className="text-xs text-muted-foreground">{METRIC_LABELS[key]}</span>
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{formatMetric(key, value)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, data.length * 28)}>
            <ComposedChart data={data} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={130} />
              <Tooltip content={<AllMetricsTooltip selectedMetric={selectedMetric} />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Bar
                dataKey={selectedMetric}
                name={METRIC_LABELS[selectedMetric]}
                fill={METRIC_COLORS[selectedMetric]}
                radius={[0, 2, 2, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {



  // return (
  //   <div className='flex flex-col items-center justify-center h-full'>
  //     <h3 className='text-2xl font-bold'>Coming Soon</h3>
  //     <p className='text-sm text-muted-foreground'>We are working on this feature and it will be available soon.</p>
  //   </div>
  // )

  const [searchParams, setSearchParams] = useSearchParams();
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(searchParams.get('campaign') || 'all');
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  // const { setExtraCrumbs } = usePageBreadcrumb();
  const [campaignsReport, setCampaignsReport] = useState<CampaignReport>();
  const [countryCityReport, setCountryCityReport] = useState<CountryCityReportData | null>(null);
  const [contentInventoryReport, setContentInventoryReport] = useState<ContentInventoryReportData | null>(null);
  const [adDeliveryReport, setAdDeliveryReport] = useState<AdDeliveryReportData | null>(null);
  const [impressionsByFiltered, setImpressionsByFiltered] = useState<ImpressionsByFilteredData | null>(null);
  const [impressionsShareByCampaigns, setImpressionsShareByCampaigns] = useState<CampaignImpressionsShareRow[] | null>(null);
  const [campaignPerformanceRows, setCampaignPerformanceRows] = useState<CampaignActionData[] | null>(null);

  const tzLabel = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetMin = -new Date().getTimezoneOffset();
      const sign = offsetMin >= 0 ? '+' : '-';
      const h = Math.floor(Math.abs(offsetMin) / 60);
      const m = Math.abs(offsetMin) % 60;
      const offset = `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
      return `${tz} (${offset})`;
    } catch {
      return null;
    }
  }, []);

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => ({
    from: subDays(new Date(), 29),
    to: new Date(),
  }));

  // Granularity for Campaign Report chart
  const [granularity, setGranularity] = useState<Granularity>('daily');

  // Range-aware grouping options
  const groupingConfig = useMemo(() => {
    const span = differenceInCalendarDays(dateRange.to, dateRange.from) + 1;
    let options: Granularity[] = [];
    let smartDefault: Granularity | null = null;
    if (span <= 1) { options = []; smartDefault = null; }
    else if (span <= 14) { options = ['daily']; smartDefault = 'daily'; }
    else if (span <= 60) { options = ['daily', 'weekly']; smartDefault = 'daily'; }
    else if (span <= 180) { options = ['daily', 'weekly', 'monthly']; smartDefault = 'weekly'; }
    else { options = ['weekly', 'monthly']; smartDefault = 'monthly'; }
    return { options, smartDefault, span };
  }, [dateRange]);

  useEffect(() => {
    if (groupingConfig.options.length === 0) return;
    if (!groupingConfig.options.includes(granularity) && groupingConfig.smartDefault) {
      setGranularity(groupingConfig.smartDefault);
    }
  }, [groupingConfig, granularity]);

  // Per-chart selected metric (replaces former global metric toggle)
  const [reportMetric, setReportMetric] = useState<MetricKey>('impressions');
  // LTR is only available per-campaign; reset if user switches back to All Campaigns
  useEffect(() => {
    if (selectedCampaignId === 'all' && reportMetric === 'ltr') {
      setReportMetric('impressions');
    }
  }, [selectedCampaignId, reportMetric]);
  
  const [countryMetric, setCountryMetric] = useState<MetricKey>('impressions');
  const [cityMetric, setCityMetric] = useState<MetricKey>('impressions');
  const [showMetric, setShowMetric] = useState<MetricKey>('impressions');

  // Granularity for the Campaign Performance grid
  const [gridGranularity, setGridGranularity] = useState<Granularity>('daily');


  useEffect(() => {
    if (allCampaigns.length === 0) return;

    let cancelled = false;

    const loadCampaignReports = async () => {
      const { data: { session: sessionData } } = await auth.getSession();
      if (!sessionData?.currentAdvertiserId) return;

      const campaignIds =
        selectedCampaignId === 'all'
          ? allCampaigns.map((c) => Number(c.externalRefId)).filter((id) => !Number.isNaN(id))
          : allCampaigns
              .filter((c) => c.id === selectedCampaignId)
              .map((c) => Number(c.externalRefId))
              .filter((id) => !Number.isNaN(id));

      if (campaignIds.length === 0) return;

      const { data, status, error } = await reportsApi.getCampaignReports({
        advertiserId: sessionData.currentAdvertiserId,
        campaignIds,
        dateRange: gridGranularityToApiDateRange(granularity),
        from: dateRange.from.toISOString().substring(0, 10),
        to: dateRange.to.toISOString().substring(0, 10),
        campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
      });

      if (cancelled) return;
      if (status !== 200 || error || !data?.data) {
        if (error) console.error(error);
        return;
      }

      const parsed = parseCampaignReportsPayload(data.data);
      if (parsed) {
        setCampaignsReport(parsed);
      } else {
        setCampaignsReport(undefined);
      }
    };

    loadCampaignReports();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to, granularity]);

  useEffect(() => {
    if (allCampaigns.length === 0) return;

    let cancelled = false;

    const loadCountryCityReport = async () => {
      const { data: { session: sessionData } } = await auth.getSession();
      if (!sessionData?.currentAdvertiserId) return;

      const campaignIds = resolveReportCampaignIds(allCampaigns, selectedCampaignId);
      if (campaignIds.length === 0) return;

      const { data, status, error } = await reportsApi.GetCountryCityReport({
        advertiserId: sessionData.currentAdvertiserId,
        campaignIds,
        dateRange: 'CUSTOM',
        from: dateRange.from.toISOString().substring(0, 10),
        to: dateRange.to.toISOString().substring(0, 10),
        campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
      });

      if (cancelled) return;
      if (status !== 200 || error || !data?.data) {
        if (error) console.error(error);
        return;
      }

      setCountryCityReport(data.data);
    };

    loadCountryCityReport();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0) return;

    let cancelled = false;

    const loadContentInventory = async () => {
      const { data: { session: sessionData } } = await auth.getSession();
      if (!sessionData?.currentAdvertiserId) return;

      const campaignIds = resolveReportCampaignIds(allCampaigns, selectedCampaignId);
      if (campaignIds.length === 0) return;

      const { data, status, error } = await reportsApi.GetContentInventory({
        advertiserId: sessionData.currentAdvertiserId,
        campaignIds,
        dateRange: 'CUSTOM',
        from: dateRange.from.toISOString().substring(0, 10),
        to: dateRange.to.toISOString().substring(0, 10),
        campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
      });

      if (cancelled) return;
      if (status !== 200 || error || !data?.data) {
        if (error) console.error(error);
        return;
      }

      setContentInventoryReport(data.data);
    };

    loadContentInventory();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0) return;

    let cancelled = false;

    const loadAdDelivery = async () => {
      const { data: { session: sessionData } } = await auth.getSession();
      if (!sessionData?.currentAdvertiserId) return;

      const campaignIds = resolveReportCampaignIds(allCampaigns, selectedCampaignId);
      if (campaignIds.length === 0) return;

      const { data, status, error } = await reportsApi.GetAdDelivery({
        advertiserId: sessionData.currentAdvertiserId,
        campaignIds,
        dateRange: 'CUSTOM',
        from: dateRange.from.toISOString().substring(0, 10),
        to: dateRange.to.toISOString().substring(0, 10),
        campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
      });

      if (cancelled) return;
      if (status !== 200 || error || !data?.data) {
        if (error) console.error(error);
        return;
      }

      setAdDeliveryReport(data.data);
    };

    loadAdDelivery();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0) return;

    let cancelled = false;

    const loadImpressionsByFiltered = async () => {
      const { data: { session: sessionData } } = await auth.getSession();
      if (!sessionData?.currentAdvertiserId) return;

      const campaignIds = resolveReportCampaignIds(allCampaigns, selectedCampaignId);
      if (campaignIds.length === 0) return;

      const { data, status, error } = await reportsApi.getImpressionsByFiltered({
        advertiserId: sessionData.currentAdvertiserId,
        campaignIds,
        dateRange: 'CUSTOM',
        from: dateRange.from.toISOString().substring(0, 10),
        to: dateRange.to.toISOString().substring(0, 10),
      });

      if (cancelled) return;
      if (status !== 200 || error || !data?.data) {
        if (error) console.error(error);
        return;
      }

      setImpressionsByFiltered(data.data);
    };

    loadImpressionsByFiltered();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0) return;

    let cancelled = false;

    const loadImpressionsShareByCampaigns = async () => {
      const { data: { session: sessionData } } = await auth.getSession();
      if (!sessionData?.currentAdvertiserId) return;

      const campaignIds = resolveReportCampaignIds(allCampaigns, selectedCampaignId);
      if (campaignIds.length === 0) return;

      const { data, status, error } = await reportsApi.ImpressionsShareByCampaigns({
        advertiserId: sessionData.currentAdvertiserId,
        campaignIds,
        dateRange: 'CUSTOM',
        from: dateRange.from.toISOString().substring(0, 10),
        to: dateRange.to.toISOString().substring(0, 10),
        campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
      });

      if (cancelled) return;
      if (status !== 200 || error || !data?.data?.campaignMetrics) {
        if (error) console.error(error);
        return;
      }

      setImpressionsShareByCampaigns(data.data.campaignMetrics);
    };

    loadImpressionsShareByCampaigns();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0) return;

    let cancelled = false;

    const loadCampaignPerformance = async () => {
      const { data: { session: sessionData } } = await auth.getSession();
      if (!sessionData?.currentAdvertiserId) return;

      const campaignIds = resolveReportCampaignIds(allCampaigns, selectedCampaignId);
      if (campaignIds.length === 0) return;

      const { data, status, error } = await reportsApi.getCampaignPerformance({
        advertiserId: sessionData.currentAdvertiserId,
        campaignIds,
        dateRange: gridGranularityToApiDateRange(gridGranularity),
        from: dateRange.from.toISOString().substring(0, 10),
        to: dateRange.to.toISOString().substring(0, 10),
        campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
      });

      if (cancelled) return;
      if (status !== 200 || error || !Array.isArray(data?.data)) {
        if (error) console.error(error);
        return;
      }

      setCampaignPerformanceRows(data.data);
    };

    loadCampaignPerformance();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to, gridGranularity]);

  useEffect(() => {
    const loadAllReports = async () => {
      const {data: {session: sessionData}} = await auth.getSession();
      if (!sessionData) {
        console.error("Not authenticated");
        return;
      }


      const campaignIds = resolveReportCampaignIds(allCampaigns, selectedCampaignId);
      if (campaignIds.length === 0) return;

      const getListeningHeatMap = async () => {

        const {data, status, error} = await reportsApi.getListeningHeatMap({
          advertiserId: sessionData.currentAdvertiserId || "",
          campaignIds,
          dateRange: "CUSTOM",
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
        });
        if (status !== 200 || error) {
          console.error(error);
          return;
        }
      }
      const GetDemographics = async () => {
        const {data, status, error} = await reportsApi.GetDemographics({
          advertiserId: sessionData.currentAdvertiserId || "",
          campaignIds,
          dateRange: "CUSTOM",
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: selectedCampaignId === 'all' ? 'ALL' : 'SPECIFIC',
        });
        if (status !== 200 || error) {
          console.error(error);
          return;
        }
      }

      await Promise.all([
        getListeningHeatMap(),
        GetDemographics(),
      ]);
    }


    if (allCampaigns.length === 0) return;
    loadAllReports();
  }, [allCampaigns, selectedCampaignId, dateRange.from, dateRange.to])
  

  useEffect(() => {
    const fetchData = async () => {
      const {data: {session: sessionData}} = await auth.getSession();
      if (!sessionData) {
        console.error("Not authenticated");
        return;
      }
      const { data, status, error } = await campaignApi.getCampaigns({
        page: 1,
        limit: 1000,
        advertiserId: sessionData.currentAdvertiserId || "",
        sortBy: "createdAt",
        sortOrder: "asc",
      });
      if (status !== 200 || error) {
        console.error(error);
        return;
      }

      const excludeDrafts = data.data.filter((c: Campaign) => c.status.toLowerCase() !== 'draft' && c.status.toLowerCase() !== 'rejected');
      setAllCampaigns(excludeDrafts || []);      
      setLoading(false);
    };
    fetchData();


    appNotifications.subscribe('advertiser:selected', () => {
      console.log("advertiser:selected");
      fetchData();
    });

    return () => {
      //appNotifications.unsubscribe('advertiser:selected');
    };
  }, []);

  useEffect(() => {
    if (allCampaigns.length === 0) return;
    const today = new Date();
    if (selectedCampaignId === 'all') {
      const earliest = allCampaigns
        .map(c => parseISO(c.startDate || ""))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      if (earliest) setDateRange({ from: earliest, to: today });
    } else {
      const c = allCampaigns.find(x => x.id === selectedCampaignId);
      if (c) {
        const from = parseISO(c.startDate || "");
        const end = parseISO(c.endDate || "");
        const to = !isNaN(end.getTime()) && end < today ? end : today;
        if (!isNaN(from.getTime())) setDateRange({ from, to });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, allCampaigns]);

  const campaigns = useMemo(() => {
    if (selectedCampaignId === 'all') return allCampaigns;
    return allCampaigns.filter((c) => c.id === selectedCampaignId);
  }, [allCampaigns, selectedCampaignId]);

  const selectedCampaign = useMemo(() => {
    if (selectedCampaignId === 'all') return null;
    return allCampaigns.find((c) => c.id === selectedCampaignId) || null;
  }, [allCampaigns, selectedCampaignId]);
  const selectedCampaignName = selectedCampaign?.name || null;

  useEffect(() => {
    if (selectedCampaignName && selectedCampaignName.length > 20) {
      // setExtraCrumbs([{ label: selectedCampaignName.slice(0, 20) + '...' }]);
    } else if (selectedCampaignName) {
      // setExtraCrumbs([{ label: selectedCampaignName }]);
    } else {
      // setExtraCrumbs([]);
    }
  }, [selectedCampaignName]);

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
    if(!campaignsReport) return { totalImpressions: 0, totalReach: 0, totalSpent: 0, avgLtr: 0, totalConversions: 0, budgetUtil: 0, cpa: 0, totalBudget: 0, impressionsGoal: 0, avgCpm: 0 };
    //const rand = seededRandom(campaigns.reduce((a, c) => a + c.id.split('').reduce((x, ch) => x + ch.charCodeAt(0), 0), 0));
    const totalImpressions =  campaignsReport.cardTotals.impressions; //  campaigns.reduce((a, c) => a + (c.actual_impressions || Math.round(c.budget * (30 + rand() * 20))), 0);
    const totalReach =  campaignsReport.cardTotals.demandAudioReachUniqueUsers;  //campaigns.reduce((a, c) => a + (c.reach || Math.round((c.actual_impressions || c.budget * 35) * 0.25)), 0);
    const totalSpent = campaignsReport.cardTotals.totalSpend;
    const totalBudget = campaignsReport.cardTotals.totalBudget ?? 0;
    const avgLtr = Math.round(campaignsReport.cardTotals.ltr ?? 0);
    const totalConversions = campaignsReport.cardTotals.objectiveCountableSum ?? 0;
    const budgetUtil = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    let campaignGoal = 0;

    try{

      let obj: Record<string, number> = {};
      console.log("campaignsReport", campaignsReport);
      campaignsReport?.data?.forEach((c) => {
        console.log("campaignId and campaignBudget", c.campaignId, c.campaignBudget);
        if(c.campaignBudget && c.campaignId){
          if(!obj[c.campaignId]){
            const cleanString = c.campaignBudget?.toString().replace(/[^0-9.]/g, '');
            const impressions = Number(cleanString);
            campaignGoal += impressions;
            obj[c.campaignId] = impressions;
          }
        }
      })
      
    }catch(err){

    }

    const impressionsGoal = campaignGoal;


    const cpa = ((totalBudget/impressionsGoal)*1000);

    const avgCpm = campaignsReport.cardTotals.demandECPM ?? 0;
    return { totalImpressions, totalReach, totalSpent, avgLtr, totalConversions, budgetUtil, cpa, totalBudget, impressionsGoal, avgCpm };
  }, [campaignsReport]);

  const pacing = useMemo(() => {
    const today = new Date('2026-02-17');
    let elapsedSum = 0;
    let projectedImpsSum = 0;
    let count = 0;
    campaigns.forEach((c) => {
      const start = new Date(c.startDate).getTime();
      const end = new Date(c.endDate).getTime();
      if (!isFinite(start) || !isFinite(end) || end <= start) return;
      const elapsed = Math.max(0, Math.min(1, (today.getTime() - start) / (end - start)));
      elapsedSum += elapsed;
      // Project total impressions for this campaign at end of flight
      const projImps = c.impressions && elapsed > 0.05
        ? c.impressions / elapsed
        : c.budget * 35; // fallback CPM-based forecast
      projectedImpsSum += projImps;
      count++;
    });
    const avgElapsed = count > 0 ? elapsedSum / count : 0;
    const expectedImps = projectedImpsSum * avgElapsed;
    const expectedSpend = kpis.totalBudget * avgElapsed;

    // Status classification
    let statusLabel = 'On track';
    let statusTone: StatusTone = 'green';

    const allDraft = campaigns.length > 0 && campaigns.every(c => c.status === 'draft');
    const allCompleted = campaigns.length > 0 && campaigns.every(c => c.status === 'completed' || new Date(c.endDate) < today);
    const notStarted = campaigns.length > 0 && campaigns.every(c => new Date(c.startDate) > today);

    if (allDraft) { statusLabel = 'Draft'; statusTone = 'muted'; }
    else if (notStarted) { statusLabel = 'Starting soon'; statusTone = 'blue'; }
    else if (allCompleted) { statusLabel = 'Completed'; statusTone = 'muted'; }
    else {
      const deliveryDelta = expectedImps > 0 ? ((kpis.totalImpressions - expectedImps) / expectedImps) * 100 : 0;
      const ltr = kpis.avgLtr;
      if (deliveryDelta < -25 || ltr < 50) { statusLabel = 'Underperforming'; statusTone = 'red'; }
      else if (deliveryDelta < -10) { statusLabel = 'Slightly behind schedule'; statusTone = 'amber'; }
      else if (ltr >= 75 && deliveryDelta >= -10) { statusLabel = 'Doing well'; statusTone = 'green'; }
      else { statusLabel = 'On track'; statusTone = 'green'; }
    }

    return {
      statusLabel,
      statusTone,
      delivery: { actual: kpis.totalImpressions, expected: Math.round(expectedImps) },
      spend: { actual: kpis.totalSpent, expected: Math.round(expectedSpend) },
    };
  }, [campaigns, kpis]);

  const rawDailyData = useMemo(() => {
    const apiRows = campaignsReport?.PerformanceTotals;
    if (apiRows && apiRows.length > 0) {
      return dailyRowsToChartPoints(apiRows);
    }

    const allDays = campaigns.flatMap(c => generateDailyData(c));
    const map = new Map<string, { date: string; impressions: number; reach: number; conversions: number; spent: number; ltr: number; _ltrSum: number; _ltrN: number }>();
    allDays.forEach(d => {
      const existing = map.get(d.date) || { date: d.date, impressions: 0, reach: 0, conversions: 0, spent: 0, ltr: 0, _ltrSum: 0, _ltrN: 0 };
      existing.impressions += d.impressions;
      existing.reach += d.reach;
      existing.conversions += d.conversions;
      existing.spent += d.spent;
      if (d.ltr != null) {
        existing._ltrSum += d.ltr;
        existing._ltrN += 1;
      }
      map.set(d.date, existing);
    });
    return Array.from(map.values())
      .map(r => ({ ...r, ltr: r._ltrN > 0 ? Math.round(r._ltrSum / r._ltrN) : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [campaigns, campaignsReport]);

  const dailyChartData = useMemo(() => {
    if (campaignsReport?.PerformanceTotals?.length) {
      return chartPointsToLabeledBuckets(
        dailyRowsToChartPoints(campaignsReport.PerformanceTotals),
        dateRange,
        granularity,
        true,
      );
    }
    return chartPointsToLabeledBuckets(rawDailyData, dateRange, granularity, false);
  }, [campaignsReport, rawDailyData, dateRange, granularity]);

  // Per-campaign stacked chart data (for "All Campaigns" view)
  const stackedChartData = useMemo(() => {
    const apiRows = campaignsReport?.PerformanceTotals;

    const perCampaign =
      apiRows?.length && campaigns.length > 1
        ? campaigns.map((c) => {
            const extId = Number(c.externalRefId);
            const rows = apiRows.filter((r) => Number(r.campaignId) === extId);
            const points = rows.map(campaignReportRowToChartPoint);
            return {
              campaign: c,
              buckets: chartPointsToLabeledBuckets(points, dateRange, granularity, true),
            };
          })
        : campaigns.map((c) => ({
            campaign: c,
            buckets: chartPointsToLabeledBuckets(
              generateDailyData(c).map((d) => ({
                date: d.date,
                impressions: d.impressions,
                reach: d.reach,
                conversions: d.conversions,
                spent: d.spent,
                ltr: d.ltr,
              })),
              dateRange,
              granularity,
              false,
            ),
          }));

    const labelOrder: string[] = [];
    const map = new Map<string, Record<string, unknown>>();
    perCampaign.forEach(({ campaign, buckets }) => {
      const seriesKey = campaign.id ?? String(campaign.externalRefId);
      buckets.forEach((b) => {
        if (!map.has(b.label)) {
          map.set(b.label, { label: b.label });
          labelOrder.push(b.label);
        }
        const row = map.get(b.label)!;
        row[seriesKey] = (Number(row[seriesKey]) || 0) + Number((b as Record<string, number>)[reportMetric] ?? 0);
      });
    });
    return labelOrder.map((l) => map.get(l));
  }, [campaigns, campaignsReport, dateRange, granularity, reportMetric]);

  const dailyGridData = useMemo(() => {
    const data = campaigns.flatMap(c => generateDailyData(c));
    return data.filter(d => {
      const dt = parseISO(d.date);
      return isWithinInterval(dt, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
    });
  }, [campaigns, dateRange]);

  const apiPerformanceGridData = useMemo(() => {
    if (!campaignPerformanceRows?.length) return null;
    return campaignPerformanceRows.map(mapCampaignPerformanceToGridRow);
  }, [campaignPerformanceRows]);

  const performanceGridData = useMemo(() => {
    if (apiPerformanceGridData) {
      return [...apiPerformanceGridData].sort((a, b) => b.date.localeCompare(a.date));
    }
    return aggregatePerformanceGridRows(dailyGridData, gridGranularity);
  }, [apiPerformanceGridData, dailyGridData, gridGranularity]);

  const seed = useMemo(() => campaigns.reduce((a, c) => a + c.id.split('').reduce((x, ch) => x + ch.charCodeAt(0), 0), 0), [campaigns]);
  const totalImpr = kpis.totalImpressions;

  const campaignImpressionShareSlices = useMemo(() => {
    if (impressionsShareByCampaigns?.length) {
      return impressionsShareByCampaigns.map((row, i) => ({
        name: row.campaignName,
        value: row.impressions ?? 0,
        color: COLORS[i % COLORS.length],
      }));
    }

    const rand = seededRandom(seed + 999);
    return campaigns.map((c, i) => ({
      name: c.campaignName || c.id || 'Campaign',
      value: c.impressions ?? Math.round((c.budget ?? 0) * (30 + rand() * 20)),
      color: COLORS[i % COLORS.length],
    }));
  }, [impressionsShareByCampaigns, campaigns, seed]);

  const campaignImpressionShareTotal = useMemo(
    () => campaignImpressionShareSlices.reduce((sum, slice) => sum + slice.value, 0),
    [campaignImpressionShareSlices],
  );

  // Bar chart data
  const topShows = useMemo(() => {
    if (impressionsByFiltered?.podcastTopicsResult?.length) {
      return mapPodcastTopicsToBarRows(impressionsByFiltered.podcastTopicsResult, {
        totalReach: kpis.totalReach,
        totalConversions: kpis.totalConversions,
        totalSpent: kpis.totalSpent,
      });
    }

    const impressions = generateDemographic(SHOW_NAMES, totalImpr, seed + 1);
    const reaches = generateDemographic(SHOW_NAMES, kpis.totalReach, seed + 10);
    const convs = generateDemographic(SHOW_NAMES, kpis.totalConversions, seed + 11);
    const spents = generateDemographic(SHOW_NAMES, Math.round(kpis.totalSpent), seed + 12);
    const ltrRand = seededRandom(seed + 41);
    return impressions.map((item, i) => ({
      name: item.name,
      impressions: item.value,
      reach: reaches[i].value,
      conversions: convs[i].value,
      spent: spents[i].value,
      ltr: 70 + Math.round(ltrRand() * 25),
    })).sort((a, b) => b.impressions - a.impressions);
  }, [impressionsByFiltered, totalImpr, kpis.totalReach, kpis.totalConversions, kpis.totalSpent, seed]);

  // Pie chart data
  const deviceTypes = useMemo(() => {
    if (impressionsByFiltered?.deviceTypeResult?.length) {
      return mapImpressionsFilteredToPieSlices<DeviceTypeFilterRow>(
        impressionsByFiltered.deviceTypeResult,
        (row) => row.deviceTypeLabel,
      );
    }
    return generateDemographic(DEVICE_TYPES, totalImpr, seed + 3);
  }, [impressionsByFiltered, totalImpr, seed]);

  const genders = useMemo(() => {
    if (impressionsByFiltered?.genderResult?.length) {
      return mapImpressionsFilteredToPieSlices<GenderFilterRow>(
        impressionsByFiltered.genderResult,
        (row) => row.genderLabel?.trim() || 'Unknown',
      );
    }
    return generateDemographic(GENDERS, totalImpr, seed + 4);
  }, [impressionsByFiltered, totalImpr, seed]);

  const ageGroups = useMemo(() => {
    if (impressionsByFiltered?.ageResult?.length) {
      return mapImpressionsFilteredToPieSlices<AgeFilterRow>(
        impressionsByFiltered.ageResult,
        (row) => row.age?.trim() || row.ageLabel?.trim() || 'Unknown',
      );
    }
    return generateDemographic(AGE_GROUPS, totalImpr, seed + 5);
  }, [impressionsByFiltered, totalImpr, seed]);
  const podcastGenres = useMemo(() => {
    if (contentInventoryReport?.genreData?.length) {
      return mapContentInventoryToPieSlices<GenreDataRow>(
        contentInventoryReport.genreData,
        (row) => row.genreName || row.genre,
      );
    }
    return generateDemographic(PODCAST_GENRES, totalImpr, seed + 6);
  }, [contentInventoryReport, totalImpr, seed]);

  const podcastAudiences = useMemo(() => {
    if (contentInventoryReport?.audienceInsights?.length) {
      return mapContentInventoryToPieSlices<AudienceInsightRow>(
        contentInventoryReport.audienceInsights,
        (row) => row.audienceName,
      );
    }
    return generateDemographic(PODCAST_AUDIENCES, totalImpr, seed + 7);
  }, [contentInventoryReport, totalImpr, seed]);

  const adPositions = useMemo(() => {
    if (adDeliveryReport?.adPositionData?.length) {
      return mapAdDeliveryToPieSlices<AdPositionRow>(
        adDeliveryReport.adPositionData,
        (row) => formatAdPositionLabel(row.adPosition),
      );
    }
    return generateDemographic(AD_POSITIONS, totalImpr, seed + 20);
  }, [adDeliveryReport, totalImpr, seed]);

  const contentLanguages = useMemo(() => {
    if (adDeliveryReport?.contentLanguageData?.length) {
      return mapAdDeliveryToPieSlices<ContentLanguageRow>(
        adDeliveryReport.contentLanguageData,
        (row) => formatLanguageLabel(row.language),
      );
    }
    return generateDemographic(CONTENT_LANGUAGES, totalImpr, seed + 21);
  }, [adDeliveryReport, totalImpr, seed]);

  const deviceOS = useMemo(() => {
    if (adDeliveryReport?.deviceOSData?.length) {
      return mapAdDeliveryToPieSlices<DeviceOSRow>(
        adDeliveryReport.deviceOSData,
        (row) => row.osLabel || formatLocationLabel(row.os ?? 'Other'),
      );
    }
    return generateDemographic(DEVICE_OS, totalImpr, seed + 22);
  }, [adDeliveryReport, totalImpr, seed]);
  const mediaTopics = useMemo(() => {
    if (contentInventoryReport?.mediaTopics?.length) {
      return mapContentInventoryToPieSlices<MediaTopicRow>(
        contentInventoryReport.mediaTopics,
        (row) => row.mediaName,
      );
    }
    return generateDemographic(MEDIA_TOPICS, totalImpr, seed + 23);
  }, [contentInventoryReport, totalImpr, seed]);

  // Location data
  const targetedCities = useMemo(() => {
    const collect = (camps: Campaign[]): { city: string; country: string }[] => {
      const out: { city: string; country: string }[] = [];
      const seen = new Set<string>();
      camps.forEach(c => {
        const tl = Array.isArray(c.target_locations) ? c.target_locations : [];
        tl.forEach((entry: any) => {
          const country = entry?.country || 'Unknown';
          const businesses = Array.isArray(entry?.businessLocations) ? entry.businessLocations : [];
          if (businesses.length === 0) {
            // No specific cities selected — expand to known cities for the country
            const countryCities = COUNTRY_TO_CITIES[country];
            if (countryCities) {
              countryCities.forEach(cityName => {
                const key = `${country}:${cityName}`;
                if (!seen.has(key)) { seen.add(key); out.push({ city: cityName, country }); }
              });
            } else {
              const key = `__country__:${country}`;
              if (!seen.has(key)) { seen.add(key); out.push({ city: country, country }); }
            }
          } else {
            businesses.forEach((b: any) => {
              const cityName = b?.name || b?.address || 'Location';
              const key = `${country}:${cityName}`;
              if (!seen.has(key)) { seen.add(key); out.push({ city: cityName, country }); }
            });
          }
        });
      });
      return out;
    };
    const fromCampaigns = collect(campaigns);
    if (fromCampaigns.length > 0) return fromCampaigns;
    return LOCATIONS.map(c => ({ city: c, country: CITY_TO_COUNTRY[c] || 'Other' }));
  }, [campaigns]);

  const cityRows = useMemo(() => {
    if (countryCityReport?.cityData?.length) {
      return countryCityReport.cityData
        .map(mapCityToChartRow)
        .sort((a, b) => b.impressions - a.impressions);
    }

    const names = targetedCities.map(t => t.city);
    const impr = generateDemographic(names, totalImpr, seed + 8);
    const reaches = generateDemographic(names, kpis.totalReach, seed + 13);
    const convs = generateDemographic(names, kpis.totalConversions, seed + 14);
    const spents = generateDemographic(names, Math.round(kpis.totalSpent), seed + 15);
    const ltrRand = seededRandom(seed + 42);
    return impr.map((item, i) => ({
      name: item.name,
      country: targetedCities[i].country,
      impressions: item.value,
      reach: reaches[i].value,
      conversions: convs[i].value,
      spent: spents[i].value,
      ltr: 70 + Math.round(ltrRand() * 25),
    })).sort((a, b) => b.impressions - a.impressions);
  }, [countryCityReport, targetedCities, totalImpr, kpis.totalReach, kpis.totalConversions, kpis.totalSpent, seed]);

  const countryRows = useMemo(() => {
    if (countryCityReport?.countryData?.length) {
      return countryCityReport.countryData
        .map(mapCountryToChartRow)
        .sort((a, b) => b.impressions - a.impressions);
    }

    const map = new Map<string, { name: string; impressions: number; reach: number; conversions: number; spent: number; _ltrSum: number; _ltrN: number; ltr: number }>();
    cityRows.forEach(r => {
      const country = r.country ?? 'Other';
      const existing = map.get(country);
      if (existing) {
        existing.impressions += r.impressions;
        existing.reach += r.reach;
        existing.conversions += r.conversions;
        existing.spent += r.spent;
        existing._ltrSum += r.ltr ?? 0;
        existing._ltrN += 1;
      } else {
        map.set(country, { name: country, impressions: r.impressions, reach: r.reach, conversions: r.conversions, spent: r.spent, _ltrSum: r.ltr ?? 0, _ltrN: 1, ltr: r.ltr ?? 0 });
      }
    });
    return Array.from(map.values())
      .map(r => ({ ...r, ltr: Math.round(r._ltrSum / r._ltrN) }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [countryCityReport, cityRows]);

  const gridColDefs = useMemo<ColDef[]>(() => [
    { field: 'date', headerName: gridGranularity === 'daily' ? 'Date' : gridGranularity === 'weekly' ? 'Week of' : 'Month', width: 130, sort: 'desc' },
    { field: 'campaignName', headerName: 'Campaign', flex: 2, minWidth: 150 },
    { field: 'campaignStatus', headerName: 'Status', width: 110, cellRenderer: StatusRenderer },
    { field: 'campaignGoal', headerName: 'Goal', width: 110 },
    { field: 'startDate', headerName: 'Start Date', width: 110 },
    { field: 'endDate', headerName: 'End Date', width: 110 },
    { field: 'dailyBudget', headerName: 'Daily Budget', width: 115, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toFixed(0)}` },
    { field: 'totalBudget', headerName: 'Total Budget', width: 115, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toLocaleString()}` },
    { field: 'spent', headerName: 'Spend', width: 100, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toFixed(0)}` },
    { headerName: 'Utilization', width: 140, cellRenderer: UtilizationRenderer },
    { field: 'impressions', headerName: 'Impressions', width: 120, type: 'numericColumn', valueFormatter: p => (p.value ?? 0).toLocaleString() },
    { field: 'reach', headerName: 'Reach', width: 100, type: 'numericColumn', valueFormatter: p => (p.value ?? 0).toLocaleString() },
    { field: 'ltr', headerName: 'LTR', width: 80, type: 'numericColumn', valueFormatter: p => `${p.value ?? 0}%` },
  ], [gridGranularity]);

  // Per-campaign aggregated rows
  const campaignOverviewRows = useMemo(() => {
    const rand = seededRandom(seed + 444);
    return campaigns.map(c => {
      const impressions = c.impressions;
      const spend = c.spend;
      const reach = c.reach;
      const goal = c.campaignBudget;
      const ecpm = impressions > 0 ? spend / (impressions / 1000) : 0;
      return {
        id: c.id,
        campaignName: c.campaignName,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        budget: c.totalBudget,
        spend,
        utilization: c.totalBudget > 0 ? Math.min(100, Math.round((spend / c.totalBudget) * 100)) : 0,
        campaignBudget: goal,
        impressions,
        reach,
        ltr: c.ltr ?? 75,
        ecpm,
      };
    });
  }, [campaigns, seed]);

  const overviewColDefs = useMemo<ColDef[]>(() => [
    { field: 'campaignName', headerName: 'Campaign', flex: 2, minWidth: 160 },
    {
      field: 'id',
      headerName: 'Campaign ID',
      width: 130,
    },
    { field: 'status', headerName: 'Status', width: 110, cellRenderer: StatusRenderer },
    { field: 'startDate', headerName: 'Start Date', width: 110 },
    { field: 'endDate', headerName: 'End Date', width: 110 },
    { field: 'totalBudget', headerName: 'Budget', width: 110, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toLocaleString()}` },
    { field: 'spend', headerName: 'Spend', width: 110, type: 'numericColumn', valueFormatter: p => `$${Math.round(p.value ?? 0).toLocaleString()}` },
    {
      headerName: 'Utilization', width: 140,
      cellRenderer: (p: ICellRendererParams) => (
        <div className="flex items-center gap-2">
          <Progress value={p.data.utilization} className="h-1.5 w-16" />
          <span className="text-xs text-muted-foreground">{p.data.utilization}%</span>
        </div>
      ),
    },
    { field: 'campaignBudget', headerName: 'Impressions Goal', width: 140, type: 'numericColumn', valueFormatter: p => (p.value ?? 0).toLocaleString() },
    { field: 'impressions', headerName: 'Impressions', width: 120, type: 'numericColumn' },
    { field: 'reach', headerName: 'Reach', width: 100, type: 'numericColumn' },
    { field: 'ltr', headerName: 'LTR', width: 80, type: 'numericColumn', valueFormatter: p => `${p.value ?? 0}%` },
    { field: 'ecpm', headerName: 'eCPM', width: 90, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toFixed(2)}` },
  ], []);

  // Per-campaign × month rows (within date range)
  const monthlyRows = useMemo(() => {
    const out: any[] = [];
    campaigns.forEach(c => {
      const days = generateDailyData(c).filter(d => {
        const dt = parseISO(d.date);
        return isWithinInterval(dt, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
      });
      const buckets = new Map<string, { date: string; impressions: number; reach: number; spent: number; ltrSum: number; n: number }>();
      days.forEach(d => {
        const key = format(parseISO(d.date), 'MMM yyyy');
        const ex = buckets.get(key) || { date: d.date, impressions: 0, reach: 0, spent: 0, ltrSum: 0, n: 0 };
        ex.impressions += d.impressions;
        ex.reach += d.reach;
        ex.spent += d.spent;
        ex.ltrSum += d.ltr;
        ex.n += 1;
        if (d.date < ex.date) ex.date = d.date;
        buckets.set(key, ex);
      });
      Array.from(buckets.entries())
        .sort((a, b) => a[1].date.localeCompare(b[1].date))
        .forEach(([month, b]) => {
          const ecpm = b.impressions > 0 ? b.spent / (b.impressions / 1000) : 0;
          out.push({
            id: `${c.id}-${month}`,
            month,
            name: c.name,
            status: c.status,
            startDate: c.start_date,
            endDate: c.end_date,
            budget: c.budget,
            spent: b.spent,
            utilization: c.budget > 0 ? Math.min(100, Math.round((b.spent / c.budget) * 100)) : 0,
            impressions: b.impressions,
            reach: b.reach,
            ltr: b.n > 0 ? Math.round(b.ltrSum / b.n) : 0,
            ecpm,
          });
        });
    });
    return out;
  }, [campaigns, dateRange]);

  const monthlyColDefs = useMemo<ColDef[]>(() => [
    { field: 'month', headerName: 'Month', width: 110 },
    { field: 'name', headerName: 'Campaign', flex: 2, minWidth: 160 },
    { field: 'status', headerName: 'Status', width: 110, cellRenderer: StatusRenderer },
    { field: 'startDate', headerName: 'Start Date', width: 110 },
    { field: 'endDate', headerName: 'End Date', width: 110 },
    { field: 'budget', headerName: 'Budget', width: 110, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toLocaleString()}` },
    { field: 'spent', headerName: 'Spend', width: 110, type: 'numericColumn', valueFormatter: p => `$${Math.round(p.value ?? 0).toLocaleString()}` },
    {
      headerName: 'Utilization', width: 140,
      cellRenderer: (p: ICellRendererParams) => (
        <div className="flex items-center gap-2">
          <Progress value={p.data.utilization} className="h-1.5 w-16" />
          <span className="text-xs text-muted-foreground">{p.data.utilization}%</span>
        </div>
      ),
    },
    { field: 'impressions', headerName: 'Impressions', width: 120, type: 'numericColumn', valueFormatter: p => (p.value ?? 0).toLocaleString() },
    { field: 'reach', headerName: 'Reach', width: 100, type: 'numericColumn', valueFormatter: p => (p.value ?? 0).toLocaleString() },
    { field: 'ltr', headerName: 'LTR', width: 80, type: 'numericColumn', valueFormatter: p => `${p.value ?? 0}%` },
    { field: 'ecpm', headerName: 'eCPM', width: 90, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toFixed(2)}` },
  ], []);


  const tooltipStyle = { borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 };

  // Period-over-period comparison for the Campaign Report header
  const periodComparison = useMemo(() => {
    const span = differenceInCalendarDays(dateRange.to, dateRange.from) + 1;
    const periodLabel =
      span <= 1 ? 'vs previous day'
      : span <= 90 ? `vs previous ${span} days`
      : 'vs previous period';

    const buildDelta = (current: number, offset: number) => {
      const r = seededRandom(seed + span * 13 + offset)();
      const pct = -25 + r * 60; // -25%..+35%
      const previous = Math.round(current / (1 + pct / 100));
      const delta = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      return { current, previous, delta };
    };
    return {
      periodLabel,
      impressions: buildDelta(kpis.totalImpressions, 101),
      reach: buildDelta(kpis.totalReach, 211),
      spent: buildDelta(kpis.totalSpent, 307),
      conversions: buildDelta(kpis.totalConversions, 419),
    };
  }, [dateRange, kpis, seed]);


  const handleExport = () => {
    const headers = ['Date', 'Campaign', 'Status', 'Goal', 'Start Date', 'End Date', 'Daily Budget', 'Total Budget', 'Spend', 'Impressions', 'Reach', 'LTR'];
    const rows = performanceGridData.map(d => [
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

  const renderPieChart = (title: string, data: PieChartSlice[]) => {
    const totalImpressions = data.reduce((a, d) => a + d.value, 0);
    const ltrRand = seededRandom(seed + title.length * 7 + 31);
    const rows = data.map((d, i) => {
      const share = totalImpressions > 0 ? d.value / totalImpressions : 0;
      return {
        name: d.name,
        impressions: d.value,
        reach: d.reach ?? Math.round(kpis.totalReach * share),
        spend: d.spent ?? kpis.totalSpent * share,
        ltr: d.ltr ?? 80 + Math.round(ltrRand() * 20),
        color: COLORS[i % COLORS.length],
      };
    });

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full lg:w-[220px] shrink-0">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" labelLine={false}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => (v as number).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-1.5 pr-2">Name</th>
                    <th className="text-right font-medium py-1.5 px-2">Impressions</th>
                    <th className="text-right font-medium py-1.5 px-2">Reach</th>
                    <th className="text-right font-medium py-1.5 px-2">Spend</th>
                    <th className="text-right font-medium py-1.5 pl-2">LTR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name} className="border-b border-border/50 last:border-0">
                      <td className="py-1.5 pr-2">
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                          <span className="text-foreground">{r.name}</span>
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.impressions.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-foreground">{r.reach.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-foreground">${r.spend.toFixed(2)}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums text-foreground">{r.ltr}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      <Helmet>
        <title>EARO | Reports</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground">
              {selectedCampaignName || 'Campaign Reports'}
            </h1>
            {selectedCampaign && (
              <Badge variant="secondary" className={statusColors[selectedCampaign.status] || ''}>
                {formatStatus(selectedCampaign.status)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {selectedCampaignName ? 'Campaign performance details' : 'Performance analytics across all campaigns'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker value={dateRange} onChange={setDateRange} isMobile={isMobile} tzLabel={tzLabel} />
          <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
            <SelectTrigger className="w-52 h-9 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {allCampaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.campaignName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <>
          {/* KPI Summary */}
          {(() => {
            const reachSeries = rawDailyData.map(d => d.reach);
            const cpaSeries = rawDailyData.map(d => (d.conversions > 0 ? d.spent / d.conversions : 0));
            const cpmSeries = rawDailyData.map(d => (d.impressions > 0 ? d.spent / (d.impressions / 1000) : 0));
            // Trend: compare first half avg to second half avg
            const half = Math.floor(reachSeries.length / 2);
            const firstAvg = half > 0 ? reachSeries.slice(0, half).reduce((a, b) => a + b, 0) / half : 0;
            const secondAvg = half > 0 ? reachSeries.slice(half).reduce((a, b) => a + b, 0) / (reachSeries.length - half) : 0;
            const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
            const reachTrend: 'up' | 'down' | 'flat' = trendPct > 5 ? 'up' : trendPct < -5 ? 'down' : 'flat';
            const ltrStatus: 'good' | 'average' | 'low' = kpis.avgLtr >= 75 ? 'good' : kpis.avgLtr >= 60 ? 'average' : 'low';
            const prevCpa = periodComparison.conversions.previous > 0
              ? periodComparison.spent.previous / periodComparison.conversions.previous
              : kpis.cpa;
            const cpaDeltaPct = prevCpa > 0 ? ((kpis.cpa - prevCpa) / prevCpa) * 100 : 0;
            const prevCpm = periodComparison.impressions.previous > 0
              ? periodComparison.spent.previous / (periodComparison.impressions.previous / 1000)
              : kpis.avgCpm;
            const cpmDeltaPct = prevCpm > 0 ? ((kpis.avgCpm - prevCpm) / prevCpm) * 100 : 0;
            const isAll = selectedCampaignId === 'all';
            return (
              <CampaignKpiSummary
                status={{ label: pacing.statusLabel, tone: pacing.statusTone }}
                asOfDate={new Date()}
                impressions={{ actual: kpis.totalImpressions, goal: kpis.impressionsGoal }}
                budget={{ spent: kpis.totalSpent, total: kpis.totalBudget }}
                reach={{ value: kpis.totalReach, impressions: kpis.totalImpressions, trend: reachTrend, series: reachSeries }}
                ltr={{ value: kpis.avgLtr, industryAvg: 90, status: ltrStatus }}
                cpa={{ value: kpis.cpa, deltaPct: cpaDeltaPct, series: cpaSeries }}
                cpm={isAll ? { value: kpis.avgCpm, deltaPct: cpmDeltaPct, series: cpmSeries } : undefined}
              />
            );
          })()}

          {/* ─── Bar Chart 1: Campaign Report ─── */}
          <Card>
            <CardHeader className="pb-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base">{selectedCampaignId === 'all' ? 'All campaign reports' : 'Campaign Report'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {groupingConfig.options.length > 0 && (
                    <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
                      <SelectTrigger className="w-52 h-9 focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {groupingConfig.options.map(g => (
                          <SelectItem key={g} value={g}>
                            {g === 'daily' ? 'Daily' : g === 'weekly' ? 'Weekly' : 'Monthly'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <MetricDropdown value={reportMetric} onChange={setReportMetric} extraKeys={selectedCampaignId === 'all' ? undefined : ['ltr']} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={selectedCampaignId === 'all' && campaigns.length > 1 ? stackedChartData : dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    content={
                      selectedCampaignId === 'all' && campaigns.length > 1
                        ? <StackedCampaignTooltip metric={reportMetric} />
                        : <AllMetricsTooltip selectedMetric={reportMetric} />
                    }
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  />
                  {selectedCampaignId === 'all' && campaigns.length > 1 ? (
                    campaigns.map((c, i) => (
                      <Bar
                        key={c.id ?? String(c.externalRefId)}
                        dataKey={c.id ?? String(c.externalRefId)}
                        name={c.campaignName ?? `Campaign ${c.externalRefId}`}
                        stackId="metric"
                        fill={COLORS[i % COLORS.length]}
                        radius={i === campaigns.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))
                  ) : (
                    <Bar
                      dataKey={reportMetric}
                      name={METRIC_LABELS[reportMetric]}
                      fill={METRIC_COLORS[reportMetric]}
                      radius={[2, 2, 0, 0]}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ─── Per-Campaign Charts (All Campaigns view) ─── */}
          {selectedCampaignId === 'all'  && (
            <div className="grid grid-cols-1 gap-4">
              {/* LTR per campaign */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">LTR% by campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(240, campaigns.length * 36)}>
                    <ComposedChart
                      data={[...campaigns]
                        .map(c => ({ name: c.campaignName, ltr: c.ltr ? parseInt(c.ltr+"") : 0 }))
                        .sort((a, b) => b.ltr - a.ltr)}
                      layout="vertical"
                      margin={{ left: 10, right: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${v}%`} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={130} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="ltr" name="LTR" fill="hsl(210, 70%, 55%)" radius={[0, 2, 2, 0]} label={{ position: 'right', fontSize: 10, formatter: (v: number) => `${v}%` }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Impression share per campaign */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Impressions share by campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  {campaignImpressionShareSlices.length === 0 || campaignImpressionShareTotal === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No impression share data for this period.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={campaignImpressionShareSlices}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={95}
                            paddingAngle={2}
                            dataKey="value"
                            label={(e: { value: number }) => `${((e.value / campaignImpressionShareTotal) * 100).toFixed(1)}%`}
                            labelLine={false}
                          >
                            {campaignImpressionShareSlices.map((s, i) => <Cell key={i} fill={s.color} />)}
                          </Pie>
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v: number) => `${v.toLocaleString()} (${((v / campaignImpressionShareTotal) * 100).toFixed(1)}%)`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="w-full space-y-1.5 text-xs">
                        {campaignImpressionShareSlices.map((s) => (
                          <div key={s.name} className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 min-w-0">
                              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="text-foreground truncate">{s.name}</span>
                            </span>
                            <span className="tabular-nums text-muted-foreground shrink-0">
                              {((s.value / campaignImpressionShareTotal) * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedCampaignId !== 'all' && (
            <>
              {/* ─── Bar Chart 2: Country ─── */}
              <HorizontalBarChartCard
                title="Country"
                data={countryRows}
                selectedMetric={countryMetric}
                onMetricChange={setCountryMetric}
                extraKeys={['ltr']}
              />

              {/* ─── Bar Chart 3: City ─── */}
              <HorizontalBarChartCard
                title="City"
                data={cityRows}
                selectedMetric={cityMetric}
                onMetricChange={setCityMetric}
                extraKeys={['ltr']}
              />

              {/* ─── Bar Chart 4: Podcast Show Name ─── */}
              <HorizontalBarChartCard
                title="Podcast Show Name"
                data={topShows}
                selectedMetric={showMetric}
                onMetricChange={setShowMetric}
                extraKeys={['ltr']}
              />

              {/* ─── Pie Charts: Content & Inventory ─── */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Content & Inventory</h2>
                <div className="grid grid-cols-1 gap-4">
                  {renderPieChart('Podcast Genre', podcastGenres)}
                  {renderPieChart('Contextual Media Topics', mediaTopics)}
                  {renderPieChart('Contextual Audience Insights', podcastAudiences)}
                </div>
              </div>

              {/* ─── Pie Charts: Ad Delivery ─── */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Ad Delivery</h2>
                <div className="grid grid-cols-1 gap-4">
                  {renderPieChart('Ad Position', adPositions)}
                  {renderPieChart('Content Language', contentLanguages)}
                  {renderPieChart('Device OS', deviceOS)}
                  {renderPieChart('Device Type', deviceTypes)}
                </div>
              </div>

              {/* ─── Pie Charts: Demographics ─── */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Demographics</h2>
                <div className="grid grid-cols-1 gap-4">
                  {renderPieChart('Age', ageGroups)}
                  {renderPieChart('Gender', genders)}
                </div>
              </div>
            </>
          )}
          {/* Campaign Overview Grid (All Campaigns view only) */}
          {selectedCampaignId === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle>All campaigns overview</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <MobileDataCards
                    data={campaignOverviewRows}
                    emptyMessage="No campaigns"
                    renderCard={(row) => (
                      <div key={row.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm truncate">{row.campaignName}</p>
                          <Badge variant="secondary" className={statusColors[row.status] || ''}>
                            {formatStatus(row.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{row.startDate} → {row.endDate}</p>
                        <div className="space-y-1.5">
                          <MobileStatRow label="Budget" value={`$${row.totalBudget.toLocaleString()}`} />
                          <MobileStatRow label="Spend" value={`$${Math.round(row.spend).toLocaleString()}`} />
                          <MobileStatRow label="Impressions" value={row.impressions.toLocaleString()} />
                          <MobileStatRow label="Reach" value={row.reach.toLocaleString()} />
                          <MobileStatRow label="LTR" value={`${row.ltr}%`} />
                          <MobileStatRow label="eCPM" value={`$${row.ecpm.toFixed(2)}`} />
                        </div>
                      </div>
                    )}
                  />
                ) : (
                  <AgGridReact
                    theme={appGridTheme}
                    modules={[AllCommunityModule]}
                    rowData={campaignOverviewRows}
                    columnDefs={overviewColDefs}
                    domLayout="autoHeight"
                    suppressCellFocus
                    animateRows
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance Grid */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{selectedCampaignId === 'all' ? 'All campaigns performance' : 'Campaign Performance'}</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={gridGranularity} onValueChange={(v) => setGridGranularity(v as Granularity)}>
                  <SelectTrigger className="w-32 h-9 focus:ring-0 focus:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <MobileDataCards
                  data={performanceGridData.slice(0, 30)}
                  emptyMessage="No performance data"
                  renderCard={(row) => (
                    <div key={`${row.date}-${row.campaignName}`} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground text-sm">{row.date}</p>
                        <Badge variant="secondary" className={statusColors[row.campaignStatus] || ''}>
                          {formatStatus(row.campaignStatus)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{row.campaignName || row.campaignDB}</p>
                      <div className="space-y-1.5">
                        <MobileStatRow label="Impressions" value={row.impressions.toLocaleString()} />
                        <MobileStatRow label="Spend" value={`$${row.spent.toFixed(0)}`} />
                        <MobileStatRow label="Reach" value={row.reach.toLocaleString()} />
                        <MobileStatRow label="LTR" value={`${row.ltr}%`} />
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div style={{ height: 350 }}>
                  <AgGridReact
                    theme={appGridTheme}
                    modules={[AllCommunityModule]}
                    rowData={performanceGridData}
                    columnDefs={gridColDefs}
                    suppressCellFocus
                    animateRows
                    pagination
                    paginationPageSize={30}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}