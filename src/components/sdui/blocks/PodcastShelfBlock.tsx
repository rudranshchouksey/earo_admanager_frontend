 // SDUI Podcast Shelf Block Component
 import React from 'react';
 
 interface Props {
   blockId: string;
   podcasts?: Array<{ id: string; name: string; logo: string }>;
   show_filters?: boolean;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function PodcastShelfBlock({ podcasts, show_filters }: Props) {
   return (
     <div className="w-full py-12" data-block="podcast-shelf">
       {/* Placeholder for integration with existing PodcastPlacements */}
     </div>
   );
 }