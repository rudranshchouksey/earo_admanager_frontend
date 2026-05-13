import { request } from "./api";


export const paymentApi = {
    generatePaymentLink: (payload: { campaignId: string, amount: number }) => request<string>('/api/v1/payment/generatePaymentLink', { method: 'POST', body: payload }),
}