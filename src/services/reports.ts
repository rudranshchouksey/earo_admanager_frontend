import { request } from "./api";


export interface CampaignReportsResponse {
  status: number;
  message: string;
  data: CampaignReport;
}

export interface PerformanceTotals {
    __time: {
        start: string;
        end: string;
    };
    attributionCPAInUSD: number;
    totalSpend: number;
    demandECPM: number;
    demandAudioReachUniqueUsers: number;
    impressions: number;
    ltr: number;
    objectiveCountableSum: number;
    demandAudioImp: number;
}

export interface CampaignReport {
    "cardTotals": {
        attributionCPAInUSD: number;
        totalSpend: number;
        demandECPM: number;
        demandAudioReachUniqueUsers: number;
        impressions: number;
        ltr: number;
        objectiveCountableSum: number;
        demandAudioImp: number;
    },
    "PerformanceTotals": PerformanceTotals[]
}

export const reportsApi = {
    getCampaignReports: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/getCampaignReports', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    getCampaignPerformance: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/getCampaignPerformance', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),

}