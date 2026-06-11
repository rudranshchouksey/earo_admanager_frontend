import { request } from "./api";
import { Campaign } from "./campaign";


export interface AddCardResponse {
    status: number;
    message: string;
    data: {
        payment_url: string;
    };
}

export interface PaymentHistoryResponse {
    status: number;
    message: string;
    data: PaymentHistory[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface PaymentHistory {
    id: string;
    campaignId: string;
    type: string;
    amount: number;
    couponCode: string;
    description: string;
    status: string;
    createdAt: string;
    campaign?: Campaign;
}

export const paymentApi = {
    generatePaymentLink: (payload: { campaignId: string, amount: number }) => request<string>('/api/v1/payment/generatePaymentLink', { method: 'POST', body: payload }),
    addCard: () => request<AddCardResponse>('/api/v1/wallet-billing/addNewCard', { method: 'POST' }),
    getPaymentHistory: ({page, limit, advertiserIds}) => request<PaymentHistoryResponse>('/api/v1/wallet-billing/getPaymentsHistory', { method: 'POST', body: {page, limit, advertiserIds} }),
}