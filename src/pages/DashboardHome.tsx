import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, DollarSign, MousePointerClick, Target, Volume2, Radio, TrendingUp } from 'lucide-react';
import CampaignActionsGrid from '@/components/dashboard/CampaignActionsGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/dashboard/StatCard';
import { api } from '@/services/api';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { useTranslation } from '@/contexts/TranslationContext';

export default function DashboardHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isNewUser, isPro, isAgency } = useSessionFlags();
  const [stats, setStats] = useState({ impressions: 0, spend: 0, reach: 0 });

  const mockStats = { impressions: 124500, spend: 2340, reach: 48200 };

  useEffect(() => {
    if (!isNewUser) {
      setStats(mockStats);
      return;
    }
    const fetchStats = async () => {
      const { data } = await api.getCampaignStats();
      if (data) {
        setStats({
          impressions: data.reduce((s, c) => s + (c.actual_impressions ?? 0), 0),
          spend: data.reduce((s, c) => s + (c.actual_spend ?? 0), 0),
          reach: data.reduce((s, c) => s + (c.reach ?? 0), 0),
        });
      }
    };
    fetchStats();
  }, [isNewUser]);

  const cpa = stats.reach > 0 ? (stats.spend / stats.reach).toFixed(2) : '0';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard.welcome')}</p>
      </div>

      {/* Primary CTAs — new users only */}
      {isNewUser && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {isPro && (
            <Card className="border-2 border-transparent hover:border-primary/20 hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold text-foreground">{t('dashboard.create_campaign')}</h3>
                <p className="text-sm text-muted-foreground">{t('dashboard.create_campaign_desc')}</p>
                <Button onClick={() => navigate('/dashboard/campaigns/new')}>{t('dashboard.create_campaign')}</Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-2 border-transparent hover:border-primary/20 hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">{t('dashboard.create_audio_ad')}</h3>
              <p className="text-sm text-muted-foreground">{t('dashboard.create_audio_ad_desc')}</p>
              <Button onClick={() => navigate('/dashboard/ads/new')}>{t('dashboard.create_audio_ad')}</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New User Welcome or Monthly Stats */}
      {isNewUser ? (
        <Card className="border-2 border-dashed border-primary/20">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">{t('dashboard.get_started_title')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('dashboard.get_started_desc')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Volume2, titleKey: 'dashboard.create_ai_ads', descKey: 'dashboard.create_ai_ads_desc' },
                { icon: Radio, titleKey: 'dashboard.launch_campaigns', descKey: 'dashboard.launch_campaigns_desc' },
                { icon: TrendingUp, titleKey: 'dashboard.track_performance', descKey: 'dashboard.track_performance_desc' },
              ].map((item) => (
                <div key={item.titleKey} className="flex flex-col items-center text-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t(item.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.this_month')}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('dashboard.total_impressions')} value={stats.impressions.toLocaleString()} icon={Eye} trend={stats.impressions > 0 ? t('dashboard.active') : t('dashboard.no_data_yet')} />
              <StatCard label={t('dashboard.total_spent')} value={`$${stats.spend.toLocaleString()}`} icon={DollarSign} trend={stats.spend > 0 ? t('dashboard.active') : t('dashboard.no_data_yet')} />
              <StatCard label={t('dashboard.total_reach')} value={stats.reach.toLocaleString()} icon={MousePointerClick} trend={stats.reach > 0 ? t('dashboard.active') : t('dashboard.no_data_yet')} />
              <StatCard label="CPA" value={`$${cpa}`} icon={Target} trend={stats.reach > 0 ? t('dashboard.active') : t('dashboard.no_data_yet')} />
            </div>
          </div>

          <CampaignActionsGrid />
        </>
      )}
    </div>
  );
}
