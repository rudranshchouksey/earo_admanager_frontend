// ============================================
// GTM dataLayer helpers
// The GTM container (GTM-NKZL36XK) is loaded in index.html. These helpers push
// GA4-standard ecommerce events that GTM tags/triggers consume via Data Layer
// Variables (ecommerce.transaction_id, ecommerce.value, ecommerce.currency,
// ecommerce.items). This is the only place the app writes to window.dataLayer.
// ============================================

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Low-level push. Safe to call before GTM has initialised (it drains the array). */
export function pushToDataLayer(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

// Campaign budgets are denominated in USD across the platform (min $250),
// and checkout renders amounts with "$". Report revenue in USD.
const PURCHASE_CURRENCY = "USD";

export interface PurchaseEvent {
  /** Unique per transaction — GA4 dedupes on this. Charge UID (card) or campaign id (credit). */
  transactionId: string;
  /** Reported revenue — the NET amount after any coupon (GA4 does not subtract `discount` itself). */
  value: number;
  campaignId?: string;
  campaignName?: string;
  /** "card" | "credit" — surfaced as item_variant. */
  paymentMethod?: "card" | "credit";
  /** "express" | "pro" | "agency" — surfaced as item_category. */
  plan?: string;
  /** Coupon code applied at checkout (string). Standard GA4 item param. */
  coupon?: string;
  /** Monetary amount discounted by the coupon. Reporting only — already excluded from `value`. */
  discount?: number;
}

/**
 * Pushes the GA4 standard `purchase` event into the dataLayer.
 * Reset `ecommerce` to null first so values from a prior event can't leak in.
 *
 * `coupon` and `discount` are nested inside `items` (and `coupon` mirrored at event
 * level) — both are standard GA4 params captured by the existing `ecommerce.items`
 * Data Layer Variable, so no extra DLV is required.
 */
export function trackPurchase({
  transactionId,
  value,
  campaignId,
  campaignName,
  paymentMethod,
  plan,
  coupon,
  discount,
}: PurchaseEvent): void {
  pushToDataLayer({ ecommerce: null });
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: transactionId,
      value,
      currency: PURCHASE_CURRENCY,
      ...(coupon ? { coupon } : {}),
      items: [
        {
          item_id: campaignId,
          item_name: campaignName || "Campaign",
          item_category: plan,
          item_variant: paymentMethod,
          price: value,
          quantity: 1,
          ...(coupon ? { coupon } : {}),
          ...(discount ? { discount } : {}),
        },
      ],
    },
  });
}
