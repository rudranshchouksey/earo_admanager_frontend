import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Headphones, Loader2, Lock, Mic, PenLine, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReadyAdCard from '@/components/dashboard/ReadyAdCard';
import PaymentModal from '@/components/dashboard/launch/PaymentModal';
import { toast } from '@/components/ui/use-toast';
import { paymentApi } from '@/services/payment';
import { logger } from '@/lib/logger';
import DraftCampaignCard from '@/components/dashboard/DraftCampaignCard';
import type { DraftChecklist } from '@/lib/campaignCompletion';
import type { AdData } from '@/services/ads';
import type { Campaign } from '@/services/campaign';

// Step 4's "What's left" before any campaign exists: nothing is set up yet.
const EMPTY_CAMPAIGN_CHECKLIST: DraftChecklist = {
  audioDone: false,
  budgetDone: false,
  datesDone: false,
  targetingDone: false,
};

const AD_PILLS: { label: string; icon: LucideIcon }[] = [
  { label: 'Write your prompt', icon: PenLine },
  { label: 'Pick voice & music', icon: Mic },
  { label: 'Review & save', icon: Headphones },
];

interface GettingStartedCardProps {
  hasAudioAd: boolean;
  latestAudioAd?: AdData;
  hasPaymentMethod: boolean;
  /** e.g. "Visa •••• 4242", shown on the completed payment step. */
  paymentCardLabel?: string | null;
  hasDraftCampaign: boolean;
  draftCampaign?: Campaign | null;
  draftChecklist?: DraftChecklist | null;
  draftCampaignId?: string | null;
  canEdit: boolean;
  isAdmin: boolean;
  /** Called when the add-card modal closes, so the page can re-check saved cards. */
  onPaymentModalClose?: () => void;
}

// 'current' is the one step the user should act on next (its CTA is the primary/green
// button); 'active' steps are unlocked but not next. Markers are 8px-corner squares (same as
// the Button component): done = solid green with a white check, open steps = white with a
// green border and number. The button colour, not the marker, shows which step is next.
export type StepStatus = 'done' | 'current' | 'active' | 'locked';

