 // SDUI Footer Block Component
 import React from 'react';
 
 interface Props {
   blockId: string;
   links?: Array<{ label: string; href: string }>;
   show_social?: boolean;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function FooterBlock({ links, show_social }: Props) {
  return (
    <div className="w-full" data-block="footer" />
  );
 }