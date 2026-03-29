import { request } from './api';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  ad_id: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  actual_spend: number;
  actual_impressions: number;
  start_date: string;
  end_date: string;
  campaign_type: 'express' | 'pro';
  currency: string;
  created_at: string;
}

export const campaignApi = {
  /** Fetches all campaigns for the dashboard */
  getCampaigns: () => 
    request<Campaign[]>('/api/v1/campaigns'),

  /** Creates a new distribution campaign linked to an Ad ID */
  createCampaign: (payload: Partial<Campaign>) => 
    request<Campaign>('/api/v1/campaigns', { method: 'POST', body: payload }),

  /** Fetches real-time analytics for the reports page */
  getCampaignStats: () => 
    request('/api/v1/campaigns/stats'),
};