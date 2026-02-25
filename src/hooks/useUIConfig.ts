 // ============================================
 // UI Config Hooks (Legacy Compatibility)
 // These re-export from the new SDUIContext for backwards compatibility
 // ============================================
 
 // Re-export from SDUIContext for backwards compatibility
 export { 
   useFeatureFlag, 
   useExperiment as useExperimentVariant,
   useLocale,
   useDefaults,
 } from '@/contexts/SDUIContext';
 
 // Legacy hook - use useSDUI from SDUIContext instead
 export { useSDUI as useUIConfig } from '@/contexts/SDUIContext';