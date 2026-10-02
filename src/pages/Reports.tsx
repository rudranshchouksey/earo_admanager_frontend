import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { supabase } from '@/integrations/supabase/client';
import { type StatusTone } from '@/components/dashboard/reports/CampaignStatusSummary';
import CampaignKpiSummary from '@/components/dashboard/reports/CampaignKpiSummary';
// import { usePageBreadcrumb } from '@/contexts/PageBreadcrumbContext';
import { Eye, Users, Target, DollarSign, TrendingUp, BarChart3, Percent, Download, CalendarIcon, ChevronDown, Clock, Loader2 } from 'lucide-react';
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
  ShowNameReportData,
  ShowNameRow,
  reportsApi,
} from '@/services/reports';
import { appNotifications } from '@/services/appNotifications';
import { Helmet } from 'react-helmet-async';
import { toast } from '@/hooks/use-toast';
import { logger } from "@/lib/logger";




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
  spent: number;
  campaignName: string;
  campaignStatus: string;
  campaignGoal: string;
  startDate: string;
  endDate: string;
  dailyBudget: number;
  totalBudget: number;
  ltr: number;
  totalSpend?: number;
  dailyCap?: number;
}

interface DemographicSlice { name: string; value: number; }

interface PieChartSlice extends DemographicSlice {
  reach?: number;
  spent?: number;
  ltr?: number;
}

type MetricMode = 'bar' | 'line' | 'off';
type MetricKey = 'impressions' | 'reach' | 'spent' | 'ltr';

const METRIC_LABELS: Record<MetricKey, string> = {
  impressions: 'Impressions',
  reach: 'Reach',
  spent: 'Spend ($)',
  ltr: 'LTR (%)',
};

const METRIC_KEYS: MetricKey[] = ['impressions', 'reach', 'spent'];
const METRIC_DROPDOWN_KEYS: MetricKey[] = ['impressions', 'reach', 'spent'];

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
  running: 'bg-green-100 text-green-800',
  ready: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-green-100 text-green-800',
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

const GOALS = ['awareness', 'engagement', 'reach'];
const SHOW_NAMES = [];
const DEVICE_TYPES = [];
const GENDERS = [];
const AGE_GROUPS = [];
const PODCAST_GENRES = [];
const PODCAST_AUDIENCES = [];
const LOCATIONS = [];
const DAYS_OF_WEEK = [];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const CITY_TO_COUNTRY: Record<string, string> = {};
const COUNTRY_TO_CITIES: Record<string, string[]> = {};

// New constants for additional pie charts
const AD_POSITIONS = [];

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
const CONTENT_LANGUAGES = [];
const DEVICE_OS = [];
const MEDIA_TOPICS = [];

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

  const totalImpressions = campaign.impressions || Math.round(campaign.budget * (30 + rand() * 20));
  const totalSpend = campaign.spend || Math.round(campaign.budget * (0.4 + rand() * 0.3) * 100) / 100;
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
      spent: Math.round((totalSpend / numDays) * weight * 100) / 100,
      campaignName: campaign.campaignName,
      campaignStatus: campaign.status,
      campaignGoal: goal,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      dailyBudget: Math.round(dailyBudget * 100) / 100,
      totalBudget: campaign.budget,
      totalSpend: campaign.spend ?? 0,
      ltr: campaign.ltr ?? Math.round(70 + rand() * 20),
      dailyCap: campaign.dailyCap ?? 0,
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
  <Badge variant="secondary" className={statusColors[params.value?.toLowerCase()] || ''}>{formatStatus(params.value)}</Badge>
);

const DailyBudgetRenderer = (params: ICellRendererParams) => {
  const row = params.data as DailyData;
  if(row.dailyCap)
      return <span className="text-xs text-muted-foreground">${(row.dailyCap ?? 0).toFixed(2)}</span>;

  const startDate = new Date(row.startDate);
  const endDate = new Date(row.endDate);
  const noOfDays = endDate.getTime() - startDate.getTime();
  return <span className="text-xs text-muted-foreground">${(row.totalBudget / (noOfDays / (1000 * 60 * 60 * 24))).toFixed(2)}</span>;
}

