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

import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, type ICellRendererParams, type RowClickedEvent } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { Campaign, campaignApi } from '@/services/campaign';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
import { auth } from '@/services/auth';
import { advertiserApi } from '@/services/advertiser';


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
  const isMobile = useIsMobile();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('SCHEDULED');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { t } = useTranslation();

  useEffect(() => {
    // const fetchCampaigns = async () => {
    //   const { data } = await supabase
    //     .from('campaigns')
    //     .select('id, name, status, campaign_type, start_date, end_date, budget, actual_spend, actual_impressions, reach, ltr, currency')
    //     .order('created_at', { ascending: false });
    //   setCampaigns(data && data.length > 0 ? data : mockCampaigns);
    //   setLoading(false);
    // };
    // fetchCampaigns();
    
    const fetchCampaigns = async () => {
      setLoading(true);
    
      const session = await auth.getSession();
      if(!session) {
        toast({ title: t('common.error'), description: 'Unauthorized', variant: 'destructive' });
        setCampaigns([]);
        setLoading(false);
        return;
      }

      console.log("session here ", {session});


      let advertiserId = session.data.session.currentAdvertiserId;

      if(!advertiserId) {

        /// fetch the advertisers and set the first one as the advertiserId
        const { data: advertisersRes, status: advertisersStatus, error: advertisersError, message: advertisersMessage } = await advertiserApi.getAdvertisers(session.data.session.currentOrganizationId);
        console.log("advertisersRes here ", {advertisersRes, advertisersStatus, advertisersError, advertisersMessage});

        if(advertisersStatus !== 200 || advertisersError) {
          toast({ title: t('common.error'), description: advertisersMessage ?? 'Unable to load advertisers', variant: 'destructive' });
          setCampaigns([]);
          setLoading(false);
          return;
        }


        const advertisers = advertisersRes.data;
        console.log("advertisers here ", {advertisers});
        if(advertisers.length > 0) {
          advertiserId = advertisers[0].id;
          auth.setCurrentAdvertiserId(advertiserId, advertisers[0].isPro);
        }
      }
    
      const { data, status, error, message } = await campaignApi.getCampaigns({page, limit, search, status: statusFilter, advertiserId: advertiserId});
      if(status !== 200 || error) {
        toast({ title: t('common.error'), description: message ?? 'Unable to load campaigns', variant: 'destructive' });
        setCampaigns([]);
        setLoading(false);
        return;
      }
      console.log("data here ", data?.data);
      setCampaigns(data?.data ?? []);
      setLoading(false);
    };
    fetchCampaigns();
  }, [page, limit, search, statusFilter]);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesStatus;
    });
  }, [campaigns, statusFilter]);

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
    { field: 'campaignName', headerName: 'Campaign', flex: 2, minWidth: 160, filter: true },
    { field: 'status', headerName: 'Status', width: 110, cellRenderer: StatusRenderer },
    {
      headerName: 'Dates', width: 200,
      valueGetter: (p) => `${p.data.startDate} — ${p.data.endDate}`,
      cellStyle: { display: 'flex', alignItems: 'center', fontSize: '0.75rem' },
    },
    {
      field: 'totalBudget', headerName: 'Budget', width: 110, type: 'numericColumn',
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
    },
    {
      field: 'spend', headerName: 'Spend', width: 110, type: 'numericColumn',
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
    },
    {
      headerName: 'Utilization', width: 140,
      cellRenderer: UtilizationRenderer,
      sortable: true,
      valueGetter: (p) => {
        const c = p.data as Campaign;
        return c.budget > 0 ? Math.min(100, Math.round(((c.actual_spend ?? 0) / c.budget) * 100)) : 0;
      },
    },
    {
      field: 'actual_impressions', headerName: 'Impressions', width: 120, type: 'numericColumn',
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
    },
    {
      field: 'reach', headerName: 'Reach', width: 100, type: 'numericColumn',
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
        const impr = c.impressions ?? 0;
        const spend = c.spend ?? 0;
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
          See Details
        </Button>
      ),
    },
  ], [navigate]);

  const onRowClicked = useCallback((e: RowClickedEvent<Campaign>) => {
    if (e.data) navigate(`/dashboard/campaigns/${e.data.id}`);
  }, [navigate]);

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

      {/* Performance table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {campaigns.length === 0 ? 'No campaigns yet' : 'No matching campaigns'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {campaigns.length === 0
                ? 'Create your first campaign to start reaching listeners.'
                : 'Try adjusting your search or filters.'}
            </p>
            {campaigns.length === 0 && (
              <Button onClick={() => navigate('/dashboard/campaigns/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardContent>
            {isMobile ? (
              <MobileDataCards
                data={filtered.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))}
                emptyMessage="No campaigns match your search"
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
                      <MobileStatRow label="Budget" value={`$${c.budget.toLocaleString()}`} />
                      <MobileStatRow label="Spend" value={`$${(c.actual_spend ?? 0).toLocaleString()}`} />
                      <MobileStatRow label="Impressions" value={(c.actual_impressions ?? 0).toLocaleString()} />
                      <MobileStatRow label="LTR" value={c.ltr != null ? `${c.ltr}%` : '—'} />
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => navigate(`/dashboard/reports?campaign=${c.id}`)}
                    >
                      See Details
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
