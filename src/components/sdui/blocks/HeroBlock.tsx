 // SDUI Hero Block Component
 import React from 'react';
 import type { HeroBlockProps } from '@/types/sdui';
 
 interface Props extends HeroBlockProps {
   blockId: string;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function HeroBlock({ 
   headline, 
   subheadline, 
   badge_text, 
   cta_text, 
   cta_action,
   onAction 
 }: Props) {
   const handleCTA = () => {
     if (onAction) onAction(cta_action);
   };
 
   return (
     <section className="relative py-16 md:py-24">
       <div className="container mx-auto px-4 text-center">
         {badge_text && (
           <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-primary/10 text-primary rounded-full">
             {badge_text}
           </span>
         )}
         <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
           {headline}
         </h1>
         <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
           {subheadline}
         </p>
         {cta_text && (
           <button
             onClick={handleCTA}
             className="inline-flex items-center px-8 py-4 text-lg font-semibold bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
           >
             {cta_text}
           </button>
         )}
       </div>
     </section>
   );
 }