import { useEffect, useState } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { FeatureCard } from '@/components/ui/feature-card';
import { Wand2, Mic, Music, FileText, MapPin, Users, BarChart3, Radio, Headphones, Podcast, Globe } from 'lucide-react';
import targetingListenerImg from '@/assets/targeting-listener.png';
import applePay from '@/assets/logos/apple-pay.svg';
import visa from '@/assets/logos/visa.svg';
import mastercard from '@/assets/logos/mastercard.svg';
import samsungPay from '@/assets/logos/samsung-pay.svg';
import appsflyer from '@/assets/logos/appsflyer.svg';
import adjust from '@/assets/logos/adjust.svg';
import googleAnalytics from '@/assets/logos/google-analytics.svg';

const studioSteps = [
  { icon: FileText, title: 'Smart Script Generation', description: 'AI analyzes your brand and audience to craft a compelling, broadcast-ready script in seconds.', highlight: true },
  { icon: Mic, title: 'Voice Selection & Synthesis', description: 'Studio-quality voices across multiple languages and accents, optimized for listener engagement.' },
  { icon: Music, title: 'Music & Sound Design', description: 'AI-recommended royalty-free tracks matched to your ad\'s mood with simple mixing controls.' },
  { icon: Wand2, title: 'One-Click Mastering', description: 'Auto-mastered to broadcast standards — LUFS normalization, compression, and format encoding.' },
];

const targetingFeatures = [
  { icon: MapPin, title: 'Geographic Precision', description: 'Target by country, city, or radius. Perfect for local businesses reaching nearby listeners.' },
  { icon: Users, title: 'Demographic Filters', description: 'Reach specific age groups, genders, and language speakers matching your ideal customer.' },
  { icon: Headphones, title: 'Interest-Based Targeting', description: 'Curated interest categories — fitness, food, tech, business — to reach listeners by passion.' },
  { icon: Radio, title: 'Device & Platform', description: 'Choose where your ad plays: mobile, desktop, smart speakers. Optimize for context.' },
];

const analyticsFeatures = [
  { icon: BarChart3, title: 'Real-Time Dashboard', description: 'Live impressions, reach, frequency, and spend — updated every hour.', highlight: true },
  { icon: Globe, title: 'Conversion Tracking', description: 'Pixel-based and server-side tracking for visits, installs, and purchases.' },
  { icon: Podcast, title: 'Listen-Through Rate', description: 'See exactly how much of your ad listeners hear — 25%, 50%, 75%, 100%.' },
];

const inventoryChannels = [
  { title: 'Podcasts', stat: '50,000+', description: 'Premium inventory across every genre — true crime, business, comedy, news.' },
  { title: 'Music Streaming', stat: '200M+', description: 'Reach listeners on major streaming platforms during their favorite playlists.' },
  { title: 'Digital Radio', stat: '1,000+', description: 'Broadcast-quality placements on internet radio stations across MENA and beyond.' },
];

