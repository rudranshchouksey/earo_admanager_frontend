import { request } from "./api";


export const supportApi = {
    sendSupport: (message: SupportMessage) => request<{ message: string, status: number, error: Error | null }>('/api/v1/support/sendSupport', { method: 'POST', body: message }),
}

interface SupportMessage {
    topic: string;
    message: string;
}