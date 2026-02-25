 // SDUI Testimonial Block Component
 import React from 'react';
 
 interface Props {
   blockId: string;
   quotes?: Array<{ text: string; author: string; role?: string; image?: string }>;
   show_metrics?: boolean;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export default function TestimonialBlock({ quotes, show_metrics }: Props) {
   if (!quotes || quotes.length === 0) return null;
 
   return (
     <section className="py-16" data-block="testimonial">
       <div className="container mx-auto px-4">
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           {quotes.map((quote, index) => (
             <blockquote key={index} className="p-6 bg-card rounded-xl border">
               <p className="text-foreground mb-4">"{quote.text}"</p>
               <footer className="flex items-center gap-3">
                 {quote.image && (
                   <img src={quote.image} alt={quote.author} className="w-10 h-10 rounded-full" />
                 )}
                 <div>
                   <cite className="font-semibold not-italic">{quote.author}</cite>
                   {quote.role && <p className="text-sm text-muted-foreground">{quote.role}</p>}
                 </div>
               </footer>
             </blockquote>
           ))}
         </div>
       </div>
     </section>
   );
 }