import { MyTooltip } from "@/components/ui/MyTooltip";
import { cn } from "@/lib/utils";
import { DollarSign, Filter, Globe, Lightbulb, Volume2, Smartphone, MapPin, Mic } from "lucide-react";


export const goalPlaceholders: Record<string, string> = {
    sales: "Write a 30-second sales ad for My Brand Pizza targeting young adults in Dubai.\n\n[Language] English (Standard American) \n[Tone] energetic\n[Target audience] young adults in Dubai\n[Brand website] www.mybrandpizza.com\n[Opening hook] \"Craving pizza tonight?\"\n[Product] freshly made pizza delivered in under 30 minutes.\n[Offer] 20% off the first order using promo code PIZZA20.\n[Urgency] Tonight only.\n[CTA] Order now at www.mybrandpizza.com.\n[Tagline] Delivering happiness to your door.\n[Mixed language] Use the tagline in English",
    leads: "Write a 30-second lead generation ad for My Brand Finance targeting homeowners in Abu Dhabi.\n\n[Language] Arabic (Gulf - Khaleeji)\n[Tone] warm, conversational\n[Target audience] homeowners in Abu Dhabi\n[Brand website] www.mybrandfinance.com\n[Product] freshly made pizza delivered in under 30 minutes\n[Opening hook] \"Craving something delicious tonight?\"\n[Lead magnet] a free 10-minute consultation, no commitment\n[Trust signal] rated 4.9 stars by over 5,000 customers\n[CTA] Order now at our website.",
    traffic: "Write a 30-second website traffic ad for My Brand Fashion targeting women aged 25-40 across the UAE.\n\n[Language] English (Standard British)\n[Tone] inspiring, aspirational\n[Target audience] women aged 25-40 across the UAE\n[Brand website] www.mybrandfashion.com\n[Opening hook] \"Looking for something new this season?\"\n[ Product] an online fashion destination with new arrivals every week.\n[Context] the new summer collection has just dropped with exclusive online-only styles.\n[Occasion] Summer Sale.\n[CTA] Explore the new collection at www.mybrandfashion.com.",
    consideration: "Write a 30-second consideration ad for My Brand Solar targeting homeowners in Saudi Arabia.\n\n[Language] Arabic (Gulf - Khaleeji)\n[Tone] authoritative, confident\n[Target audience] homeowners in Saudi Arabia\n[Brand website] www.mybrandsolar.com\n[Opening hook] \"Worried about the cost of switching to solar?\"\n[Product] a premium solar installation service with zero upfront cost and a 25-year performance guarantee.\n[Key differentiator] no lock-in contract and free annual maintenance included.\n[Objection to address] think it's too complicated to switch.\n[Trust signal] over 2,000 installations across the GCC, rated 4.8 stars.\n[CTA] Find out more at www.mybrandsolar.com.",
    awareness: "Write a 30-second brand awareness ad for My Brand Bank targeting young adults across the UAE\n\n[Language] English (Standard American)\n[Tone] inspiring, warm\n[Target audience] young adults across the UAE\n[Brand website] www.mybrandbank.com\n[Brand personality] modern, human, and approachable.\n[Brand mission] we believe banking should work for people, not the other way around.\n[Emotional feeling] the listener should feel empowered and hopeful, like a better financial choice is genuinely within reach.\n[Tagline] A better way to bank.\n[Light CTA] find us at mybrandbank.com.",
    app: "Write a 30-second app promotion ad for My Brand, a grocery delivery app, targeting busy families in Dubai.\n\n[Language] English (Standard American)\n[Tone] energetic, fun\n[Target audience] busy families in Dubai\n[Brand website] www.mybrandapp.com\n[Opening hook] \"Hate waiting in supermarket queues?\"\n[App description] the fastest grocery delivery service in Dubai,  over 5,000 products delivered in under 60 minutes.\n[Offer] new users get AED 30 off their first order\n[Platform] available on iOS and Android.\n[CTA] Download the My Brand app today, search My Brand on the App Store and Google Play.",
    local: "Write a 30-second local store visit ad for My Brand Bakery targeting families in Riyadh.\n\n[Language] Arabic (Gulf - Khaleeji)\n[Tone] warm, inviting\n[Target audience] families in Riyadh\n[Brand website] www.mybrandbakery.com\n[Opening hook] \"Looking for the perfect weekend treat?\"\n[Product] a fresh daily-baked goods store with seasonal specials.\n[Offer] 15% off all pastries this weekend.\n[Urgency] offer ends Sunday evening.\n[Location] next to Al Faisaliah Tower on King Fahd Road; easy to find, free parking.\n[Opening hours] open daily from 7am to 10pm.\n[CTA] Come visit us at My Brand Bakery on King Fahd Road.",
    podcast: "Write a 30-second podcast promotion ad for My Brand Business Podcast, targeting entrepreneurs and business owners across the UAE.\n\n[Language] English (Standard American)\n[Tone] energetic, authoritative\n[Target audience] entrepreneurs and business owners across the UAE\n[Brand website] www.mybrandpodcast.com\n[Podcast description] a weekly show covering growth strategies, founder stories, and practical business advice for entrepreneurs in the Middle East.\n[Opening hook] \"Ever wondered what separates the top 1% of entrepreneurs from everyone else?\"\n[Trust signal] over 50,000 monthly listeners, ranked #1 in the UAE business podcast charts.\n[Host] hosted by Ahmad Karimi.\n[Episode highlight] this week, Sarah Al-Rashidi reveals how she scaled from one restaurant to a national F&B chain in under three years.\n[Platform] available on Spotify and Apple Podcasts\n[CTA] Search \"My Brand Business Podcast\" on Spotify or Apple Podcasts and subscribe today.",
  };

  export const goalPlaceholdersHtml: Record<string, string> = {
    sales: "Write a [30-second] sales ad for [Brand name] targeting [audience and location, e.g. young adults in Dubai].<br /><br />[Language] e.g. English (Standard American) · Arabic (Gulf-Khaleeji)<br />[Tone] e.g. energetic · urgent · conversational<br />[Brand website] www.yourbrand.com — the AI reviews this page for additional context<br />[Product] describe what you're selling<br />[Opening hook] e.g. \"Tired of [problem]?\" or \"Looking for [desire]?\"<br />[Offer] e.g. 20% off your first order<br />[Promo code] e.g. SAVE20 — short, all caps, easy to spell when heard<br />[Urgency] e.g. This weekend only · Tonight only · Ends Sunday<br />[CTA] e.g. Order now at [website]<br />[Tagline] e.g. Your brand's closing line".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
    leads: "Write a [30-second] lead generation ad for [Brand name] targeting [audience and location, e.g. homeowners in Abu Dhabi].<br /><br />[Language] e.g. Arabic (Gulf - Khaleeji) · English (Standard American)<br />[Tone] e.g. warm, conversational · reassuring · authoritative<br />[Brand website] www.yourbrand.com — the AI reviews this page for additional context<br />[Product] describe your service or offer<br />[Opening hook] e.g. \"Still paying too much on your [product]?\"<br />[Lead magnet] e.g. free 10-minute consultation, no commitment · free quote in 60 seconds<br />[Trust signal] e.g. rated 4.9 stars by over 5,000 customers · 10 years in the UAE<br />[CTA] e.g. Book your free consultation at [website]<br />[Tagline] e.g. Your brand's closing line".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
    traffic: "Write a [30-second] website traffic ad for [Brand name] targeting [audience and location, e.g. women aged 25-40 across the UAE].<br /><br />[Language] e.g. English (Standard British) · Arabic (MSA)<br />[Tone] e.g. inspiring · curious · aspirational<br />[Brand website] www.yourbrand.com — the AI reviews this page for additional context<br />[Product] describe what's on the website worth visiting<br />[Opening hook] e.g. \"Looking for something new this season?\"<br />[Occasion] e.g. Summer Sale · Eid · Back to School (optional — delete if not relevant)<br />[CTA] e.g. Discover more at [website]<br />[Tagline] e.g. Your brand's closing line".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
    consideration: "Write a [30-second] brand consideration ad for [Brand name] targeting [audience and location, e.g. homeowners in Saudi Arabia].<br /><br />[Language] e.g. Arabic (Gulf - Khaleeji) · English (Standard American)<br />[Tone] e.g. authoritative · confident · empathetic<br />[Brand website] www.yourbrand.com — the AI reviews this page for additional context<br />[Product] describe your product or service<br />[Opening hook] e.g. \"Worried about [common concern]?\"<br />[Key differentiator] e.g. no lock-in contract, free annual maintenance included<br />[Objection to address] e.g. think it's too complicated to switch?<br />[Trust signal] e.g. over 2,000 installations across the GCC, rated 4.8 stars<br />[CTA] e.g. Find out more at [website]<br />[Tagline] e.g. Your brand's closing line".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
    awareness: "Write a [30-second] brand awareness ad for [Brand name] targeting [audience and location, e.g. young adults across the UAE].<br /><br />[Language] e.g. English (Standard American) · Arabic (Gulf - Khaleeji)<br />[Tone] e.g. inspiring · warm · nostalgic<br />[Brand website] www.yourbrand.com — the AI reviews this page for additional context<br />[Brand personality] e.g. modern, human, and approachable · bold and innovative<br />[Brand mission] e.g. we believe banking should work for people, not the other way around<br />[Emotional feeling to leave behind] e.g. empowered and hopeful · a sense of belonging<br />[Tagline] e.g. Your brand's closing line — this should be the final thing the listener hears".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
    app: "Write a [30-second] app promotion ad for [App name], a [brief description of what the app does], targeting [audience and location, e.g. busy families in Dubai].<br /><br />[Language] e.g. English (Standard American) · Arabic (Gulf - Khaleeji)<br />[Tone] e.g. energetic · fun · direct<br />[Brand website] www.yourbrand.com — the AI reviews this page for additional context<br />[App description] describe what the app does and who it's for in one sentence<br />[Opening hook] e.g. \"Hate waiting in supermarket queues?\"<br />[Offer] e.g. new users get AED 30 off their first order (optional — delete if not relevant)<br />[Platform] e.g. available on iOS and Android · App Store and Google Play<br />[CTA] e.g. Search [App name] on the App Store and Google Play<br />[Tagline] e.g. Your brand's closing line".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
    local: "Write a [30-second] local store visit ad for [Brand name] targeting [audience and location, e.g. families in Riyadh].<br /><br />[Language] e.g. Arabic (Gulf - Khaleeji) · English (Standard American)<br />[Tone] e.g. warm · inviting · energetic<br />[Brand website] www.yourbrand.com — the AI reviews this page for additional context<br />[Product] describe what your store sells<br />[Opening hook] e.g. \"Looking for the perfect weekend treat?\"<br />[Offer] e.g. 15% off all pastries this weekend (optional — delete if not relevant)<br />[Urgency] e.g. Offer ends Sunday evening (optional — delete if not relevant)<br />[Location] e.g. next to [landmark] on [road name] — use a landmark, not just an address<br />[Opening hours] e.g. open daily from 7am to 10pm<br />[CTA] e.g. Come visit us at [Brand name] on [road name]<br />[Tagline] e.g. Your brand's closing line".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
    podcast: "Write a [30-second] podcast promotion ad for [Podcast name] targeting [audience and location, e.g. entrepreneurs and business owners across the UAE].<br /><br />[Language] e.g. English (Standard American) · Arabic (Gulf - Khaleeji)<br />[Tone] e.g. energetic · authoritative · curious<br />[Brand website] www.yourpodcast.com — the AI reviews this page for additional context<br />[Podcast description] describe what the podcast is about and who it's for<br />[Opening hook] e.g. \"Ever wondered what separates the top 1% of entrepreneurs from everyone else?\"<br />[Trust signal] e.g. 50,000 monthly listeners · ranked #1 in the UAE business podcast charts (optional)<br />[Host] e.g. hosted by [Host name] (optional — include if the name adds recognition)<br />[Episode highlight] e.g. this week, [Guest name] reveals [key insight or story] (optional)<br />[Platform] e.g. available on Spotify and Apple Podcasts<br />[CTA] e.g. Search \"[Podcast name]\" on Spotify or Apple Podcasts and subscribe today<br />[Tagline] e.g. Your podcast's closing line (optional)".replace(/(\[[^\]]+\])/g, "<strong>$1</strong>")
    .replace(/\.\s/g, ". <br />"),
};

