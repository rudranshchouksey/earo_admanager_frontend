import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import type { LocationData } from '@/components/dashboard/campaign-wizard/CampaignInventoryStep';
import { MOCK_CITIES_DATA } from '@/components/dashboard/campaign-wizard/CampaignInventoryStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
// import { useDevFlags } from '@/contexts/DevFlagsContext';

import CampaignSetupStep from '@/components/dashboard/campaign-wizard/CampaignSetupStep';
import CampaignScheduleStep from '@/components/dashboard/campaign-wizard/CampaignScheduleStep';
import CampaignInventoryStep from '@/components/dashboard/campaign-wizard/CampaignInventoryStep';
import CampaignTargetingStep from '@/components/dashboard/campaign-wizard/CampaignTargetingStep';
import CampaignBudgetStep from '@/components/dashboard/campaign-wizard/CampaignBudgetStep';
import CampaignPaymentStep from '@/components/dashboard/campaign-wizard/CampaignPaymentStep';
import ForecastSidebar from '@/components/dashboard/campaign-wizard/ForecastSidebar';
import CampaignSummary from '@/components/dashboard/campaign-wizard/CampaignSummary';
import AudienceExtensionStep from '@/components/dashboard/campaign-wizard/AudienceExtensionStep';
import type { AudienceExtensionData } from '@/components/dashboard/campaign-wizard/AudienceExtensionStep';
import CampaignLaunchModal from '@/components/dashboard/campaign-wizard/CampaignLaunchModal';
import { useSessionFlags } from '@/hooks/useSessionFlags';

