import { request } from "./api";



export const walletApi = {
    getCards: () => request<any>('/api/v1/wallet-billing/getCards', { method: 'GET' }),
}