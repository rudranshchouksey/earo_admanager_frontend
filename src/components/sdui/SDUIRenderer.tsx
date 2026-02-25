 // ============================================
 // SDUI Renderer
 // Maps block types to React components
 // ============================================
 
 import React, { Suspense, lazy, useMemo } from 'react';
 import { useSDUI, useExperiment } from '@/contexts/SDUIContext';
 import type { SDUIBlock, BlockType } from '@/types/sdui';
 import { Skeleton } from '@/components/ui/skeleton';
 
 // Lazy load block components for code splitting
 const blockComponents: Record<BlockType, React.LazyExoticComponent<React.ComponentType<any>>> = {
   HERO: lazy(() => import('./blocks/HeroBlock')),
   MAGIC_INPUT: lazy(() => import('./blocks/MagicInputBlock')),
   PROCESSING: lazy(() => import('./blocks/ProcessingBlock')),
   AUDIO_REVEAL: lazy(() => import('./blocks/AudioRevealBlock')),
   REACH_MAP: lazy(() => import('./blocks/ReachMapBlock')),
   CHECKOUT: lazy(() => import('./blocks/CheckoutBlock')),
   TRUST_LOGOS: lazy(() => import('./blocks/TrustLogosBlock')),
   FEATURE_GRID: lazy(() => import('./blocks/FeatureGridBlock')),
   PODCAST_SHELF: lazy(() => import('./blocks/PodcastShelfBlock')),
   CTA_BANNER: lazy(() => import('./blocks/CTABannerBlock')),
   TESTIMONIAL: lazy(() => import('./blocks/TestimonialBlock')),
   FAQ: lazy(() => import('./blocks/FAQBlock')),
   NUDGE: lazy(() => import('./blocks/NudgeBlock')),
   VALUE_PROPS: lazy(() => import('./blocks/ValuePropsBlock')),
   WHY_SECTION: lazy(() => import('./blocks/WhySectionBlock')),
   FINAL_CTA: lazy(() => import('./blocks/FinalCTABlock')),
   FOOTER: lazy(() => import('./blocks/FooterBlock')),
 };
 
 // Block wrapper component that handles experiment tracking
 interface BlockWrapperProps {
   block: SDUIBlock;
   children: React.ReactNode;
 }
 
 function BlockWrapper({ block, children }: BlockWrapperProps) {
   // Track experiment exposure if this block is part of an experiment
   const { variant } = block.experiment_id 
     ? useExperiment(block.experiment_id) 
     : { variant: null };
   
   // Don't render if block is not visible or if variant doesn't match
   if (!block.visible) return null;
   if (block.experiment_variant && variant !== block.experiment_variant) return null;
   
   return <>{children}</>;
 }
 
 // Loading fallback for lazy-loaded blocks
 function BlockSkeleton({ type }: { type: BlockType }) {
   const heights: Partial<Record<BlockType, string>> = {
     HERO: 'h-96',
     MAGIC_INPUT: 'h-32',
     TRUST_LOGOS: 'h-24',
     FEATURE_GRID: 'h-64',
     PODCAST_SHELF: 'h-48',
     VALUE_PROPS: 'h-80',
   };
   
   return (
     <Skeleton className={`w-full ${heights[type] || 'h-32'} rounded-lg`} />
   );
 }
 
 // Single block renderer
 interface SDUIBlockRendererProps {
   block: SDUIBlock;
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export function SDUIBlockRenderer({ block, onAction }: SDUIBlockRendererProps) {
   const BlockComponent = blockComponents[block.type];
   
   if (!BlockComponent) {
     console.warn(`[SDUI] Unknown block type: ${block.type}`);
     return null;
   }
   
   return (
     <BlockWrapper block={block}>
       <Suspense fallback={<BlockSkeleton type={block.type} />}>
         <BlockComponent {...block.props} blockId={block.id} onAction={onAction} />
       </Suspense>
     </BlockWrapper>
   );
 }
 
 // Main SDUI renderer component
 interface SDUIRendererProps {
   /** Override blocks from SDUI payload */
   blocks?: SDUIBlock[];
   /** Filter blocks by type */
   filter?: BlockType[];
   /** Callback for block actions */
   onAction?: (action: string, params?: Record<string, unknown>) => void;
 }
 
 export function SDUIRenderer({ blocks: overrideBlocks, filter, onAction }: SDUIRendererProps) {
   const { payload, isLoading } = useSDUI();
   
   const blocksToRender = useMemo(() => {
     let blocks = overrideBlocks || payload.blocks;
     
     // Filter by type if specified
     if (filter && filter.length > 0) {
       blocks = blocks.filter(b => filter.includes(b.type));
     }
     
     // Sort by priority if specified
     return [...blocks].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
   }, [overrideBlocks, payload.blocks, filter]);
   
   if (isLoading && blocksToRender.length === 0) {
     return (
       <div className="space-y-4">
         <Skeleton className="h-96 w-full" />
         <Skeleton className="h-32 w-full" />
         <Skeleton className="h-24 w-full" />
       </div>
     );
   }
   
   return (
     <div className="sdui-container">
       {blocksToRender.map((block) => (
         <SDUIBlockRenderer key={block.id} block={block} onAction={onAction} />
       ))}
     </div>
   );
 }
 
 export default SDUIRenderer;