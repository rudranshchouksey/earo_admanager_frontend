import { request } from "./api";

export interface CreditDetails {
    availableCredit: number;
    creditUsed: number;
    totalCredits: number;
    utilizationPercentage: string;
}

export interface CreditDetailsResponse {
    status: number;
    data: CreditDetails;
}

export const walletApi = {
    getCards: () => request<any>('/api/v1/wallet-billing/getCards', { method: 'GET' }),
    getCreditsDetails: (advertiserId: string) => request<CreditDetailsResponse>('/api/v1/wallet-billing/getCreditsDetails', { method: 'POST', body: {advertiserId: advertiserId} }),

}