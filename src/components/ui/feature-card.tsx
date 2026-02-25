 import { cn } from '@/lib/utils';
 import { Card, CardContent } from '@/components/ui/card';
 import { LucideIcon } from 'lucide-react';
 
 interface FeatureCardProps {
   icon: LucideIcon;
   title: string;
   description: string;
   highlight?: boolean;
   className?: string;
 }
 
 export function FeatureCard({
   icon: Icon,
   title,
   description,
   highlight = false,
   className,
 }: FeatureCardProps) {
   return (
     <Card
       className={cn(
         'border-0 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
         highlight
           ? 'bg-primary text-primary-foreground shadow-md'
           : 'bg-card shadow-sm',
         className
       )}
     >
       <CardContent className="p-8 text-center">
         <div
           className={cn(
             'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6',
             highlight ? 'bg-primary-foreground/20' : 'bg-primary/10'
           )}
         >
           <Icon
             className={cn(
               'w-8 h-8',
               highlight ? 'text-primary-foreground' : 'text-primary'
             )}
           />
         </div>
         <h3 className="text-lg font-semibold mb-3">{title}</h3>
         <p
           className={cn(
             'text-sm leading-relaxed',
             highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'
           )}
         >
           {description}
         </p>
       </CardContent>
     </Card>
   );
 }