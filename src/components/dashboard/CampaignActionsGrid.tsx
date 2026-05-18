import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Clock, Play, CalendarCheck, FileEdit } from 'lucide-react';
import { CampaignActionData, reportsApi } from '@/services/reports';
import { auth } from '@/services/auth';

type TabKey = 'ALL' | 'ALMOST_ENDING' | 'UNDERPERFORMING' | 'DOING_WELL' | 'STARTING_SOON' | 'ENDED_LAST_10_DAYS' | 'DRAFTS';

type TabMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const PAGE_LIMIT = 10;

const INITIAL_META: Record<TabKey, TabMeta> = {
  ALL: { total: 0, page: 0, limit: PAGE_LIMIT, totalPages: 1 },
  ALMOST_ENDING: { total: 0, page: 0, limit: PAGE_LIMIT, totalPages: 1 },
  UNDERPERFORMING: { total: 0, page: 0, limit: PAGE_LIMIT, totalPages: 1 },
  DOING_WELL: { total: 0, page: 0, limit: PAGE_LIMIT, totalPages: 1 },
  STARTING_SOON: { total: 0, page: 0, limit: PAGE_LIMIT, totalPages: 1 },
  ENDED_LAST_10_DAYS: { total: 0, page: 0, limit: PAGE_LIMIT, totalPages: 1 },
  DRAFTS: { total: 0, page: 0, limit: PAGE_LIMIT, totalPages: 1 },
};

const TAB_KEYS: TabKey[] = [
  'ALL',
  'ALMOST_ENDING',
  'STARTING_SOON',
  'ENDED_LAST_10_DAYS',
  'DRAFTS',
];

const CAMPAIGN_CATEGORIES: { value: string; key: TabKey; label: string; icon: ReactNode }[] = [
  { value: 'All', key: 'ALL', label: 'All', icon: null },
  { value: 'Almost Ending', key: 'ALMOST_ENDING', label: 'Almost Ending', icon: <Clock className="size-3.5" /> },
  { value: 'Starting Soon', key: 'STARTING_SOON', label: 'Starting Soon', icon: <Play className="size-3.5" /> },
  { value: 'Ended Last 10 Days', key: 'ENDED_LAST_10_DAYS', label: 'Ended Last 10 Days', icon: <CalendarCheck className="size-3.5" /> },
  { value: 'Drafts', key: 'DRAFTS', label: 'Drafts', icon: <FileEdit className="size-3.5" /> },
];

const TAB_VALUE_TO_KEY: Record<string, TabKey> = Object.fromEntries(
  CAMPAIGN_CATEGORIES.map((c) => [c.value, c.key]),
) as Record<string, TabKey>;

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-primary/10 text-primary',
};

function campaignDisplayName(campaign: CampaignActionData) {
  return campaign.campaignName || campaign.campaignDB;
}

function appendCampaigns(existing: CampaignActionData[], incoming: CampaignActionData[]) {
  const ids = new Set(existing.map((c) => c.id));
  const unique = incoming.filter((c) => !ids.has(c.id));
  return [...existing, ...unique];
}

