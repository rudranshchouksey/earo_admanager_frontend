import { useEffect, useState } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Users, Radio, Award, ChevronDown, ChevronUp } from 'lucide-react';

import valentinoLogo from '@/assets/logos/valentino.png';
import jnjLogo from '@/assets/logos/johnson-johnson.png';
import careemLogo from '@/assets/logos/careem.png';
import emiratesLogo from '@/assets/logos/emirates.png';
import visaLogo from '@/assets/logos/visa.png';

interface CaseStudy {
  brand: string;
  initials: string;
  logo?: string;
  industry: string;
  campaignTypes: string[];
  objective: string;
  execution: string;
  metrics?: { label: string; value: string }[];
}

const caseStudies: CaseStudy[] = [
  {
    brand: 'Valentino',
    initials: 'V',
    logo: valentinoLogo,
    industry: 'Luxury',
    campaignTypes: ['Awareness'],
    objective: 'Drive brand awareness and purchase intent for Valentino\'s fragrance line across premium audiences in the MENA region.',
    execution: 'Deployed targeted audio ads across music streaming platforms, reaching affluent listeners during curated luxury lifestyle playlists and podcasts.',
    metrics: [
      { label: 'Purchase intention', value: '+34%' },
      { label: 'Brand affection', value: '+16%' },
      { label: 'LTR', value: '96%' },
    ],
  },
  {
    brand: 'Johnson & Johnson',
    initials: 'J&J',
    logo: jnjLogo,
    industry: 'Skincare',
    campaignTypes: ['Awareness', 'Consideration'],
    objective: 'Increase brand recall and consideration for J&J skincare products among health-conscious consumers.',
    execution: 'Ran multi-format audio campaigns across health, wellness, and parenting podcast inventory with sequential messaging.',
    metrics: [
      { label: 'Brand recall uplift', value: '+13pt' },
      { label: 'Interest increase', value: '+28pt' },
      { label: 'Brand likability', value: '+20pt' },
    ],
  },
  {
    brand: 'Careem',
    initials: 'C',
    logo: careemLogo,
    industry: 'E-commerce',
    campaignTypes: ['Performance', 'DCO'],
    objective: 'Drive app installs and first-ride conversions at an efficient cost per install across the UAE and Saudi Arabia.',
    execution: 'Leveraged dynamic creative optimization (DCO) to serve personalized audio ads based on listener location and time of day.',
    metrics: [
      { label: 'LTR', value: '96%' },
      { label: 'CPI', value: '<$3' },
    ],
  },
  {
    brand: 'Emirates Airlines',
    initials: 'EA',
    logo: emiratesLogo,
    industry: 'Travel Airline',
    campaignTypes: ['Awareness'],
    objective: 'Strengthen brand presence and drive consideration for Emirates routes among frequent travelers.',
    execution: 'Premium audio placements across travel, business, and news podcasts with immersive sound design showcasing the Emirates experience.',
    metrics: [
      { label: 'LTR', value: '97%' },
      { label: 'Brand Interest', value: '+23%' },
      { label: 'Likability', value: '+21%' },
      { label: 'Consideration', value: '+11%' },
    ],
  },
  {
    brand: 'Visa',
    initials: 'Vi',
    logo: visaLogo,
    industry: 'Financial Services',
    campaignTypes: ['Branded Content', 'Awareness'],
    objective: 'Build top-of-mind awareness for Visa\'s contactless payment solutions among digitally active consumers.',
    execution: 'Sponsored branded audio content segments within popular finance and lifestyle podcasts, integrating Visa messaging naturally into editorial content.',
    metrics: [
      { label: 'LTR', value: '95%' },
    ],
  },
  {
    brand: 'BEL Group',
    initials: 'BG',
    industry: 'FMCG',
    campaignTypes: ['Awareness'],
    objective: 'Boost brand interest and recall for BEL Group\'s dairy portfolio among family audiences.',
    execution: 'Audio campaigns across family and cooking podcast inventory with targeted reach during meal-prep hours.',
    metrics: [
      { label: 'Brand Interest', value: '+30%' },
      { label: 'LTR', value: '95%' },
    ],
  },
  {
    brand: 'Centrum',
    initials: 'Ce',
    industry: 'CPG',
    campaignTypes: ['Consideration'],
    objective: 'Drive purchase intent and brand image for Centrum\'s multivitamin range among health-aware adults.',
    execution: 'Targeted audio ads on health, fitness, and wellness streaming content with clear product benefit messaging.',
    metrics: [
      { label: 'Purchase intention', value: '+34%' },
      { label: 'Brand Interest', value: '+24%' },
      { label: 'Brand Image', value: '+28%' },
    ],
  },
  {
    brand: 'Accor Hotels',
    initials: 'AH',
    industry: 'Travel & Tourism',
    campaignTypes: ['Interest'],
    objective: 'Generate interest and booking intent for Accor Hotels properties across the Middle East.',
    execution: 'Seasonal audio campaigns on travel and lifestyle platforms, highlighting exclusive offers and destination experiences.',
    metrics: [
      { label: 'LTR', value: '96%' },
      { label: 'Purchase intention', value: '+34%' },
    ],
  },
  {
    brand: 'P&O Ferries',
    initials: 'P&O',
    industry: 'Travel & Tourism',
    campaignTypes: ['Consideration'],
    objective: 'Increase consideration for P&O Ferries as a holiday travel option among UK families.',
    execution: 'Targeted audio campaigns on family, travel, and entertainment podcast and music streaming platforms.',
    metrics: [
      { label: 'Consideration', value: '+45%' },
      { label: 'LTR', value: '96%' },
    ],
  },
  {
    brand: 'Saxo Bank',
    initials: 'SB',
    industry: 'Finance',
    campaignTypes: ['Awareness', 'Consideration'],
    objective: 'Build awareness among active investors and traders for Saxo Bank\'s trading platform.',
    execution: 'Placed audio ads across business news, finance, and investing podcast inventory.',
  },
  {
    brand: 'Hubpay',
    initials: 'HP',
    industry: 'Fintech',
    campaignTypes: ['Awareness'],
    objective: 'Drive awareness for Hubpay\'s digital payment solution among expats in the UAE.',
    execution: 'Geo-targeted audio campaigns reaching expat listeners on music streaming platforms during commute hours.',
  },
  {
    brand: 'BMW',
    initials: 'BM',
    industry: 'Automotive',
    campaignTypes: ['DCO', 'Performance'],
    objective: 'Drive test-drive bookings and model-specific interest using dynamic creative.',
    execution: 'DCO-powered audio ads personalized by listener location, serving nearest dealership information dynamically.',
  },
  {
    brand: 'Travel Switzerland',
    initials: 'TS',
    industry: 'Travel & Tourism',
    campaignTypes: ['Awareness', 'Performance'],
    objective: 'Inspire MENA travelers to consider Switzerland as a premium holiday destination.',
    execution: 'Immersive audio storytelling campaigns across travel and luxury lifestyle streaming content.',
  },
  {
    brand: 'Capital.com',
    initials: 'Ca',
    industry: 'Finance',
    campaignTypes: ['Awareness', 'Sponsorship'],
    objective: 'Build brand awareness for Capital.com\'s trading platform among retail investors.',
    execution: 'Sponsored segments within popular finance and business podcasts with host-read integrations.',
  },
  {
    brand: 'Cadbury',
    initials: 'Cd',
    industry: 'FMCG',
    campaignTypes: ['Awareness'],
    objective: 'Reinforce brand love and drive top-of-mind recall during seasonal campaigns.',
    execution: 'Audio ads across music streaming platforms timed around key seasonal moments like Ramadan and Eid.',
  },
  {
    brand: 'Dell',
    initials: 'De',
    industry: 'B2B & Technology',
    campaignTypes: ['Awareness', 'Host Read'],
    objective: 'Reach IT decision-makers and small business owners with Dell\'s enterprise solutions messaging.',
    execution: 'Host-read ad placements on technology, business, and entrepreneurship podcasts.',
  },
  {
    brand: 'Pegasus Airlines',
    initials: 'PA',
    industry: 'Travel & Tourism',
    campaignTypes: ['Awareness'],
    objective: 'Drive awareness of Pegasus Airlines\' affordable routes across new markets.',
    execution: 'Targeted audio campaigns on travel and lifestyle platforms in key origin markets.',
  },
  {
    brand: 'Saudia',
    initials: 'Sa',
    industry: 'Travel & Tourism',
    campaignTypes: ['Awareness'],
    objective: 'Strengthen Saudia\'s brand presence among international travelers.',
    execution: 'Premium audio placements on travel, news, and cultural content platforms.',
  },
  {
    brand: 'Dubai Tourism',
    initials: 'DT',
    industry: 'Travel & Tourism',
    campaignTypes: ['Awareness'],
    objective: 'Promote Dubai as a world-class tourism destination to global audiences.',
    execution: 'Multi-market audio campaigns across music and podcast platforms, highlighting Dubai\'s attractions and experiences.',
  },
  {
    brand: 'Standard Chartered',
    initials: 'SC',
    industry: 'Finance & Banking',
    campaignTypes: ['Awareness'],
    objective: 'Increase awareness of Standard Chartered\'s banking products in key growth markets.',
    execution: 'Targeted audio ads on business, finance, and lifestyle podcast inventory.',
  },
  {
    brand: 'American Express',
    initials: 'AE',
    industry: 'Finance & Banking',
    campaignTypes: [],
    objective: 'Reinforce premium brand positioning and drive card acquisition among affluent listeners.',
    execution: 'Sponsored audio content across luxury lifestyle, travel, and dining podcast categories.',
  },
  {
    brand: 'Adidas',
    initials: 'Ad',
    industry: 'Fashion/Lifestyle',
    campaignTypes: ['Awareness'],
    objective: 'Drive brand engagement and product launches among young, active audiences.',
    execution: 'Audio ads placed during workout playlists and sports-related streaming content.',
  },
  {
    brand: 'Brain & Performance Centre',
    initials: 'BP',
    industry: 'Healthcare/Wellness',
    campaignTypes: ['Consideration', 'Performance'],
    objective: 'Generate leads and bookings for specialized brain health assessment services.',
    execution: 'Targeted audio campaigns on health, wellness, and self-improvement podcast inventory with clear CTAs.',
  },
  {
    brand: 'Calpol',
    initials: 'Cl',
    industry: 'CPG/Healthcare',
    campaignTypes: ['Awareness'],
    objective: 'Build trust and awareness among parents for Calpol\'s children\'s health products.',
    execution: 'Audio ads on parenting and family podcast content, timed around cold and flu season.',
  },
  {
    brand: 'Volkswagen',
    initials: 'VW',
    industry: 'Automotive',
    campaignTypes: [],
    objective: 'Drive awareness and showroom visits for Volkswagen\'s latest model line-up.',
    execution: 'Geo-targeted audio campaigns reaching in-market auto buyers across music and podcast platforms.',
  },
];

