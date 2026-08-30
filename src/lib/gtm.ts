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
export function trackNewAudioAd(): void {
  pushToDataLayer({ event: "app_new_audio_ad" });
}

export function trackGenerateAd({
  mode,
  advertiserId,
}: {
  mode: "ai" | "legacy";
  advertiserId?: string;
}): void {
  pushToDataLayer({ event: "app_generate_ad", mode, ...(advertiserId ? { advertiser_id: advertiserId } : {}) });
}

export function trackAdGenerated({ adId, adName }: { adId?: string; adName?: string } = {}): void {
  pushToDataLayer({
    event: "app_ad_generated",
    ...(adId ? { ad_id: adId } : {}),
    ...(adName ? { ad_name: adName } : {}),
  });
}

export function trackNewCampaign(): void {
  pushToDataLayer({ event: "app_new_campaign" });
}

export function trackSaveDraft({
  campaignId,
  campaignName,
}: {
  campaignId?: string;
  campaignName?: string;
} = {}): void {
  pushToDataLayer({
    event: "app_save_draft",
    ...(campaignId ? { campaign_id: campaignId } : {}),
    ...(campaignName ? { campaign_name: campaignName } : {}),
  });
}

export function trackSignUp({
  method,
  plan,
  userId,
  orgId,
}: {
  method: "email" | "google";
  plan?: string;
  userId?: string;
  orgId?: string;
}): void {
  pushToDataLayer({
    event: "sign_up",
    method,
    ...(plan ? { plan } : {}),
    ...(userId ? { user_id: userId } : {}),
    ...(orgId ? { org_id: orgId } : {}),
  });
}

// Bonus GA4-standard event, not one of the 4 named funnel stages but essentially free here.
export function trackLogin({
  method,
  plan,
  userId,
  orgId,
}: {
  method: "email" | "google";
  plan?: string;
  userId?: string;
  orgId?: string;
}): void {
  pushToDataLayer({
    event: "login",
    method,
    ...(plan ? { plan } : {}),
    ...(userId ? { user_id: userId } : {}),
    ...(orgId ? { org_id: orgId } : {}),
  });
}

// Mirrors the landing site's play_audio event. No matching GTM tag confirmed yet —
// needs console-side tag/trigger setup, same as sign_up/login/app_ad_generated.
export function trackPlayAudio({ adId, adName }: { adId?: string; adName?: string } = {}): void {
  pushToDataLayer({
    event: "app_play_audio",
    ...(adId ? { ad_id: adId } : {}),
    ...(adName ? { ad_name: adName } : {}),
  });
}

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
