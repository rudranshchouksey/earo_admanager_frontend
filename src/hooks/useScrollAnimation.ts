 import { useEffect, useRef, useState, useCallback } from 'react';
 
 interface UseScrollAnimationOptions {
   threshold?: number;
   triggerOnce?: boolean;
   rootMargin?: string;
 }
 
 export function useScrollAnimation({
   threshold = 0.1,
   triggerOnce = true,
   rootMargin = '0px 0px -50px 0px',
 }: UseScrollAnimationOptions = {}) {
   const ref = useRef<HTMLDivElement>(null);
   const [isVisible, setIsVisible] = useState(false);
   const hasTriggered = useRef(false);
 
   const handleIntersect = useCallback(
     (entries: IntersectionObserverEntry[]) => {
       const [entry] = entries;
       
       if (entry.isIntersecting) {
         if (triggerOnce && hasTriggered.current) return;
         hasTriggered.current = true;
         setIsVisible(true);
       } else if (!triggerOnce) {
         setIsVisible(false);
       }
     },
     [triggerOnce]
   );
 
   useEffect(() => {
     const element = ref.current;
     if (!element) return;
 
     const observer = new IntersectionObserver(handleIntersect, {
       threshold,
       rootMargin,
     });
 
     observer.observe(element);
 
     return () => observer.disconnect();
   }, [threshold, rootMargin, handleIntersect]);
 
   return { ref, isVisible };
 }