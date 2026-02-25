import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Search, Filter, Download, BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDataCards, MobileStatRow } from '@/components/ui/mobile-data-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';
import { useTranslation } from '@/contexts/TranslationContext';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, type ICellRendererParams, type RowClickedEvent } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';

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

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-primary/10 text-primary',
};

const StatusRenderer = (params: ICellRendererParams) => (
  <Badge variant="secondary" className={statusColors[params.value] || ''}>{params.value}</Badge>
);

const UtilizationRenderer = (params: ICellRendererParams) => {
  const c = params.data as Campaign;
  const util = c.budget > 0 ? Math.min(100, Math.round(((c.actual_spend ?? 0) / c.budget) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <Progress value={util} className="h-1.5 w-16" />
      <span className="text-xs text-muted-foreground">{util}%</span>
    </div>
  );
};

export default function CampaignsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const mockCampaigns: Campaign[] = [
    { id: 'mock-1', name: 'Ramadan Brand Awareness', status: 'active', campaign_type: 'awareness', start_date: '2026-02-01', end_date: '2026-03-15', budget: 5000, actual_spend: 2340, actual_impressions: 187200, reach: 45800, ltr: 78, currency: 'USD' },
    { id: 'mock-2', name: 'Summer Product Launch', status: 'active', campaign_type: 'awareness', start_date: '2026-01-20', end_date: '2026-02-28', budget: 3000, actual_spend: 1870, actual_impressions: 112500, reach: 31200, ltr: 82, currency: 'USD' },
    { id: 'mock-3', name: 'Podcast Sponsorship Q1', status: 'active', campaign_type: 'engagement', start_date: '2026-01-01', end_date: '2026-03-31', budget: 8000, actual_spend: 4150, actual_impressions: 320000, reach: 89000, ltr: 71, currency: 'USD' },
    { id: 'mock-4', name: 'Holiday Campaign 2025', status: 'completed', campaign_type: 'awareness', start_date: '2025-12-01', end_date: '2025-12-31', budget: 4500, actual_spend: 4480, actual_impressions: 256000, reach: 62000, ltr: 85, currency: 'USD' },
    { id: 'mock-5', name: 'Back to School Promo', status: 'completed', campaign_type: 'conversions', start_date: '2025-08-15', end_date: '2025-09-15', budget: 2500, actual_spend: 2500, actual_impressions: 198000, reach: 41000, ltr: 76, currency: 'USD' },
    { id: 'mock-6', name: 'National Day Special', status: 'completed', campaign_type: 'awareness', start_date: '2025-11-15', end_date: '2025-12-05', budget: 3500, actual_spend: 3490, actual_impressions: 210000, reach: 55000, ltr: 80, currency: 'USD' },
    { id: 'mock-7', name: 'New App Install Drive', status: 'paused', campaign_type: 'conversions', start_date: '2026-01-10', end_date: '2026-02-28', budget: 6000, actual_spend: 1200, actual_impressions: 72000, reach: 18500, ltr: 68, currency: 'USD' },
    { id: 'mock-8', name: 'Weekend Flash Sale', status: 'draft', campaign_type: 'engagement', start_date: '2026-03-01', end_date: '2026-03-03', budget: 1500, actual_spend: null, actual_impressions: null, reach: null, ltr: null, currency: 'USD' },
  ];

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data } = await api.getCampaigns();
      setCampaigns(data && data.length > 0 ? data : mockCampaigns);
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesStatus;
    });
  }, [campaigns, statusFilter]);

  const totals = useMemo(() => {
    return campaigns.reduce(
      (acc, c) => ({
        budget: acc.budget + (c.budget || 0),
        spend: acc.spend + (c.actual_spend || 0),
        impressions: acc.impressions + (c.actual_impressions || 0),
        reach: acc.reach + (c.reach || 0),
      }),
      { budget: 0, spend: 0, impressions: 0, reach: 0 }
    );
  }, [campaigns]);

  const utilization = (c: Campaign) =>
    c.budget > 0 ? Math.min(100, Math.round(((c.actual_spend ?? 0) / c.budget) * 100)) : 0;

  const ecpm = (c: Campaign) => {
    const impr = c.actual_impressions ?? 0;
    const spend = c.actual_spend ?? 0;
    return impr > 0 ? ((spend / impr) * 1000).toFixed(2) : '—';
  };

  const exportCSV = () => {
    const headers = ['Name', 'Status', 'Type', 'Start', 'End', 'Budget', 'Spend', 'Utilization', 'Impressions', 'Reach', 'LTR', 'eCPM'];
    const rows = campaigns.map((c) => [
      c.name, c.status, c.campaign_type, c.start_date, c.end_date,
      c.budget, c.actual_spend ?? 0, `${utilization(c)}%`,
      c.actual_impressions ?? 0, c.reach ?? 0, c.ltr != null ? `${c.ltr}%` : '—', ecpm(c),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colDefs = useMemo<ColDef[]>(() => [
    { field: 'name', headerName: t('reports.campaign'), flex: 2, minWidth: 160, filter: true },
    { field: 'status', headerName: t('campaigns.status'), width: 110, cellRenderer: StatusRenderer },
    {
      headerName: t('campaigns.dates'), width: 180,
      valueGetter: (p) => `${p.data.start_date} — ${p.data.end_date}`,
      cellClass: 'text-xs text-muted-foreground',
    },
    {
      field: 'budget', headerName: t('campaigns.budget'), width: 110, type: 'numericColumn',
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
    },
    {
      field: 'actual_spend', headerName: t('campaigns.spend'), width: 110, type: 'numericColumn',
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
    },
    {
      headerName: t('campaigns.utilization'), width: 140,
      cellRenderer: UtilizationRenderer,
      sortable: true,
      valueGetter: (p) => {
        const c = p.data as Campaign;
        return c.budget > 0 ? Math.min(100, Math.round(((c.actual_spend ?? 0) / c.budget) * 100)) : 0;
      },
    },
    {
      field: 'actual_impressions', headerName: t('reports.impressions'), width: 120, type: 'numericColumn',
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
    },
    {
      field: 'reach', headerName: t('reports.reach'), width: 100, type: 'numericColumn',
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
    },
    {
      field: 'ltr', headerName: 'LTR', width: 80, type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? `${p.value}%` : '—',
    },
    {
      headerName: 'eCPM', width: 90, type: 'numericColumn',
      valueGetter: (p) => {
        const c = p.data as Campaign;
        const impr = c.actual_impressions ?? 0;
        const spend = c.actual_spend ?? 0;
        return impr > 0 ? (spend / impr) * 1000 : null;
      },
      valueFormatter: (p) => p.value != null ? `$${p.value.toFixed(2)}` : '—',
    },
    {
      headerName: '', width: 130, sortable: false, filter: false,
      cellRenderer: (params: ICellRendererParams) => (
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigate(`/dashboard/reports?campaign=${params.data.id}`)}
        >
          {t('campaigns.see_details')}
        </Button>
      ),
    },
  ], [navigate, t]);

  const onRowClicked = useCallback((e: RowClickedEvent<Campaign>) => {
    if (e.data) navigate(`/dashboard/campaigns/${e.data.id}`);
  }, [navigate]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('campaigns.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('campaigns.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={campaigns.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {t('campaigns.export_csv')}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('campaigns.total_budget')}</p>
            <p className="text-2xl font-bold text-foreground">${totals.budget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('campaigns.total_spend')}</p>
            <p className="text-2xl font-bold text-foreground">${totals.spend.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('campaigns.total_impressions')}</p>
            <p className="text-2xl font-bold text-foreground">{totals.impressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('campaigns.total_reach')}</p>
            <p className="text-2xl font-bold text-foreground">{totals.reach.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {campaigns.length === 0 ? t('campaigns.no_campaigns') : t('campaigns.no_matching')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {campaigns.length === 0
                ? t('campaigns.no_campaigns_desc')
                : t('campaigns.adjust_filters')}
            </p>
            {campaigns.length === 0 && (
              <Button onClick={() => navigate('/dashboard/campaigns/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('dashboard.create_campaign')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('campaigns.campaign_performance')}</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('campaigns.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('campaigns.all_statuses')}</SelectItem>
                <SelectItem value="draft">{t('campaigns.drafts')}</SelectItem>
                <SelectItem value="active">{t('dashboard.active')}</SelectItem>
                <SelectItem value="paused">{t('campaigns.paused')}</SelectItem>
                <SelectItem value="completed">{t('campaigns.completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardContent>
            {isMobile ? (
              <MobileDataCards
                data={filtered.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))}
                emptyMessage={t('campaigns.no_campaigns_search')}
                renderCard={(c) => (
                  <div
                    key={c.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground truncate">{c.name}</p>
                      <Badge variant="secondary" className={statusColors[c.status] || ''}>{c.status}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <MobileStatRow label={t('campaigns.budget')} value={`$${c.budget.toLocaleString()}`} />
                      <MobileStatRow label={t('campaigns.spend')} value={`$${(c.actual_spend ?? 0).toLocaleString()}`} />
                      <MobileStatRow label={t('reports.impressions')} value={(c.actual_impressions ?? 0).toLocaleString()} />
                      <MobileStatRow label="LTR" value={c.ltr != null ? `${c.ltr}%` : '—'} />
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => navigate(`/dashboard/reports?campaign=${c.id}`)}
                    >
                      {t('campaigns.see_details')}
                    </Button>
                  </div>
                )}
              />
            ) : (
              <AgGridReact
                theme={appGridTheme}
                modules={[AllCommunityModule]}
                rowData={filtered}
                columnDefs={colDefs}
                quickFilterText={search}
                domLayout="autoHeight"
                suppressCellFocus
                animateRows
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
