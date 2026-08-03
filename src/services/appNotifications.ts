import { logger } from "@/lib/logger";
/**
 * Lightweight in-app pub/sub for cross-route updates (no WebSocket).
 * Use when a child page mutates data the shell (e.g. layout) must refresh.
 */

export type AppNotificationEvent = 'advertisers:changed' | 'advertiser:selected';

export type AdvertisersChangedPayload = {
  organizationId?: string;
};

export type AdvertiserSelectedPayload = {
  advertiserId: string;
};

type AdvertisersListener = (payload?: AdvertisersChangedPayload) => void;
type AdvertiserSelectedListener = (payload: AdvertiserSelectedPayload) => void;

const advertisersListeners = new Set<AdvertisersListener>();
const advertiserSelectedListeners = new Set<AdvertiserSelectedListener>();

type AppNotifications = {
  subscribe(event: 'advertisers:changed', listener: AdvertisersListener): () => void;
  subscribe(event: 'advertiser:selected', listener: AdvertiserSelectedListener): () => void;
  subscribe(event: AppNotificationEvent, listener: AdvertisersListener | AdvertiserSelectedListener): () => void;

  notify(event: 'advertisers:changed', payload?: AdvertisersChangedPayload): void;
  notify(event: 'advertiser:selected', payload: AdvertiserSelectedPayload): void;
  notify(event: AppNotificationEvent, payload?: AdvertisersChangedPayload | AdvertiserSelectedPayload): void;
};

export const appNotifications: AppNotifications = {
  subscribe(event: AppNotificationEvent, listener: AdvertisersListener | AdvertiserSelectedListener): () => void {
    if (event === 'advertisers:changed') {
      const fn = listener as AdvertisersListener;
      advertisersListeners.add(fn);
      return () => advertisersListeners.delete(fn);
    }
    if (event === 'advertiser:selected') {
      const fn = listener as AdvertiserSelectedListener;
      advertiserSelectedListeners.add(fn);
      return () => advertiserSelectedListeners.delete(fn);
    }
    return () => {};
  },

  notify(event: AppNotificationEvent, payload?: AdvertisersChangedPayload | AdvertiserSelectedPayload): void {
    if (event === 'advertisers:changed') {
      advertisersListeners.forEach((fn) => {
        try {
          fn(payload as AdvertisersChangedPayload | undefined);
        } catch (err) {
          logger.captureException(err, { context: '[appNotifications]', event: event });
        }
      });
      return;
    }
    if (event === 'advertiser:selected') {
      advertiserSelectedListeners.forEach((fn) => {
        try {
          fn(payload as AdvertiserSelectedPayload);
        } catch (err) {
          logger.captureException(err, { context: '[appNotifications]', event: event });
        }
      });
    }
  },
};
