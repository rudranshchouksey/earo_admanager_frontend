 // ============================================
 // Server-Driven UI Types
 // Complete type definitions for SDUI payloads
 // ============================================
 
 // Block Types
 export type BlockType =
   | 'HERO'
   | 'MAGIC_INPUT'
   | 'PROCESSING'
   | 'AUDIO_REVEAL'
   | 'REACH_MAP'
   | 'CHECKOUT'
   | 'TRUST_LOGOS'
   | 'FEATURE_GRID'
   | 'PODCAST_SHELF'
   | 'CTA_BANNER'
   | 'TESTIMONIAL'
   | 'FAQ'
   | 'NUDGE'
   | 'VALUE_PROPS'
   | 'WHY_SECTION'
   | 'FINAL_CTA'
   | 'FOOTER';
 
 // Currency type
 export interface Currency {
   code: string;
   symbol: string;
 }
 
 // Payment method type
 export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'mamo_pay' | 'mada';
 
 // Experiment assignment
 export interface ExperimentAssignment {
   experiment_id: string;
   variant_id: string;
   variant_config: Record<string, unknown>;
   assigned_at: string;
 }
 
 // Nudge payload
 export interface NudgePayload {
   id: string;
   type: 'toast' | 'banner' | 'modal' | 'tooltip';
   priority: 'low' | 'medium' | 'high';
   message: string;
   cta?: {
     text: string;
     action: string;
     params?: Record<string, unknown>;
   };
   dismissable: boolean;
   expires_at?: string;
   max_impressions: number;
   cooldown_hours: number;
 }
 
 // SDUI Block
 export interface SDUIBlock {
   id: string;
   type: BlockType;
   props: Record<string, unknown>;
   visible: boolean;
   experiment_id?: string;
   experiment_variant?: string;
   priority?: number;
 }
 
 // Locale configuration
 export interface LocaleConfig {
   country: string;
   country_code: string;
   currency: Currency;
   language: string;
   payment_methods: PaymentMethod[];
   payment_logos: string[];
   min_budget: number;
   cultural_copy: Record<string, string>;
 }
 
 // Precomputed defaults from learning engine
 export interface ComputedDefaults {
   suggested_budget: number;
   suggested_tone: string;
   suggested_duration: number;
   suggested_cities: string[];
   suggested_voice?: string;
 }
 
 // Full SDUI Payload
 export interface SDUIPayload {
   screen_id: string;
   version: string;
   persona: 'express' | 'pro';
   layout: 'single_column' | 'two_column' | 'wizard';
   blocks: SDUIBlock[];
   features: Record<string, boolean>;
   locale: LocaleConfig;
   experiments: Record<string, ExperimentAssignment>;
   defaults: ComputedDefaults;
   nudges: NudgePayload[];
 }
 
 // Block Props Types
 export interface HeroBlockProps {
   headline: string;
   subheadline: string;
   badge_text?: string;
   cta_text: string;
   cta_action: 'scroll_to_input' | 'open_modal' | 'navigate';
   background_variant?: 'default' | 'gradient' | 'image';
 }
 
 export interface MagicInputBlockProps {
   placeholder_rotation: string[];
   show_manual_toggle: boolean;
   submit_text: string;
 }
 
 export interface TrustLogosBlockProps {
   logos: string[];
   layout: 'scroll' | 'grid';
 }
 
 export interface FeatureGridBlockProps {
   features: Array<{
     icon: string;
     title: string;
     description: string;
   }>;
   columns: 2 | 3 | 4;
 }
 
 export interface AudioRevealBlockProps {
   brand_name: string;
   show_waveform: boolean;
   share_methods: ('whatsapp' | 'download' | 'copy')[];
   cta_primary: { text: string; action: string };
   cta_secondary?: { text: string; action: string };
 }
 
 export interface ReachMapBlockProps {
   min_budget: number;
   max_budget: number;
   default_budget: number;
   currency: Currency;
   reach_formula: 'linear' | 'logarithmic';
   show_radius_visualization: boolean;
   cta_text: string;
 }
 
 export interface CheckoutBlockProps {
   payment_methods: PaymentMethod[];
   show_credits: boolean;
   show_promo_input: boolean;
   order_summary: {
     budget: number;
     duration_days: number;
     estimated_reach: number;
   };
 }
 
 // User behavioral state
 export type UserState =
   | 'NEW_VISITOR'
   | 'ENGAGED_VISITOR'
   | 'AD_CREATED'
   | 'DORMANT_CREATOR'
   | 'FIRST_CAMPAIGN'
   | 'ACTIVE_ADVERTISER'
   | 'REPEAT_ADVERTISER'
   | 'VIP_ADVERTISER'
   | 'CHURNED'
   | 'REACTIVATION';