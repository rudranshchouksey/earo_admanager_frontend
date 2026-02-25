 // SDUI Processing Block Component
 import React from 'react';
 
 interface Props {
   blockId: string;
   steps?: string[];
   estimated_duration?: number;
   brand_name?: string;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function ProcessingBlock({ steps, estimated_duration, brand_name }: Props) {
   return (
     <div className="w-full py-12" data-block="processing">
       {/* Placeholder for integration with existing ProcessingStep */}
     </div>
   );
 }