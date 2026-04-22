import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Calendar, MapPin, Users, CreditCard, ChevronDown, ChevronUp, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import type { LocationData } from '@/components/dashboard/campaign-wizard/CampaignInventoryStep';

import LaunchAdCard from '@/components/dashboard/launch/LaunchAdCard';
import LaunchPodcastShelf from '@/components/dashboard/launch/LaunchPodcastShelf';
import CampaignScheduleStep from '@/components/dashboard/campaign-wizard/CampaignScheduleStep';
import CampaignBudgetStep from '@/components/dashboard/campaign-wizard/CampaignBudgetStep';
import CampaignInventoryStep from '@/components/dashboard/campaign-wizard/CampaignInventoryStep';
import CampaignTargetingStep from '@/components/dashboard/campaign-wizard/CampaignTargetingStep';
import CampaignPaymentStep from '@/components/dashboard/campaign-wizard/CampaignPaymentStep';
import ForecastSidebar from '@/components/dashboard/campaign-wizard/ForecastSidebar';
import CampaignLaunchModal from '@/components/dashboard/campaign-wizard/CampaignLaunchModal';

interface AdData {
  id: string;
  brandName: string;
  audioUrl: string;
  duration: number;
}

type SectionKey = 'schedule' | 'location' | 'audience' | 'payment';

