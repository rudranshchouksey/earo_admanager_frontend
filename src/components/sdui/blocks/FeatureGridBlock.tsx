 // SDUI Feature Grid Block Component
 import React from 'react';
 import type { FeatureGridBlockProps } from '@/types/sdui';
 
 interface Props extends FeatureGridBlockProps {
   blockId: string;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function FeatureGridBlock({ features, columns }: Props) {
   return (
     <section className="py-16 bg-muted/30" data-block="feature-grid">
       <div className="container mx-auto px-4">
         <div className={`grid gap-6 md:grid-cols-${columns}`}>
           {features.map((feature, index) => (
             <div key={index} className="p-6 bg-card rounded-xl border">
               <div className="text-3xl mb-4">{feature.icon}</div>
               <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
               <p className="text-muted-foreground text-sm">{feature.description}</p>
             </div>
           ))}
         </div>
       </div>
     </section>
   );
 }