export default function CampaignWizard() {
  const navigate = useNavigate();
  const { isPro } = useSessionFlags();
  const [saving, setSaving] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  const [setup, setSetup] = useState<{ adId: string; campaignName: string; adName?: string; externalCampaignId?: string }>({ adId: '', campaignName: '' });
  const [schedule, setSchedule] = useState(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(today), endDate: fmt(end) };
  });
  const { geoData, isLoading: geoLoading } = useGeoLocation();
  const [inventory, setInventory] = useState<LocationData>({ country: '', countryCode: '', businessLocations: [] });
  const [geoApplied, setGeoApplied] = useState(false);
  const [targeting, setTargeting] = useState({ gender: 'all', ageRanges: ['18-24', '25-34', '35-44', '45-54', '55-65'] as string[], deviceTypes: ['Mobile', 'Desktop'] as string[], inventoryTypes: ['Podcast'] as string[], podcastTopics: [] as string[] });
  const [budget, setBudget] = useState({ dailyBudget: '', totalBudget: '', currency: 'USD' });
  const [payment, setPayment] = useState({ paymentMethod: '', couponCode: '' });
  const [audienceExtension, setAudienceExtension] = useState<AudienceExtensionData>({
    enabled: false,
    banners: [],
    impressionPixel: '',
  });

  // Completion checks
  const setupDone = !!(setup.adId && setup.campaignName.trim());
  const scheduleDone = !!(schedule.startDate && schedule.endDate);
  const inventoryDone = !!(inventory.country || (inventory.selectedCountries && inventory.selectedCountries.length > 0));
  const targetingDone = true;
  const budgetDone = Number(budget.totalBudget) > 0;

  // Auto-fill country from geo-detect
  useEffect(() => {
    if (geoData && !geoApplied) {
      const code = geoData.countryCode || '';
      const name = geoData.country !== 'your country' ? geoData.country : '';
      setInventory(prev => ({
        ...prev,
        country: name || prev.country,
        countryCode: code || prev.countryCode,
        selectedCountries: code ? [code] : prev.selectedCountries,
      }));
      setGeoApplied(true);
    }
  }, [geoData, geoApplied]);

  const canLaunch = setupDone && scheduleDone && inventoryDone && budgetDone;

  const durationDays = schedule.startDate && schedule.endDate
    ? Math.max(1, Math.ceil((new Date(schedule.endDate).getTime() - new Date(schedule.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Summary text helpers
  const getSummaryText = (section: string): string => {
    switch (section) {
      case 'setup': {
        const parts: string[] = [];
        if (setup.adName) parts.push(setup.adName);
        if (setup.campaignName) parts.push(setup.campaignName);
        return parts.join(' · ') || 'Untitled';
      }
      case 'schedule': {
        if (!schedule.startDate || !schedule.endDate) return '';
        const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${fmt(schedule.startDate)} – ${fmt(schedule.endDate)} (${durationDays} days)`;
      }
      case 'inventory': {
        const parts: string[] = [];
        const selectedCities = inventory.selectedCities || [];
        if (selectedCities.length > 0) {
          const cityNames = selectedCities
            .map(id => {
              const allCities = Object.values(MOCK_CITIES_DATA).flat();
              return allCities.find((c: { id: string; name: string }) => c.id === id)?.name;
            })
            .filter(Boolean);
          if (cityNames.length <= 3) {
            parts.push(cityNames.join(', '));
          } else {
            parts.push(`${cityNames.slice(0, 2).join(', ')} +${cityNames.length - 2} more`);
          }
        } else if (inventory.country) {
          parts.push(inventory.country);
        }
        if (inventory.businessLocations.length > 0) parts.push(`${inventory.businessLocations.length} location(s)`);
        return parts.join(', ') || 'Not set';
      }
      case 'targeting': {
        const parts: string[] = [];
        if (targeting.podcastTopics.length > 0) {
          const interests = targeting.podcastTopics;
          if (interests.length <= 2) {
            parts.push(interests.join(', '));
          } else {
            parts.push(`${interests.slice(0, 2).join(', ')} +${interests.length - 2}`);
          }
        }
        parts.push(targeting.gender === 'all' ? 'All genders' : targeting.gender);
        if (targeting.ageRanges.length > 0) parts.push(targeting.ageRanges.slice(0, 2).join('/') + (targeting.ageRanges.length > 2 ? '+' : ''));
        return parts.join(', ');
      }
      case 'budget':
        return budget.dailyBudget && budget.totalBudget
          ? `$${Number(budget.dailyBudget).toLocaleString()}/day, $${Number(budget.totalBudget).toLocaleString()} total`
          : budget.totalBudget ? `$${Number(budget.totalBudget).toLocaleString()} total` : '';
      default:
        return '';
    }
  };

  // Build summary items for sidebar
  const summaryLabels: Record<string, string> = { setup: 'Your Ad', schedule: 'Schedule', budget: 'Budget', inventory: 'Location', targeting: 'Audience' };
  const summaryItems = (['setup', 'schedule', 'budget', 'inventory', 'targeting'] as const)
    .filter(key => {
      const doneMap: Record<string, boolean> = { setup: setupDone, budget: budgetDone, inventory: inventoryDone, targeting: targetingDone, schedule: scheduleDone };
      return doneMap[key];
    })
    .map(key => ({
      key,
      label: summaryLabels[key],
      value: getSummaryText(key),
      icon: CheckCircle2,
    }));

  const saveCampaign = async (status: 'draft' | 'active') => {
    setSaving(true);
    try {
      // const { data: { session } } = await supabase.auth.getSession();
      // if (!session) throw new Error('Not authenticated');

      // const { error } = await supabase.from('campaigns').insert({
      //   user_id: session.user.id,
      //   ad_id: setup.adId,
      //   name: setup.campaignName,
      //   campaign_type: 'one_off',
      //   status,
      //   start_date: schedule.startDate,
      //   end_date: schedule.endDate,
      //   budget: Number(budget.totalBudget),
      //   currency: budget.currency,
      //   target_locations: [{
      //     country: inventory.country,
      //     countryCode: inventory.countryCode,
      //     businessLocations: inventory.businessLocations,
      //   }],
      // });

      // if (error) throw error;

      if (status === 'active') {
        setShowLaunchModal(true);
      } else {
        toast({ title: 'Draft saved' });
        navigate('/dashboard/campaigns');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Render a section card — always visible, no collapse
  let sectionCounter = 0;
  const renderSection = (
    title: string,
    done: boolean,
    children: React.ReactNode,
  ) => {
    sectionCounter++;
    const num = sectionCounter;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
              {num}
            </span>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className={done ? 'pt-0' : undefined}>{children}</CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Create Campaign</h1>
        <p className="text-muted-foreground">Fill in each section to configure your campaign</p>
      </div>

      {/* Main content + sidebar */}
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        <div className="space-y-4">
          {/* Your Ad */}
          {renderSection('Your Ad', setupDone,
            <CampaignSetupStep data={setup} onChange={setSetup} />
          )}

          {/* Schedule */}
          {renderSection('Schedule', scheduleDone,
            <CampaignScheduleStep data={schedule} onChange={setSchedule} />
          )}

          {/* Budget */}
          {renderSection('Budget', budgetDone,
            <CampaignBudgetStep data={budget} onChange={setBudget} durationDays={durationDays || 7} inventoryCount={targeting.inventoryTypes.length} />
          )}

          {/* Location */}
          {renderSection('Location', inventoryDone,
            <CampaignInventoryStep data={inventory} onChange={setInventory} isLoading={geoLoading && !geoApplied} />
          )}

          {/* Audience */}
          {renderSection('Audience', targetingDone,
            <CampaignTargetingStep data={targeting} onChange={setTargeting} />
          )}

          {/* Audience Extension — Pro only */}
          {isPro && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
                    6
                  </span>
                  <CardTitle className="text-lg">Audience Extension</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AudienceExtensionStep
                  data={audienceExtension}
                  onChange={setAudienceExtension}
                  dailyBudget={Number(budget.dailyBudget) || 0}
                />
              </CardContent>
            </Card>
          )}

          {/* Payment — Express only */}
          {!isPro && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
                    6
                  </span>
                  <CardTitle className="text-lg">Payment</CardTitle>
                </div>
              </CardHeader>
              <CardContent><CampaignPaymentStep data={payment} onChange={setPayment} /></CardContent>
            </Card>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/campaigns')} disabled={saving}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveCampaign('draft')} disabled={saving || !setupDone}>
                Save Draft
              </Button>
              <Button onClick={() => saveCampaign('active')} disabled={saving || !canLaunch}>
                {saving ? 'Launching...' : isPro ? 'Launch Campaign' : 'Pay & Launch'}
              </Button>
            </div>
          </div>
        </div>

        {/* Forecast + Summary sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ zIndex: 10 }}>
            <CampaignSummary items={summaryItems} />
            <ForecastSidebar
              totalBudget={Number(budget.totalBudget) || 0}
              dailyBudget={Number(budget.dailyBudget) || 0}
              inventoryTypes={targeting.inventoryTypes}
              durationDays={durationDays}
              ageRangeCount={targeting.ageRanges.length}
              deviceTypeCount={targeting.deviceTypes.length}
              hasLocation={!!inventory.country}
            />
          </div>
        </div>
      </div>
      <CampaignLaunchModal open={showLaunchModal} onDone={() => navigate('/dashboard/campaigns')} />
    </div>
  );
}
