 // SDUI Nudge Block Component (inline nudge, not toast/banner)
 import React from 'react';
 import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
 import type { NudgePayload } from '@/types/sdui';
 
 interface Props extends Partial<NudgePayload> {
   blockId: string;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function NudgeBlock({ 
   message, 
   cta, 
   priority = 'medium',
   dismissable = true,
   onAction 
 }: Props) {
   if (!message) return null;
 
   const icons = {
     low: Info,
     medium: Info,
     high: AlertTriangle,
   };
   const Icon = icons[priority];
 
   return (
     <div className="p-4 bg-muted rounded-lg border flex items-start gap-3" data-block="nudge">
       <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
       <div className="flex-1">
         <p className="text-sm text-foreground">{message}</p>
         {cta && (
           <button
             onClick={() => onAction?.(cta.action, cta.params)}
             className="text-sm text-primary hover:underline mt-1"
           >
             {cta.text}
           </button>
         )}
       </div>
       {dismissable && (
         <button
           onClick={() => onAction?.('dismiss_nudge')}
           className="text-muted-foreground hover:text-foreground"
         >
           <X className="h-4 w-4" />
         </button>
       )}
     </div>
   );
 }