import { useEffect, useState } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Lightbulb, Wand2, Target, BarChart3, ArrowRight, Zap, RefreshCw, Shield, Clock } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Lightbulb,
    title: 'Describe Your Business',
    description: 'Start by entering your brand name or website URL. Our AI instantly analyzes your business — your industry, tone of voice, target audience, and competitive landscape — to build a foundation for your ad.',
    detail: 'No creative brief needed. The AI pulls information from your website, social profiles, and industry benchmarks to understand what makes your business unique.',
    proTip: 'Add a short description of your current promotion or offer for the most targeted script.',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'AI Creates Your Ad',
    description: 'In under 60 seconds, the platform generates a complete audio ad: a written script, a selected voice, background music, and a fully mixed audio file. Every element is chosen to match your brand personality.',
    detail: 'The AI considers your industry norms, competitor messaging, and audience preferences. It generates multiple script options and selects the voice that best matches your brand\'s energy.',
    proTip: 'You can regenerate any element — swap the voice, change the music, or edit the script directly.',
  },
  {
    number: '03',
    icon: Target,
    title: 'Set Your Audience & Budget',
    description: 'Define who hears your ad and how much you want to spend. Choose your target geography (down to city-level), demographics, interests, and preferred content categories. Set a daily or total budget starting from as low as $50.',
    detail: 'Our forecast engine shows estimated reach, impressions, and frequency before you commit. Adjust your targeting in real-time to optimize delivery.',
    proTip: 'Start with a broad audience and let the platform\'s optimization narrow it down based on engagement data.',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Launch & Track Results',
    description: 'Hit launch and your ad goes live across premium audio inventory — podcasts, music streaming, and digital radio. Track performance in real-time with metrics that matter: listens, completion rate, reach, and conversions.',
    detail: 'Campaigns are reviewed and activated within hours. You\'ll receive push notifications for key milestones and weekly summary reports.',
    proTip: 'Connect your attribution platform (AppsFlyer, Adjust) for end-to-end conversion tracking.',
  },
];

const behindTheScenes = [
  { icon: Zap, title: 'Brand Analysis', description: 'AI scans your website, extracts brand colors, tone, products, and unique selling points.' },
  { icon: Wand2, title: 'Script Writing', description: 'Natural language model crafts a persuasive script optimized for audio attention spans.' },
  { icon: RefreshCw, title: 'Voice Synthesis', description: 'Neural voice engine produces human-quality narration with natural inflection and pacing.' },
  { icon: Shield, title: 'Audio Mastering', description: 'Automatic loudness normalization, compression, and format encoding to broadcast standards.' },
];

const lifecycleSteps = [
  { title: 'Delivery Optimization', description: 'Our system distributes your ad across the highest-performing inventory slots, adjusting in real-time based on listener engagement.' },
  { title: 'Frequency Capping', description: 'Listeners won\'t hear your ad more than a set number of times per day or week — preventing fatigue and maintaining positive brand perception.' },
  { title: 'Performance Reporting', description: 'Hourly dashboard updates show impressions, completion rates, reach, and attribution data. Export reports anytime.' },
  { title: 'Budget Pacing', description: 'Smart pacing ensures your budget is spent evenly across the campaign duration, avoiding early exhaustion or under-delivery.' },
];

const faqs = [
  { q: 'How much does it cost to create an ad?', a: 'Creating an ad with our AI tool is completely free. You only pay when you launch a campaign to distribute it. Campaign budgets start from $50.' },
  { q: 'How long does it take to create an audio ad?', a: 'The AI generates a complete audio ad — script, voice, music, and mastering — in under 60 seconds. You can customize and iterate as many times as you like before launching.' },
  { q: 'What\'s the minimum campaign budget?', a: 'You can launch a campaign with as little as $50. There are no long-term commitments or minimum spend requirements.' },
  { q: 'Which regions do you support?', a: 'We currently support campaigns across the UAE, Saudi Arabia, Egypt, and other MENA markets, with global expansion in progress. Contact us for specific availability.' },
  { q: 'Can I use my own audio file instead of AI-generated ads?', a: 'Absolutely. You can upload your own pre-produced audio file and use our platform purely for targeting, distribution, and reporting.' },
  { q: 'How do I track conversions?', a: 'We support pixel-based tracking, promo codes, and integrations with AppsFlyer and Adjust. You can also track listen-through rates and website visits directly in the dashboard.' },
  { q: 'What audio formats do you support?', a: 'We support MP3 and WAV uploads. AI-generated ads are automatically exported in the optimal format for each distribution channel.' },
  { q: 'Can I pause or stop a campaign once it\'s live?', a: 'Yes. You can pause, resume, or stop any campaign at any time from the dashboard. Unspent budget is preserved for future campaigns.' },
];

export default function HowItWorks() {
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-28 pb-10 md:pt-36 md:pb-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            From Idea to Airwaves: A Complete Guide
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about creating, launching, and optimizing your audio ad campaign — broken down step by step.
          </p>
        </div>
      </section>

      <Separator />

      {/* Step-by-step Guide */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-10">Step-by-Step Guide</h2>
          <div className="space-y-10">
            {steps.map((step, i) => (
              <div key={step.number} className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">{step.number}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                    <step.icon className="h-5 w-5 text-primary" />
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">{step.description}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.detail}</p>
                  <div className="bg-primary/5 rounded-[12px] p-4 flex items-start gap-3">
                    <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground"><span className="font-medium">Pro tip:</span> {step.proTip}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex justify-center mt-6 md:hidden">
                      <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Behind the Scenes */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">What Happens Behind the Scenes</h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            When you click "Generate," here's the AI pipeline that produces your ad in seconds.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {behindTheScenes.map((item, i) => (
              <Card key={item.title} className="rounded-[16px] border border-border relative">
                <CardContent className="p-6 text-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Campaign Lifecycle */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Campaign Lifecycle</h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            What happens after you hit launch? Your campaign is continuously optimized for maximum impact.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {lifecycleSteps.map((item) => (
              <Card key={item.title} className="rounded-[16px] border border-border">
                <CardContent className="p-6">
                  <Clock className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* FAQ */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-10">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="max-w-2xl">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <div className="bg-secondary rounded-[32px] p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Try it now — your first ad is free</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Create a broadcast-quality audio ad in under 60 seconds. No credit card, no commitment.
            </p>
            <Button size="lg" className="rounded-[8px] px-8" onClick={() => setAuthOpen(true)}>
              Create Your Free Ad
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
