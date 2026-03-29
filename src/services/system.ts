import { request } from './api';

export interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: 'info' | 'warning' | 'error';
  cta_label: string | null;
  cta_url: string | null;
}

export const systemApi = {
  /** Fetches all active system-wide notifications */
  getSystemAlerts: () => 
    request<Alert[]>('/api/v1/system/alerts'),

  /** Marks an alert as read/dismissed for the current user */
  dismissAlert: (id: string) => 
    request(`/api/v1/system/alerts/${id}`, { 
      method: 'DELETE' 
    }),

  /** Fetches Dynamic UI configurations (SDUI) */
  getUIConfig: (screenId: string) => 
    request(`/api/v1/system/config/${screenId}`),
};