export const campaignGoalTooltip = `<div class="p-2">
Choose the primary outcome you want this ad to drive. The goal shapes the AI's script tone and the platform's default conversion tracking settings.
<br />
<br />
<b>Sales</b><br />
Drive listeners to make a purchase directly. The AI writes an urgent, offer-led script that names the deal clearly and pushes the listener to act right now.
<br />
<br />

<b>Leads</b>
<br />
Encourage listeners to take a low-friction first step — request a quote, fill in a form, or book a call. The AI builds credibility and makes contacting you feel effortless and risk-free.
<br />
<br />

<b>Website Traffic</b>
<br />
Drive listeners to visit a specific URL. The AI creates a curiosity-driven script that makes visiting your site feel like a natural next step — without a hard sell or pricing pressure.
<br />
<br />

<b>Product & Brand Consideration</b>
<br />
Move listeners from awareness into active consideration. The AI builds preference through an informative, confident script — educating rather than selling, and ending with a soft invitation to find out more.
<br />
<br />

<b>Brand Awareness & Reach</b>
<br />
Build recognition and emotional connection — no immediate action required. The AI writes a brand storytelling script that creates a feeling and a memory, not a sales pitch.
<br />
<br />

<b>App Promotion</b>
<br />
Drive listeners to download or re-engage with your mobile app. The AI creates a scenario-driven script that puts the listener inside a real moment where the app solves a problem — then closes with a specific proof point and both app store names.
<br />
<br />

<b>Local Store Visits & Promotions</b>
<br />
Drive foot traffic to a physical location. The AI creates an urgency-and-location script that makes the listener feel they will miss out if they do not visit — and tells them exactly where to go and when.
<br />
</div>


`;

