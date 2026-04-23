import { request } from "./api";
import { OrganizationIndustry } from "./organization";


export interface Advertiser {
  id: string;
  orgId: string;
  advertiserName: string;
  extId: string | null;
  external_id: string;
  industry: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
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
  getAdvertisers: (organizationId: string) => request<AdvertiserResponse>('/api/v1/users/getAdvertisers', {method:"POST", body: { orgId: organizationId }}),

  createAdvertiser: ({advertiserName, orgId, industry}: {advertiserName: string, orgId: string, industry: string}) => request<AdvertiserResponse>('/api/v1/users/createAdvertiser', {method:"POST", body: {advertiserName, orgId, industry}}),

  updateAdvertiser: ({advertiserId, advertiserName, industry, status, extId}: {advertiserId: string, advertiserName: string, industry: string, status: string, extId: string}) => request<AdvertiserResponse>('/api/v1/users/updateAdvertiser', {method:"POST", body: {advertiserId, advertiserName, industry, status, extId}}),

};