export default function LaunchMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { geoData, isLoading: geoLoading } = useGeoLocation();
  const [ad, setAd] = useState<AdData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);

  const adId = searchParams.get('adId');

  // State
  const [schedule, setSchedule] = useState(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(today), endDate: fmt(end) };
  });

  const pendingBudget = localStorage.getItem('pendingBudget');
  const [budget, setBudget] = useState({
    dailyBudget: pendingBudget || '60',
    totalBudget: pendingBudget ? String(Number(pendingBudget) * 30) : '1800',
    currency: 'USD',
  });

  const [inventory, setInventory] = useState<LocationData>({
    country: '', countryCode: '', businessLocations: [],
  });
  const [geoApplied, setGeoApplied] = useState(false);

  const [targeting, setTargeting] = useState({
    gender: 'all',
    ageRanges: ['18-24', '25-34', '35-44', '45-54', '55-65'] as string[],
    deviceTypes: ['Mobile', 'Desktop'] as string[],
    inventoryTypes: ['Podcast'] as string[],
    podcastTopics: [] as string[],
  });

  const [payment, setPayment] = useState({ paymentMethod: 'card', couponCode: '' });

  // Derived
  const durationDays = schedule.startDate && schedule.endDate
    ? Math.max(1, Math.ceil((new Date(schedule.endDate).getTime() - new Date(schedule.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  const canLaunch = !!(schedule.startDate && schedule.endDate && Number(budget.totalBudget) > 0 && inventory.country && ad);

  // Fetch ad
  useEffect(() => {
    const fetchAd = async () => {
      if (adId) {
        const { data } = await supabase.from('ads').select('id, brand_name, audio_url, duration_seconds').eq('id', adId).single();
        if (data) setAd({ id: data.id, brandName: data.brand_name || 'Your Brand', audioUrl: data.audio_url || '', duration: data.duration_seconds || 15 });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('ads').select('id, brand_name, audio_url, duration_seconds').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
        if (data) setAd({ id: data.id, brandName: data.brand_name || 'Your Brand', audioUrl: data.audio_url || '', duration: data.duration_seconds || 15 });
      }
    };
    fetchAd();
  }, [adId]);

  // Auto-fill geo
  useEffect(() => {
    if (geoData && !geoApplied) {
      setInventory(prev => ({
        ...prev,
        country: geoData.country !== 'your country' ? geoData.country : prev.country,
        countryCode: geoData.countryCode || prev.countryCode,
      }));
      if (geoData.currency) setBudget(prev => ({ ...prev, currency: geoData.currency?.code || prev.currency }));
      setGeoApplied(true);
    }
  }, [geoData, geoApplied]);

  // Summary helpers
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const scheduleText = schedule.startDate && schedule.endDate ? `${fmtDate(schedule.startDate)} – ${fmtDate(schedule.endDate)} (${durationDays} days)` : 'Not set';
  const locationText = inventory.country || 'Not set';
  const audienceText = targeting.gender === 'all' ? 'Broad audience (recommended)' : `${targeting.gender}, ${targeting.ageRanges.length} age groups`;
  const paymentText = payment.paymentMethod === 'card' ? 'Credit / Debit Card' : payment.paymentMethod === 'wallet' ? 'Digital Wallet' : 'Bank Transfer';

  const toggle = (key: SectionKey) => setExpandedSection(prev => prev === key ? null : key);

  const saveCampaign = async (status: 'draft' | 'active') => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !ad) throw new Error('Not authenticated');
      const { error } = await supabase.from('campaigns').insert({
        user_id: session.user.id, ad_id: ad.id, name: `${ad.brandName} Campaign`,
        campaign_type: 'one_off', status, start_date: schedule.startDate, end_date: schedule.endDate,
        budget: Number(budget.totalBudget), currency: budget.currency,
        target_locations: [{ country: inventory.country, countryCode: inventory.countryCode, businessLocations: inventory.businessLocations }],
      });
      if (error) throw error;
      localStorage.removeItem('pendingBudget');
      localStorage.removeItem('pendingCity');
      if (status === 'active') setShowLaunchModal(true);
      else { toast({ title: 'Draft saved' }); navigate('/dashboard/campaigns'); }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // Summary row component
  const SummaryRow = ({ sectionKey, icon: Icon, label, value }: { sectionKey: SectionKey; icon: React.ElementType; label: string; value: string }) => {
    const isExpanded = expandedSection === sectionKey;
    const Chevron = isExpanded ? ChevronUp : ChevronDown;
    return (
      <button
        type="button"
        onClick={() => toggle(sectionKey)}
        className="flex items-center gap-3 w-full py-3 text-left hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground shrink-0">{label}</span>
        <span className="text-sm text-muted-foreground truncate flex-1">{value}</span>
        <span className="text-xs text-primary font-medium shrink-0 mr-1">Change</span>
        <Chevron className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
    );
  };

  if (!ad) {
    return (
      <div className="max-w-[1088px] mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded-[16px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1088px] mx-auto px-4 space-y-6 pb-24 md:pb-10">
      {/* Success Bar */}
      <div className="flex items-center gap-2.5 rounded-[12px] bg-green-50 border border-green-200 px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-800">Your ad is saved — you're ready to go live</p>
      </div>

      {/* Compact Ad Card */}
      <LaunchAdCard
        brandName={ad.brandName}
        audioUrl={ad.audioUrl}
        duration={ad.duration}
        onEdit={() => navigate(`/dashboard/ads/${ad.id}`)}
        onShare={() => {}}
      />

      {/* Configure + Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Left: single config card */}
        <Card className="rounded-[16px]">
          <CardContent className="p-6 space-y-6">
            {/* Budget — always visible hero */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-4">Set your budget</h3>
              <CampaignBudgetStep data={budget} onChange={setBudget} durationDays={durationDays} inventoryCount={targeting.inventoryTypes.length} />
            </div>

            <Separator />

            {/* Summary rows */}
            <div className="space-y-1">
              <SummaryRow sectionKey="schedule" icon={Calendar} label="Schedule" value={scheduleText} />
              {expandedSection === 'schedule' && (
                <div className="pl-7 pb-3">
                  <CampaignScheduleStep data={schedule} onChange={setSchedule} />
                </div>
              )}

              <SummaryRow sectionKey="location" icon={MapPin} label="Location" value={locationText} />
              {expandedSection === 'location' && (
                <div className="pl-7 pb-3">
                  <CampaignInventoryStep data={inventory} onChange={setInventory} isLoading={geoLoading && !geoApplied} />
                </div>
              )}

              <SummaryRow sectionKey="audience" icon={Users} label="Audience" value={audienceText} />
              {expandedSection === 'audience' && (
                <div className="pl-7 pb-3">
                  <CampaignTargetingStep data={targeting} onChange={setTargeting} />
                </div>
              )}

              <SummaryRow sectionKey="payment" icon={CreditCard} label="Payment" value={paymentText} />
              {expandedSection === 'payment' && (
                <div className="pl-7 pb-3">
                  <CampaignPaymentStep data={payment} onChange={setPayment} />
                </div>
              )}
            </div>

            <Separator />

            {/* CTA */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">You're ready to go live</p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => saveCampaign('active')}
                  disabled={saving || !canLaunch}
                  className="flex-1 gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  {saving ? 'Launching...' : 'Go Live Now'}
                </Button>
                <Button variant="outline" onClick={() => saveCampaign('draft')} disabled={saving}>
                  Save Draft
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: sticky forecast + podcast shelf */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <ForecastSidebar
              totalBudget={Number(budget.totalBudget) || 0}
              dailyBudget={Number(budget.dailyBudget) || 0}
              inventoryTypes={targeting.inventoryTypes}
              durationDays={durationDays}
              ageRangeCount={targeting.ageRanges.length}
              deviceTypeCount={targeting.deviceTypes.length}
              hasLocation={!!inventory.country}
            />
            <Card className="rounded-[16px]">
              <CardContent className="p-4">
                <LaunchPodcastShelf />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile: podcast shelf + sticky CTA */}
      <div className="lg:hidden">
        <LaunchPodcastShelf />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border lg:hidden z-50">
        <Button
          className="w-full gap-2"
          onClick={() => saveCampaign('active')}
          disabled={saving || !canLaunch}
        >
          <Rocket className="w-5 h-5" />
          {saving ? 'Launching...' : 'Go Live Now'}
        </Button>
      </div>

      <CampaignLaunchModal open={showLaunchModal} onDone={() => navigate('/dashboard/campaigns')} />
    </div>
  );
}
