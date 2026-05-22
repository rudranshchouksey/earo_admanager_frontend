import { request } from "./api";


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
    campaignName: string | null;
    status: string;
    startDate: string;
    endDate: string;
    totalBudget: string;
    externalRefId: string | number | null;
    campaignDB: string;
    start: string | null;
    end: string | null;
    campaignBudget?: string | number | null;
    demandAudioReachUniqueUsers: number | null;
    campaignId: string | number | null;
    impressions: number | null;
    ltr: number | null;
    objectiveCountableSum: number | null;
    dailyCap?: string | null;
    ctr?: number;
    clicks?: number;
    demandAudioImp?: number;
}

export interface CampaignPerformanceResponse {
    status: number;
    message: string;
    data: CampaignActionData[];
}

export interface CampaignReportCardTotals {
    attributionCPAInUSD: number;
    totalSpend: number;
    demandECPM: number;
    demandAudioReachUniqueUsers: number;
    impressions: number;
    ltr: number;
    objectiveCountableSum: number;
    demandAudioImp: number;
    totalBudget?: number;
}

/** One day (or bucket) row from getCampaignReports */
export interface CampaignReportDailyRow {
    __time: {
        start: string;
        end: string;
    };
    attributionCPAInUSD: number;
    campaignBudget?: string;
    totalSpend: number;
    demandECPM: number;
    demandAudioReachUniqueUsers: number;
    campaignId?: number;
    impressions: number;
    ltr: number;
    objectiveCountableSum: number;
    campaignName?: string;
    demandAudioImp: number;
}

export type PerformanceTotals = CampaignReportDailyRow;

export interface CampaignReport {
    cardTotals: CampaignReportCardTotals;
    PerformanceTotals: CampaignReportDailyRow[];
    data: CampaignReportDailyRow[];
}

/** getCampaignReports response body */
export interface CampaignReportsData {
    cardTotals: CampaignReportCardTotals;
    campaignDetails?: Record<string, unknown>;
    data: CampaignReportDailyRow[];
}

export interface CampaignReportsResponse {
  status: number;
  message: string;
  data: CampaignReportsData;
}


export interface CardTotals {

    "attributionCPAInUSD": number,
    "totalSpend": number,
    "impressions": number,
    "demandAudioReachUniqueUsers": number

}

export interface CountryReportRow {
    countryName: string;
    countryCode: string;
    impressions: number;
    reach: number;
    totalSpend: number;
}

export interface CityReportRow {
    city?: string;
    impressions: number;
    uniqueUsers: number;
    totalSpend: number;
}

export interface CountryCityReportData {
    countryData: CountryReportRow[];
    cityData: CityReportRow[];
}

export interface CountryCityReportResponse {
    status: number;
    message: string;
    data: CountryCityReportData;
}

export interface ContentInventoryMetricRow {
    totalSpend: number;
    impressions: number;
    ltr: number;
    uniqueUsers: number;
}

export interface GenreDataRow extends ContentInventoryMetricRow {
    genre: string;
    genreName: string;
}

export interface MediaTopicRow extends ContentInventoryMetricRow {
    mediaId: string | null;
    mediaName: string;
}

export interface AudienceInsightRow extends ContentInventoryMetricRow {
    audienceId: string | null;
    audienceName: string;
}

export interface ContentInventoryReportData {
    genreData: GenreDataRow[];
    mediaTopics: MediaTopicRow[];
    audienceInsights: AudienceInsightRow[];
}

export interface ContentInventoryReportResponse {
    status: number;
    message: string;
    data: ContentInventoryReportData;
}

export interface AdDeliveryMetricRow {
    totalSpend: number;
    impressions: number;
    ltr: number;
    uniqueUsers: number;
}

export interface AdPositionRow extends AdDeliveryMetricRow {
    adPosition: string;
}

export interface ContentLanguageRow extends AdDeliveryMetricRow {
    language: string;
}

export interface DeviceOSRow extends AdDeliveryMetricRow {
    os: string | null;
    osLabel: string;
}

export interface AdDeliveryReportData {
    adPositionData: AdPositionRow[];
    contentLanguageData: ContentLanguageRow[];
    deviceOSData: DeviceOSRow[];
}

export interface AdDeliveryReportResponse {
    status: number;
    message: string;
    data: AdDeliveryReportData;
}

export interface ImpressionsFilterMetricRow {
    impressions: number;
    percentage: number;
}

export interface DeviceTypeFilterRow extends ImpressionsFilterMetricRow {
    deviceTypeLabel: string;
}

export interface AgeFilterRow extends ImpressionsFilterMetricRow {
    ageLabel?: string;
    age?: string;
}

export interface GenderFilterRow extends ImpressionsFilterMetricRow {
    genderLabel?: string;
}

export interface PodcastTopicFilterRow extends ImpressionsFilterMetricRow {
    podcastTopicLabel: string;
}

export interface PodcastAudienceFilterRow extends ImpressionsFilterMetricRow {
    podcastAudienceLabel: string;
}

export interface ImpressionsByFilteredData {
    deviceTypeResult: DeviceTypeFilterRow[];
    ageResult: AgeFilterRow[];
    genderResult: GenderFilterRow[];
    podcastTopicsResult?: PodcastTopicFilterRow[];
    podcastAudienceResult?: PodcastAudienceFilterRow[];
}

export interface ImpressionsByFilteredResponse {
    status: number;
    message: string;
    data: ImpressionsByFilteredData;
}

export interface CampaignImpressionsShareRow {
    campaignName: string;
    impressions: number;
    ltr: number;
}

export interface ImpressionsShareByCampaignsData {
    campaignMetrics: CampaignImpressionsShareRow[];
}

export interface ImpressionsShareByCampaignsResponse {
    status: number;
    message: string;
    data: ImpressionsShareByCampaignsData;
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
    getCampaignPerformance: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignPerformanceResponse>('/api/v1/reports/getCampaignPerformance', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    getImpressionsByFiltered: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<ImpressionsByFilteredResponse>('/api/v1/reports/getImpressionsByFiltered', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    getListeningHeatMap: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/getListeningHeatMap', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    ImpressionsShareByCampaigns: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<ImpressionsShareByCampaignsResponse>('/api/v1/reports/ImpressionsShareByCampaigns', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetCountryCityReport: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CountryCityReportResponse>('/api/v1/reports/GetCountryCityReport', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetContentInventory: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<ContentInventoryReportResponse>('/api/v1/reports/GetContentInventory', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetAdDelivery: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<AdDeliveryReportResponse>('/api/v1/reports/GetAdDelivery', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    GetDemographics: ({advertiserId, campaignType = "SPECIFIC", campaignIds, dateRange, from, to}) => request<CampaignReportsResponse>('/api/v1/reports/GetDemographics', { method: 'POST', body: {advertiserId, campaignType, campaignIds, dateRange, from, to} }),
    

    getDashboardCampaignActions: ({advertiserId, page, limit, tab}) => request<CampaignActionsResponse>('/api/v1/reports/getDashboardCampaignActions', { method: 'POST', body: {advertiserId, page, limit, tab},  }),
    getDashboardCardsData: ({advertiserId}) => request<DashboardCardsDataResponse>('/api/v1/reports/getDashboardCardsData', { method: 'POST', body: {advertiserId} }),

}