import { useNavigate } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReadyAdCard from '@/components/dashboard/ReadyAdCard';
import DraftCampaignCard, { DraftProgressBar } from '@/components/dashboard/DraftCampaignCard';
import { draftChecklistCaption, type DraftChecklist } from '@/lib/campaignCompletion';
import type { AdData } from '@/services/ads';
import type { Campaign } from '@/services/campaign';

const AD_PILLS = ['Drop your URL', 'Pick voice & music', 'Review & save'];

interface GettingStartedCardProps {
  hasAudioAd: boolean;
  latestAudioAd?: AdData;
  hasPaymentMethod: boolean;
  hasDraftCampaign: boolean;
  draftCampaign?: Campaign | null;
  draftChecklist?: DraftChecklist | null;
  draftCampaignId?: string | null;
  canEdit: boolean;
  isAdmin: boolean;
}

export type StepStatus = 'done' | 'active' | 'locked';

export function StepIcon({ status, number }: { status: StepStatus; number: number }) {
  if (status === 'done') {
    return (
      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
        <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
      </div>
    );
  }
  if (status === 'locked') {
    return (
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="h-9 w-9 rounded-full border-2 border-primary bg-background flex items-center justify-center shrink-0">
      <span className="text-sm font-bold text-primary">{number}</span>
    </div>
  );
}

export default function GettingStartedCard({
  hasAudioAd,
  latestAudioAd,
  hasPaymentMethod,
  hasDraftCampaign,
  draftCampaign,
  draftChecklist,
  draftCampaignId,
  canEdit,
  isAdmin,
}: GettingStartedCardProps) {
  const navigate = useNavigate();

  // A draft campaign can exist without an audio ad attached yet (draftChecklist.audioDone
  // tracks that independently of the standalone `hasAudioAd` flag), so step 2 counts as
  // done if either is true, and being on the draft path always puts step 4 in progress --
  // otherwise a draft campaign with no separately-saved ad would show step 4 as locked
  // and the "resume your draft" checklist below would never render.
  const step2Done = hasAudioAd || Boolean(hasDraftCampaign && draftChecklist?.audioDone);
  const doneCount = 1 + (step2Done ? 1 : 0) + (hasPaymentMethod ? 1 : 0); // step 1 is always done, out of 4
  const cardTitle = doneCount === 1 ? 'Getting started' : 'Almost there';

  const step2Status: StepStatus = step2Done ? 'done' : 'active';
  const step3Status: StepStatus = hasPaymentMethod ? 'done' : step2Done ? 'active' : 'locked';
  // Payment can be added independently of ad creation (reachable directly via Account >
  // Billing), so require step2 too -- otherwise a user who adds a card before ever
  // creating an ad would see step 4 unlock with no ad to actually launch a campaign with.
  const step4Status: StepStatus = hasDraftCampaign || (step2Done && hasPaymentMethod) ? 'active' : 'locked';

  return (
    <Card className="rounded-[32px] border border-border bg-card">
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">{cardTitle}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{doneCount} of 4 complete</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={cn('h-1.5 w-8 rounded-full', i < doneCount ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
          </div>
        </div>

        {/* Stepper rows */}
        <div className="flex flex-col">
          {/* Step 1: Create your account — always done */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status="done" number={1} />
              <div className="w-px flex-1 min-h-[16px] bg-border my-1" />
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-sm font-semibold text-foreground">Create your account</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Done</p>
            </div>
          </div>

          {/* Step 2: Create your first audio ad */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status={step2Status} number={2} />
              <div className="w-px flex-1 min-h-[16px] bg-border my-1" />
            </div>
            <div className="flex-1 pb-6">
              <h3 className="text-sm font-semibold text-foreground">Create your first audio ad</h3>
              {step2Status === 'done' ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mt-0.5">Done</p>
                  {latestAudioAd && (
                    <div className="max-w-md">
                      <ReadyAdCard
                        ad={latestAudioAd}
                        onEditAudio={() => navigate(`/dashboard/ads/${latestAudioAd.id}`)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    AI writes the script, picks a voice and mixes the music from your website.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {AD_PILLS.map((label, i) => (
                      <div
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"
                      >
                        <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        {label}
                      </div>
                    ))}
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <Button onClick={() => navigate('/dashboard/ads/new')}>Create audio ad</Button>
                      <span className="text-xs text-muted-foreground">~3 minutes</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Step 3: Add a payment method */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status={step3Status} number={3} />
              <div className="w-px flex-1 min-h-[16px] bg-border my-1" />
            </div>
            <div className="flex-1 pb-6">
              <h3 className={cn('text-sm font-semibold', step3Status === 'locked' ? 'text-muted-foreground' : 'text-foreground')}>
                Add a payment method
              </h3>
              {step3Status === 'done' && <p className="text-xs text-muted-foreground mt-0.5">Done</p>}
              {step3Status === 'locked' && (
                <p className="text-xs text-muted-foreground mt-0.5">Available after you create an audio ad.</p>
              )}
              {step3Status === 'active' && (
                <>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Add a credit card to activate campaigns. You&apos;re only charged for what your campaign
                    actually spends, up to your daily budget limit.
                  </p>
                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <Button onClick={() => navigate('/dashboard/account?page=billing')}>Add payment method</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Step 4: Launch your first campaign */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIcon status={step4Status} number={4} />
            </div>
            <div className="flex-1">
              <h3 className={cn('text-sm font-semibold', step4Status === 'locked' ? 'text-muted-foreground' : 'text-foreground')}>
                Launch your first campaign
              </h3>

              {step4Status === 'locked' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step2Done ? 'Available after you add a payment method.' : 'Available after you create an audio ad.'}
                </p>
              )}

              {step4Status === 'active' && !hasDraftCampaign && (
                <>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Pick your listeners, set a budget, launch. About two minutes.
                  </p>
                  {canEdit && latestAudioAd && (
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <Button onClick={() => navigate(`/dashboard/campaigns/new?audioId=${latestAudioAd.id}`)}>
                        Create campaign with this ad
                      </Button>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => navigate('/dashboard/ads/new')}
                      >
                        Create another ad
                      </button>
                    </div>
                  )}
                </>
              )}

              {step4Status === 'active' && hasDraftCampaign && draftChecklist && (
                <div className="mt-3 space-y-3 max-w-md">
                  <p className="text-sm text-muted-foreground">
                    {draftCampaign?.campaignName || 'Untitled campaign'}
                  </p>
                  <DraftCampaignCard checklist={draftChecklist} />
                  <div className="space-y-1.5">
                    <DraftProgressBar checklist={draftChecklist} />
                    <p className="text-xs text-muted-foreground">{draftChecklistCaption(draftChecklist)}</p>
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap items-center gap-4">
                      <Button onClick={() => navigate(`/dashboard/campaigns/${draftCampaignId}`)}>Resume campaign</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