export default function CampaignGoal({ goal, onGoalChange }: { goal: string, onGoalChange: (value: string) => void }) {
    return (
        <div className="hidden md:grid grid-cols-4 gap-3">
        {[
            { value: 'sales', label: 'Sales', description: "Drive conversions",  icon: DollarSign, tooltip: "Turning interest into results by driving sales, sign-ups, or form completions." },
            { value: 'leads', label: 'Leads', description: "Generate enquiries", icon: Filter, tooltip: "Best for capturing contact details or bookings. The script will establish a pain point, introduce a low-barrier entry offer, and close with an easy next step."},
            { value: 'traffic', label: 'Website Traffic', description: "Boost site visits", icon: Globe, tooltip: "Best for driving listeners to your website. The script will build curiosity, tease what's waiting on the site, and close with a direct URL call to action." },
            { value: 'consideration', label: 'Consideration', description: "Earn a second look", icon: Lightbulb, tooltip: "Best for getting listeners to seriously evaluate your brand. The script will acknowledge a common objection, counter it with a differentiator, and close with a low-friction 'find out more' action." },
            { value: 'awareness', label: 'Brand Awareness', description: "Build brand recall", icon: Volume2, tooltip: "Best for introducing the brand and making it memorable. The script will focus on who you are and how you want to make listeners feel — not on a product or a link." },
            { value: 'app', label: 'App Promotion', description: "Drive installs", icon: Smartphone, tooltip: "Best for growing your app user base. The script will describe the app's core benefit, name the platforms, lead with a download incentive, and close with a direct app store call to action." },
            { value: 'local', label: 'Store Visits', description: "Bring people in", icon: MapPin, tooltip: "Best for driving footfall to a physical location. The script will give a reason to visit today, name a recognisable landmark, include opening hours, and close with a clear location call to action." },
            { value: 'podcast', label: 'Podcast promotion', description: "Grow your audience", icon: Mic, tooltip: "Best for winning new podcast subscribers. The script will tease a pain point the show addresses regularly, surface a standout episode or guest, and close with a platform-specific subscribe call to action. " },
        ].map(({ value, label, description, icon: Icon, tooltip }) => {
            const selected = goal === value;
            return (
            <button
                key={value}
                type="button"
                onClick={() => onGoalChange(value)}
                className={cn(
                'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all',
                selected
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border bg-card hover:bg-muted/50'
                )}
            >
                <span
                className={cn(
                    'flex items-center justify-center rounded-xl w-10 h-10 shrink-0',
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
                >
                <Icon className="w-5 h-5" />
                </span>
                <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <span className="text-xs font-semibold text-muted-foreground">{description}</span>
                </div>
                <MyTooltip infoText={tooltip} />
            </button>
            );
        })}
        </div>
    )
}