 // SDUI FAQ Block Component
 import React from 'react';
 import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
 
 interface Props {
   blockId: string;
   items?: Array<{ question: string; answer: string }>;
   show_contact_cta?: boolean;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function FAQBlock({ items, show_contact_cta, onAction }: Props) {
   if (!items || items.length === 0) return null;
 
   return (
     <section className="py-16" data-block="faq">
       <div className="container mx-auto px-4 max-w-3xl">
         <h2 className="text-3xl font-semibold text-center mb-8">Frequently Asked Questions</h2>
         <Accordion type="single" collapsible className="space-y-2">
           {items.map((item, index) => (
             <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
               <AccordionTrigger className="text-left font-medium">
                 {item.question}
               </AccordionTrigger>
               <AccordionContent className="text-muted-foreground">
                 {item.answer}
               </AccordionContent>
             </AccordionItem>
           ))}
         </Accordion>
         {show_contact_cta && (
           <div className="text-center mt-8">
             <button
               onClick={() => onAction?.('contact_support')}
               className="text-primary hover:underline"
             >
               Still have questions? Contact us
             </button>
           </div>
         )}
       </div>
     </section>
   );
 }