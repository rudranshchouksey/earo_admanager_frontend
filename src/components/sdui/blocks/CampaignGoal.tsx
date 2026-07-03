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
    sales: "Write a 30-second sales ad for My Brand Pizza targeting young adults in Dubai.<br /><br /><strong>[Language]</strong> English (Standard American) <br /><strong>[Tone]</strong> energetic<br /><strong>[Target audience]</strong> young adults in Dubai<br /><strong>[Brand website]</strong> www.mybrandpizza.com<br /><strong>[Opening hook]</strong> \"Craving pizza tonight?\"<br /><strong>[Product]</strong> freshly made pizza delivered in under 30 minutes.<br /><strong>[Offer]</strong> 20% off the first order using promo code PIZZA20.<br /><strong>[Urgency]</strong> Tonight only.<br /><strong>[CTA]</strong> Order now at www.mybrandpizza.com.<br /><strong>[Tagline]</strong> Delivering happiness to your door.<br /><strong>[Mixed language]</strong> Use the tagline in English",
    leads: "Write a 30-second lead generation ad for My Brand Finance targeting homeowners in Abu Dhabi.<br /><br /><strong>[Language]</strong> Arabic (Gulf - Khaleeji)<br /><strong>[Tone]</strong> warm, conversational<br /><strong>[Target audience]</strong> homeowners in Abu Dhabi<br /><strong>[Brand website]</strong> www.mybrandfinance.com<br /><strong>[Product]</strong> freshly made pizza delivered in under 30 minutes<br /><strong>[Opening hook]</strong> \"Craving something delicious tonight?\"<br /><strong>[Lead magnet]</strong> a free 10-minute consultation, no commitment<br /><strong>[Trust signal]</strong> rated 4.9 stars by over 5,000 customers<br /><strong>[CTA]</strong> Order now at our website.",
    traffic: "Write a 30-second website traffic ad for My Brand Fashion targeting women aged 25-40 across the UAE.<br /><br /><strong>[Language]</strong> English (Standard British)<br /><strong>[Tone]</strong> inspiring, aspirational<br /><strong>[Target audience]</strong> women aged 25-40 across the UAE<br /><strong>[Brand website]</strong> www.mybrandfashion.com<br /><strong>[Opening hook]</strong> \"Looking for something new this season?\"<br /><strong>[ Product]</strong> an online fashion destination with new arrivals every week.<br /><strong>[Context]</strong> the new summer collection has just dropped with exclusive online-only styles.<br /><strong>[Occasion]</strong> Summer Sale.<br /><strong>[CTA]</strong> Explore the new collection at www.mybrandfashion.com.",
    consideration: "Write a 30-second consideration ad for My Brand Solar targeting homeowners in Saudi Arabia.<br /><br /><strong>[Language]</strong> Arabic (Gulf - Khaleeji)<br /><strong>[Tone]</strong> authoritative, confident<br /><strong>[Target audience]</strong> homeowners in Saudi Arabia<br /><strong>[Brand website]</strong> www.mybrandsolar.com<br /><strong>[Opening hook]</strong> \"Worried about the cost of switching to solar?\"<br /><strong>[Product]</strong> a premium solar installation service with zero upfront cost and a 25-year performance guarantee.<br /><strong>[Key differentiator]</strong> no lock-in contract and free annual maintenance included.<br /><strong>[Objection to address]</strong> think it's too complicated to switch.<br /><strong>[Trust signal]</strong> over 2,000 installations across the GCC, rated 4.8 stars.<br /><strong>[CTA]</strong> Find out more at www.mybrandsolar.com.",
    awareness: "Write a 30-second brand awareness ad for My Brand Bank targeting young adults across the UAE<br /><br /><strong>[Language]</strong> English (Standard American)<br /><strong>[Tone]</strong> inspiring, warm<br /><strong>[Target audience]</strong> young adults across the UAE<br /><strong>[Brand website]</strong> www.mybrandbank.com<br /><strong>[Brand personality]</strong> modern, human, and approachable.<br /><strong>[Brand mission]</strong> we believe banking should work for people, not the other way around.<br /><strong>[Emotional feeling]</strong> the listener should feel empowered and hopeful, like a better financial choice is genuinely within reach.<br /><strong>[Tagline]</strong> A better way to bank.<br /><strong>[Light CTA]</strong> find us at mybrandbank.com.",
    app: "Write a 30-second app promotion ad for My Brand, a grocery delivery app, targeting busy families in Dubai.<br /><br /><strong>[Language]</strong> English (Standard American)<br /><strong>[Tone]</strong> energetic, fun<br /><strong>[Target audience]</strong> busy families in Dubai<br /><strong>[Brand website]</strong> www.mybrandapp.com<br /><strong>[Opening hook]</strong> \"Hate waiting in supermarket queues?\"<br /><strong>[App description]</strong> the fastest grocery delivery service in Dubai,  over 5,000 products delivered in under 60 minutes.<br /><strong>[Offer]</strong> new users get AED 30 off their first order<br /><strong>[Platform]</strong> available on iOS and Android.<br /><strong>[CTA]</strong> Download the My Brand app today, search My Brand on the App Store and Google Play.",
    local: "Write a 30-second local store visit ad for My Brand Bakery targeting families in Riyadh.<br /><br /><strong>[Language]</strong> Arabic (Gulf - Khaleeji)<br /><strong>[Tone]</strong> warm, inviting<br /><strong>[Target audience]</strong> families in Riyadh<br /><strong>[Brand website]</strong> www.mybrandbakery.com<br /><strong>[Opening hook]</strong> \"Looking for the perfect weekend treat?\"<br /><strong>[Product]</strong> a fresh daily-baked goods store with seasonal specials.<br /><strong>[Offer]</strong> 15% off all pastries this weekend.<br /><strong>[Urgency]</strong> offer ends Sunday evening.<br /><strong>[Location]</strong> next to Al Faisaliah Tower on King Fahd Road; easy to find, free parking.<br /><strong>[Opening hours]</strong> open daily from 7am to 10pm.<br /><strong>[CTA]</strong> Come visit us at My Brand Bakery on King Fahd Road.",
    podcast: "Write a 30-second podcast promotion ad for My Brand Business Podcast, targeting entrepreneurs and business owners across the UAE.<br /><br /><strong>[Language]</strong> English (Standard American)<br /><strong>[Tone]</strong> energetic, authoritative<br /><strong>[Target audience]</strong> entrepreneurs and business owners across the UAE<br /><strong>[Brand website]</strong> www.mybrandpodcast.com<br /><strong>[Podcast description]</strong> a weekly show covering growth strategies, founder stories, and practical business advice for entrepreneurs in the Middle East.<br /><strong>[Opening hook]</strong> \"Ever wondered what separates the top 1% of entrepreneurs from everyone else?\"<br /><strong>[Trust signal]</strong> over 50,000 monthly listeners, ranked #1 in the UAE business podcast charts.<br /><strong>[Host]</strong> hosted by Ahmad Karimi.<br /><strong>[Episode highlight]</strong> this week, Sarah Al-Rashidi reveals how she scaled from one restaurant to a national F&B chain in under three years.<br /><strong>[Platform]</strong> available on Spotify and Apple Podcasts<br /><strong>[CTA]</strong> Search \"My Brand Business Podcast\" on Spotify or Apple Podcasts and subscribe today.",
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
            { value: 'sales', label: 'Sales', icon: DollarSign, tooltip: "Turning interest into results by driving sales, sign-ups, or form completions." },
            { value: 'leads', label: 'Leads', icon: Filter, tooltip: "Attracting qualified leads by inviting the audience to share details for future engagement."},
            { value: 'traffic', label: 'Website Traffic', icon: Globe, tooltip: "Boosting visits to the site or app by motivating people to check it out online." },
            { value: 'consideration', label: 'Consideration', icon: Lightbulb, tooltip: "Spreading the message to the largest possible group, increasing overall exposure." },
            { value: 'awareness', label: 'Brand Awareness', icon: Volume2, tooltip: "Introducing the brand to new audiences and building name recall whenever people think of the category." },
            { value: 'app', label: 'App Promotion', icon: Smartphone, tooltip: "Driving more installs and active users by encouraging listeners to download and engage with the app." },
            { value: 'local', label: 'Store Visits', icon: MapPin, tooltip: "Bringing customers to the location by encouraging in-person visits." },
            { value: 'podcast', label: 'Podcast promotion', icon: Mic, tooltip: "Boosting listeners of your podcast by motivating people to check it out and grow subscribers." },
        ].map(({ value, label, icon: Icon, tooltip }) => {
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
                <span className="text-sm font-semibold text-foreground">{label}</span>
                <MyTooltip infoText={tooltip} />
            </button>
            );
        })}
        </div>
    )
}