import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/contexts/TranslationContext';

interface ReviewProps {
  setup: { adId: string; campaignName: string };
  schedule: { startDate: string; endDate: string };
  inventory: { inventoryType: string; podcastTopics: string[] };
  targeting: { location: string; gender: string; ageRanges: string[]; deviceTypes: string[] };
  budget: { dailyBudget: string; totalBudget: string; currency: string };
  payment: { paymentMethod: string; couponCode: string };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}

export default function CampaignReviewStep({ setup, schedule, inventory, targeting, budget, payment }: ReviewProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('wizard.review.setup')}</h3>
          <Row label={t('wizard.review.campaign_name')} value={setup.campaignName} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('wizard.review.schedule')}</h3>
          <Row label={t('wizard.review.start_date')} value={schedule.startDate} />
          <Row label={t('wizard.review.end_date')} value={schedule.endDate} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('wizard.review.inventory')}</h3>
          <Row label={t('wizard.review.types')} value={inventory.inventoryType} />
          {inventory.podcastTopics.length > 0 && (
            <Row label={t('wizard.review.podcast_topics')} value={inventory.podcastTopics.join(', ')} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('wizard.review.targeting')}</h3>
          <Row label={t('wizard.review.location')} value={targeting.location} />
          <Row label={t('wizard.review.gender')} value={targeting.gender} />
          <Row label={t('wizard.review.age_ranges')} value={targeting.ageRanges.join(', ')} />
          <Row label={t('wizard.review.devices')} value={targeting.deviceTypes.join(', ')} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('wizard.review.budget')}</h3>
          <Row label={t('wizard.review.daily_budget')} value={`${budget.currency} ${budget.dailyBudget}`} />
          <Row label={t('wizard.review.total_budget')} value={`${budget.currency} ${budget.totalBudget}`} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t('wizard.review.payment')}</h3>
          <Row label={t('wizard.review.method')} value={payment.paymentMethod} />
          {payment.couponCode && <Row label={t('wizard.review.coupon')} value={payment.couponCode} />}
        </CardContent>
      </Card>
    </div>
  );
}
