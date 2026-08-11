import { request } from "./api";

export interface Country {
    id: string;
    name: string;
    code: string;
    postalCodeAvailable: boolean
}

export interface City {
    id: string;
    name: string;
    country: string;
}

export interface GetCountriesResponse {
    status: number;
    data: Country[];
    message: string;
}


export interface CityResponse {
    id: string;
    name: string;
    code: string;
    cities: string[];
}

export interface GetCitiesResponse {
    status: number;
    data: CityResponse;
    message: string;
}

export interface PublisherSegment {
    id: string;
    name: string;
    code: string;
    value: string;
    label: string;
    description: string;
}

export interface GetPublisherSegmentsResponse {
    status: number;
    data: PublisherSegment[];
    message: string;
}

export interface GetPodcastAudiencesResponse {
    status: number;
    data: PodcastAudience[];
    message: string;
}


export interface PodcastAudience {
    name: string;
    code: string;
    price: number;
}

export interface GetStreamingAudiencesResponse {
    status: number;
    data: StreamingAudience[];
    message: string;
}

export interface StreamingAudience {
    category: string;
    code: string;
    price: number;
    value: string;
    label: string;
}

export interface GetTargetingSegmentsResponse {
    status: number;
    data: TargetingSegment[];
    message: string;
}


export interface TargetingSegment {
    code: string;
    category: string;
    value: string;
    label: string;
    description: string;
}

export interface GetInventoryForecastResponse {
    status: number;
    data: {
        data: [
            {
                station: string;
                campaignAvails: number;
                reach: number;
                frequency: number;
            }
        ]
    };
    message: string;
}

export interface InventoryForecast {
    inventoryType: string;
    inventoryId: string;
    forecast: number;
}



export interface Rule {
    comparison: "IS_ANY_OF" | "IS_NOT_ANY_OF" | "CONTAIN" | "NOT_CONTAIN";
    groups?: {
        segmentCode: string;
        segmentValues: string[];
    };
    week?: {
        day: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
        hours: number[];

    }[];
    type: "HOURLY_WEEK_DAY" | "LOCATION_CITY" | "LOCATION_COUNTRY"
}

export interface Groups {
    rules: Rule[];
}

export interface GetInventoryForecastRequest {
    dateRange: {
        from: string;
        to: string
    };
    adDuration?: number;
    audienceTargeting?: {
        groups?: Groups[];
        zoneIds?: string[]
    };
}

export interface GetContentLanguageResponse {
    status: number;
    data: ContentLanguage[];
    message: string;
}
export interface ContentLanguage {
    code: string;
    name: string;
    label: string;
}



export const targetingApi = {
    getCountries: (postalCode: string) => request<GetCountriesResponse>('/api/v1/campaigns/getCountries', { method: 'GET', params: { postalCode: postalCode ? postalCode : '' }, dedupingInterval: 15 * 60 * 1000}),
    getCities: (countryCode: string) => request<GetCitiesResponse>('/api/v1/campaigns/getCitiesByCountry', { method: 'POST', body: { countryCode }, dedupingInterval: 15 * 60 * 1000 }),
    getPublisherSegments: () => request<GetPublisherSegmentsResponse>('/api/v1/campaigns/getPublisherSegments', { method: 'POST', body: { segmentCode: 'PUBLISHER_ATTRIBUTES_SEGMENTS', search: '' } }),
    getPodcastAudiences: (contextual: string, behavioral: string) => request<GetPodcastAudiencesResponse>('/api/v1/campaigns/getPodcastAudiences', { method: 'POST', body: { contextual, behavioral, search: '' } }),
    getStreamingAudiences: (segmentCode: string, search: string) => request<GetStreamingAudiencesResponse>('/api/v1/campaigns/getStreamingAudiences', { method: 'GET', params: { segmentCode, search: '' } }),
    getTargetingSegments: (ruleType: string, segmentCode: string, search: string) => request<GetTargetingSegmentsResponse>('/api/v1/campaigns/getTargetingSegments', { method: 'POST', body: { ruleType, segmentCode, search: '' } }),
    getContentLanguage: () => request<GetContentLanguageResponse>('/api/v1/campaigns/getContentLanguageTargeting', {method: 'POST'}),

    getInventoryForecast: (req: GetInventoryForecastRequest) => request<GetInventoryForecastResponse>('/api/v1/campaigns/getInventoryForecast', { method: 'POST', body: { ...req } }),
    /** Multipart upload — JSON body cannot carry a File; backend should read the field (e.g. multer `single('file')`). */
    uploadBanner: (file: File, width: number, height: number) => {
        const formData = new FormData();
        formData.append("file", file, file.name);
        formData.append("width", width.toString());
        formData.append("height", height.toString());
        return request<{ url?: string; data?: string }>("/api/v1/campaigns/upload-banner", {
            method: "POST",
            body: formData,
        });
    },

}