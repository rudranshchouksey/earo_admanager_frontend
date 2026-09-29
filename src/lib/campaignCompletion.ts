import type { AdGroup, Campaign } from '@/services/campaign';

/**
 * These are the "select everything" defaults CampaignWizard seeds its targeting
 * state with, and what an untouched draft persists on its ad group. A non-empty
 * check on these two fields is therefore always true — only a strict subset of
 * the full default list means the user actually narrowed something.
 */
export const DEFAULT_AGE_RANGES = ['1824', '2124', '2534', '3544', '4554', '5564', '6500'];
export const DEFAULT_DEVICE_TYPES = [
  'tablet',
  'desktop',
  'phone',
  'portable_media_player',
  'console',
  'smart_speaker',
  'television',
  'car_browser',
  'other',
  'wearable',
];

export interface TargetingSignals {
  gender?: string | null;
  age?: string[] | null;
  deviceType?: string[] | null;
  podcastTopics?: string[] | null;
  podcastAudiences?: string[] | null;
  streamingTopics?: string[] | null;
  streamingAudiences?: string[] | null;
  contentLanguage?: string[] | null;
  showsInventory?: string[] | null;
}

const hasAny = (arr: string[] | null | undefined) => Array.isArray(arr) && arr.length > 0;

const isNarrowedList = (arr: string[] | null | undefined, fullDefault: string[]) =>
  Array.isArray(arr) && arr.length > 0 && arr.length < fullDefault.length;

/** True once the user has made any deliberate audience-narrowing choice. */
export function isTargetingSet(s: TargetingSignals): boolean {
  return (
    !!s.gender?.trim() ||
    isNarrowedList(s.age, DEFAULT_AGE_RANGES) ||
    isNarrowedList(s.deviceType, DEFAULT_DEVICE_TYPES) ||
    hasAny(s.podcastTopics) ||
    hasAny(s.podcastAudiences) ||
    hasAny(s.streamingTopics) ||
    hasAny(s.streamingAudiences) ||
    hasAny(s.contentLanguage) ||
    hasAny(s.showsInventory)
  );
}

type AdGroupTargeting = Pick<
  AdGroup,
  | 'demogGender'
  | 'demogAge'
  | 'deviceType'
  | 'podcastTopics'
  | 'podcastAudiences'
  | 'streamingTopics'
  | 'streamingAudiences'
  | 'contentLanguage'
  | 'showsInventory'
>;

/** True if any ad group on a persisted campaign has real targeting set. */
export function hasAnyTargetingSetOnCampaign(campaign?: { adGroups?: AdGroupTargeting[] } | null): boolean {
  return !!campaign?.adGroups?.some((ag) =>
    isTargetingSet({
      gender: ag.demogGender,
      age: ag.demogAge,
      deviceType: ag.deviceType,
      podcastTopics: ag.podcastTopics,
      podcastAudiences: ag.podcastAudiences,
      streamingTopics: ag.streamingTopics,
      streamingAudiences: ag.streamingAudiences,
      contentLanguage: ag.contentLanguage,
      showsInventory: ag.showsInventory,
    }),
  );
}

export interface DraftChecklist {
  audioDone: boolean;
  budgetDone: boolean;
  datesDone: boolean;
  targetingDone: boolean;
}

export function getDraftChecklist(campaign: Campaign): DraftChecklist {
  return {
    audioDone: !!campaign.audioId,
    budgetDone: Number(campaign.totalBudget ?? campaign.budget ?? 0) > 0,
    datesDone: !!(campaign.startDate && campaign.endDate),
    targetingDone: hasAnyTargetingSetOnCampaign(campaign),
  };
}
