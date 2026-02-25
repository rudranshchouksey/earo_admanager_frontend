 import { cn } from '@/lib/utils';
 import React from 'react';
 
 interface PillTabsProps<T extends string> {
   value: T;
   onValueChange: (value: T) => void;
   options: { value: T; label: string }[];
   className?: string;
 }
 
 export function PillTabs<T extends string>({
   value,
   onValueChange,
   options,
   className,
 }: PillTabsProps<T>) {
   return (
     <div
       className={cn(
         'inline-flex items-center gap-1 rounded-full bg-muted p-1',
         className
       )}
       role="tablist"
     >
       {options.map((option) => (
         <button
           key={option.value}
           role="tab"
           aria-selected={value === option.value}
           onClick={() => onValueChange(option.value)}
           className={cn(
             'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
             'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
             value === option.value
               ? 'bg-card text-foreground shadow-sm'
               : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
           )}
         >
           {option.label}
         </button>
       ))}
     </div>
   );
 }