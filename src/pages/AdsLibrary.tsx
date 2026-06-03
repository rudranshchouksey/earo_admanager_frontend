import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, Trash2, Volume2, Download, Search, Filter, Pencil, RefreshCcw, Archive, Share } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDataCards, MobileStatRow } from '@/components/ui/mobile-data-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { auth } from '@/services/auth';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/TranslationContext';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, type ICellRendererParams } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { adsApi, AdData } from '@/services/ads';
import { campaignApi } from '@/services/campaign';
import { appNotifications } from '@/services/appNotifications';
import { advertiserApi } from '@/services/advertiser';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { Helmet } from 'react-helmet-async';
import ShareModal from '@/components/modals/ShareModal';

interface AdStats {
  impressions: number;
  spend: number;
  reach: number;
  campaignCount: number;
}

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-muted text-muted-foreground',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-destructive/10 text-destructive',
  REJECTED: 'bg-destructive/10 text-destructive',
  APPROVED: 'bg-green-100 text-green-800',
};

export default function AdsLibrary() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [ads, setAds] = useState<AdData[]>([]);
  const [adStats, setAdStats] = useState<Record<string, AdStats>>({});
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { role } = useSessionFlags();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingIdRef = useRef<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showShareModal, setShowshareModal] = useState(false);
  const [supportedActions, setSupportedActions] = useState({
    canShare: false,
    canEdit: false,
    canDelete: false,
  })

  const apiStatus = useMemo(() => {
    if (statusFilter === 'all') return undefined;
    // UI filters are lowercase; API expects uppercase enums.
    return statusFilter.toUpperCase() as any;
  }, [statusFilter]);

  const fetchAds = useCallback(async (opts: { page: number; limit: number; search?: string; status?: any }) => {
    const { data: { session } } = await auth.getSession();
    if (!session) return;

    let advertiserId = session.currentAdvertiserId;

    if(!advertiserId) {

      /// fetch the advertisers and set the first one as the advertiserId
      const { data: advertisersRes, status: advertisersStatus, error: advertisersError, message: advertisersMessage } = await advertiserApi.getAdvertisers(session.currentOrganizationId);
      console.log("advertisersRes here ", {advertisersRes, advertisersStatus, advertisersError, advertisersMessage});

      if(advertisersStatus !== 200 || advertisersError) {
        toast({ title: t('common.error'), description: advertisersMessage ?? 'Unable to load advertisers', variant: 'destructive' });
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

    setLoading(true);
    const { data: adsRes, error, status, message } = await adsApi.getAds({
      page: opts.page,
      limit: opts.limit,
      sortBy: "createdAt",
      advertiserId: advertiserId,
      isSaved: true,
      search: opts.search || undefined,
      status: opts.status,
    });

    console.log("adsRes here ", {adsRes, error, status, message});
    if (status !== 200 || error) {
      toast({ title: t('common.error'), description: message ?? 'Unable to load ads', variant: 'destructive' });
      setAds([]);
      setMeta((m) => ({ ...m, total: 0, totalPages: 1 }));
      setLoading(false);
      return;
    }

    setAds(adsRes.data ?? []);
    if (adsRes.meta) {
      setMeta({
        total: adsRes.meta.total,
        page: adsRes.meta.page,
        limit: adsRes.meta.limit,
        totalPages: adsRes.meta.totalPages,
      });
    }

    // if (campaignsRes.data) {
    //   const stats: Record<string, AdStats> = {};
    //   for (const c of campaignsRes.data as { ad_id: string; actual_impressions?: number; actual_spend?: number; reach?: number }[]) {
    //     if (!stats[c.ad_id]) stats[c.ad_id] = { impressions: 0, spend: 0, reach: 0, campaignCount: 0 };
    //     stats[c.ad_id].impressions += c.actual_impressions ?? 0;
    //     stats[c.ad_id].spend += Number(c.actual_spend ?? 0);
    //     stats[c.ad_id].reach += c.reach ?? 0;
    //     stats[c.ad_id].campaignCount += 1;
    //   }
    //   setAdStats(stats);
    // }

    setLoading(false);
  }, [t]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, limit]);

  // Debounced server fetch (search/status/page/limit)
  useEffect(() => {
    const handle = window.setTimeout(() => {
      fetchAds({ page, limit, search: search.trim() || undefined, status: apiStatus });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [apiStatus, fetchAds, limit, page, search]);

  // Refetch when advertiser changes in the layout
  useEffect(() => {
    return appNotifications.subscribe('advertiser:selected', async () => {
      setTimeout(() => {
        setPage(1);
        fetchAds({ page: 1, limit, search: search.trim() || undefined, status: apiStatus });  
      }, 500);
    });
  }, [apiStatus, fetchAds, limit, search]);

  const togglePlay = useCallback((ad: AdData) => {
    if (!ad.sourceUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    // If clicking the currently playing row, toggle pause.
    if (playingIdRef.current === ad.id && !audio.paused) {
      audio.pause();
      return;
    }

    playingIdRef.current = ad.id;
    audio.preload = 'none';
    audio.src = ad.sourceUrl;
    audio.load();

    const p = audio.play();
    if (p && typeof (p as Promise<void>).then === 'function') {
      (p as Promise<void>)
        .then(() => setPlayingId(ad.id))
        .catch(() => {
          // Playback can fail due to CORS, codec, or autoplay policies.
          playingIdRef.current = null;
          setPlayingId(null);
          toast({ title: t('common.error'), description: 'Unable to play audio preview', variant: 'destructive' });
        });
    } else {
      // Older browsers: assume play started.
      setPlayingId(ad.id);
    }
  }, [t]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const clear = () => {
      playingIdRef.current = null;
      setPlayingId(null);
    };
    audio.addEventListener('ended', clear);
    audio.addEventListener('pause', clear);
    audio.addEventListener('error', clear);
    return () => {
      audio.removeEventListener('ended', clear);
      audio.removeEventListener('pause', clear);
      audio.removeEventListener('error', clear);
    };
  }, []);

  const handleDelete = async (id: string) => {
    const { error, status, message } = await adsApi.deleteAd(id);

    if (status !== 200 || error) {
      toast({ title: t('ads.delete_failed'), variant: 'destructive' });
      return;
    }
    
    fetchAds({ page, limit, search: search.trim() || undefined, status: apiStatus });
    toast({ title: t('ads.deleted') });
  
  };

  const handleExportCSV = async () => {
    const { data: { session } } = await auth.getSession();
    if (!session) return;


    let advertiserId = session.currentAdvertiserId;
    if(!advertiserId) {
      const { data: advertisersRes, status: advertisersStatus, error: advertisersError, message: advertisersMessage } = await advertiserApi.getAdvertisers(session.currentOrganizationId);
      console.log("advertisersRes here ", {advertisersRes, advertisersStatus, advertisersError, advertisersMessage});
      if(advertisersStatus !== 200 || advertisersError) {
        toast({ title: t('common.error'), description: advertisersMessage ?? 'Unable to load advertisers', variant: 'destructive' });
        return;
      }
      const advertisers = advertisersRes.data;
      console.log("advertisers here ", {advertisers});
      if(advertisers.length > 0) {
        advertiserId = advertisers[0].id;
        auth.setCurrentAdvertiserId(advertiserId, advertisers[0].isPro);
      }
    }

    const {data}= await adsApi.exportAds(advertiserId);
    
    console.log("data here ", {data});
    if (!data) return;

    const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlayingId(null);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, []);

  useEffect(() => {
    
    const supportedActions = {
      canShare: false,
      canEdit: false,
      canDelete: selectedIds.length === 1,
    }

    if(selectedIds.length === 1) {
      const ad = ads.find((ad) => ad.id === selectedIds[0]);
      if(ad) {
        supportedActions.canEdit = ad.jobId !== null;
      }
    }
    
    if(selectedIds.length > 0 && selectedIds.length <= 5) {
      const isAnyUploaded = ads.some((ad) => !ad.jobId && selectedIds.includes(ad.id));
      console.log("isAnyUploaded here ", {isAnyUploaded});
      supportedActions.canShare = !isAnyUploaded;
    }



    setSupportedActions(supportedActions);
  }, [selectedIds])
  
  
  // const totals = useMemo(() => {
  //   return ads.reduce(
  //     (acc, ad) => {
  //       const s = getStats(ad.id);
  //       return {
  //         impressions: acc.impressions + s.impressions,
  //         spend: acc.spend + s.spend,
  //         reach: acc.reach + s.reach,
  //       };
  //     },
  //     { impressions: 0, spend: 0, reach: 0 }
  //   );
  // }, [ads, adStats, getStats]);

  // const filteredAds = useMemo(() => {
  //   return ads.filter((ad) => {
  //     const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
  //     return matchesStatus;
  //   });
  // }, [ads, statusFilter]);

  // const exportCSV = () => {
  //   const headers = ['Name', 'Status', 'Duration', 'Tone', 'Impressions', 'Spend', 'Conversions', 'CPA', 'eCPM', 'Created'];
  //   const rows = ads.map((ad) => {
  //     const s = getStats(ad.id);
  //     return [
  //       ad.adName, ad.status ?? '—',?? '—', ad.tone ?? '—',
  //       s.impressions, s.spend.toFixed(2), s.reach, cpa(s), ecpm(s),
  //       ad.created_at ? new Date(ad.created_at).toLocaleDateString() : '—',
  //     ];
  //   });
  //   const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  //   const blob = new Blob([csv], { type: 'text/csv' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `audio-ads-report-${new Date().toISOString().slice(0, 10)}.csv`;
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

  // Cell renderers that need component state
  const PlayRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as AdData;
    return (
      <Button
        variant="dark"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={(e) => { e.stopPropagation(); togglePlay(ad); }}
        disabled={!ad.sourceUrl}
      >
        {playingId === ad.id ? (
          <Pause className="h-4 w-4 text-white" />
        ) : (
          <Play className="h-4 w-4 text-white ml-0.5" />
        )}
      </Button>
    );
  }, [playingId, togglePlay]);

  const DeleteRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as AdData;
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('modal.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('modal.delete_confirm_desc', { name: ad.adName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(ad.id)}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [t]);

  const EditRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as AdData;
    if(!ad.jobId) return null;


    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/dashboard/ads/${ad.id}`);
        }}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    );
  }, [navigate]);


  const StatusRenderer = useCallback((params: ICellRendererParams) => (
    <Badge variant="secondary" className={statusColors[params.value ?? ''] || ''}>
      {params.value ?? 'DRAFT'}
    </Badge>
  ), []);

  const NameRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as AdData;
    return (
      <div>
        <p className="font-medium text-foreground truncate max-w-[200px]">{ad.adName}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ad.campaignGoal ?? '—'}</p>
      </div>
    );
  }, []);

  const AdTypeRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as AdData;
    return (
      <p className="text-center text-muted-foreground truncate max-w-[200px]">{ad.jobId ? 'AI' : 'Uploaded'}</p>
    );
  }, []);

  const colDefs = useMemo<ColDef<AdData>[]>(() => [
    {
      headerName: '',
      width: 44,
      pinned: 'left',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
    },
    { headerName: '', width: 50, cellRenderer: PlayRenderer, sortable: false, suppressHeaderMenuButton: true },
    { field: 'adName', headerName: t('ad_creator.ad_name'), flex: 2, minWidth: 160, cellRenderer: NameRenderer, filter: true },
    { headerName: 'Ad Type', width: 100, cellRenderer: AdTypeRenderer },
    { field: 'status', headerName: t('campaigns.status'), width: 110, cellRenderer: StatusRenderer },
    {
      field: 'duration', headerName: t('ads.duration'), width: 100,
      valueFormatter: (p) => p.value ? String(p.value) : '—',
    },
    {
      field: 'impressions', headerName: t('reports.impressions'), width: 130, type: 'numericColumn',
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
    },
    {
      field: 'spend', headerName: t('campaigns.spend'), width: 110, type: 'numericColumn',
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
    },
    {
      field: 'conversions', headerName: t('ads.total_conversions'), width: 130, type: 'numericColumn',
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
    },
    {
      field: 'CPA', headerName: 'CPA', width: 100,
      valueFormatter: (p) => p.value ? String(p.value) : '—',
    },
    {
      field: 'eCPM', headerName: 'eCPM', width: 100,
      valueFormatter: (p) => p.value ? String(p.value) : '—',
    },
    {
      field: 'pixelUrl', headerName: 'Pixel URL', width: 100,
      valueFormatter: (p) => p.value ? String(p.value) : '—',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 130,
      valueFormatter: (p) => p.value ? new Date(String(p.value)).toLocaleDateString() : '—',
    },
  ], [PlayRenderer, DeleteRenderer, StatusRenderer, NameRenderer, t]);

  return (
    <>
      <ShareModal open={showShareModal} onClose={() => setShowshareModal(false)} ids={selectedIds} />

      <div className="max-w-[1400px] mx-auto space-y-6">
        <audio ref={audioRef} preload="none" />


      
        <Helmet>
          <title>EARO | Audio Ads</title>
        </Helmet>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('ads.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('ads.subtitle')}</p>
          </div>
          <Button variant="outline" 
          onClick={handleExportCSV} 
          disabled={ads.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            {t('campaigns.export_csv')}
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t('ads.total_ads')}</p>
              <p className="text-2xl font-bold text-foreground">{meta.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t('ads.total_impressions')}</p>
              {/* <p className="text-2xl font-bold text-foreground">{totals.impressions.toLocaleString()}</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t('ads.total_spend')}</p>
              {/* <p className="text-2xl font-bold text-foreground">${totals.spend.toLocaleString()}</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{t('ads.total_conversions')}</p>
              {/* <p className="text-2xl font-bold text-foreground">{totals.reach.toLocaleString()}</p> */}
            </CardContent>
          </Card>
        </div>

        {/* Performance table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
        ) : ads.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Volume2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {ads.length === 0 ? t('ads.no_ads') : t('ads.no_matching')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {ads.length === 0 ? t('ads.no_ads_desc') : t('campaigns.adjust_filters')}
              </p>
              {
                (role === "ADMIN" || role === "EDITOR" ) && (
                  <Button onClick={() => navigate('/dashboard/ads/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('ads.create_audio_ad')}
                </Button>                  
                )
              }
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className='flex justify-between'>
                {t('ads.ad_performance')}
                
                <Button variant="outline" size="sm" className="ml-4" onClick={() => fetchAds({ page, limit, search: search.trim() || undefined, status: apiStatus })} >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                </Button>
                
                </CardTitle>
            </CardHeader>
            <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('ads.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('ads.status_all')}</SelectItem>
                  <SelectItem disabled className="text-xs font-semibold text-muted-foreground" value="_approval_header">— Ad Approval —</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="not approved">Not Approved</SelectItem>
                  <SelectItem disabled className="text-xs font-semibold text-muted-foreground" value="_campaign_header">— Campaign —</SelectItem>
                  <SelectItem value="draft">{t('ads.status_draft')}</SelectItem>
                  <SelectItem value="processing">{t('ads.status_processing')}</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">{t('ads.status_completed')}</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select> */}
            </div>

            {selectedIds.length > 0 && (
              <div className="mx-6 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
                <p className="text-sm font-medium text-foreground">
                  {selectedIds.length} selected
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => setShowshareModal(true)} disabled={!supportedActions.canShare}>
                    <Share className="h-3.5 w-3.5 mr-1.5" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => console.log("edit")} disabled={!supportedActions.canEdit}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8" disabled={!supportedActions.canDelete}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.length} ad{selectedIds.length > 1 ? 's' : ''}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the selected ads. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(selectedIds[0])}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}

            <CardContent>
              {isMobile ? (
                <MobileDataCards
                  data={ads.filter(a => !search || a.adName.toLowerCase().includes(search.toLowerCase()))}
                  emptyMessage={t('ads.no_ads_search')}
                  renderCard={(ad) => {
                    return (
                      <div key={ad.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full shrink-0"
                              onClick={() => togglePlay(ad)}
                              disabled={!ad.sourceUrl}
                            >
                              {playingId === ad.id ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
                            </Button>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{ad.adName}</p>
                              {/* <p className="text-xs text-muted-foreground">{ad.tone ?? '—'}</p> */}
                            </div>
                          </div>
                          <Badge variant="secondary" className={statusColors[ad.status ?? ''] || ''}>
                            {ad.status ?? 'DRAFT'}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <MobileStatRow label={t('reports.impressions')} value={(ad.impressions ?? 0).toLocaleString()} />
                          <MobileStatRow label={t('campaigns.spend')} value={`$${(ad.spend ?? 0).toLocaleString()}`} />
                          <MobileStatRow label="eCPM" value={ad.eCPM ? String(ad.eCPM) : '—'} />
                        </div>
                        <div className="flex justify-end">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                {t('common.delete')}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('modal.delete_confirm_title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('modal.delete_confirm_desc', { name: ad.adName })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(ad.id)}>{t('common.delete')}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  }}
                />
              ) : (
                <>
                  <AgGridReact
                    theme={appGridTheme}
                    modules={[AllCommunityModule]}
                    rowData={ads}
                    columnDefs={colDefs}
                    quickFilterText={search}
                    domLayout="autoHeight"
                    suppressCellFocus
                    animateRows
                    getRowId={(p) => p.data.id}
                    rowSelection="multiple"
                    onSelectionChanged={(e) => setSelectedIds(e.api.getSelectedRows().map((r: AdData) => r.id))}                
                  />
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
        )}
      </div>
    </>
  );
}
