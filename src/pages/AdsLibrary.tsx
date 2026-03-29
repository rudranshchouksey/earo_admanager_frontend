import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Pause, Trash2, Volume2, Download, Search, Filter } from 'lucide-react';
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
import { adsApi } from '@/services/ads';
import { campaignApi } from '@/services/campaign';

interface Ad {
  id: string;
  product_name: string;
  brand_name: string | null;
  audio_url: string | null;
  created_at: string | null;
  status: string | null;
  duration_seconds: number | null;
  tone: string | null;
}

interface AdStats {
  impressions: number;
  spend: number;
  reach: number;
  campaignCount: number;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  draft: 'bg-muted text-muted-foreground',
  processing: 'bg-yellow-100 text-yellow-800',
};

export default function AdsLibrary() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [ads, setAds] = useState<Ad[]>([]);
  const [adStats, setAdStats] = useState<Record<string, AdStats>>({});
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchAds = async () => {
    const { data: { session } } = await auth.getSession();
    if (!session) return;

    const [adsRes, campaignsRes] = await Promise.all([
      adsApi.getAds(session.user.id),
      campaignApi.getCampaigns(),
    ]);

    if (adsRes.data) setAds(adsRes.data);

    if (campaignsRes.data) {
      const stats: Record<string, AdStats> = {};
      for (const c of campaignsRes.data as { ad_id: string; actual_impressions?: number; actual_spend?: number; reach?: number }[]) {
        if (!stats[c.ad_id]) stats[c.ad_id] = { impressions: 0, spend: 0, reach: 0, campaignCount: 0 };
        stats[c.ad_id].impressions += c.actual_impressions ?? 0;
        stats[c.ad_id].spend += Number(c.actual_spend ?? 0);
        stats[c.ad_id].reach += c.reach ?? 0;
        stats[c.ad_id].campaignCount += 1;
      }
      setAdStats(stats);
    }

    setLoading(false);
  };

  useEffect(() => { fetchAds(); }, []);

  const togglePlay = useCallback((ad: Ad) => {
    if (!ad.audio_url) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === ad.id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.src = ad.audio_url;
      audio.play();
      setPlayingId(ad.id);
    }
  }, [playingId]);

  const handleDelete = async (id: string) => {
    const { error } = await adsApi.deleteAd(id);
    if (error) {
      toast({ title: t('ads.delete_failed'), variant: 'destructive' });
    } else {
      setAds((prev) => prev.filter((a) => a.id !== id));
      toast({ title: t('ads.deleted') });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlayingId(null);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, []);

  const getStats = useCallback((id: string) => adStats[id] || { impressions: 0, spend: 0, reach: 0, campaignCount: 0 }, [adStats]);
  const ecpm = (s: AdStats) => s.impressions > 0 ? ((s.spend / s.impressions) * 1000).toFixed(2) : '—';
  const cpa = (s: AdStats) => s.reach > 0 ? `$${(s.spend / s.reach).toFixed(2)}` : '—';

  const totals = useMemo(() => {
    return ads.reduce(
      (acc, ad) => {
        const s = getStats(ad.id);
        return {
          impressions: acc.impressions + s.impressions,
          spend: acc.spend + s.spend,
          reach: acc.reach + s.reach,
        };
      },
      { impressions: 0, spend: 0, reach: 0 }
    );
  }, [ads, adStats, getStats]);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
      return matchesStatus;
    });
  }, [ads, statusFilter]);

  const exportCSV = () => {
    const headers = ['Name', 'Status', 'Duration', 'Tone', 'Impressions', 'Spend', 'Conversions', 'CPA', 'eCPM', 'Created'];
    const rows = ads.map((ad) => {
      const s = getStats(ad.id);
      return [
        ad.product_name, ad.status ?? '—', ad.duration_seconds ?? '—', ad.tone ?? '—',
        s.impressions, s.spend.toFixed(2), s.reach, cpa(s), ecpm(s),
        ad.created_at ? new Date(ad.created_at).toLocaleDateString() : '—',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-ads-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cell renderers that need component state
  const PlayRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as Ad;
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={(e) => { e.stopPropagation(); togglePlay(ad); }}
        disabled={!ad.audio_url}
      >
        {playingId === ad.id ? (
          <Pause className="h-4 w-4 text-primary" />
        ) : (
          <Play className="h-4 w-4 text-primary ml-0.5" />
        )}
      </Button>
    );
  }, [playingId, togglePlay]);

  const DeleteRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as Ad;
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('modal.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('modal.delete_confirm_desc', { name: ad.product_name })}
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

  const StatusRenderer = useCallback((params: ICellRendererParams) => (
    <Badge variant="secondary" className={statusColors[params.value ?? ''] || ''}>
      {params.value ?? 'draft'}
    </Badge>
  ), []);

  const NameRenderer = useCallback((params: ICellRendererParams) => {
    const ad = params.data as Ad;
    return (
      <div>
        <p className="font-medium text-foreground truncate max-w-[200px]">{ad.product_name}</p>
        <p className="text-xs text-muted-foreground">{ad.tone ?? '—'}</p>
      </div>
    );
  }, []);

  const colDefs = useMemo<ColDef[]>(() => [
    { headerName: '', width: 50, cellRenderer: PlayRenderer, sortable: false, suppressHeaderMenuButton: true },
    { field: 'product_name', headerName: t('ad_creator.ad_name'), flex: 2, minWidth: 160, cellRenderer: NameRenderer, filter: true },
    { field: 'status', headerName: t('campaigns.status'), width: 110, cellRenderer: StatusRenderer },
    {
      field: 'duration_seconds', headerName: t('ads.duration'), width: 100, type: 'numericColumn',
      valueFormatter: (p) => p.value ? `${p.value}s` : '—',
    },
    {
      headerName: t('reports.impressions'), width: 120, type: 'numericColumn',
      valueGetter: (p) => getStats(p.data.id).impressions,
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
    },
    {
      headerName: t('campaigns.spend'), width: 100, type: 'numericColumn',
      valueGetter: (p) => getStats(p.data.id).spend,
      valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
    },
    {
      headerName: t('ads.total_conversions'), width: 110, type: 'numericColumn',
      valueGetter: (p) => getStats(p.data.id).reach,
      valueFormatter: (p) => (p.value ?? 0).toLocaleString(),
    },
    {
      headerName: 'CPA', width: 90, type: 'numericColumn',
      valueGetter: (p) => {
        const s = getStats(p.data.id);
        return s.reach > 0 ? s.spend / s.reach : null;
      },
      valueFormatter: (p) => p.value != null ? `$${p.value.toFixed(2)}` : '—',
    },
    {
      headerName: 'eCPM', width: 90, type: 'numericColumn',
      valueGetter: (p) => {
        const s = getStats(p.data.id);
        return s.impressions > 0 ? (s.spend / s.impressions) * 1000 : null;
      },
      valueFormatter: (p) => p.value != null ? `$${p.value.toFixed(2)}` : '—',
    },
    { headerName: '', width: 50, cellRenderer: DeleteRenderer, sortable: false, suppressHeaderMenuButton: true },
  ], [PlayRenderer, DeleteRenderer, StatusRenderer, NameRenderer, getStats, t]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <audio ref={audioRef} preload="none" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('ads.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('ads.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={ads.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {t('campaigns.export_csv')}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('ads.total_ads')}</p>
            <p className="text-2xl font-bold text-foreground">{ads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('ads.total_impressions')}</p>
            <p className="text-2xl font-bold text-foreground">{totals.impressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('ads.total_spend')}</p>
            <p className="text-2xl font-bold text-foreground">${totals.spend.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('ads.total_conversions')}</p>
            <p className="text-2xl font-bold text-foreground">{totals.reach.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : filteredAds.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Volume2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {ads.length === 0 ? t('ads.no_ads') : t('ads.no_matching')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {ads.length === 0 ? t('ads.no_ads_desc') : t('campaigns.adjust_filters')}
            </p>
            <Button onClick={() => navigate('/dashboard/ads/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('ads.create_audio_ad')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('ads.ad_performance')}</CardTitle>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ads.status_all')}</SelectItem>
                <SelectItem value="completed">{t('ads.status_completed')}</SelectItem>
                <SelectItem value="draft">{t('ads.status_draft')}</SelectItem>
                <SelectItem value="processing">{t('ads.status_processing')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardContent>
            {isMobile ? (
              <MobileDataCards
                data={filteredAds.filter(a => !search || a.product_name.toLowerCase().includes(search.toLowerCase()))}
                emptyMessage={t('ads.no_ads_search')}
                renderCard={(ad) => {
                  const s = getStats(ad.id);
                  return (
                    <div key={ad.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full shrink-0"
                            onClick={() => togglePlay(ad)}
                            disabled={!ad.audio_url}
                          >
                            {playingId === ad.id ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
                          </Button>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{ad.product_name}</p>
                            <p className="text-xs text-muted-foreground">{ad.tone ?? '—'}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={statusColors[ad.status ?? ''] || ''}>
                          {ad.status ?? 'draft'}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <MobileStatRow label={t('reports.impressions')} value={s.impressions.toLocaleString()} />
                        <MobileStatRow label={t('campaigns.spend')} value={`$${s.spend.toLocaleString()}`} />
                        <MobileStatRow label="eCPM" value={s.impressions > 0 ? `$${((s.spend / s.impressions) * 1000).toFixed(2)}` : '—'} />
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
                                {t('modal.delete_confirm_desc', { name: ad.product_name })}
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
              <AgGridReact
                theme={appGridTheme}
                modules={[AllCommunityModule]}
                rowData={filteredAds}
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
