import { FeatureListCard } from '@/components/dashboard/WhatYouCanDoSection';

export default function AgencyWhatYouCanDoSection() {
  return (
    <FeatureListCard
      rows={[
        {
          title: 'Advertisers',
          description: 'A separate workspace per client, all from one agency login.',
          href: '/dashboard/account?page=advertisers',
        },
        {
          title: 'Team',
          description: 'Invite colleagues and give them access to specific advertisers.',
          lockedLabel: 'After first advertiser',
        },
        {
          title: 'Campaigns',
          description: 'Run campaigns for any advertiser, with cross-advertiser reporting.',
          lockedLabel: 'After first advertiser',
        },
      ]}
    />
  );
}
