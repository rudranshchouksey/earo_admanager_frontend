import { Advertiser } from "./advertiser";
import { request } from "./api";
import { UserProfile } from "./user";


export interface OrganizationWithAdvertiser {
    id: string;
    name: string;
    advertisers: Advertiser[];
  }

export enum OrganizationIndustry {
    RETAIL = "RETAIL",
    TECH = "TECH",
    HOSPITALITY = "HOSPITALITY",
    FINANCE = "FINANCE",
    AUTO = "AUTO",
    FMCG = "FMCG",
    REAL_ESTATE = "REAL_ESTATE",
}

export interface OrganizationDetails {
    id: string;
    orgName: string;
    orgType: "SME" | "AGENCY";
    industry: string;
    subIndustry: string;
    country: string;
}

export interface OrganizationDetailsResponse {
    status: number;
    data: {
        user: UserProfile,
        organization: OrganizationDetails,

    };
}

 export const organizationApi = {
    getOrganization: async () => {
        const { data, error, status, message } = await request<any>('/api/v1/organizations/getOrganization', {
            method: 'GET',
        });
    },
    getOrganizationsWithAdvertisers: (organizationId: string)  => request<OrganizationWithAdvertiser[]>('/api/v1/users/getOrganizationsWithAdvertisers' , {method:"GET",}),
    getOrganizationDetails: (organizationId: string)  => request<OrganizationDetailsResponse>('/api/v1/users/getOrganizationDetails' , {method:"POST", body: { orgId: organizationId }}),
    updateOrganizationDetails: (organizationId: string, organizationDetails: OrganizationDetails)  => request<OrganizationDetailsResponse>('/api/v1/users/updateOrganizationDetails' , {method:"POST", body: { orgId: organizationId, ...organizationDetails }}),
    updateOrganizationType: (userId: string, orgType: "SME" | "AGENCY") => request<OrganizationDetailsResponse>('/api/v1/auth/updateOrgType' , {method:"POST", body: { userId, orgType }}),
    requestToUpgradeToAgency: (userId: string, organizationId: string) => request<OrganizationDetailsResponse>('/api/v1/auth/requestForAgency' , {method:"POST", body: { userId, orgId: organizationId }}),

}