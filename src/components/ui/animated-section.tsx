 import { cn } from '@/lib/utils';
 import { useScrollAnimation } from '@/hooks/useScrollAnimation';
 import React from 'react';
 
 type AnimationType = 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'stagger';
 
 interface AnimatedSectionProps {
   children: React.ReactNode;
   animation?: AnimationType;
   delay?: number;
   stagger?: number;
   className?: string;
   threshold?: number;
 }
 
 const animationClasses: Record<AnimationType, { initial: string; visible: string }> = {
   'fade-up': {
     initial: 'opacity-0 translate-y-8',
     visible: 'opacity-100 translate-y-0',
   },
   'fade-left': {
     initial: 'opacity-0 -translate-x-8',
     visible: 'opacity-100 translate-x-0',
   },
   'fade-right': {
     initial: 'opacity-0 translate-x-8',
     visible: 'opacity-100 translate-x-0',
   },
   scale: {
     initial: 'opacity-0 scale-95',
     visible: 'opacity-100 scale-100',
   },
   stagger: {
     initial: 'opacity-0 translate-y-5',
     visible: 'opacity-100 translate-y-0',
   },
 };
 
 export function AnimatedSection({
   children,
   animation = 'fade-up',
   delay = 0,
   stagger = 0,
   className,
   threshold = 0.1,
 }: AnimatedSectionProps) {
   const { ref, isVisible } = useScrollAnimation({ threshold });
   const { initial, visible } = animationClasses[animation];
 
   // If stagger is set, clone children with staggered delays
   if (stagger > 0 && React.Children.count(children) > 1) {
     return (
       <div ref={ref} className={className}>
         {React.Children.map(children, (child, index) => {
           if (!React.isValidElement(child)) return child;
           
           const childDelay = delay + index * stagger;
           
           return (
             <div
               className={cn(
                 'transition-all duration-700 ease-out',
                 isVisible ? visible : initial
               )}
               style={{ transitionDelay: isVisible ? `${childDelay}ms` : '0ms' }}
             >
               {child}
             </div>
           );
         })}
       </div>
     );
   }
 
   return (
     <div
       ref={ref}
       className={cn(
         'transition-all duration-700 ease-out',
         isVisible ? visible : initial,
         className
       )}
       style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
     >
       {children}
     </div>
   );
 }