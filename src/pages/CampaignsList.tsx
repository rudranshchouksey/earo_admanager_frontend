import { useEffect, useLayoutEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Megaphone, Search, Filter, Download, Pencil, RefreshCcw, ChartAreaIcon, Eye, DollarSign, MousePointerClick, Target, Archive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, type CellClickedEvent, type GetRowIdParams, type ICellRendererParams, type RowSelectionOptions, type SelectionChangedEvent, type SortChangedEvent } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { Campaign, campaignApi } from '@/services/campaign';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
import { auth } from '@/services/auth';
import { advertiserApi } from '@/services/advertiser';
import { appNotifications } from '@/services/appNotifications';
import { CardTotals, reportsApi } from '@/services/reports';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { Helmet } from 'react-helmet-async';
import StatCard from '@/components/dashboard/StatCard';


const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-muted text-muted-foreground',
};


const StatusRenderer = (params: ICellRendererParams) => (
  <Badge variant="secondary" className={statusColors[params.value?.toLowerCase() || ''] || ''}>{params.value}</Badge>
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
  const util = c.totalBudget > 0 ? Math.min(100, Math.round(((c.spend ?? 0) / c.totalBudget) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 h-full">
      <Progress value={util} className="h-1.5 w-16" />
      <span className="text-xs text-muted-foreground">{util}%</span>
    </div>
  );
};

// Sorting is server-side, so AG Grid's own comparator is a no-op.
const DEFAULT_COL_DEF: ColDef = { comparator: () => 0 };
const getRowId = (p: GetRowIdParams<Campaign>) => p.data.id;
// Drafts have no AdsWizz ID, so there's nothing to archive or report on yet.
const ROW_SELECTION: RowSelectionOptions<Campaign> = {
  mode: 'multiRow',
  checkboxes: true,
  headerCheckbox: true,
  enableClickSelection: false,
  isRowSelectable: (node) => node.data?.externalRefId != null,
};
const SELECTION_COLUMN_DEF: ColDef = { pinned: 'left', width: 44, resizable: false, suppressHeaderMenuButton: true };

const VALID_STATUS_FILTERS = ['all', 'DRAFT', 'PROCESSING', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'];

export default function CampaignsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    const fromUrl = searchParams.get('status');
    return fromUrl && VALID_STATUS_FILTERS.includes(fromUrl) ? fromUrl : 'all';
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const advertiserIdCacheRef = useRef<string | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const gridRef = useRef<AgGridReact<Campaign>>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Campaign[]>([]);
  const { t } = useTranslation();
  const [dashboardCardData, setDashboardCardData] = useState<CardTotals>({
    attributionCPAInUSD: 0,
    totalSpend: 0,
    impressions: 0,
    demandAudioReachUniqueUsers: 0,
  })
  const [loadingDashboardData, setLoadingDashboardData] = useState(false);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const { role } = useSessionFlags();
  
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useLayoutEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sortBy, sortOrder, limit]);


  const fetchCampaigns = async () => {
    setLoading(true);
    setSelectedCampaigns([]);

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
      toast({ title: t('common.error'), description:  'Unable to load campaigns', variant: 'destructive' });
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


  const canManage = role === 'ADMIN' || role === 'EDITOR';
  const canViewReport = selectedCampaigns.length === 1;
  const canArchive = selectedCampaigns.every((c) => (c.status as string) !== 'ARCHIVED');
  const [archiving, setArchiving] = useState(false);

  const onSelectionChanged = useCallback((e: SelectionChangedEvent<Campaign>) => {
    setSelectedCampaigns(e.api.getSelectedRows());
  }, []);

  const handleArchive = async () => {
    const advertiserId = advertiserIdCacheRef.current;
    if (!advertiserId) {
      toast({ title: t('common.error'), description: 'Unable to archive campaigns', variant: 'destructive' });
      return;
    }
    setArchiving(true);
    const { error, status, message } = await campaignApi.archiveCampaigns(
      selectedCampaigns.map((c) => c.externalRefId as number),
      advertiserId,
    );
    setArchiving(false);
    if (Number(status) !== 200 || error) {
      toast({ title: t('common.error'), description: typeof message === 'string' ? message : 'Unable to archive campaigns', variant: 'destructive' });
    } else {
      toast({ title: `Archived ${selectedCampaigns.length} campaign${selectedCampaigns.length > 1 ? 's' : ''}` });
    }
    // Refetch either way (some may have archived on a partial failure), from page 1 in case
    // the current page is now empty.
    if (page !== 1) setPage(1);
    else fetchCampaigns();
  };

  const refresh = () => {
    setPage(1);
    fetchCampaigns();
  };

  
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


  useEffect(() => {
  
    const fetchDashboardCardData = async () => {

      const session = await auth.getSession();
      if(!session) return;
      
      const advertiserId = session.data.session.currentAdvertiserId;
      if(!advertiserId) return;
      setLoadingDashboardData(true);
      const { data, error, status } = await reportsApi.getDashboardCardsData({ advertiserId });
      if(status !== 200 || error) {
        //toast({ title: t('common.error'), description: error?.message ?? 'Unable to load dashboard card data', variant: 'destructive' });
        setLoadingDashboardData(false);
        return;
      }
      setDashboardCardData(data.data.cardTotals);
      setLoadingDashboardData(false);
    }
    setTimeout(fetchDashboardCardData, 1000);
  }, [])
  

  const colDefs = useMemo<ColDef[]>(() => [
    {
      colId: 'actions',
      headerName: '', sortable: false, filter: false,
      width: 80,
      cellRenderer: (params: ICellRendererParams) => (
        <>
        
          {
            params.data.status === 'DRAFT' ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => navigate(`/dashboard/campaigns/${params.data.id}`)}
              >
                        <Pencil className="h-3.5 w-3.5" />
              </Button>
            ): (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => navigate(`/dashboard/reports?campaign=${params.data.id}`)}
              >
                <ChartAreaIcon className="h-3.5 w-3.5" />
              </Button>
            )
          }
        </>
      ),
    },
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
      valueFormatter: (p) => `$${(p.value ?? 0).toFixed(2).toLocaleString()}`,
      sortable: false
    },
    {
      headerName: 'Utilization', width: 140,
      cellRenderer: UtilizationRenderer,
      valueGetter: (p) => {
        const c = p.data as Campaign;
        return c.totalBudget > 0 ? Math.min(100, Math.round(((c.spend ?? 0) / c.totalBudget) * 100)) : 0;
      },
      sortable: false,
    },
    {
      field: 'impressions', headerName: 'Impressions', width: 120, type: 'numericColumn',
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
      valueFormatter: (p) => p.value != null ? `${p.value?.toFixed(0)}%` : '—',
      sortable: false,
    },
    {
      headerName: 'eCPM', width: 90, type: 'numericColumn',
      valueGetter: (p) => {
        try{
          const c = p.data as Campaign;
          if(c.cpm){
            return c.cpm;
          }
          return null;
        }catch(err){
          return null;
        }
      },
      valueFormatter: (p) => p.value != null ? `$${p.value.toFixed(2)}` : '—',
      sortable: false,
    },
  ], [navigate]);

  // The selection and action columns handle their own clicks; anywhere else opens the campaign.
  const onCellClicked = useCallback((e: CellClickedEvent<Campaign>) => {
    const colId = e.column.getColId();
    if (colId === 'actions' || colId === 'ag-Grid-SelectionColumn') return;
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
    <div className="max-w-[1400px] mx-auto space-y-6">

      <Helmet>
        <title>EARO | Campaigns</title>
      </Helmet>
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
      <StatCard label="Total Impressions" value={dashboardCardData.impressions.toLocaleString()} icon={Eye} loading={loadingDashboardData} />
        <StatCard label="Total Spend" value={`$${dashboardCardData.totalSpend?.toFixed(2).toLocaleString()}`} icon={DollarSign} loading={loadingDashboardData} />
        <StatCard label="Total Reach" value={dashboardCardData.demandAudioReachUniqueUsers.toLocaleString()} icon={MousePointerClick} loading={loadingDashboardData} />
        <StatCard label="CPA" value={`$${dashboardCardData.attributionCPAInUSD.toFixed(2)}`} icon={Target} loading={loadingDashboardData} />
  
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex justify-between'>
            Campaign Performance
            <Button variant="outline" size="sm" className="ml-4" onClick={refresh} >
              <RefreshCcw className="h-4 w-4 mr-2" />
            </Button>
          </CardTitle>
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
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedCampaigns.length > 0 && (
          <div className="mx-6 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
            <p className="text-sm font-medium text-foreground">
              {selectedCampaigns.length} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => navigate(`/dashboard/reports?campaign=${selectedCampaigns[0].id}`)}
                disabled={!canViewReport}
              >
                <ChartAreaIcon className="h-3.5 w-3.5 mr-1.5" />
                View report
              </Button>
              {canManage && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8" disabled={!canArchive || archiving}>
                      <Archive className="h-3.5 w-3.5 mr-1.5" />
                      Archive
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive {selectedCampaigns.length} campaign{selectedCampaigns.length > 1 ? 's' : ''}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Archived campaigns are hidden from this list. You can still find them with the Archived status filter.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="ghost" size="sm" className="h-8" onClick={() => gridRef.current?.api.deselectAll()}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          </div>
        )}
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
              {!hasActiveFilters && (role === "ADMIN" || role === "EDITOR" ) && (
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
                  ref={gridRef}
                  theme={appGridTheme}
                  modules={[AllCommunityModule]}
                  rowData={campaigns}
                  getRowId={getRowId}
                  rowSelection={ROW_SELECTION}
                  selectionColumnDef={SELECTION_COLUMN_DEF}
                  onSelectionChanged={onSelectionChanged}
                  columnDefs={colDefs}
                  defaultColDef={DEFAULT_COL_DEF}
                  suppressMultiSort
                  onCellClicked={onCellClicked}
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
