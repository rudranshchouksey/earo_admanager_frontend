import { request } from "./api";


export interface CampaignReportsResponse {
  status: number;
  message: string;
  data: CampaignReport;
}

export interface CampaignActionsResponse {
    status: number;
    message: string;
    data: CampaignActionData[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }

export interface CampaignActionData {
    id: string;
    "campaignName": null,
    status: string;
    startDate: string;
    endDate: string;
    totalBudget: string;
    externalRefId: string | null;
    campaignDB: string;
    start: string | null;
    end: string | null;
    campaignBudget: number | null;
    demandAudioReachUniqueUsers: number | null;
    campaignId: string | null;
    impressions: number | null;
    ltr: number | null;
    objectiveCountableSum: number | null;
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

export interface CardTotals {

    "attributionCPAInUSD": number,
    "totalSpend": number,
    "impressions": number,
    "demandAudioReachUniqueUsers": number

}

export interface DashboardCardsDataResponse {
    status: number;
    message: string;
    data: {
        "cardTotals": CardTotals
    };
}

export interface DashboardCardsData {
    totalCampaigns: number;
    totalSpend: number;
    totalImpressions: number;
    totalLtr: number;
    totalObjectiveCountableSum: number;
}

export const reportsApi = {
    getCampaignReports: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/getCampaignReports', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    getCampaignPerformance: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/getCampaignPerformance', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    getImpressionsByFiltered: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/getImpressionsByFiltered', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    getListeningHeatMap: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/getListeningHeatMap', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    ImpressionsShareByCampaigns: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/ImpressionsShareByCampaigns', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetCountryCityReport: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/GetCountryCityReport', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetContentInventory: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/GetContentInventory', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetAdDelivery: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/GetAdDelivery', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetDemographics: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/GetDemographics', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    

    getDashboardCampaignActions: ({advertiserId, page, limit, tab}) => request<CampaignActionsResponse>('/api/v1/reports/getDashboardCampaignActions', { method: 'POST', body: {advertiserId, page, limit, tab} }),
    getDashboardCardsData: ({advertiserId}) => request<DashboardCardsDataResponse>('/api/v1/reports/getDashboardCardsData', { method: 'POST', body: {advertiserId} }),

}