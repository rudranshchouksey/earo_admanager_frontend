 // ============================================
 // SDUI Context Provider
 // Provides SDUI payload, experiments, and nudges
 // ============================================
 
 import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { api } from '@/services/api';
 import { useGeoLocation } from '@/hooks/useGeoLocation';
 import { analytics } from '@/lib/analytics';
 import type { SDUIPayload, NudgePayload, ExperimentAssignment } from '@/types/sdui';
 
 // Fallback payload for when backend is unavailable
 const FALLBACK_PAYLOAD: SDUIPayload = {
   screen_id: 'landing',
   version: '2025-02-05',
   persona: 'express',
   layout: 'single_column',
   blocks: [],
   features: {
     enable_wondercraft_tts: true,
     enable_whatsapp_share: true,
     enable_campaign_map: true,
   },
   locale: {
     country: 'United States',
     country_code: 'US',
     currency: { code: 'USD', symbol: '$' },
     language: 'en',
     payment_methods: ['card', 'apple_pay'],
     payment_logos: ['/logos/visa.svg', '/logos/mastercard.svg'],
     min_budget: 50,
     cultural_copy: {},
   },
   experiments: {},
   defaults: {
     suggested_budget: 500,
     suggested_tone: 'friendly',
     suggested_duration: 15,
     suggested_cities: [],
   },
   nudges: [],
 };
 
 interface SDUIContextValue {
   // Payload data
   payload: SDUIPayload;
   isLoading: boolean;
   error: Error | null;
   
   // Feature flags
   isFeatureEnabled: (flag: string) => boolean;
   
   // Experiments
   getExperimentVariant: (experimentId: string) => string | null;
   getExperimentConfig: (experimentId: string) => Record<string, unknown> | null;
   logExposure: (experimentId: string) => void;
   
   // Nudges
   activeNudges: NudgePayload[];
   dismissNudge: (nudgeId: string) => void;
   recordNudgeClick: (nudgeId: string) => void;
   
   // Locale
   locale: SDUIPayload['locale'];
   defaults: SDUIPayload['defaults'];
   
   // Persona
   persona: 'express' | 'pro';
 }
 
 const SDUIContext = createContext<SDUIContextValue | null>(null);
 
 interface SDUIProviderProps {
   children: React.ReactNode;
   screenId?: string;
 }
 
 export function SDUIProvider({ children, screenId = 'landing' }: SDUIProviderProps) {
   const { geoData } = useGeoLocation();
   
  // Fetch SDUI config
  const { data: payload, isLoading, error } = useQuery({
    queryKey: ['sdui-config', screenId, geoData?.country],
    queryFn: async (): Promise<SDUIPayload> => {
      const anonymousId = localStorage.getItem('nextads_anonymous_id') || crypto.randomUUID();
      return api.getUIConfig(screenId, geoData?.countryCode || 'US', anonymousId);
    },
     staleTime: 5 * 60 * 1000, // 5 minutes
     enabled: !!geoData,
     placeholderData: FALLBACK_PAYLOAD,
   });
 
   // Sync experiments to analytics
   useEffect(() => {
     if (payload?.experiments) {
       const experimentMap: Record<string, string> = {};
       Object.entries(payload.experiments).forEach(([id, assignment]) => {
         experimentMap[id] = assignment.variant_id;
       });
       analytics.setExperiments(experimentMap);
     }
   }, [payload?.experiments]);
 
   // Feature flag helper
   const isFeatureEnabled = useCallback((flag: string): boolean => {
     return payload?.features?.[flag] ?? false;
   }, [payload?.features]);
 
   // Experiment helpers
   const getExperimentVariant = useCallback((experimentId: string): string | null => {
     return payload?.experiments?.[experimentId]?.variant_id ?? null;
   }, [payload?.experiments]);
 
   const getExperimentConfig = useCallback((experimentId: string): Record<string, unknown> | null => {
     return payload?.experiments?.[experimentId]?.variant_config ?? null;
   }, [payload?.experiments]);
 
  const logExposure = useCallback(async (experimentId: string) => {
    const assignment = payload?.experiments?.[experimentId];
    if (!assignment) return;

    try {
      await api.invokeExperimentExposure({
        experiment_id: experimentId,
        variant_id: assignment.variant_id,
      });
    } catch (error) {
      console.error('[SDUI] Failed to log experiment exposure:', error);
    }
  }, [payload?.experiments]);
 
   // Nudge management
  const dismissNudge = useCallback(async (nudgeId: string) => {
    try {
      const anonymousId = localStorage.getItem('nextads_anonymous_id');
      await api.updateNudgeImpression(
        { dismissed: true, dismissed_at: new Date().toISOString() },
        { nudge_id: nudgeId, anonymous_id: anonymousId || '' }
      );
      analytics.track({ name: 'nudge.dismissed', properties: { nudge_id: nudgeId } });
    } catch (error) {
      console.error('[SDUI] Failed to dismiss nudge:', error);
    }
  }, []);

  const recordNudgeClick = useCallback(async (nudgeId: string) => {
    try {
      const anonymousId = localStorage.getItem('nextads_anonymous_id');
      await api.updateNudgeImpression(
        { clicked: true, clicked_at: new Date().toISOString() },
        { nudge_id: nudgeId, anonymous_id: anonymousId || '' }
      );
      analytics.track({ name: 'nudge.clicked', properties: { nudge_id: nudgeId } });
    } catch (error) {
      console.error('[SDUI] Failed to record nudge click:', error);
    }
  }, []);
 
   const value = useMemo<SDUIContextValue>(() => ({
     payload: payload || FALLBACK_PAYLOAD,
     isLoading,
     error: error as Error | null,
     isFeatureEnabled,
     getExperimentVariant,
     getExperimentConfig,
     logExposure,
     activeNudges: payload?.nudges || [],
     dismissNudge,
     recordNudgeClick,
     locale: payload?.locale || FALLBACK_PAYLOAD.locale,
     defaults: payload?.defaults || FALLBACK_PAYLOAD.defaults,
     persona: payload?.persona || 'express',
   }), [
     payload,
     isLoading,
     error,
     isFeatureEnabled,
     getExperimentVariant,
     getExperimentConfig,
     logExposure,
     dismissNudge,
     recordNudgeClick,
   ]);
 
   return (
     <SDUIContext.Provider value={value}>
       {children}
     </SDUIContext.Provider>
   );
 }
 
 // Hook to access SDUI context
 export function useSDUI() {
   const context = useContext(SDUIContext);
   if (!context) {
     throw new Error('useSDUI must be used within a SDUIProvider');
   }
   return context;
 }
 
 // Convenience hooks
 export function useFeatureFlag(flag: string, defaultValue = false): boolean {
   const { isFeatureEnabled } = useSDUI();
   return isFeatureEnabled(flag) ?? defaultValue;
 }
 
 export function useExperiment(experimentId: string) {
   const { getExperimentVariant, getExperimentConfig, logExposure } = useSDUI();
   
   useEffect(() => {
     if (getExperimentVariant(experimentId)) {
       logExposure(experimentId);
     }
   }, [experimentId, getExperimentVariant, logExposure]);
   
   return {
     variant: getExperimentVariant(experimentId),
     config: getExperimentConfig(experimentId),
   };
 }
 
 export function useLocale() {
   const { locale } = useSDUI();
   return locale;
 }
 
 export function useDefaults() {
   const { defaults } = useSDUI();
   return defaults;
 }