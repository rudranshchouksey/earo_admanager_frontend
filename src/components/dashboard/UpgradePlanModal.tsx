import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { auth } from '@/services/auth';
import { organizationApi } from '@/services/organization';
import { toast } from '@/hooks/use-toast';
import { advertiserApi } from '@/services/advertiser';
import { logger } from "@/lib/logger";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: "Pro" | "Express" | "Agency";
  requestedForAgency?: boolean;
}

const expressFeaturesIntro = 'All features included in the Express plan:';
const proFeaturesIntro = (
  <>
    All features in Express, <span className="font-semibold">plus</span>:
  </>
);
const agencyFeaturesIntro = (
  <>
    All features in Pro, <span className="font-semibold">plus</span>:
  </>
);

const expressFeatures = [
  'AI powered ad creation tools',
  'Multi-language script generation',
  '100+ voice options',
  '100+ licenced background music tracks',
  'Campaign targeting (selected options)',
  'Budget controls (daily / total)',
  'Standard reporting dashboard',
  'Debit / credit card payments',
];

const proFeatures = [
  '300+ voice options',
  '200+ licenced background music tracks',
  'Audio mixing controls',
  'Extensive targeting options',
  'Granular scheduling options',
  'Advanced behavioral audiences',
  'Third-party tracking pixels',
  'Cross-platform retargeting (display banners)',
  'Advanced reporting dashboard',
  'Multi-user & rights management',
  'Monthly invoicing option',
];

const agencyFeatures = [
  'Multi-advertiser account management',
  'Advanced multi-user & rights management',
  'Monthly invoicing',
];

function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-foreground">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
      </span>
      <span>{label}</span>
    </li>
  );
}