const industryQuotes = [
  { industry: 'Food & Beverage', quote: 'We tried everything — Instagram, Google, flyers. Audio was the first channel where we could actually track walk-ins to ad listens.', author: 'Mariam K., Restaurant Owner' },
  { industry: 'Fitness', quote: 'Our members told us they heard our ad while working out. That\'s exactly when they\'re most motivated to try something new.', author: 'Ahmed R., Gym Founder' },
  { industry: 'Retail', quote: 'The production quality was incredible. People thought we hired a professional agency. It was just me and the AI tool.', author: 'Nour S., Boutique Owner' },
  { industry: 'Services', quote: 'I set up the campaign during my lunch break and had calls coming in by the next morning. Nothing else works this fast.', author: 'Faisal T., Clinic Manager' },
];

const stats = [
  { value: '500+', label: 'Brands on EARO', icon: Users },
  { value: '10M+', label: 'Listeners Reached', icon: Radio },
  { value: '3.2x', label: 'Average ROAS', icon: TrendingUp },
  { value: '92%', label: 'Client Satisfaction', icon: Award },
];

export default function Testimonials() {
  const [authOpen, setAuthOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayedStudies = showAll ? caseStudies : caseStudies.slice(0, 5);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-28 pb-10 md:pt-36 md:pb-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-4">
            Audio Advertising Performance Results
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how brands across industries are using digital audio advertising to drive real performance, from awareness to action.
          </p>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-8">
        <div className="container mx-auto max-w-[1088px] px-4">
          <div className="bg-secondary rounded-[16px] p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-semibold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Case Studies */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Case Studies</h2>
          <p className="text-muted-foreground mb-10 max-w-xl">
            Campaign highlights from brands that achieved their goals with audio advertising.
          </p>
          <div className="space-y-4">
            {displayedStudies.map((cs) => (
              <Card key={cs.brand} className="rounded-[16px] border border-border overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Left: Logo + Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {cs.logo ? (
                            <img src={cs.logo} alt={cs.brand} className="w-full h-full object-contain p-1.5" />
                          ) : (
                            <span className="text-sm font-semibold text-primary">{cs.initials}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{cs.brand}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {cs.industry}
                            </span>
                            {cs.campaignTypes.map((ct) => (
                              <span key={ct} className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {ct}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">Objective: </span>
                          {cs.objective}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Campaign Execution: </span>
                          {cs.execution}
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics */}
                    {cs.metrics && cs.metrics.length > 0 && (
                      <div className="md:w-56 flex-shrink-0 bg-secondary rounded-[12px] p-4">
                        <p className="text-xs font-medium text-foreground mb-2">Key Results</p>
                        <ul className="space-y-2">
                          {cs.metrics.map((m) => (
                            <li key={m.label} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{m.label}</span>
                              <span className="font-semibold text-foreground">{m.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Show More / Show Less */}
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              size="lg"
              className="rounded-[8px] gap-2"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>Show Less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show More ({caseStudies.length - 5} more) <ChevronDown className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* By Industry */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-10">What Business Owners Say</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {industryQuotes.map((q) => (
              <Card key={q.author} className="rounded-[16px] bg-secondary border-0">
                <CardContent className="p-6">
                  <span className="text-xs font-medium text-primary">{q.industry}</span>
                  <p className="text-sm text-foreground mt-3 mb-4 italic leading-relaxed">"{q.quote}"</p>
                  <p className="text-xs text-muted-foreground font-medium">— {q.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-[80px]">
        <div className="container mx-auto max-w-[1088px] px-4">
          <div className="bg-secondary rounded-[32px] p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">Join hundreds of brands already on air</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Start your first campaign today and see why brands are switching to audio.
            </p>
            <Button size="lg" className="rounded-[8px] px-8" onClick={() => setAuthOpen(true)}>
              Get Started
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
