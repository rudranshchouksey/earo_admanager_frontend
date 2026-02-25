 // SDUI CTA Banner Block Component
 import React from 'react';
 
 interface Props {
   blockId: string;
   headline: string;
   cta_text: string;
   urgency_badge?: string;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function CTABannerBlock({ headline, cta_text, urgency_badge, onAction }: Props) {
   return (
     <section className="py-16 bg-primary" data-block="cta-banner">
       <div className="container mx-auto px-4 text-center">
         {urgency_badge && (
           <span className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-background/20 text-primary-foreground rounded-full">
             {urgency_badge}
           </span>
         )}
         <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-6">
           {headline}
         </h2>
         <button
           onClick={() => onAction?.('cta_click')}
           className="inline-flex items-center px-8 py-4 text-lg font-semibold bg-background text-foreground rounded-full hover:opacity-90 transition-opacity"
         >
           {cta_text}
         </button>
       </div>
     </section>
   );
 }