export default function UpgradePlanModal({ open, onOpenChange, currentPlan = 'Express', requestedForAgency = false }: UpgradePlanModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgradePro = async () => {

    const {data: {session: sessionData}} = await auth.getSession();
    if (!sessionData) {
      logger.error("Not authenticated");
      return;
    }
    setLoading(true);
    if(!sessionData?.currentAdvertiserId) {
      toast({
        title: "No advertiser found",
        description: "Please refresh the page and try again",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error, status, message } = await advertiserApi.upgradeAdvertiserToPro(sessionData?.currentAdvertiserId ?? '');
    if (error || status !== 200) {
      logger.error("Failed to upgrade advertiser to pro", { status, error, message });
      toast({
        title: "Failed to upgrade advertiser to pro",
        description: message,
        variant: "destructive",
      });
      return;

    } else {
      toast({
        title: "Success",
        description: message || "Advertiser upgraded to pro successfully",
        variant: "default",
      });
      onOpenChange(false);
      auth.setCurrentAdvertiserId(sessionData?.currentAdvertiserId ?? '', true);
    }
    setLoading(false);

    // onOpenChange(false);
    // navigate('/dashboard/account');
  };

  const handleUpgradeToAgency = async () => {
    const {data: {session: sessionData}} = await auth.getSession();
    if (!sessionData) {
      logger.error("Not authenticated");
      return;
    }
    setLoading(true);

    const { error, status, message } = await organizationApi.requestToUpgradeToAgency(sessionData?.user?.id, sessionData?.currentOrganizationId ?? '');
    if (error || status !== 200) {
      logger.error("Failed to request to upgrade to agency", { status, error, message });
      toast({
        title: "Failed to request to upgrade to agency",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: message || "Requested to upgrade to agency successfully",
        variant: "default",
      });
      onOpenChange(false);
    }
    setLoading(false);
    // onOpenChange(false);
    // navigate('/contact');
  };

  const isExpressCurrent = currentPlan === 'Express';
  const isProCurrent = currentPlan === 'Pro';
  const isAgencyCurrent = currentPlan === 'Agency';

  const CurrentBadge = () => (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center h-7 px-3 rounded-md bg-foreground text-background text-[11px] font-semibold uppercase tracking-wider">
      Current plan
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto p-6 md:p-10">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Choose your plan
            </span>
          </div>
          <DialogTitle className="text-3xl md:text-4xl font-semibold tracking-tight">
            Find the plan that's right for you
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground max-w-xl mx-auto">
            Scale your audio advertising with more voices, deeper targeting and the controls you need.
          </DialogDescription>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* Express */}
          <div className={`relative rounded-2xl border bg-background p-6 flex flex-col ${isExpressCurrent ? 'border-2 border-primary' : 'border-border'}`}>
            {isExpressCurrent && <CurrentBadge />}
            <h3 className="text-2xl font-semibold text-foreground">Express</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Designed for SMEs starting their audio advertising journey.
            </p>
            <div className="my-5 border-t border-border" />
            {isExpressCurrent ? (
              <Button variant="outline" disabled className="w-full h-11 opacity-100 disabled:opacity-100">
                <Check className="h-4 w-4 mr-2" />
                Existing plan
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full h-11">
                Downgrade unavailable
              </Button>
            )}
            <p className="mt-6 mb-3 text-sm font-semibold text-foreground">{expressFeaturesIntro}</p>
            <ul className="space-y-2.5">
              {expressFeatures.map((f) => <FeatureItem key={f} label={f} />)}
            </ul>
          </div>

          {/* Pro */}
          <div className={`relative rounded-2xl border bg-background p-6 flex flex-col ${isProCurrent ? 'border-2 border-primary' : 'border-border'}`}>
            {isProCurrent && <CurrentBadge />}
            <h3 className="text-2xl font-semibold text-foreground">Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Advanced controls for audio and campaign creation features.
            </p>
            <div className="my-5 border-t border-border" />
            {isProCurrent ? (
              <Button variant="outline" disabled className="w-full h-11 opacity-100 disabled:opacity-100">
                <Check className="h-4 w-4 mr-2" />
                Existing plan
              </Button>
            ) : isAgencyCurrent ? (
              <Button variant="outline" disabled className="w-full h-11">
                Downgrade unavailable
              </Button>
            ) : (
              <Button className="w-full h-11" onClick={handleUpgradePro} disabled={loading}>
                Upgrade to Pro
              </Button>
            )}
            <p className="mt-6 mb-3 text-sm font-semibold text-foreground">{proFeaturesIntro}</p>
            <ul className="space-y-2.5">
              {proFeatures.map((f) => <FeatureItem key={f} label={f} />)}
            </ul>
          </div>

          {/* Agency */}
          <div className={`relative rounded-2xl border bg-background p-6 flex flex-col ${isAgencyCurrent ? 'border-2 border-primary' : 'border-border'}`}>
            {isAgencyCurrent && <CurrentBadge />}
            <h3 className="text-2xl font-semibold text-foreground">Agency</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Built for agencies that need flexibility, scale and governance.
            </p>
            <div className="my-5 border-t border-border" />
            {isAgencyCurrent ? (
              <Button variant="outline" disabled className="w-full h-11 opacity-100 disabled:opacity-100">
                <Check className="h-4 w-4 mr-2" />
                Existing plan
              </Button>
            ) : (
              <Button disabled={loading || requestedForAgency} variant="outline" className="w-full h-11 border-foreground text-foreground hover:bg-foreground hover:text-background" onClick={handleUpgradeToAgency}>
                {requestedForAgency ? 'Already Requested' : 'Request'}
              </Button>
            )}
            <p className="mt-6 mb-3 text-sm font-semibold text-foreground">{agencyFeaturesIntro}</p>
            <ul className="space-y-2.5">
              {agencyFeatures.map((f) => <FeatureItem key={f} label={f} />)}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {['Cancel anytime', 'Keep your existing campaigns', 'VAT-compliant invoicing'].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" strokeWidth={3} />
              {item}
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}