const UtilizationRenderer = (params: ICellRendererParams) => {
  const row = params.data as DailyData;
  const util = row.totalBudget > 0 ? Math.min(100, Math.round((row.totalSpend / row.dailyBudget) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <Progress value={util} className="h-1.5 w-16" />
      <span className="text-xs text-muted-foreground">{util}%</span>
    </div>
  );
};

// Aggregation helper with explicit granularity
function aggregateWithGranularity(
  data: { date: string; impressions: number; reach: number; spent: number; ltr?: number }[],
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

  const map = new Map<string, { label: string; impressions: number; reach: number; spent: number; ltr: number; _ltrSum: number; _ltrN: number; _sortKey: string }>();
  filtered.forEach(d => {
    const key = bucketKey(d.date);
    const existing = map.get(key) || { label: key, impressions: 0, reach: 0, spent: 0, ltr: 0, _ltrSum: 0, _ltrN: 0, _sortKey: d.date };
    existing.impressions += d.impressions;
    existing.reach += d.reach;
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
  spent: number;
  ltr: number;
};

/** Normalize date from getCampaignReports rows (shape varies by dateRange: DAY vs WEEK/MONTH). */
function getCampaignReportRowDate(row: CampaignReportDailyRow): string {
  const time = row.__time;
  if (time && typeof time === 'object') {
    const start = time.start ?? time.end;
    if (typeof start === 'string' && start.length >= 10) return start.substring(0, 10);
  }
  if (typeof time === 'string' && time.length >= 10) return time.substring(0, 10);
  if (typeof row.start === 'string' && row.start.length >= 10) return row.start.substring(0, 10);
  if (typeof row.date === 'string' && row.date.length >= 10) return row.date.substring(0, 10);
  if (typeof row.end === 'string' && row.end.length >= 10) return row.end.substring(0, 10);
  return '';
}

function campaignReportRowToChartPoint(row: CampaignReportDailyRow): ChartDailyPoint {
  return {
    date: getCampaignReportRowDate(row),
    impressions: row.impressions ?? 0,
    reach: row.demandAudioReachUniqueUsers ?? 0,
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

function isCampaignReportTreeNode(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.key === 'string' && row.total != null && typeof row.total === 'object';
}

function isFlatCampaignReportRow(value: unknown): value is CampaignReportDailyRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return row.impressions != null && !('key' in row && 'total' in row);
}

/** Flatten nested getCampaignReports tree: __time buckets → optional campaignName breakdown. */
function flattenCampaignReportTree(nodes: unknown[]): CampaignReportDailyRow[] {
  const rows: CampaignReportDailyRow[] = [];

  for (const node of nodes) {
    if (!isCampaignReportTreeNode(node)) continue;

    const timeTotal = node.total as CampaignReportDailyRow;
    const children = Array.isArray(node.data) ? node.data : [];
    let hasCampaignBreakdown = false;

    for (const child of children) {
      if (!isCampaignReportTreeNode(child)) continue;
      if (child.key !== 'campaignName') continue;

      hasCampaignBreakdown = true;
      rows.push({
        ...(child.total as CampaignReportDailyRow),
        __time: timeTotal.__time ?? (child.total as CampaignReportDailyRow).__time,
      });
    }

    if (!hasCampaignBreakdown) {
      rows.push(timeTotal);
    }
  }

  return rows.sort((a, b) => getCampaignReportRowDate(a).localeCompare(getCampaignReportRowDate(b)));
}

function normalizeCampaignReportDailyRows(data: unknown[]): CampaignReportDailyRow[] {
  if (data.length === 0) return [];
  if (isCampaignReportTreeNode(data[0])) {
    return flattenCampaignReportTree(data);
  }
  return data.filter(isFlatCampaignReportRow);
}

function parseCampaignReportsPayload(payload: unknown): CampaignReport | null {
  if (!payload || typeof payload !== 'object') return null;

  if (Array.isArray(payload)) {
    if (payload.length === 0) return null;
    const dailyRows = normalizeCampaignReportDailyRows(payload);
    if (dailyRows.length === 0) return null;
    return {
      cardTotals: aggregateCardTotalsFromDailyRows(dailyRows),
      PerformanceTotals: dailyRows,
      data: dailyRows,
    };
  }

  const record = payload as Record<string, unknown>;

  // Nested wrapper: { data: { cardTotals, data: [...] } }
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    const nested = parseCampaignReportsPayload(record.data);
    if (nested) return nested;
  }

  const rawData = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.PerformanceTotals)
      ? record.PerformanceTotals
      : null;

  if (!rawData || rawData.length === 0) {
    const cardTotals = record.cardTotals as CampaignReportCardTotals | undefined;
    if (cardTotals) {
      return { cardTotals, PerformanceTotals: [], data: [] };
    }
    return null;
  }

  const dailyRows = normalizeCampaignReportDailyRows(rawData);
  if (dailyRows.length === 0) {
    const cardTotals = record.cardTotals as CampaignReportCardTotals | undefined;
    if (cardTotals) {
      return { cardTotals, PerformanceTotals: [], data: [] };
    }
    return null;
  }

  const cardTotals =
    (record.cardTotals as CampaignReportCardTotals | undefined) ??
    aggregateCardTotalsFromDailyRows(dailyRows);

  return { cardTotals, PerformanceTotals: dailyRows, data: dailyRows };
}

type LocationChartRow = {
  name: string;
  country?: string;
  impressions: number;
  reach: number;
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

// Campaigns not yet synced to AdsWizz have no externalRefId (Number(null) is 0), so skip them.
function resolveReportCampaignIds(campaigns: Campaign[]): number[] {
  return campaigns.map((c) => Number(c.externalRefId)).filter((id) => Number.isFinite(id) && id > 0);
}

// Default report window: a single campaign's flight (capped at today), or earliest start → today for several.
function defaultDateRange(campaigns: Campaign[], single: boolean): { from: Date; to: Date } | null {
  const today = new Date();
  if (single) {
    const from = parseISO(campaigns[0]?.startDate || "");
    const end = parseISO(campaigns[0]?.endDate || "");
    const to = !isNaN(end.getTime()) && end < today ? end : today;
    return isNaN(from.getTime()) ? null : { from, to };
  }
  const earliest = campaigns
    .map(c => parseISO(c.startDate || ""))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  return earliest ? { from: earliest, to: today } : null;
}

// `?campaign=` holds a comma-separated list of campaign IDs; empty means all campaigns.
function parseCampaignParam(value: string | null): string[] {
  return (value ?? '').split(',').map((id) => id.trim()).filter(Boolean);
}

function mapCountryToChartRow(row: CountryReportRow): LocationChartRow {
  return {
    name: row.countryName,
    impressions: row.impressions ?? 0,
    reach: row.reach ?? 0,
    spent: row["spent"] ?? row["totalSpend"] ?? 0,
    ltr: row.ltr ? Number(row.ltr) : 0,
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
      ltr: row["ltr"] ? Number(row["ltr"]) : 0,
      reach: row["demandAudioReachUniqueUsers"] ?? row["uniqueUsers"] ?? 0,
      spent: row["spent"] ?? row["totalSpend"] ?? 0,
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
    spent: 0,
    campaignName: row.campaignName ?? '',
    campaignStatus: (row.status ?? '').toLowerCase(),
    campaignGoal: row.campaignDB ?? '',
    startDate: flightStart,
    endDate: flightEnd,
    dailyBudget: parseReportBudget(row.dailyCap),
    totalBudget: parseReportBudget(row.totalBudget),
    totalSpend: row.totalSpend ?? 0,
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

function mapAdDeliveryToPieSlices<T extends AdDeliveryMetricRow>(
  rows: T[],
  getName: (row: T) => string,
): PieChartSlice[] {
  return rows
    .map((row) => ({
      name: getName(row),
      value: row.impressions ?? 0,
      reach: row.uniqueUsers ?? 0,
      spent: row["spent"] ?? row["totalSpend"] ?? 0,
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
      spent: row["spent"] ?? row["totalSpend"] ?? 0,
      ltr: row.ltr ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function mapCityToChartRow(row: CityReportRow): LocationChartRow {
  return {
    name: formatLocationLabel(row.city),
    impressions: row.impressions ?? 0,
    reach: row.uniqueUsers ?? 0,
    ltr: row.ltr ? Number(row.ltr) : 0,
    spent: row["spent"] ?? row["totalSpend"] ?? 0,
  };
}

function normalizeShowNameRows(data: ShowNameReportData | null | undefined): ShowNameRow[] {
  return data?.showData ?? [];
}

function mapShowNameToChartRow(row: ShowNameRow): LocationChartRow {
  return {
    name: row.showName?.trim() || 'Unknown',
    impressions: row.impressions ?? 0,
    reach: row.uniqueUsers ?? 0,
    spent: row["spent"] ?? row["totalSpend"] ?? 0,
    ltr: row.ltr ? Number(row.ltr) : 0,
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
      spent: 0,
      ltr: 0,
      _ltrSum: 0,
      _ltrN: 0,
    };
    existing.impressions += point.impressions;
    existing.reach += point.reach;
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
  keys,
}: {
  value: MetricKey;
  onChange: (v: MetricKey) => void;
  extraKeys?: MetricKey[];
  keys?: MetricKey[];
}) {
  const baseKeys = keys ?? METRIC_DROPDOWN_KEYS;
  const allKeys = extraKeys && extraKeys.length ? [...baseKeys, ...extraKeys] : baseKeys;
  return (
    <Select value={value} onValueChange={(v) => onChange(v as MetricKey)}>
      <SelectTrigger className="w-52 h-9 focus:ring-0 focus:ring-offset-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allKeys.map((k) => (
          <SelectItem key={k} value={k}>
            {METRIC_LABELS[k]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Shared tooltip that shows ALL metrics for a data point ───
function AllMetricsTooltip({ active, payload, label, selectedMetric, metricKeys }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload as Record<string, any>;
  const defaultKeys: MetricKey[] = [...METRIC_KEYS, ...(row.ltr != null ? ['ltr' as MetricKey] : [])];
  const baseKeys: MetricKey[] = metricKeys ?? defaultKeys;
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

type ReportLoadingKey =
  | 'campaignReport'
  | 'countryCity'
  | 'contentInventory'
  | 'adDelivery'
  | 'showName'
  | 'impressionsFiltered'
  | 'impressionsShare'
  | 'campaignPerformance';

type ReportLoadingState = Record<ReportLoadingKey, boolean>;

const ALL_REPORT_LOADING: ReportLoadingState = {
  campaignReport: true,
  countryCity: true,
  contentInventory: true,
  adDelivery: true,
  showName: true,
  impressionsFiltered: true,
  impressionsShare: true,
  campaignPerformance: true,
};

const NO_REPORT_LOADING: ReportLoadingState = {
  campaignReport: false,
  countryCity: false,
  contentInventory: false,
  adDelivery: false,
  showName: false,
  impressionsFiltered: false,
  impressionsShare: false,
  campaignPerformance: false,
};

function ChartLoadingShell({
  loading,
  children,
  minHeight = 280,
  className,
}: {
  loading: boolean;
  children: ReactNode;
  minHeight?: number;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)} style={{ minHeight }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-[1px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          <span className="sr-only">Loading chart</span>
        </div>
      )}
      <div className={cn(loading && 'pointer-events-none opacity-30')}>{children}</div>
    </div>
  );
}

// ─── Horizontal bar chart card (reusable) ───
function HorizontalBarChartCard({ title, data, selectedMetric, onMetricChange, extraKeys, metricKeys, loading = false }: {
  title: string;
  data: any[];
  selectedMetric: MetricKey;
  onMetricChange: (v: MetricKey) => void;
  extraKeys?: MetricKey[];
  metricKeys?: MetricKey[];
  loading?: boolean;
}) {
  const baseMetricKeys = metricKeys ?? METRIC_KEYS;
  const tooltipMetricKeys: MetricKey[] = [
    ...baseMetricKeys,
    ...((extraKeys ?? []).filter((k) => !baseMetricKeys.includes(k))),
  ];
  const chartHeight = Math.max(280, data.length * 28);
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">{title}</CardTitle>
          <MetricDropdown
            value={selectedMetric}
            onChange={onMetricChange}
            keys={baseMetricKeys}
            extraKeys={extraKeys}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ChartLoadingShell loading={loading} minHeight={chartHeight}>
        {data.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No data for this period.</p>
        ) : data.length === 1 ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-foreground">{data[0].name}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...baseMetricKeys, ...((extraKeys ?? []).filter(k => (data[0] as any)[k] != null))].map((key) => {
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
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart data={data} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} className="fill-muted-foreground" width={130} />
              <Tooltip content={<AllMetricsTooltip selectedMetric={selectedMetric} metricKeys={tooltipMetricKeys} />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              <Bar
                dataKey={selectedMetric}
                name={METRIC_LABELS[selectedMetric]}
                fill={METRIC_COLORS[selectedMetric]}
                radius={[0, 2, 2, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        </ChartLoadingShell>
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
  const [loading, setLoading] = useState(true);

  // The URL is the source of truth for the selection, so Back/Forward and the sidebar link stay in sync.
  const campaignParam = searchParams.get('campaign');
  const selectedCampaignIds = useMemo(() => parseCampaignParam(campaignParam), [campaignParam]);
  // Selected campaigns that exist in the loaded list; empty means nothing (valid) is selected.
  const pickedCampaigns = useMemo(() => {
    const ids = new Set(selectedCampaignIds);
    return allCampaigns.filter((c) => ids.has(c.id));
  }, [allCampaigns, selectedCampaignIds]);
  const isSubset = pickedCampaigns.length > 0;
  const campaigns = isSubset ? pickedCampaigns : allCampaigns;
  const activeCampaignIds = useMemo(() => pickedCampaigns.map((c) => c.id), [pickedCampaigns]);
  // One campaign gets the detailed single-campaign layout; several (or all) get the comparison layout.
  const isSingle = pickedCampaigns.length === 1;
  const isMobile = useIsMobile();
  // const { setExtraCrumbs } = usePageBreadcrumb();
  const [campaignsReport, setCampaignsReport] = useState<CampaignReport>();
  const [countryCityReport, setCountryCityReport] = useState<CountryCityReportData | null>(null);
  const [contentInventoryReport, setContentInventoryReport] = useState<ContentInventoryReportData | null>(null);
  const [adDeliveryReport, setAdDeliveryReport] = useState<AdDeliveryReportData | null>(null);
  const [showNameReport, setShowNameReport] = useState<ShowNameRow[] | null>(null);
  const [impressionsByFiltered, setImpressionsByFiltered] = useState<ImpressionsByFilteredData | null>(null);
  const [impressionsShareByCampaigns, setImpressionsShareByCampaigns] = useState<CampaignImpressionsShareRow[] | null>(null);
  const [campaignPerformanceRows, setCampaignPerformanceRows] = useState<CampaignActionData[] | null>(null);
  const [reportLoading, setReportLoading] = useState<ReportLoadingState>(NO_REPORT_LOADING);

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
    if (!isSingle && reportMetric === 'ltr') {
      setReportMetric('impressions');
    }
  }, [isSingle, reportMetric]);
  
  const [countryMetric, setCountryMetric] = useState<MetricKey>('impressions');
  const [cityMetric, setCityMetric] = useState<MetricKey>('impressions');
  const [showNameMetric, setShowNameMetric] = useState<MetricKey>('impressions');

  useEffect(() => {
    if (reportMetric === 'impressions') setReportMetric('impressions');
    if (countryMetric === 'impressions') setCountryMetric('impressions');
    if (cityMetric === 'impressions') setCityMetric('impressions');
  }, [reportMetric, countryMetric, cityMetric]);

  // Granularity for the Campaign Performance grid
  const [gridGranularity, setGridGranularity] = useState<Granularity>('daily');

  // Clear chart/report data when filters change so stale graphs are not shown while loading
  useEffect(() => {
    setCampaignsReport(undefined);
    setCountryCityReport(null);
    setContentInventoryReport(null);
    setAdDeliveryReport(null);
    setShowNameReport(null);
    setImpressionsByFiltered(null);
    setImpressionsShareByCampaigns(null);
    setCampaignPerformanceRows(null);
    setReportLoading(allCampaigns.length > 0 ? ALL_REPORT_LOADING : NO_REPORT_LOADING);
  }, [campaigns, dateRange.from, dateRange.to, allCampaigns.length]);

  useEffect(() => {
    if (allCampaigns.length === 0){
      setCampaignsReport(undefined);
      setReportLoading((prev) => ({ ...prev, campaignReport: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, campaignReport: true }));

    const loadCampaignReports = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);

        if (campaignIds.length === 0) return;

        const { data, status, error } = await reportsApi.getCampaignReports({
          advertiserId: sessionData.currentAdvertiserId,
          campaignIds,
          dateRange: gridGranularityToApiDateRange(granularity),
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });

        if (cancelled) return;
        if (status !== 200 || error || !data?.data) {
          logger.error("Error getting campaign reports", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        const parsed = parseCampaignReportsPayload(data.data);
        if (parsed) {
          setCampaignsReport(parsed);
        } else {
          setCampaignsReport(undefined);
        }
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, campaignReport: false }));
        }
      }
    };

    loadCampaignReports();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to, granularity]);

  useEffect(() => {
    if (allCampaigns.length === 0){
      setCountryCityReport(null);
      setReportLoading((prev) => ({ ...prev, countryCity: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, countryCity: true }));

    const loadCountryCityReport = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);
        if (campaignIds.length === 0) return;

        const { data, status, error } = await reportsApi.GetCountryCityReport({
          advertiserId: sessionData.currentAdvertiserId,
          campaignIds,
          dateRange: 'CUSTOM',
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });

        if (cancelled) return;
        if (status !== 200 || error || !data?.data) {
          logger.error("Error getting country city report", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        setCountryCityReport(data.data);
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, countryCity: false }));
        }
      }
    };

    loadCountryCityReport();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0){
      setContentInventoryReport(null);
      setReportLoading((prev) => ({ ...prev, contentInventory: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, contentInventory: true }));

    const loadContentInventory = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);
        if (campaignIds.length === 0) return;

        const { data, status, error } = await reportsApi.GetContentInventory({
          advertiserId: sessionData.currentAdvertiserId,
          campaignIds,
          dateRange: 'CUSTOM',
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });

        if (cancelled) return;
        if (status !== 200 || error || !data?.data) {
          logger.error("Error getting content inventory report", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        setContentInventoryReport(data.data);
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, contentInventory: false }));
        }
      }
    };

    loadContentInventory();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0){
      setAdDeliveryReport(null);
      setReportLoading((prev) => ({ ...prev, adDelivery: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, adDelivery: true }));

    const loadAdDelivery = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);
        if (campaignIds.length === 0) return;

        const { data, status, error } = await reportsApi.GetAdDelivery({
          advertiserId: sessionData.currentAdvertiserId,
          campaignIds,
          dateRange: 'CUSTOM',
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });

        if (cancelled) return;
        if (status !== 200 || error || !data?.data) {
          logger.error("Error getting ad delivery report", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        setAdDeliveryReport(data.data);
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, adDelivery: false }));
        }
      }
    };

    loadAdDelivery();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0) {
      setShowNameReport(null);
      setReportLoading((prev) => ({ ...prev, showName: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, showName: true }));

    const loadShowNameReport = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);
        if (campaignIds.length === 0) return;

        const { data, status, error } = await reportsApi.GetShowName({
          advertiserId: sessionData.currentAdvertiserId,
          campaignIds,
          dateRange: 'CUSTOM',
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });

        if (cancelled) return;
        if (status !== 200 || error || !data?.data) {
          logger.error("Error getting show name report", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        setShowNameReport(normalizeShowNameRows(data.data));
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, showName: false }));
        }
      }
    };

    loadShowNameReport();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0){
      setImpressionsByFiltered(null);
      setReportLoading((prev) => ({ ...prev, impressionsFiltered: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, impressionsFiltered: true }));

    const loadImpressionsByFiltered = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);
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
          logger.error("Error getting impressions by filtered", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        setImpressionsByFiltered(data.data);
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, impressionsFiltered: false }));
        }
      }
    };

    loadImpressionsByFiltered();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0){
      setImpressionsShareByCampaigns(null);
      setReportLoading((prev) => ({ ...prev, impressionsShare: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, impressionsShare: true }));

    const loadImpressionsShareByCampaigns = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);
        if (campaignIds.length === 0) return;

        const { data, status, error } = await reportsApi.ImpressionsShareByCampaigns({
          advertiserId: sessionData.currentAdvertiserId,
          campaignIds,
          dateRange: 'CUSTOM',
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });

        if (cancelled) return;
        if (status !== 200 || error || !data?.data?.campaignMetrics) {
          logger.error("Error getting impressions share by campaigns", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        setImpressionsShareByCampaigns(data.data.campaignMetrics);
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, impressionsShare: false }));
        }
      }
    };

    loadImpressionsShareByCampaigns();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to]);

  useEffect(() => {
    if (allCampaigns.length === 0){
      setCampaignPerformanceRows(null);
      setReportLoading((prev) => ({ ...prev, campaignPerformance: false }));
      return;
    }

    let cancelled = false;
    setReportLoading((prev) => ({ ...prev, campaignPerformance: true }));

    const loadCampaignPerformance = async () => {
      try {
        const { data: { session: sessionData } } = await auth.getSession();
        if (!sessionData?.currentAdvertiserId) return;

        const campaignIds = resolveReportCampaignIds(campaigns);
        if (campaignIds.length === 0) return;

        const { data, status, error } = await reportsApi.getCampaignPerformance({
          advertiserId: sessionData.currentAdvertiserId,
          campaignIds,
          dateRange: gridGranularityToApiDateRange(gridGranularity),
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });

        if (cancelled) return;
        if (status !== 200 || error || !Array.isArray(data?.data)) {
          logger.error("Error getting campaign performance", { status, error, message: data?.message });
          if (error) logger.captureException(error);
          return;
        }

        setCampaignPerformanceRows(data.data);
      } finally {
        if (!cancelled) {
          setReportLoading((prev) => ({ ...prev, campaignPerformance: false }));
        }
      }
    };

    loadCampaignPerformance();
    return () => {
      cancelled = true;
    };
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to, gridGranularity]);

  useEffect(() => {
    const loadAllReports = async () => {
      if (allCampaigns.length === 0){
        setCampaignPerformanceRows(null);
        return;
      }

      const {data: {session: sessionData}} = await auth.getSession();
      if (!sessionData) {
        logger.error("Not authenticated");
        return;
      }


      const campaignIds = resolveReportCampaignIds(campaigns);
      if (campaignIds.length === 0) return;

      const getListeningHeatMap = async () => {

        const {data, status, error} = await reportsApi.getListeningHeatMap({
          advertiserId: sessionData.currentAdvertiserId || "",
          campaignIds,
          dateRange: "CUSTOM",
          from: dateRange.from.toISOString().substring(0, 10),
          to: dateRange.to.toISOString().substring(0, 10),
          campaignType: 'SPECIFIC',
        });
        if (status !== 200 || error) {
          logger.captureException(error);
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
          campaignType: 'SPECIFIC',
        });
        if (status !== 200 || error) {
          logger.captureException(error);
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
  }, [allCampaigns, campaigns, dateRange.from, dateRange.to])
  

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {data: {session: sessionData}} = await auth.getSession();
        if (!sessionData) {
          logger.error("Not authenticated");
          setAllCampaigns([]);
          return;
        }
        const { data, status, error } = await campaignApi.getCampaigns({
          page: 1,
          limit: 1000,
          advertiserId: sessionData.currentAdvertiserId || "",
          sortBy: "createdAt",
          sortOrder: "asc",
          adswizzSync: false
        });
        if (status !== 200 || error) {
          logger.captureException(error);
          toast({ title:'Error', description: error?.message ?? 'Unable to load campaigns', variant: 'destructive' });
          setAllCampaigns([]);
          return;
        }

        const excludeDrafts = (data?.data ?? []).filter(
          (c: Campaign) => c.status.toLowerCase() !== 'draft' && c.status.toLowerCase() !== 'rejected',
        );
        setAllCampaigns(excludeDrafts);
      } finally {
        setLoading(false);
      }
    };
    fetchData();


    appNotifications.subscribe('advertiser:selected', () => {
      logger.info("advertiser:selected");
      fetchData();
    });

    return () => {
      //appNotifications.unsubscribe('advertiser:selected');
    };
  }, []);

  // Last campaign set the date range was defaulted for. handleCampaignChange sets the range in the
  // same update as the selection, so the report effects fire once instead of twice per tick.
  const rangeKeyRef = useRef<string | null>(null);
  const campaignsKey = campaigns.map((c) => c.id).join(',');
  useEffect(() => {
    if (allCampaigns.length === 0 || rangeKeyRef.current === campaignsKey) return;
    rangeKeyRef.current = campaignsKey;
    const range = defaultDateRange(campaigns, isSingle);
    if (range) setDateRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignsKey, allCampaigns.length]);

  // Drop URL IDs that aren't reportable for this advertiser (stale links, drafts, another advertiser).
  useEffect(() => {
    if (loading || allCampaigns.length === 0 || selectedCampaignIds.length === activeCampaignIds.length) return;
    const next = new URLSearchParams(searchParams);
    if (activeCampaignIds.length === 0) next.delete('campaign');
    else next.set('campaign', activeCampaignIds.join(','));
    setSearchParams(next, { replace: true });
  }, [loading, allCampaigns.length, selectedCampaignIds, activeCampaignIds, searchParams, setSearchParams]);

  const selectedCampaign = isSingle ? campaigns[0] : null;
  const selectedCampaignName = selectedCampaign?.campaignName || null;

  useEffect(() => {
    if (selectedCampaignName && selectedCampaignName.length > 20) {
      // setExtraCrumbs([{ label: selectedCampaignName.slice(0, 20) + '...' }]);
    } else if (selectedCampaignName) {
      // setExtraCrumbs([{ label: selectedCampaignName }]);
    } else {
      // setExtraCrumbs([]);
    }
  }, [selectedCampaignName]);

  const handleCampaignChange = (ids: string[]) => {
    // Ticking "All campaigns" clears the selection; ticking a campaign drops the "All" tick.
    const pickedAll = ids.includes('all') && activeCampaignIds.length > 0;
    const next = pickedAll ? [] : ids.filter((id) => id !== 'all');
    const nextSet = new Set(next);
    const nextPicked = allCampaigns.filter((c) => nextSet.has(c.id));
    const nextCampaigns = nextPicked.length > 0 ? nextPicked : allCampaigns;
    const range = defaultDateRange(nextCampaigns, nextPicked.length === 1);
    rangeKeyRef.current = nextCampaigns.map((c) => c.id).join(',');
    if (range) setDateRange(range);

    const params = new URLSearchParams(searchParams);
    if (next.length === 0) params.delete('campaign');
    else params.set('campaign', next.join(','));
    // replace: ticking through the open dropdown shouldn't stack a history entry per click.
    setSearchParams(params, { replace: true });
  };

  const campaignOptions = useMemo(
    () => [
      { id: 'all', label: 'All campaigns' },
      ...allCampaigns.map((c) => ({ id: c.id, label: c.campaignName })),
    ],
    [allCampaigns],
  );

  const kpis = useMemo(() => {
    if(!campaignsReport) return { bookedImpressions: 0, totalImpressions: 0, totalReach: 0, totalSpent: 0, avgLtr: 0, totalConversions: 0, budgetUtil: 0, cpa: 0, totalBudget: 0, impressionsGoal: 0, avgCpm: 0 };
    //const rand = seededRandom(campaigns.reduce((a, c) => a + c.id.split('').reduce((x, ch) => x + ch.charCodeAt(0), 0), 0));
    const totalImpressions =  campaignsReport.cardTotals.impressions; //  campaigns.reduce((a, c) => a + (c.actual_impressions || Math.round(c.budget * (30 + rand() * 20))), 0);
    const totalReach =  campaignsReport.cardTotals.demandAudioReachUniqueUsers;  //campaigns.reduce((a, c) => a + (c.reach || Math.round((c.actual_impressions || c.budget * 35) * 0.25)), 0);
    const totalSpent = campaignsReport.cardTotals.totalSpend;
    const totalBudget = campaignsReport.cardTotals.totalBudget ?? 0;
    const avgLtr = Math.round(campaignsReport.cardTotals.ltr ?? 0);
    const totalConversions = campaignsReport.cardTotals.objectiveCountableSum ?? 0;
    const budgetUtil = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    let campaignGoal = 0;
    const bookedImpressions = campaignsReport.cardTotals.totalImpressions ?? 0;

    try{

      let obj: Record<string, number> = {};

      campaignsReport?.data?.forEach((c) => {

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
    return { bookedImpressions, totalImpressions, totalReach, totalSpent, avgLtr, totalConversions, budgetUtil, cpa, totalBudget, impressionsGoal, avgCpm };
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
    if (!campaignsReport) return [];

    const allDays = campaigns.flatMap(c => generateDailyData(c));
    const map = new Map<string, { date: string; impressions: number; reach: number; spent: number; ltr: number; _ltrSum: number; _ltrN: number }>();
    allDays.forEach(d => {
      const existing = map.get(d.date) || { date: d.date, impressions: 0, reach: 0, spent: 0, ltr: 0, _ltrSum: 0, _ltrN: 0 };
      existing.impressions += d.impressions;
      existing.reach += d.reach;
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
    if (!campaignsReport) return [];

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
    if (campaignPerformanceRows === null) return [];
    return aggregatePerformanceGridRows(dailyGridData, gridGranularity);
  }, [apiPerformanceGridData, campaignPerformanceRows, dailyGridData, gridGranularity]);

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
    if (impressionsShareByCampaigns === null) return [];

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

  const behaviouralSegments = useMemo(() => {
    if (impressionsByFiltered?.podcastTopicsResult?.length) {
      return mapImpressionsFilteredToPieSlices<PodcastTopicFilterRow>(
        impressionsByFiltered.podcastTopicsResult,
        (row) => row.podcastTopicLabel,
      );
    }
    if (impressionsByFiltered === null) return [];
    return generateDemographic(SHOW_NAMES, totalImpr, seed + 1);
  }, [impressionsByFiltered, totalImpr, seed]);

  // Pie chart data
  const deviceTypes = useMemo(() => {
    if (impressionsByFiltered?.deviceTypeResult?.length) {
      return mapImpressionsFilteredToPieSlices<DeviceTypeFilterRow>(
        impressionsByFiltered.deviceTypeResult,
        (row) => row.deviceTypeLabel,
      );
    }
    if (impressionsByFiltered === null) return [];
    return generateDemographic(DEVICE_TYPES, totalImpr, seed + 3);
  }, [impressionsByFiltered, totalImpr, seed]);

  const genders = useMemo(() => {
    if (impressionsByFiltered?.genderResult?.length) {
      return mapImpressionsFilteredToPieSlices<GenderFilterRow>(
        impressionsByFiltered.genderResult,
        (row) => row["requestVariables_aw_0_awz.g_name"]?.trim() || 'Unknown',
      );
    }
    if (impressionsByFiltered === null) return [];
    return generateDemographic(GENDERS, totalImpr, seed + 4);
  }, [impressionsByFiltered, totalImpr, seed]);

  const ageGroups = useMemo(() => {
    if (impressionsByFiltered?.ageResult?.length) {
      return mapImpressionsFilteredToPieSlices<AgeFilterRow>(
        impressionsByFiltered.ageResult,
        (row) => row.age?.trim() || row.ageLabel?.trim() || 'Unknown',
      );
    }
    if (impressionsByFiltered === null) return [];
    return generateDemographic(AGE_GROUPS, totalImpr, seed + 5);
  }, [impressionsByFiltered, totalImpr, seed]);
  const podcastGenres = useMemo(() => {
    if (contentInventoryReport?.genreData?.length) {
      return mapContentInventoryToPieSlices<GenreDataRow>(
        contentInventoryReport.genreData,
        (row) => row.genreName || row.genre,
      );
    }
    if (contentInventoryReport === null) return [];
    return generateDemographic(PODCAST_GENRES, totalImpr, seed + 6);
  }, [contentInventoryReport, totalImpr, seed]);

  const podcastAudiences = useMemo(() => {
    if (contentInventoryReport?.audienceInsights?.length) {
      return mapContentInventoryToPieSlices<AudienceInsightRow>(
        contentInventoryReport.audienceInsights,
        (row) => row.audienceName,
      );
    }
    if (contentInventoryReport === null) return [];
    return generateDemographic(PODCAST_AUDIENCES, totalImpr, seed + 7);
  }, [contentInventoryReport, totalImpr, seed]);

  const adPositions = useMemo(() => {
    if (adDeliveryReport?.adPositionData?.length) {
      return mapAdDeliveryToPieSlices<AdPositionRow>(
        adDeliveryReport.adPositionData,
        (row) => formatAdPositionLabel(row.adPosition),
      );
    }
    if (adDeliveryReport === null) return [];
    return generateDemographic(AD_POSITIONS, totalImpr, seed + 20);
  }, [adDeliveryReport, totalImpr, seed]);

  const contentLanguages = useMemo(() => {
    if (adDeliveryReport?.contentLanguageData?.length) {
      return mapAdDeliveryToPieSlices<ContentLanguageRow>(
        adDeliveryReport.contentLanguageData,
        (row) => formatLanguageLabel(row.language),
      );
    }
    if (adDeliveryReport === null) return [];
    return generateDemographic(CONTENT_LANGUAGES, totalImpr, seed + 21);
  }, [adDeliveryReport, totalImpr, seed]);

  const deviceOS = useMemo(() => {
    if (adDeliveryReport?.deviceOSData?.length) {
      return mapAdDeliveryToPieSlices<DeviceOSRow>(
        adDeliveryReport.deviceOSData,
        (row) => row.osLabel || formatLocationLabel(row.os ?? 'Other'),
      );
    }
    if (adDeliveryReport === null) return [];
    return generateDemographic(DEVICE_OS, totalImpr, seed + 22);
  }, [adDeliveryReport, totalImpr, seed]);
  const mediaTopics = useMemo(() => {
    if (contentInventoryReport?.mediaTopics?.length) {
      return mapContentInventoryToPieSlices<MediaTopicRow>(
        contentInventoryReport.mediaTopics,
        (row) => row.mediaName,
      );
    }
    if (contentInventoryReport === null) return [];
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
    if (countryCityReport === null) return [];

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
    if (countryCityReport === null) return [];

    const map = new Map<string, { name: string; impressions: number; reach: number; spent: number; _ltrSum: number; _ltrN: number; ltr: number }>();
    cityRows.forEach(r => {
      const country = r.country ?? 'Other';
      const existing = map.get(country);
      if (existing) {
        existing.impressions += r.impressions;
        existing.reach += r.reach;
        existing.spent += r.spent;
        existing._ltrSum += r.ltr ?? 0;
        existing._ltrN += 1;
      } else {
        map.set(country, { name: country, impressions: r.impressions, reach: r.reach, spent: r.spent, _ltrSum: r.ltr ?? 0, _ltrN: 1, ltr: r.ltr ?? 0 });
      }
    });
    return Array.from(map.values())
      .map(r => ({ ...r, ltr: Math.round(r._ltrSum / r._ltrN) }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [countryCityReport, cityRows]);

  const showNameRows = useMemo(() => {
    if (showNameReport?.length) {
      return showNameReport
        .map(mapShowNameToChartRow)
        .sort((a, b) => b.impressions - a.impressions);
    }
    if (showNameReport === null) return [];
    return [];
  }, [showNameReport]);

  const gridColDefs = useMemo<ColDef[]>(() => [
    { field: 'date', headerName: gridGranularity === 'daily' ? 'Date' : gridGranularity === 'weekly' ? 'Week of' : 'Month', width: 130, sort: 'desc' },
    { field: 'campaignName', headerName: 'Campaign', flex: 2, minWidth: 150 },
    { field: 'campaignStatus', headerName: 'Status', width: 110, cellRenderer: StatusRenderer },
    { field: 'campaignGoal', headerName: 'Goal', width: 110 },
    { field: 'startDate', headerName: 'Start Date', width: 110 },
    { field: 'endDate', headerName: 'End Date', width: 110 },
    { field: 'dailyBudget', headerName: 'Daily Budget', width: 115, type: 'numericColumn', cellRenderer: DailyBudgetRenderer },
    { field: 'totalBudget', headerName: 'Total Budget', width: 115, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toLocaleString()}` },
    { field: 'totalSpend', headerName: 'Spend', width: 100, type: 'numericColumn', valueFormatter: p => `$${(p.value ?? 0).toFixed(2)}` },
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

  const renderPieChart = (title: string, data: PieChartSlice[], chartLoading: boolean) => {
    const rows = data.map((d, i) => {
      return {
        name: d.name,
        impressions: d.value,
        reach: d.reach ? Number(d.reach) : 0,
        spend: d.spent ? Number(d.spent) : 0,
        ltr: d.ltr ? Number(d.ltr) : 0,
        color: COLORS[i % COLORS.length],
      };
    });

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartLoadingShell loading={chartLoading} minHeight={200}>
            {data.length === 0 && !chartLoading ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No data for this period.</p>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="w-full lg:w-[220px] shrink-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.filter((d,index) => index < 15)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" labelLine={false}>
                        {data.filter((d,index) => index < 15).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => (v as number).toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full overflow-x-auto max-h-[400px] overflow-y-auto">
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
                          <td className="py-1.5 px-2 text-right tabular-nums text-foreground">${r.spend ? Number(r.spend).toFixed(2) : '0.00'}</td>
                          <td className="py-1.5 pl-2 text-right tabular-nums text-foreground">{r.ltr ? Number(r.ltr).toFixed(0) : '0'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </ChartLoadingShell>
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
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker value={dateRange} onChange={setDateRange} isMobile={isMobile} tzLabel={tzLabel} />
          <SearchableDropdown
            items={campaignOptions}
            selectedIds={activeCampaignIds.length > 0 ? activeCampaignIds : ['all']}
            onSelectionChange={handleCampaignChange}
            selectionMode="multi"
            placeholder="All campaigns"
            searchPlaceholder="Search campaigns..."
            emptyMessage="No campaigns found"
            matchIds={false}
            className="w-52 h-9 focus-visible:ring-0 focus-visible:ring-offset-0"
            contentClassName="w-[min(32rem,calc(100vw-2rem))]"
            align="end"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : allCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-base font-medium text-foreground">No campaigns available</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Launch a campaign to start viewing performance reports here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Summary */}
          {(() => {
            const reachSeries = rawDailyData.map(d => d.reach);
            //const cpaSeries = rawDailyData.map(d => (d.conversions > 0 ? d.spent / d.conversions : 0));
            const cpmSeries = rawDailyData.map(d => (d.impressions > 0 ? d.spent / (d.impressions / 1000) : 0));
            // Trend: compare first half avg to second half avg
            const half = Math.floor(reachSeries.length / 2);
            const firstAvg = half > 0 ? reachSeries.slice(0, half).reduce((a, b) => a + b, 0) / half : 0;
            const secondAvg = half > 0 ? reachSeries.slice(half).reduce((a, b) => a + b, 0) / (reachSeries.length - half) : 0;
            const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
            const reachTrend: 'up' | 'down' | 'flat' = trendPct > 5 ? 'up' : trendPct < -5 ? 'down' : 'flat';
            const ltrStatus: 'good' | 'average' | 'low' = kpis.avgLtr >= 75 ? 'good' : kpis.avgLtr >= 60 ? 'average' : 'low';
            //const prevCpa = periodComparison.conversions.previous > 0
            //  ? periodComparison.spent.previous / periodComparison.conversions.previous
            //  : kpis.cpa;
            //const cpaDeltaPct = prevCpa > 0 ? ((kpis.cpa - prevCpa) / prevCpa) * 100 : 0;
            const prevCpm = periodComparison.impressions.previous > 0
              ? periodComparison.spent.previous / (periodComparison.impressions.previous / 1000)
              : kpis.avgCpm;
            const cpmDeltaPct = prevCpm > 0 ? ((kpis.avgCpm - prevCpm) / prevCpm) * 100 : 0;
            const isAll = !isSingle;
            return (
              <CampaignKpiSummary
                status={{ label: pacing.statusLabel, tone: pacing.statusTone }}
                asOfDate={new Date()}
                impressions={{ actual: kpis.totalImpressions, goal: kpis.impressionsGoal }}
                budget={{ spent: kpis.totalSpent, total: kpis.totalBudget }}
                reach={{ value: kpis.totalReach, impressions: kpis.totalImpressions, trend: reachTrend, series: reachSeries }}
                ltr={{ value: kpis.avgLtr, industryAvg: 90, status: ltrStatus }}
                cpa={{ value:( isAll ? null : kpis.totalBudget/kpis.impressionsGoal)*1000, deltaPct: null, series: null }}
                cpm={{ value:( isAll ? null : kpis.totalBudget/kpis.impressionsGoal)*1000, deltaPct: null, series: null }}
                // cpm={isAll ? { value: kpis.avgCpm, deltaPct: cpmDeltaPct, series: cpmSeries } : undefined}
                loading={reportLoading.campaignReport}
                />
            );
          })()}

          {/* ─── Bar Chart 1: Campaign Report ─── */}
          <Card>
            <CardHeader className="pb-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base">{isSingle ? 'Campaign Report' : isSubset ? 'Selected campaign reports' : 'All campaign reports'}</CardTitle>
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
                  <MetricDropdown value={reportMetric} onChange={setReportMetric} extraKeys={isSingle ? ['ltr'] : undefined} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartLoadingShell loading={reportLoading.campaignReport} minHeight={320}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={!isSingle && campaigns.length > 1 ? stackedChartData : dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip
                    content={
                      !isSingle && campaigns.length > 1
                        ? <StackedCampaignTooltip metric={reportMetric} />
                        : <AllMetricsTooltip selectedMetric={reportMetric} />
                    }
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  />
                  {!isSingle && campaigns.length > 1 ? (
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
              </ChartLoadingShell>
            </CardContent>
          </Card>

          {/* ─── Per-Campaign Charts (All Campaigns view) ─── */}
          {!isSingle && (
            <div className="grid grid-cols-1 gap-4">
              {/* LTR per campaign */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">LTR% by campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartLoadingShell loading={reportLoading.campaignReport} minHeight={Math.max(240, campaigns.length * 36)}>
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
                  </ChartLoadingShell>
                </CardContent>
              </Card>

              {/* Impression share per campaign */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Impressions share by campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartLoadingShell loading={reportLoading.impressionsShare} minHeight={240}>
                    {!reportLoading.impressionsShare && (campaignImpressionShareSlices.length === 0 || campaignImpressionShareTotal === 0) ? (
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
                  </ChartLoadingShell>
                </CardContent>
              </Card>
            </div>
          )}

          {isSingle && (
            <>
              {/* ─── Bar Chart 2: Country ─── */}
              <HorizontalBarChartCard
                title="Country"
                data={countryRows}
                selectedMetric={countryMetric}
                onMetricChange={setCountryMetric}
                extraKeys={['ltr']}
                loading={reportLoading.countryCity}
              />

              {/* ─── Bar Chart 3: City ─── */}
              <HorizontalBarChartCard
                title="City"
                data={cityRows}
                selectedMetric={cityMetric}
                onMetricChange={setCityMetric}
                extraKeys={['ltr']}
                loading={reportLoading.countryCity}
              />

              <HorizontalBarChartCard
                title="Show names"
                data={showNameRows}
                selectedMetric={showNameMetric}
                onMetricChange={setShowNameMetric}
                metricKeys={['impressions', 'reach', 'ltr', 'spent']}
                loading={reportLoading.showName}
              />

              {/* ─── Pie Charts: Content & Inventory ─── */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Content & Inventory</h2>
                <div className="grid grid-cols-1 gap-4">
                  {renderPieChart('Podcast Genre', podcastGenres, reportLoading.contentInventory)}
                  {renderPieChart('Contextual Media Topics', mediaTopics, reportLoading.contentInventory)}
                  {/* {renderPieChart('Contextual Audience Insights', podcastAudiences, reportLoading.contentInventory)} */}
                </div>
              </div>

              {/* ─── Pie Charts: Ad Delivery ─── */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Ad Delivery</h2>
                <div className="grid grid-cols-1 gap-4">
                  {renderPieChart('Ad Position', adPositions, reportLoading.adDelivery)}
                  {renderPieChart('Content Language', contentLanguages, reportLoading.adDelivery)}
                  {renderPieChart('Device OS', deviceOS, reportLoading.adDelivery)}
                  {renderPieChart('Device Type', deviceTypes, reportLoading.impressionsFiltered)}
                </div>
              </div>

              {/* ─── Pie Charts: Demographics ─── */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Demographics</h2>
                <div className="grid grid-cols-1 gap-4">
                  {renderPieChart('Behavioural Segment', behaviouralSegments, reportLoading.impressionsFiltered)}
                  {renderPieChart('Age', ageGroups, reportLoading.impressionsFiltered)}
                  {renderPieChart('Gender', genders, reportLoading.impressionsFiltered)}
                </div>
              </div>
            </>
          )}
          {/* Campaign Overview Grid (All Campaigns view only) */}
          {!isSingle && (
            <Card>
              <CardHeader>
                <CardTitle>{isSubset ? 'Selected campaigns overview' : 'All campaigns overview'}</CardTitle>
              </CardHeader>
              <CardContent>
                <AgGridReact
                  theme={appGridTheme}
                  modules={[AllCommunityModule]}
                  rowData={campaignOverviewRows}
                  columnDefs={overviewColDefs}
                  domLayout="autoHeight"
                  suppressCellFocus
                  animateRows
                />
              </CardContent>
            </Card>
          )}

          {/* Performance Grid */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{isSingle ? 'Campaign Performance' : isSubset ? 'Selected campaigns performance' : 'All campaigns performance'}</CardTitle>
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
              <ChartLoadingShell loading={reportLoading.campaignPerformance} minHeight={350}>
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
              </ChartLoadingShell>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}