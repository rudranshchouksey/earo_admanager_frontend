 // SDUI Value Props Block Component
 import React from 'react';
 
 interface Props {
   blockId: string;
   props?: Array<{ icon: string; title: string; description: string }>;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function ValuePropsBlock({ props: valueProps }: Props) {
   return (
     <div className="w-full py-12" data-block="value-props">
       {/* Placeholder for integration with existing ValuePropsSection */}
     </div>
   );
 }