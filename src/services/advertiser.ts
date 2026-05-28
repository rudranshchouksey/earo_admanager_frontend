import { request } from "./api";
import { OrganizationIndustry } from "./organization";


export interface Advertiser {
  id: string;
  orgId: string;
  advertiserName: string;
  extId: string | null;
  external_id: string;
  industry: string;
  subIndustry?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  isPro: boolean;
}

export interface AdvertiserResponse {
    "status": number
    "message": string,
    "data": Advertiser[],
    "meta": {
        "total": number;
        "page": number;
        "limit": number,
        "totalPages": number
    }
}

export const advertiserApi = {
  getAdvertisers: (organizationId: string, page= 1, limit = 1000) => request<AdvertiserResponse>('/api/v1/users/getAdvertisers', {method:"POST", body: { orgId: organizationId, page, limit }}),

  createAdvertiser: ({advertiserName, orgId, industry, subIndustry}: {advertiserName: string, orgId: string, industry: string, subIndustry: string}) => request<AdvertiserResponse>('/api/v1/users/createAdvertiser', {method:"POST", body: {advertiserName, orgId, industry, subIndustry}}),

  updateAdvertiser: ({advertiserId, advertiserName, industry, subIndustry, status, extId}: {advertiserId: string, advertiserName: string, industry: string, subIndustry: string, status: string, extId: string}) => request<AdvertiserResponse>('/api/v1/users/updateAdvertiser', {method:"POST", body: {advertiserId, advertiserName, industry, subIndustry, status, extId}}),

};