export default function Features() {
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-28 pb-10 md:pt-36 md:pb-[80px]">
        <AnimatedSection animation="fade-up" className="container mx-auto max-w-[1088px] px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            The Platform Behind Your Next Campaign
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From AI-powered ad creation to precision targeting and real-time analytics — everything you need to launch audio campaigns that convert.
          </p>
        </AnimatedSection>
      </section>

      {/* AI Ad Studio */}
      <section className="py-10 md:py-[80px] px-4 md:px-6">
        <div className="container mx-auto max-w-[1088px]">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">AI Ad Studio</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Go from a blank page to a broadcast-ready audio ad in under five minutes.
            </p>
          </AnimatedSection>
          <AnimatedSection animation="stagger" stagger={150} className="grid md:grid-cols-2 gap-8">
            {studioSteps.map((step) => (
              <FeatureCard
                key={step.title}
                icon={step.icon}
                title={step.title}
                description={step.description}
                highlight={step.highlight}
              />
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Targeting Engine */}
      <section className="py-10 md:py-[80px] px-4">
        <div className="container mx-auto max-w-[1088px]">
          <AnimatedSection animation="fade-up">
            <div className="rounded-[32px] overflow-hidden" style={{ backgroundColor: '#F5F5F7' }}>
              <div className="flex flex-col-reverse md:grid md:grid-cols-2 items-center">
                {/* Image */}
                <div className="flex items-end justify-center self-end">
                  <img
                    src={targetingListenerImg}
                    alt="Listener with headphones"
                    className="w-full max-w-[400px] object-contain"
                  />
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 lg:p-16">
                  <h2 className="text-3xl md:text-[40px] md:leading-[1.15] font-semibold text-foreground mb-4">
                    Targeting Engine
                  </h2>
                  <p className="text-muted-foreground mb-6 text-base leading-relaxed">
                    Reach the right listeners at the right moment with demographic, geographic, and interest data
                  </p>
                  <ul className="space-y-4">
                    {targetingFeatures.map((f) => (
                      <li key={f.title} className="flex items-start gap-3">
                        <f.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground">{f.title}</span>
                          <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Analytics & Attribution */}
      <section className="py-10 md:py-[80px] px-4 md:px-6">
        <div className="container mx-auto max-w-[1088px]">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Analytics & Attribution</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track every impression, click, and conversion. Measure true campaign ROI.
            </p>
          </AnimatedSection>
          <AnimatedSection animation="stagger" stagger={150} className="grid sm:grid-cols-3 gap-8 mb-12">
            {analyticsFeatures.map((f) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
                highlight={f.highlight}
              />
            ))}
          </AnimatedSection>
          <AnimatedSection animation="fade-up" delay={300}>
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
              <img src={appsflyer} alt="AppsFlyer" className="h-6" />
              <img src={adjust} alt="Adjust" className="h-6" />
              <img src={googleAnalytics} alt="Google Analytics" className="h-6" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Inventory & Reach */}
      <section className="py-10 md:py-[80px] px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-[1088px]">
          <AnimatedSection animation="fade-up" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Inventory & Reach</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your ad plays across a premium network of podcasts, music streaming, and digital radio.
            </p>
          </AnimatedSection>
          <AnimatedSection animation="stagger" stagger={150} className="grid sm:grid-cols-3 gap-8">
            {inventoryChannels.map((ch) => (
              <div key={ch.title} className="bg-card rounded-2xl p-8 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <p className="text-4xl font-semibold text-primary mb-2">{ch.stat}</p>
                <h3 className="text-lg font-semibold mb-3">{ch.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ch.description}</p>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Local Payments */}
      <section className="py-10 md:py-[80px] px-4 md:px-6">
        <div className="container mx-auto max-w-[1088px]">
          <AnimatedSection animation="fade-up" className="text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Local Payment Methods</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
              Pay the way you prefer. We support regional and international payment methods.
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <img src={applePay} alt="Apple Pay" className="h-8" />
              <img src={visa} alt="Visa" className="h-8" />
              <img src={mastercard} alt="Mastercard" className="h-8" />
              <img src={samsungPay} alt="Samsung Pay" className="h-8" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-[80px] px-4">
        <div className="container mx-auto max-w-[1088px]">
          <AnimatedSection animation="scale">
            <div className="rounded-[32px] p-8 md:p-16 text-center" style={{ backgroundColor: '#F5F5F7' }}>
              <h2 className="text-2xl md:text-[40px] md:leading-[1.15] font-semibold text-foreground mb-4">
                Start creating your first ad — free
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-base leading-relaxed">
                No credit card required. Create a studio-quality audio ad in minutes and see the platform in action.
              </p>
              <Button size="lg" className="rounded-[8px] px-8" onClick={() => setAuthOpen(true)}>
                Get Started
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <LandingFooter />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
