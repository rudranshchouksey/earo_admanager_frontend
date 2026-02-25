 // SDUI Why Section Block Component
 import React from 'react';
 
 interface Props {
   blockId: string;
   headline?: string;
   reasons?: Array<{ title: string; description: string }>;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function WhySectionBlock({ headline, reasons }: Props) {
   return (
     <div className="w-full py-12" data-block="why-section">
       {/* Placeholder for integration with existing WhySection */}
     </div>
   );
 }