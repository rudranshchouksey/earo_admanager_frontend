import { request } from './api';

export interface AdGroup {
  "id": string,
  "extGoalId": string | null,
  "campaignId": string,
  "inventoryType": string,
  "adPosition": string[],
  "showIds": [],
  "geoData": null,
  "geoCountries": string[],
  "businessLocations": [],
  "demogGender": string,
  "demogAge": [],
  "deviceType": [],
  "podcastTopics": [ ],
  "podcastAudiences": [],
  "streamingTopics": [],
  "streamingAudiences": [],
  "showsInventory": [],
  "bannerOne": string,
  "bannerTwo": string,
  "bannerThree": string,
  "crossDevice": false,
  "manualCpm": null,
  "dayParting": null,
  "rotationMode": null,
  "createdAt": string,
  "updatedAt": string,
  "deletedAt": null
}

export interface Campaign {
  id?: string;
  campaignName?: string;
  advertiserId?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  timezone?: string;
  daysOfWeek?: string[];
  timeOfDay?: string[];
  budget?: number;
  perDayBudget?: number;
  duration?: number;
  zones?: string[];
  audioId?: string;
  monthlyBilling?: boolean;
  billingDuration?: number;
  externalId?: string;
  externalReference?: string;
  inventoryType?: string;
  geoCountries?: string[];
  businessLocations?: string[];
  gender?: string;
  age?: string[];
  deviceType?: string[];
  podcastTopics?: string[];
  podcastAudiences?: string[];
  streamingTopics?: string[];
  showsInventory?: string[];
  bannerOne?: string;
  bannerTwo?: string;
  bannerThree?: string;
  impressionPixel?: string;
  displayPixel?: string;
  discountCoupon?: string;
  isSavedCard?: boolean;
  payment_url?: string;
  paid?: boolean;
  dailyCap?: number;
  totalBudget?: number;
  campaignBudget?: number;
  impressions?: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  adGroups?: AdGroup[];
  externalRefId?: number;
  spend?: number;
  reach?: number;
  ltr?: number;
  ecpm?: number;
}

export interface CampaignsResponse {
  status: number;
  message: string;
  data: Campaign[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CampaignResponse {
  status: number;
  message: string;
  data: Campaign;
}

interface CreateCampaignResponse {
  status: number;
  message: string;
  data: {
    id: string;
  };
  payment_url: string;
  paymentLinkId: string;
  paid: boolean;
}

export const campaignApi = {
  applyCoupon: (amount: number, couponCode: string, advertiserId: string) =>
    request<any>('/api/v1/wallet-billing/applyCoupon', { method: 'POST', body: { amount, couponCode, advertiserId } }),

  /** Fetches all campaigns for the dashboard */
  getCampaigns: ({page = 1, limit = 10, search = '', status = '', advertiserId = '', sortBy = 'createdAt', sortOrder = 'desc', adswizzSync = true}) => 
    request<CampaignsResponse>('/api/v1/campaigns/getCampaigns', {method: "POST", body: {page, limit, search, status, advertiserId, sortBy, sortOrder, adswizzSync}}),

  /** Fetches all campaigns for the dashboard */
  getCampaign: ({id, advertiserId = ''}) => 
    request<CampaignResponse>('/api/v1/campaigns/getCampaign', {method: "POST", body: {campaignId: id, advertiserId}}),

  /** Creates a new distribution campaign linked to an Ad ID */
  updateCampaign: (payload: Partial<Campaign>) => 
    request<CreateCampaignResponse>('/api/v1/campaigns/updateCampaign', { method: 'POST', body: payload }),

  /** Creates a new distribution campaign linked to an Ad ID */
  createCampaign: (payload: Partial<Campaign>) => 
    request<CreateCampaignResponse>('/api/v1/campaigns/launchCampaign', { method: 'POST', body: payload }),

  draftCampaign: (payload: Partial<Campaign>) =>
    request<Campaign>('/api/v1/campaigns/saveDraftCampaign', { method: 'POST', body: payload }),

  /** Fetches real-time analytics for the reports page */
  getCampaignStats: () => 
    request('/api/v1/campaigns/stats'),

  activateCampaign: (chargeId: string, paymentLinkId: string) =>
    request<Campaign>('/api/v1/campaigns/activateCampaign', { method: 'POST', body: { chargeId, payment_link_id: paymentLinkId } }),




};