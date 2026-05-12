import { useEffect, useLayoutEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Megaphone, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, type ICellRendererParams, type RowClickedEvent, type SortChangedEvent } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { Campaign, campaignApi } from '@/services/campaign';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
import { auth } from '@/services/auth';
import { advertiserApi } from '@/services/advertiser';
import { appNotifications } from '@/services/appNotifications';


const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-primary/10 text-primary',
};

const StatusRenderer = (params: ICellRendererParams) => (
  <Badge variant="secondary" className={statusColors[params.value] || ''}>{params.value}</Badge>
);

/** Maps AG Grid colId (or field) to getCampaigns `sortBy` */
const GRID_COL_TO_SORT_BY: Record<string, string> = {
  campaignName: 'campaignName',
  status: 'status',
  dates: 'startDate',
  totalBudget: 'totalBudget',
};

const UtilizationRenderer = (params: ICellRendererParams) => {
  const c = params.data as Campaign;
  const util = c.budget > 0 ? Math.min(100, Math.round(((c.actual_spend ?? 0) / c.budget) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 h-full">
      <Progress value={util} className="h-1.5 w-16" />
      <span className="text-xs text-muted-foreground">{util}%</span>
    </div>
  );
};

export default function CampaignsList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const advertiserIdCacheRef = useRef<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { t } = useTranslation();
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useLayoutEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, limit]);


  const fetchCampaigns = async () => {
    setLoading(true);

    const session = await auth.getSession();
    if (!session) {
      toast({ title: t('common.error'), description: 'Unauthorized', variant: 'destructive' });
      setCampaigns([]);
      setMeta((m) => ({ ...m, total: 0, page: 1, totalPages: 1 }));
      setLoading(false);
      return;
    }

    let advertiserId = session.data.session.currentAdvertiserId ?? advertiserIdCacheRef.current ?? undefined;

    if (!advertiserId) {
      const { data: advertisersRes, status: advertisersStatus, error: advertisersError, message: advertisersMessage } =
        await advertiserApi.getAdvertisers(session.data.session.currentOrganizationId);

      if (advertisersStatus !== 200 || advertisersError) {
        toast({ title: t('common.error'), description: advertisersMessage ?? 'Unable to load advertisers', variant: 'destructive' });
        setCampaigns([]);
        setMeta((m) => ({ ...m, total: 0, page: 1, totalPages: 1 }));
        setLoading(false);
        return;
      }

      const advertisers = advertisersRes.data;
      if (advertisers.length > 0) {
        advertiserId = advertisers[0].id;
        auth.setCurrentAdvertiserId(advertiserId, advertisers[0].isPro);
      }
    }

    if (advertiserId) {
      advertiserIdCacheRef.current = advertiserId;
    }

    const { data, status, error, message } = await campaignApi.getCampaigns({
      page,
      limit,
      search: debouncedSearch,
      status: statusFilter === 'all' ? '' : statusFilter,
      advertiserId: advertiserId ?? '',
      sortBy: sortBy,
      sortOrder: sortOrder,

    });


    if (status !== 200 || error) {
      toast({ title: t('common.error'), description: message ?? 'Unable to load campaigns', variant: 'destructive' });
      setCampaigns([]);
      setMeta((m) => ({ ...m, total: 0, page: 1, totalPages: 1 }));
      setLoading(false);
      return;
    }

    const rows = data?.data ?? [];
    const responseMeta = data?.meta;
    const total = responseMeta?.total ?? 0;
    const apiPage = responseMeta?.page ?? page;
    const apiLimit = responseMeta?.limit ?? limit;
    const apiTotalPages = responseMeta?.totalPages;
    const totalPages =
      typeof apiTotalPages === 'number' && apiTotalPages > 0
        ? apiTotalPages
        : total > 0
          ? Math.max(1, Math.ceil(total / apiLimit))
          : 1;

    setMeta({
      total,
      page: apiPage,
      limit: apiLimit,
      totalPages,
    });
    setCampaigns(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, limit, debouncedSearch, statusFilter, t, sortBy, sortOrder]);

  const hasActiveFilters = debouncedSearch.length > 0 || statusFilter !== 'all';

  useEffect(() => {
    return appNotifications.subscribe('advertiser:selected', async () => {
      setTimeout(() => {
        setPage(1);
        fetchCampaigns();  
      }, 500);
    });
  
  }, [fetchCampaigns])
  
  // const totals = useMemo(() => {
  //   return campaigns.reduce(
  //     (acc, c) => ({
  //       budget: acc.budget + (c.budget || 0),
  //       spend: acc.spend + (c.actual_spend || 0),
  //       impressions: acc.impressions + (c.actual_impressions || 0),
  //       reach: acc.reach + (c.reach || 0),
  //     }),
  //     { budget: 0, spend: 0, impressions: 0, reach: 0 }
  //   );
  // }, [campaigns]);

  // const utilization = (c: Campaign) =>
  //   c.budget > 0 ? Math.min(100, Math.round(((c.actual_spend ?? 0) / c.budget) * 100)) : 0;

  // const ecpm = (c: Campaign) => {
  //   const impr = c.actual_impressions ?? 0;
  //   const spend = c.actual_spend ?? 0;
  //   return impr > 0 ? ((spend / impr) * 1000).toFixed(2) : '—';
  // };

  // const exportCSV = () => {
  //   const headers = ['Name', 'Status', 'Type', 'Start', 'End', 'Budget', 'Spend', 'Utilization', 'Impressions', 'Reach', 'LTR', 'eCPM'];
  //   const rows = campaigns.map((c) => [
  //     c.name, c.status, c.campaign_type, c.start_date, c.end_date,
  //     c.budget, c.actual_spend ?? 0, `${utilization(c)}%`,
  //     c.actual_impressions ?? 0, c.reach ?? 0, c.ltr != null ? `${c.ltr}%` : '—', ecpm(c),
  //   ]);
  //   const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  //   const blob = new Blob([csv], { type: 'text/csv' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `campaign-report-${new Date().toISOString().slice(0, 10)}.csv`;
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

  const colDefs = useMemo<ColDef[]>(() => [
    { field: 'campaignName', headerName: 'Campaign', flex: 2, minWidth: 160, filter: false, sortable: true },
    { field: 'status', headerName: 'Status', width: 110, cellRenderer: StatusRenderer, sortable: true },
    {
      colId: 'dates',
      headerName: 'Dates', width: 200,
      valueGetter: (p) => `${p.data.startDate} — ${p.data.endDate}`,
      cellStyle: { display: 'flex', alignItems: 'center', fontSize: '0.75rem' },
      sortable: true,
    },
    {
      field: 'totalBudget', headerName: 'Budget', width: 110, type: 'numericColumn',
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
      sortable: true,
    },
    {
      field: 'spend', headerName: 'Spend', width: 110, type: 'numericColumn',
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
      sortable: false
    },
    {
      headerName: 'Utilization', width: 140,
      cellRenderer: UtilizationRenderer,
      valueGetter: (p) => {
        const c = p.data as Campaign;
        return c.budget > 0 ? Math.min(100, Math.round(((c.actual_spend ?? 0) / c.budget) * 100)) : 0;
      },
      sortable: false,
    },
    {
      field: 'actual_impressions', headerName: 'Impressions', width: 120, type: 'numericColumn',
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
      sortable: false,
    },
    {
      field: 'reach', headerName: 'Reach', width: 100, type: 'numericColumn',
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
      sortable: false,
    },
    {
      field: 'ltr', headerName: 'LTR', width: 80, type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? `${p.value}%` : '—',
      sortable: false,
    },
    {
      headerName: 'eCPM', width: 90, type: 'numericColumn',
      valueGetter: (p) => {
        const c = p.data as Campaign;
        const impr = c.impressions ?? 0;
        const spend = c.spend ?? 0;
        return impr > 0 ? (spend / impr) * 1000 : null;
      },
      valueFormatter: (p) => p.value != null ? `$${p.value.toFixed(2)}` : '—',
      sortable: false,
    },
    {
      headerName: '', sortable: false, filter: false,
      cellRenderer: (params: ICellRendererParams) => (
        <>
        
          {
            params.data.status === 'DRAFT' ? (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs mr-2"
                onClick={() => navigate(`/dashboard/campaigns/${params.data.id}`)}
              >
                Edit
              </Button>
            ): (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() => navigate(`/dashboard/reports?campaign=${params.data.id}`)}
              >
                See Details
              </Button>
            )
          }
        </>
      ),
    },
  ], [navigate]);

  const onRowClicked = useCallback((e: RowClickedEvent<Campaign>) => {
    if (e.data) navigate(`/dashboard/campaigns/${e.data.id}`);
  }, [navigate]);

  const onSortChanged = useCallback((e: SortChangedEvent<Campaign>) => {
    const sorted = e.api
      .getColumnState()
      .filter((c) => c.sort != null)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
    const primary = sorted[0];
    if (!primary?.sort) {
      setSortBy('createdAt');
      setSortOrder('desc');
      return;
    }
    const key = primary.colId ?? '';
    const apiSortBy = GRID_COL_TO_SORT_BY[key] ?? 'createdAt';
    setSortBy(apiSortBy);
    setSortOrder(primary.sort === 'asc' ? 'asc' : 'desc');
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage and track your ad campaigns</p>
        </div>
        <Button variant="outline" onClick={() => {}} disabled={campaigns.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-semibold text-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Spend</p>
            <p className="text-2xl font-semibold text-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Impressions</p>
            <p className="text-2xl font-semibold text-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Reach</p>
            <p className="text-2xl font-semibold text-foreground"></p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {hasActiveFilters ? 'No matching campaigns' : 'No campaigns yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first campaign to start reaching listeners.'}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => navigate('/dashboard/campaigns/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="w-full h-[380px]">
                <AgGridReact
                  theme={appGridTheme}
                  modules={[AllCommunityModule]}
                  rowData={campaigns}
                  columnDefs={colDefs}
                  defaultColDef={{ comparator: () => 0 }}
                  suppressMultiSort
                  onRowClicked={onRowClicked}
                  onSortChanged={onSortChanged}
                  suppressCellFocus
                  animateRows
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {meta.total > 0
                    ? `Showing ${(meta.page - 1) * meta.limit + 1}-${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}`
                    : 'Showing 0'}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(limit)}
                    onValueChange={(v) => setLimit(Number(v))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={loading || page <= 1}
                  >
                    Prev
                  </Button>
                  <div className="text-sm text-foreground px-2">
                    {meta.page} / {meta.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={loading || page >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>

            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