function ActionButtons({ group, campaign }: { group: string; campaign: CampaignActionData }) {
  const navigate = useNavigate();
  const name = campaignDisplayName(campaign);

  if (group === 'Almost Ending') {
    return (
      <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast({ title: 'Extend Campaign', description: `Campaign "${name}" extension requested.` }); }}>
        Extend Campaign
      </Button>
    );
  }
  if (group === 'Doing Well') {
    return (
      <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); toast({ title: 'Increase Budget', description: `Budget increase for "${name}" requested.` }); }}>
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
  const [campaignsByTab, setCampaignsByTab] = useState<Record<TabKey, CampaignActionData[]>>({
    ALL: [],
    ALMOST_ENDING: [],
    UNDERPERFORMING: [],
    DOING_WELL: [],
    STARTING_SOON: [],
    ENDED_LAST_10_DAYS: [],
    DRAFTS: [],
  });
  const [campaignsMeta, setCampaignsMeta] = useState(INITIAL_META);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLTableRowElement>(null);
  const loadingMoreRef = useRef(false);
  const campaignsMetaRef = useRef(campaignsMeta);
  campaignsMetaRef.current = campaignsMeta;

  const activeTabKey = TAB_VALUE_TO_KEY[activeTab] ?? 'ALL';
  const campaignsData = campaignsByTab[activeTabKey];
  const activeMeta = campaignsMeta[activeTabKey];
  const hasMore = activeMeta.page < activeMeta.totalPages;

  const fetchTabPage = useCallback(async (
    tabKey: TabKey,
    pageNum: number,
    append: boolean,
    advertiserId: string,
  ) => {
    const { data, error, status } = await reportsApi.getDashboardCampaignActions({
      advertiserId,
      page: pageNum.toString(),
      limit: PAGE_LIMIT.toString(),
      tab: tabKey,
    });

    if (status !== 200 || error) {
      console.error(error);
      return false;
    }

    setCampaignsByTab((prev) => ({
      ...prev,
      [tabKey]: append ? appendCampaigns(prev[tabKey], data.data) : data.data,
    }));
    setCampaignsMeta((prev) => ({ ...prev, [tabKey]: data.meta }));
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAllTabs = async () => {
      setInitialLoading(true);
      const { data: { session } } = await auth.getSession();
      if (!session) {
        console.error('Not authenticated');
        setInitialLoading(false);
        return;
      }

      const advertiserId = session.currentAdvertiserId || '';

      await Promise.allSettled(
        TAB_KEYS.map((tabKey) => fetchTabPage(tabKey, 1, false, advertiserId)),
      );

      if (!cancelled) {
        setInitialLoading(false);
      }
    };


    loadAllTabs();
    return () => { cancelled = true; };
  }, [fetchTabPage]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || initialLoading) return;

    const meta = campaignsMetaRef.current[activeTabKey];
    if (meta.page >= meta.totalPages) return;

    const nextPage = meta.page + 1;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const { data: { session } } = await auth.getSession();
      if (!session) return;

      await fetchTabPage(
        activeTabKey,
        nextPage,
        true,
        session.currentAdvertiserId || '',
      );
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [activeTabKey, fetchTabPage, initialLoading]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!root || !sentinel || initialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMoreRef.current) {
          loadMore();
        }
      },
      { root, rootMargin: '80px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTabKey, hasMore, loadMore, initialLoading]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const showEmpty = !initialLoading && campaignsData.length === 0;
  const showTable = !initialLoading && campaignsData.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Actions</CardTitle>
      </CardHeader>

      <div className="px-4 pb-4 overflow-x-auto">
        <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1" role="tablist">
          {CAMPAIGN_CATEGORIES.map((opt) => (
            <button
              key={opt.key}
              role="tab"
              aria-selected={activeTab === opt.value}
              onClick={() => handleTabChange(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                activeTab === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              {opt.icon && <span className="inline-flex">{opt.icon}</span>}
              {opt.label} ({initialLoading ? '…' : campaignsMeta[opt.key].total})
            </button>
          ))}
        </div>
      </div>

      <CardContent className={isMobile ? 'px-3 pb-3 pt-0' : 'p-0'}>
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-auto max-h-[min(480px,60vh)]"
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
              <tr className="border-b border-border">
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
              {initialLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">Loading...</td>
                </tr>
              )}
              {showEmpty && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground text-sm">No campaigns found</td>
                </tr>
              )}
              {showTable && campaignsData.map((campaign) => (
                <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-2 font-medium text-foreground">{campaignDisplayName(campaign)}</td>
                  <td className="px-3 py-2"><Badge variant="secondary" className={statusColors[campaign.status?.toLowerCase()] || ''}>{campaign.status}</Badge></td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(campaign.startDate).toDateString()} — {new Date(campaign.endDate).toDateString()}</td>
                  <td className="px-3 py-2 text-right text-foreground">${Number(campaign.totalBudget).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-foreground">${(campaign.campaignBudget ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-foreground">{(campaign.impressions ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-foreground">{campaign.ltr != null ? `${campaign.ltr}%` : '—'}</td>
                  <td className="px-3 py-2"><ActionButtons group={activeTab} campaign={campaign} /></td>
                </tr>
              ))}
              {showTable && hasMore && (
                <tr ref={loadMoreSentinelRef}>
                  <td colSpan={8} className="px-4 py-3 text-center text-muted-foreground text-sm">
                    {loadingMore ? 'Loading more...' : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
