 // ============================================
 // NextAds Analytics Client
 // Behavioral event tracking for funnel analytics
 // ============================================
 
 import { api } from "@/services/api";
 
 interface EventProperties {
   [key: string]: string | number | boolean | null | undefined;
 }
 
 interface TrackEventOptions {
   name: string;
   properties?: EventProperties;
 }
 
 interface AnalyticsContext {
   sessionId: string;
   userId?: string;
   anonymousId: string;
   deviceType: 'mobile' | 'desktop' | 'tablet';
   geoCountry?: string;
   geoCity?: string;
   referrer?: string;
   utmSource?: string;
   utmMedium?: string;
   utmCampaign?: string;
   experiments?: Record<string, string>;
 }
 
 class Analytics {
   private context: AnalyticsContext;
   private eventQueue: Array<{ name: string; properties: EventProperties; timestamp: string }> = [];
   private flushTimeout: ReturnType<typeof setTimeout> | null = null;
   private readonly FLUSH_INTERVAL = 2000; // 2 seconds
   private readonly MAX_QUEUE_SIZE = 10;
 
   constructor() {
     this.context = this.initContext();
     this.setupAuthListener();
   }
 
   private initContext(): AnalyticsContext {
     const sessionId = this.getOrCreateSessionId();
     const anonymousId = this.getOrCreateAnonymousId();
     const deviceType = this.detectDeviceType();
     const urlParams = new URLSearchParams(window.location.search);
 
     return {
       sessionId,
       anonymousId,
       deviceType,
       referrer: document.referrer || undefined,
       utmSource: urlParams.get('utm_source') || undefined,
       utmMedium: urlParams.get('utm_medium') || undefined,
       utmCampaign: urlParams.get('utm_campaign') || undefined,
       experiments: {},
     };
   }
 
   private getOrCreateSessionId(): string {
     const key = 'nextads_session_id';
     let sessionId = sessionStorage.getItem(key);
     if (!sessionId) {
       sessionId = crypto.randomUUID();
       sessionStorage.setItem(key, sessionId);
     }
     return sessionId;
   }
 
   private getOrCreateAnonymousId(): string {
     const key = 'nextads_anonymous_id';
     let anonymousId = localStorage.getItem(key);
     if (!anonymousId) {
       anonymousId = crypto.randomUUID();
       localStorage.setItem(key, anonymousId);
     }
     return anonymousId;
   }
 
   private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
     const width = window.innerWidth;
     if (width < 768) return 'mobile';
     if (width < 1024) return 'tablet';
     return 'desktop';
   }
 
  private setupAuthListener(): void {
    api.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.identify(session.user.id);
      }
    });
  }
 
   /**
    * Identify the current user (call after auth)
    */
   identify(userId: string): void {
     this.context.userId = userId;
     // Link anonymous events to user in background
     this.linkAnonymousEvents(userId);
   }
 
   private async linkAnonymousEvents(userId: string): Promise<void> {
     try {
       // This would be handled by an edge function in production
       console.log('[Analytics] Linking anonymous events to user:', userId);
     } catch (error) {
       console.error('[Analytics] Failed to link anonymous events:', error);
     }
   }
 
   /**
    * Set geo data (typically from geo-detect edge function)
    */
   setGeoData(country: string, city?: string): void {
     this.context.geoCountry = country;
     this.context.geoCity = city;
   }
 
   /**
    * Set experiment assignments
    */
   setExperiments(experiments: Record<string, string>): void {
     this.context.experiments = experiments;
   }
 
   /**
    * Track an event
    */
   track({ name, properties = {} }: TrackEventOptions): void {
     const event = {
       name,
       properties,
       timestamp: new Date().toISOString(),
     };
 
     this.eventQueue.push(event);
     console.log('[Analytics] Tracked:', name, properties);
 
     // Flush if queue is full
     if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
       this.flush();
       return;
     }
 
     // Schedule flush
     if (!this.flushTimeout) {
       this.flushTimeout = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
     }
   }
 
   /**
    * Flush queued events to the server
    */
   async flush(): Promise<void> {
     if (this.flushTimeout) {
       clearTimeout(this.flushTimeout);
       this.flushTimeout = null;
     }
 
     if (this.eventQueue.length === 0) return;
 
     const events = [...this.eventQueue];
     this.eventQueue = [];
 
    try {
       const { error } = await api.invokeEvents({
         events: events.map(e => ({
           event_name: e.name,
           properties: e.properties,
           session_id: this.context.sessionId,
           user_id: this.context.userId,
           anonymous_id: this.context.anonymousId,
           device_type: this.context.deviceType,
           geo_country: this.context.geoCountry,
           geo_city: this.context.geoCity,
           referrer: this.context.referrer,
           utm_source: this.context.utmSource,
           utm_medium: this.context.utmMedium,
           utm_campaign: this.context.utmCampaign,
           experiment_assignments: this.context.experiments,
           created_at: e.timestamp,
         })),
       });

       if (error) {
         console.error('[Analytics] Flush error:', error);
         this.eventQueue = [...events, ...this.eventQueue];
       }
     } catch (error) {
       console.error('[Analytics] Flush failed:', error);
       // Re-queue events on failure
       this.eventQueue = [...events, ...this.eventQueue];
     }
   }
 
   // ============================================
   // Pre-defined Funnel Events
   // ============================================
 
  /** User started typing in input */
   creativeInputStarted(inputType: 'url' | 'manual'): void {
     this.track({ name: 'creative.input_started', properties: { input_type: inputType } });
   }
 
   /** URL pasted */
   creativeUrlPasted(url: string): void {
     const domain = new URL(url).hostname.replace('www.', '');
     this.track({ name: 'creative.url_pasted', properties: { url, domain } });
   }
 
   /** Creative generation started */
   creativeProcessingStarted(creativeId?: string): void {
     this.track({ name: 'creative.processing_started', properties: { creative_id: creativeId } });
   }
 
   /** Audio generated successfully */
   creativeGenerated(creativeId: string, durationSeconds: number, tone: string): void {
     this.track({
       name: 'creative.generated',
       properties: { creative_id: creativeId, duration_seconds: durationSeconds, tone },
     });
   }
 
   /** Audio played */
   creativePlayed(creativeId: string, playDurationSeconds: number): void {
     this.track({
       name: 'creative.played',
       properties: { creative_id: creativeId, play_duration_seconds: playDurationSeconds },
     });
   }
 
   /** Ad shared */
   creativeShared(creativeId: string, shareMethod: 'whatsapp' | 'download' | 'copy'): void {
     this.track({
       name: 'creative.shared',
       properties: { creative_id: creativeId, share_method: shareMethod },
     });
   }
 
   /** Lead captured (email/phone submitted) */
   leadCaptured(email: string, hasPhone: boolean): void {
     this.track({
       name: 'lead.captured',
       properties: { email_domain: email.split('@')[1], has_phone: hasPhone },
     });
   }
 
   /** Campaign map viewed */
   campaignMapViewed(creativeId: string, city: string): void {
     this.track({ name: 'campaign.map_viewed', properties: { creative_id: creativeId, city } });
   }
 
   /** Budget slider changed */
   campaignBudgetChanged(budget: number, estimatedReach: number): void {
     this.track({
       name: 'campaign.budget_changed',
       properties: { budget, estimated_reach: estimatedReach },
     });
   }
 
   /** Campaign created */
   campaignCreated(campaignId: string, budget: number, currency: string): void {
     this.track({
       name: 'campaign.created',
       properties: { campaign_id: campaignId, budget, currency },
     });
   }
 
   /** Checkout started */
   paymentCheckoutStarted(campaignId: string, amount: number): void {
     this.track({
       name: 'payment.checkout_started',
       properties: { campaign_id: campaignId, amount },
     });
   }
 
   /** Payment completed */
   paymentCompleted(campaignId: string, paymentId: string, amount: number): void {
     this.track({
       name: 'payment.completed',
       properties: { campaign_id: campaignId, payment_id: paymentId, amount },
     });
   }
 
   /** Campaign launched */
   campaignLaunched(campaignId: string): void {
     this.track({ name: 'campaign.launched', properties: { campaign_id: campaignId } });
   }
 
   /** Auth signup started */
   authSignupStarted(method: 'email' | 'google' | 'apple'): void {
     this.track({ name: 'auth.signup_started', properties: { method } });
   }
 
   /** Auth signup completed */
   authSignupCompleted(method: 'email' | 'google' | 'apple'): void {
     this.track({ name: 'auth.signup_completed', properties: { method } });
   }
 
   /** Auth login */
   authLogin(method: 'email' | 'google' | 'apple'): void {
     this.track({ name: 'auth.login', properties: { method } });
   }
 }
 
 // Singleton instance
 export const analytics = new Analytics();