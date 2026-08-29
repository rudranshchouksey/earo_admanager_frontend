import { BASE_URL, request } from "./api";
import { auth, getStoredSession } from "./auth";

export interface DownloadInvoiceResult {
    blob: Blob;
    filename: string;
}

function parseContentDispositionFilename(header: string | null, fallback: string): string {
    if (!header) return fallback;
    const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
    const match = header.match(/filename="?([^";]+)"?/i);
    return match?.[1] || fallback;
}

async function downloadCreditInvoice(invoiceId: string) {
    const { data: sessionData } = await auth.getSession();
    const token = sessionData.session?.accessToken;
    const storedSession = getStoredSession();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (storedSession?.currentOrganizationId) {
        headers["x-org-id"] = storedSession.currentOrganizationId;
    }

    const res = await fetch(`${BASE_URL}/api/v1/wallet-billing/downloadCreditInvoice`, {
        method: "POST",
        headers,
        body: JSON.stringify({ invoiceId }),
    });

    if (!res.ok) {
        const text = await res.text();
        let message = `Error ${res.status}`;
        try {
            const json = JSON.parse(text);
            message = json.message || message;
        } catch {
            if (text) message = text;
        }
        return { data: null, error: new Error(message), status: res.status, message };
    }

    const rawBlob = await res.blob();
    const blob =
        rawBlob.type === "application/pdf"
            ? rawBlob
            : new Blob([rawBlob], { type: "application/pdf" });
    const filename = parseContentDispositionFilename(
        res.headers.get("Content-Disposition"),
        `${invoiceId}.pdf`,
    );

    return {
        data: { blob, filename },
        error: null,
        status: res.status,
        message: null,
    };
}

export interface CreditDetails {
    availableCredit: number;
    creditCycle: CreditCycle;

}

export interface CreditCycle {
    id: string;
    organizationId: string;
    amount: number;
    endDate: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CreditDetailsResponse {
    status: number;
    availableCredit: number;
    creditUsed: number;
    totalCredits: number;
    utilizationPercentage: string;
    creditCycle: CreditCycle;
}

export interface CreditInvoice {
    id: string;
    invoiceId: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    invoiceMonth: string;
    paymentStatus: string;
}

export interface CreditInvoiceResponse {
    status: number;
    data: CreditInvoice[];
}

export interface WalletTransactionCampaign {
    id: string;
    campaignName: string;
}

export interface WalletTransaction {
    id: string;
    orgId: string;
    advertiserId: string;
    campaignId: string | null;
    couponCode: string | null;
    amount: number;
    originalAmount: number;
    type: string;
    remarks: string | null;
    createdAt: string;
    updatedAt: string;
    campaign?: WalletTransactionCampaign | null;
}

export interface WalletTransactionsResponse {
    status: number;
    message: string;
    data: WalletTransaction[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface GetWalletTransactionsParams {
    page: number;
    limit: number;
    sortBy?: "createdAt" | "updatedAt" | "amount" | "originalAmount" | "type";
    sortOrder?: "asc" | "desc";
    orgId: string;
    advertiserId?: string;
    campaignId?: string;
    couponCode?: string;
    type?: string;
    search?: string;
}

export interface MyCouponsResponse {
    status: number;
    data: Coupon[];
}

export interface Coupon {
    id: string;
    couponCode: string;
    discountType: string;
    discountValue: string;
    maxDiscountCap: string | null;
    maxDiscountCurrency: string;
    currency: string;
    minimumCampaignBudget: string;
    minimumBudgetCurrency: string;
    usageLimit: number;
    usageLimitCounter: number;
    perAdvertiserUsageLimit: number;
    autoApply: boolean;
    status: string;
    expiryDate: string | null;
    startDate: string | null;
}
export const walletApi = {
    getCards: () => request<any>('/api/v1/wallet-billing/getCards', { method: 'GET' }),
    getCreditsDetails: (advertiserId: string, organizationId: string) => request<CreditDetailsResponse>('/api/v1/wallet-billing/getAvailableCredit', { method: 'POST', body: {advertiserId: advertiserId, orgId: organizationId} }),
    getCreditInvoices: ({organizationId, advertiserId, page, limit, type}: {organizationId: string, advertiserId: string, page: string, limit: string, type: string}) => request<CreditInvoiceResponse>('/api/v1/wallet-billing/getCreditInvoices', { method: 'POST', body: {orgId: organizationId, advertiserId: advertiserId, page: page, limit: limit, invoiceType: type} }),
    getWalletTransactions: (params: GetWalletTransactionsParams) =>
        request<WalletTransactionsResponse>('/api/v1/wallet-billing/getWalletTransactions', { method: 'POST', body: params }),
    downloadInvoice: (invoiceId: string) => downloadCreditInvoice(invoiceId),
    getMyCoupons: (advertiserId: string) => request<MyCouponsResponse>('/api/v1/wallet-billing/myCoupons', { method: 'POST', body: {advertiserId: advertiserId} }),
}