export function StepIcon({ status, number }: { status: StepStatus; number: number }) {
  if (status === 'locked') {
    return (
      <div className="h-9 w-9 rounded-[8px] bg-background flex items-center justify-center shrink-0">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  if (status === 'done') {
    return (
      <div className="h-9 w-9 rounded-[8px] border-2 border-primary bg-primary flex items-center justify-center shrink-0">
        <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 rounded-[8px] border-2 border-primary bg-background flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-primary">{number}</span>
    </div>
  );
}

// A step's text on the left and its CTA(s) on the right, vertically centred against the text,
// from sm: up; below that the CTA stacks under the text. `action` is omitted when the user
// can't act on the step (e.g. no edit rights), leaving just the text.
function StepBody({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">{children}</div>
      {action && (
        <div className="flex flex-wrap items-center gap-3 shrink-0 sm:flex-col sm:items-end sm:gap-1.5">{action}</div>
      )}
    </div>
  );
}

export default function GettingStartedCard({
  hasAudioAd,
  latestAudioAd,
  hasPaymentMethod,
  paymentCardLabel,
  hasDraftCampaign,
  draftCampaign,
  draftChecklist,
  draftCampaignId,
  canEdit,
  isAdmin,
  onPaymentModalClose,
}: GettingStartedCardProps) {
  const navigate = useNavigate();
  const [paymentUrl, setPaymentUrl] = useState('');
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);

  // Same flow as the Account > Billing add-card button (Account.tsx addPaymentMethod):
  // get a Mamo card-verification link, then open it in the shared PaymentModal right here
  // instead of sending the user to the billing tab to click again. 'dashboard' brings the user
  // back here (/dashboard?card=added|failed, toasted by DashboardHome) once Mamo is done.
  const addPaymentMethod = async () => {
    setGeneratingPaymentLink(true);
    try {
      const { data, error, status } = await paymentApi.addCard(null, 'dashboard');
      if (!error && status === 200 && data?.data?.payment_url) {
        setPaymentUrl(data.data.payment_url);
        return;
      }
      if (error) logger.captureException(error, { context: 'GettingStartedCard add payment method error' });
      toast({ title: 'Error', description: 'Failed to add payment method', variant: 'destructive' });
    } catch (err) {
      // request() throws on auth/network failures rather than returning an error.
      logger.captureException(err, { context: 'GettingStartedCard add payment method error' });
      toast({ title: 'Error', description: 'Failed to add payment method', variant: 'destructive' });
    } finally {
      setGeneratingPaymentLink(false);
    }
  };

  // Step 2 is done only while the advertiser has at least one saved (non-deleted) ad.
  // Deliberately not draftChecklist.audioDone: a draft keeps its audioId after that ad is
  // deleted, which would show "Done" with nothing to play.
  const step2Done = hasAudioAd;
  const doneCount = 1 + (step2Done ? 1 : 0) + (hasPaymentMethod ? 1 : 0); // step 1 is always done, out of 4
  const cardTitle = doneCount === 1 ? 'Getting started' : 'Your progress';

  // Only the first not-done step is 'current'. Step 2 is always unlocked, so if it isn't
  // done it's current; step 3 is current once step 2 is done; step 4 only when 2 and 3 are.
  const step2Status: StepStatus = step2Done ? 'done' : 'current';
  // Payment is never locked: a card can be added any time (also via Account > Billing). Until
  // an ad exists it's just available ('active', outline button); once there's an ad it's the
  // next step ('current', primary button).
  const step3Status: StepStatus = hasPaymentMethod ? 'done' : step2Done ? 'current' : 'active';
  // Step 4 always needs an ad first. Payment can be added independently of ad creation
  // (Account > Billing), and a draft campaign outlives the deletion of its ad, so neither
  // alone unlocks it -- otherwise "Resume campaign" would sit next to "Create audio ad"
  // with no ad to launch. With an ad, a draft opens it early (resume, outline button).
  const step4Unlocked = step2Done && (hasDraftCampaign || hasPaymentMethod);
  const step4IsCurrent = step4Unlocked && hasPaymentMethod;
  const step4Status: StepStatus = !step4Unlocked ? 'locked' : step4IsCurrent ? 'current' : 'active';
  const step4Open = step4Status !== 'locked';

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">{cardTitle}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{doneCount} of 4 complete</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={cn('h-1.5 w-8 rounded-full', i < doneCount ? 'bg-foreground' : 'bg-muted')} />
              ))}
            </div>
          </div>
        </div>

        {/* Stepper rows: each step is its own light-grey card */}
        <div className="flex flex-col gap-3">
          {/* Step 1: Create your account — always done */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status="done" number={1} />
            </div>
            <div className="flex-1 min-w-0">
              {/* Completed titles use a 36px line-height to centre on their 36px marker. */}
              <h3 className="text-sm font-semibold text-muted-foreground leading-9">Create your account</h3>
            </div>
          </div>

          {/* Step 2: Create your first audio ad */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status={step2Status} number={2} />
            </div>
            <div className="flex-1 min-w-0">
              {step2Status === 'done' ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground leading-9">Create your first audio ad</h3>
                  {latestAudioAd && (
                    <ReadyAdCard
                      ad={latestAudioAd}
                      onEditAudio={() => navigate(`/dashboard/ads/${latestAudioAd.id}`)}
                    />
                  )}
                </div>
              ) : (
                <StepBody
                  action={
                    canEdit && (
                      <>
                        <Button onClick={() => navigate('/dashboard/ads/new')}>Create audio ad</Button>
                        <span className="text-xs text-muted-foreground">~3 minutes</span>
                      </>
                    )
                  }
                >
                  <h3 className="text-sm font-semibold text-foreground">Create your first audio ad</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    AI writes the script, picks a voice and mixes the music from your website.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {AD_PILLS.map(({ label, icon: Icon }) => (
                      <div
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-background text-foreground px-3 py-1 text-xs font-medium"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                        {label}
                      </div>
                    ))}
                  </div>
                </StepBody>
              )}
            </div>
          </div>

          {/* Step 3: Add a payment method */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status={step3Status} number={3} />
            </div>
            <div className="flex-1 min-w-0">
              <StepBody
                action={
                  step3Status === 'done' ? (
                    paymentCardLabel && (
                      <span className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        <CreditCard className="h-3.5 w-3.5" aria-hidden />
                        {paymentCardLabel}
                      </span>
                    )
                  ) :
                  isAdmin && (
                    <Button
                      variant={step3Status === 'current' ? 'default' : 'outline'}
                      onClick={addPaymentMethod}
                      disabled={generatingPaymentLink}
                    >
                      {generatingPaymentLink && <Loader2 className="animate-spin" />}
                      Add debit or credit card
                    </Button>
                  )
                }
              >
                <h3 className={cn('text-sm font-semibold', step3Status === 'done' ? 'text-muted-foreground leading-9' : 'text-foreground')}>
                  Add a payment method
                </h3>
                {step3Status !== 'done' && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You&apos;re only charged for what your campaign actually spends, up to your daily budget.
                    {/* Only admins get the add-card button (billing is admin-only, like Account > Billing). */}
                    {!isAdmin && ' Ask an account admin to add a card.'}
                  </p>
                )}
              </StepBody>
            </div>
          </div>

          {/* Step 4: Launch your first campaign */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <div className="flex flex-col items-center">
              <StepIcon status={step4Status} number={4} />
            </div>
            <div className="flex-1 min-w-0">
              <StepBody
                action={
                  canEdit &&
                  step4Open &&
                  (hasDraftCampaign ? (
                    draftChecklist && (
                      <Button
                        variant={step4IsCurrent ? 'default' : 'outline'}
                        onClick={() => navigate(`/dashboard/campaigns/${draftCampaignId}`)}
                      >
                        Resume campaign
                      </Button>
                    )
                  ) : (
                    latestAudioAd && (
                      <>
                        <Button onClick={() => navigate(`/dashboard/campaigns/new?audioId=${latestAudioAd.id}`)}>
                          Create campaign with this ad
                        </Button>
                        <button
                          type="button"
                          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                          onClick={() => navigate('/dashboard/ads/new')}
                        >
                          Create another ad
                        </button>
                      </>
                    )
                  ))
                }
              >
                <h3 className={cn('text-sm font-semibold', step4Status === 'locked' ? 'text-muted-foreground' : 'text-foreground')}>
                  Launch your first campaign
                </h3>

                {step4Status === 'locked' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step2Done ? 'Available after you add a payment method.' : 'Available after you create an audio ad.'}
                  </p>
                )}

                {step4Open && !hasDraftCampaign && (
                  <>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Pick your listeners, set a budget, launch. About two minutes.
                    </p>
                    <div className="mt-3 max-w-md">
                      <DraftCampaignCard checklist={EMPTY_CAMPAIGN_CHECKLIST} />
                    </div>
                  </>
                )}

                {step4Open && hasDraftCampaign && draftChecklist && (
                  <div className="mt-3 space-y-3 max-w-md">
                    <p className="text-sm text-muted-foreground">
                      {draftCampaign?.campaignName || 'Untitled campaign'}
                    </p>
                    <DraftCampaignCard checklist={draftChecklist} />
                  </div>
                )}
              </StepBody>
            </div>
          </div>
        </div>
      </CardContent>
      {paymentUrl && (
        <PaymentModal
          open={!!paymentUrl}
          onOpenChange={() => {
            setPaymentUrl('');
            onPaymentModalClose?.();
          }}
          paymentUrl={paymentUrl}
          onCancel={() => setPaymentUrl('')}
        />
      )}
    </Card>
  );
}
