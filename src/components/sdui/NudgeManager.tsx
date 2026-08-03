import { logger } from "@/lib/logger";
 // ============================================
 // Nudge Manager
 // Displays and tracks in-app nudges
 // ============================================
 
 import React, { useEffect, useCallback, useState } from 'react';
 import { useSDUI } from '@/contexts/SDUIContext';
 import { api } from '@/services/api';
 import { X } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 import type { NudgePayload } from '@/types/sdui';
 
 interface NudgeToastProps {
   nudge: NudgePayload;
   onDismiss: () => void;
   onClick: () => void;
 }
 
 function NudgeToast({ nudge, onDismiss, onClick }: NudgeToastProps) {
   return (
     <div className={cn(
       "fixed bottom-4 right-4 z-50 max-w-sm p-4 bg-card border rounded-lg shadow-lg",
       "animate-in slide-in-from-bottom-4 duration-300",
       nudge.priority === 'high' && 'border-primary',
     )}>
       <div className="flex items-start gap-3">
         <div className="flex-1">
           <p className="text-sm font-medium text-foreground">{nudge.message}</p>
           {nudge.cta && (
             <Button
               variant="link"
               className="p-0 h-auto mt-2 text-primary"
               onClick={onClick}
             >
               {nudge.cta.text} →
             </Button>
           )}
         </div>
         {nudge.dismissable && (
           <button
             onClick={onDismiss}
             className="text-muted-foreground hover:text-foreground transition-colors"
           >
             <X className="h-4 w-4" />
           </button>
         )}
       </div>
     </div>
   );
 }
 
 function NudgeBanner({ nudge, onDismiss, onClick }: NudgeToastProps) {
   return (
     <div className={cn(
       "w-full p-3 bg-primary/10 border-b border-primary/20",
       "animate-in slide-in-from-top duration-300",
     )}>
       <div className="container mx-auto flex items-center justify-between gap-4">
         <p className="text-sm text-foreground">{nudge.message}</p>
         <div className="flex items-center gap-2">
           {nudge.cta && (
             <Button variant="secondary" size="sm" onClick={onClick}>
               {nudge.cta.text}
             </Button>
           )}
           {nudge.dismissable && (
             <button
               onClick={onDismiss}
               className="text-muted-foreground hover:text-foreground transition-colors"
             >
               <X className="h-4 w-4" />
             </button>
           )}
         </div>
       </div>
     </div>
   );
 }
 
 interface NudgeManagerProps {
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export function NudgeManager({ onAction }: NudgeManagerProps) {
   const { activeNudges, dismissNudge, recordNudgeClick } = useSDUI();
   const [displayedNudges, setDisplayedNudges] = useState<Set<string>>(new Set());
   const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
 
   // Record impression when nudge is displayed
   useEffect(() => {
     activeNudges.forEach(async (nudge) => {
       if (!displayedNudges.has(nudge.id)) {
         setDisplayedNudges(prev => new Set([...prev, nudge.id]));
         
         // Record impression
         try {
           const anonymousId = localStorage.getItem('nextads_anonymous_id');
           await api.insertNudgeImpression({
             nudge_id: nudge.id,
             anonymous_id: anonymousId,
             channel: 'in_app',
           });
         } catch (error) {
           logger.captureException(error, { context: '[NudgeManager] Failed to record impression:' });
         }
       }
     });
   }, [activeNudges, displayedNudges]);
 
   const handleDismiss = useCallback((nudgeId: string) => {
     setDismissedNudges(prev => new Set([...prev, nudgeId]));
     dismissNudge(nudgeId);
   }, [dismissNudge]);
 
   const handleClick = useCallback((nudge: NudgePayload) => {
     recordNudgeClick(nudge.id);
     if (nudge.cta?.action && onAction) {
       onAction(nudge.cta.action, nudge.cta.params);
     }
   }, [recordNudgeClick, onAction]);
 
   // Filter out dismissed nudges and expired nudges
   const visibleNudges = activeNudges.filter(nudge => {
     if (dismissedNudges.has(nudge.id)) return false;
     if (nudge.expires_at && new Date(nudge.expires_at) < new Date()) return false;
     return true;
   });
 
   // Separate by type
   const bannerNudges = visibleNudges.filter(n => n.type === 'banner');
   const toastNudges = visibleNudges.filter(n => n.type === 'toast');
 
   return (
     <>
       {/* Banners at top */}
       {bannerNudges.map(nudge => (
         <NudgeBanner
           key={nudge.id}
           nudge={nudge}
           onDismiss={() => handleDismiss(nudge.id)}
           onClick={() => handleClick(nudge)}
         />
       ))}
       
       {/* Toasts at bottom right - only show first one */}
       {toastNudges.length > 0 && (
         <NudgeToast
           nudge={toastNudges[0]}
           onDismiss={() => handleDismiss(toastNudges[0].id)}
           onClick={() => handleClick(toastNudges[0])}
         />
       )}
     </>
   );
 }
 
 export default NudgeManager;