import { request } from './api';

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
  discountCoupon?: string;
  isSavedCard?: boolean;
  payment_url?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface CampaignResponse {
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

export const campaignApi = {
  /** Fetches all campaigns for the dashboard */
  getCampaigns: ({page = 1, limit = 10, search = '', status = '', advertiserId = ''}) => 
    request<CampaignResponse>('/api/v1/campaigns/getCampaigns', {method: "POST", body: {page, limit, search, status, advertiserId}}),

  /** Creates a new distribution campaign linked to an Ad ID */
  createCampaign: (payload: Partial<Campaign>) => 
    request<Campaign>('/api/v1/campaigns/launchCampaign', { method: 'POST', body: payload }),

  /** Fetches real-time analytics for the reports page */
  getCampaignStats: () => 
    request('/api/v1/campaigns/stats'),

  activateCampaign: (chargeId: string, paymentLinkId: string) =>
    request<Campaign>('/api/v1/campaigns/activateCampaign', { method: 'POST', body: { chargeId, payment_link_id: paymentLinkId } }),




};