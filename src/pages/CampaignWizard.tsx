import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import type { LocationData } from "@/components/dashboard/campaign-wizard/CampaignInventoryStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
// import { useDevFlags } from '@/contexts/DevFlagsContext';

import CampaignSetupStep from "@/components/dashboard/campaign-wizard/CampaignSetupStep";
import CampaignScheduleStep, { TIME_SLOTS } from "@/components/dashboard/campaign-wizard/CampaignScheduleStep";
import CampaignInventoryStep from "@/components/dashboard/campaign-wizard/CampaignInventoryStep";
import CampaignTargetingStep from "@/components/dashboard/campaign-wizard/CampaignTargetingStep";
import CampaignBudgetStep from "@/components/dashboard/campaign-wizard/CampaignBudgetStep";
import CampaignPaymentStep from "@/components/dashboard/campaign-wizard/CampaignPaymentStep";
import ForecastSidebar from "@/components/dashboard/campaign-wizard/ForecastSidebar";
import CampaignSummary from "@/components/dashboard/campaign-wizard/CampaignSummary";
import AudienceExtensionStep from "@/components/dashboard/campaign-wizard/AudienceExtensionStep";
import type { AudienceExtensionData, BannerSlot } from "@/components/dashboard/campaign-wizard/AudienceExtensionStep";
import CampaignLaunchModal from "@/components/dashboard/campaign-wizard/CampaignLaunchModal";
import { useSessionFlags, getPlanFromSession } from "@/hooks/useSessionFlags";
import { trackPurchase } from "@/lib/gtm";
import {
  City,
  Country,
  PodcastAudience,
  PublisherSegment,
  StreamingAudience,
  targetingApi,
  TargetingSegment,
} from "@/services/targeting";
import { DAYS_OF_WEEK } from "@/components/dashboard/campaign-wizard/CampaignScheduleStep";
import { countryCPM } from "@/lib/defaults";
import { auth } from "@/services/auth";
import { AdGroup, campaignApi, SavedTransaction } from "@/services/campaign";
import PaymentModal from "@/components/dashboard/launch/PaymentModal";
import { CreditDetails, CreditDetailsResponse, walletApi } from "@/services/wallet";
import { adsApi } from "@/services/ads";
import { MyTooltip } from "@/components/ui/MyTooltip";
import { Helmet } from "react-helmet-async";
import { paymentApi } from "@/services/payment";

interface Cards {
  id: string;
  cardId: string;
  last_4: string;
  cardHolderName: string;
  type: string;
}

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}


const scheduleTooltip = `
<div class="p-2">
Set when your campaign runs. Start and end dates, which days of the week, and which parts of the day your ad is served.
<br /><br />
<b>Start date and time</b><br />
Your campaign begins serving impressions from this date and time. Set at least 24 hours in the future to allow for processing.
<br /><br />

<b>End date and time</b><br />
Your campaign stops automatically at this point—or earlier if your total budget is reached. No overspend is possible.
<br /><br />

<b>Duration shortcuts</b><br />
Select a common campaign length to automatically set the end date from your start date.
<br /><br />

<b>Active days</b><br />
Your ad only runs on the days you select. Deselect days where your audience is less active to concentrate budget on higher-converting periods.
<br /><br />

<b>Active time slots</b><br />
Restrict delivery to specific parts of the day. All four slots are active by default. After your campaign runs, check the time-of-day report to identify which slots drive the most conversions.
<ul>
<li>Morning (6am - 12pm): Reaches commuters and early-day listeners. Typically high-performance for business, news, and fitness advertisers.</li>
<li>Afternoon (12pm - 6pm): Captures lunchtime and afternoon listeners. Effective for lifestyle, food, and retail advertisers.</li>
<li>Evening (6pm - 12am): High engagement period as listeners wind down. Strong for entertainment, home, and finance advertisers.</li>
<li>Overnight (12am - 6am): Lower volume but lower cost per impression. Consider deselecting if your audience is unlikely to be active at this time.</li>
</ul>

</div>
`;


const budgetTooltip = `
<div class="p-2">
Set your daily spend. The Campaign Forecast on the right updates in real time as you adjust—showing estimated impressions, reach, and frequency.
<br /><br />
Actual spend may be lower if full inventory is not available.
<br /><br />

<b>Daily rate</b><br />
Set your desired daily spend.
<br /><br />

<b>Total budget</b> <br />
This is the maximum you will be charged for this campaign (e.g., $750 over 30 days). 
<br /><br />

<b>Budget shortcuts</b><br />
Use common daily budgets for quick selection.

</div>
`;


const locationTooltip = `
<div class="p-2">

Choose where your ad is heard. Select one or more countries, then optionally narrow to specific cities.
<br /><br />

<b>Countries</b><br />
Select all countries where you want your ad to run. You can select multiple countries in a single campaign.
<br /><br />

<b>Cities (optional)</b><br />
Narrow your targeting to specific cities within the selected countries. Leave empty to reach the entire country. City-level targeting reduces available inventory but improves relevance.


</div>
`;


const audienceTooltip = `
<div class="p-2">
Define who hears your ad. Choose between Podcast and Streaming inventory, then apply topic, audience, demographic, and device filters to reach the right listeners.
<br /><br />

<b>Podcast</b><br />
Serve your ad within podcast episodes. This option is highly targetable by topic, audience segment, and ad position—ideal for reaching engaged, intentional listeners (60M+ listeners globally).
<br /><br />

<b>Podcast topics </b><br />
Limit your ad to shows within specific content categories (e.g., Business, Technology, Health).
<br /><br />

<b>Podcast audiences</b><br />
Target listeners based on their interests and behavior (e.g., Car Buyers, Home Owners). This can be combined with topic targeting.
<br /><br />

<b>Streaming</b><br />
Serve your ad on music, radio, CTV, and gaming platforms. This offers a larger audience pool (100M+ listeners globally)—ideal for broad reach and awareness campaigns.
<br /><br />

<b>Streaming topics </b><br />
Limit your ad to streaming audio within specific content categories (e.g., Jazz, Rock, Blues).
<br /><br />

<b>Streaming audiences</b><br />
Target listeners based on their interests and behavior (e.g., Car Buyers, Home Owners). This can be combined with topic targeting.
<br /><br />

<b>Ad position</b><br />
Choose where in the episode your ad plays. Mid-Roll typically delivers the highest engagement.
<br /><br />

<b>Gender</b><br />
Filter by listener gender. Select "All" unless your product is gender-specific.
<br /><br />

<b>Age range</b><br />
Select the age groups most relevant to your product. Narrowing the range reduces inventory but increases relevance.
<br /><br />

<b>Device type</b><br />
Restrict delivery to specific device types. Leave all selected unless your product is meaningfully more relevant to a particular device context.

</div>

`;


const audienceExtensionTooltip = `
  <div class="p-2">
  Optionally extend your campaign with display banner ads served to listeners across the web—reinforcing your audio message with a visual reminder.
<br /><br />

<b>Retarget listeners on the web </b><br />
When enabled, listeners who hear your audio ad will also be shown your display banner as they browse premium websites.
<br /><br />

<b>Budget increase </b><br />
Enabling this option adds 20% to your daily budget to cover the cost of display inventory (e.g., +$5/day → $30/day total).
<br /><br />

<b>Upload display banner </b><br />
Upload the banner creative required for Audience Extension. Keep your visual consistent with your audio message (same headline and call to action).
<br /><br />

<b>Impression tracking pixel (optional) </b><br />
Paste your third-party tracking URL here. It fires on every ad impression, allowing you to verify delivery and attribute results in your own analytics platform.
  </div>
`;


const paymentTooltip = `

<div class="p-2">

Review your total campaign cost, apply a discount coupon if you have one, and confirm to launch.
<br /><br />
<b>Have a coupon code?</b><br />
Enter or select your coupon code and click Apply. Only one valid coupon can be applied per campaign.
<br /><br />
<b>Charge summary</b><br />
A breakdown of what you will be charged today. This shows the saving and net total if a coupon has been applied.
<br /><br />
<b>Save draft</b><br />
Save your campaign settings without launching. You can return to complete and launch it at any time from the Drafts tab on your Dashboard.
<br /><br />
<b>Pay & launch</b><br />
Confirm payment and activate your campaign. It will begin serving impressions on your chosen start date and stop automatically when the end date or budget limit is reached.


</div>
`;

export default function CampaignWizard() {
  const navigate = useNavigate();
  const { isPro, role } = useSessionFlags();
  const isAdminOrEditor = role === "ADMIN" || role === "EDITOR" || role === "EDITOR_RESTRICTED";
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  const [setup, setSetup] = useState<{
    audioId: string;
    campaignName: string;
    adName?: string;
    externalCampaignId?: string;
  }>({ audioId: "", campaignName: "" });
  const [schedule, setSchedule] = useState(() => {
    const today = new Date(new Date());
    today.setDate(today.getDate() + 1); // Start date is tomorrow
    today.setHours(today.getHours() + 2);
    const end = new Date();
    end.setDate(end.getDate() + 30);
    end.setHours(23,59);
    return {  startDate: formatDate(today), endDate: formatDate(end), startTime: today.getHours().toString().padStart(2, "0") + ":00", endTime: "23:59", daysOfWeek: DAYS_OF_WEEK, timeSlots: TIME_SLOTS.flatMap(item => item.value), selectedHours: [...new Set(TIME_SLOTS.flatMap(item => item.valueInHours))] };
  });
  const { geoData, isLoading: geoLoading } = useGeoLocation();
  const [inventory, setInventory] = useState<LocationData>({
    country: "",
    countryCode: "",
    businessLocations: [],
  });
  const [geoApplied, setGeoApplied] = useState(false);
  const [targeting, setTargeting] = useState({
    gender: "",
    ageRanges: ["1824", "2124", "2534", "3544", "4554", "5564","6500"] as string[],
    deviceTypes: ["tablet", "desktop", "phone", "portable_media_player"] as string[],
    inventoryType: "Podcast",
    podcastTopics: [] as string[],
    podcastAudiences: [] as string[],
    streamingTopics: [] as string[],
    streamingAudiences: [] as string[],
    adPositions: ["pre-roll", "mid-roll", "post-roll"] as string[],
    selectedShows: [] as string[],
    savedAudiences: [] as string[],
  });
  const [budget, setBudget] = useState({
    dailyBudget: "25",
    totalBudget: "750",
    currency: "USD",
  });
  const [payment, setPayment] = useState({ cardId: "", paymentMethod: "", couponCode: "", discountValue: 0, discountType: "", originalAmount: 0, discountApplied: 0, finalAmount: 0 });
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countryCityMap, setCountryCityMap] = useState<Record<string, City[]>>(
    {},
  );
  const [podcastTopics, setPodcastTopics] = useState<string[]>([]);
  const [streamingTopics, setStreamingTopics] = useState<string[]>([]);
  const [podcastAudiences, setPodcastAudiences] = useState<PodcastAudience[]>(
    [],
  );
  const [streamingAudiences, setStreamingAudiences] = useState<
    StreamingAudience[]
  >([]);
  const [targetingSegments, setTargetingSegments] = useState<
    TargetingSegment[]
  >([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(true);
  const [forecastData, setForecastData] = useState({
    totalAvailableImpressions: 0,
    totalReach: 0,
  });

  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentLinkId, setPaymentLinkId] = useState("");
  const [cards, setCards] = useState<Cards[]>([])
  const [creditsDetails, setCreditsDetails] = useState<CreditDetails>({
    availableCredit: 0,
    creditCycle: null,
  });
  const [audienceExtension, setAudienceExtension] =
    useState<AudienceExtensionData>({
      enabled: false,
      banners: [],
      impressionPixel: "",
    });
  const [CPM, setCPM] = useState(18);
  const [deviceTypes, setDeviceTypes] = useState<TargetingSegment[]>([]);

  const [loadedExistingCampaign, setloadedExistingCampaign] = useState(false);

  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const couponCodeTimer = useRef<NodeJS.Timeout | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("")

  const [savedTransaction, setSavedTransaction] = useState<SavedTransaction | null>(null)

  // to skip the schedule update when loading the campaign data and applying the coupon
  const skipScheduleUpdate = useRef(false);

  // Completion checks
  const setupDone = !!(setup.audioId && setup.campaignName.trim());
  const scheduleDone = !!(schedule.startDate && schedule.endDate);
  const inventoryDone = !!(
    inventory.country ||
    (inventory.selectedCountries && inventory.selectedCountries.length > 0)
  );
  const targetingDone = true;
  const budgetDone = Number(budget.totalBudget) > 0;

  const forecastTimer = useRef<NodeJS.Timeout | null>(null);


  // // Auto-fill country from geo-detect
  useEffect(() => {
    if (geoData && !geoApplied) {
      const code = geoData.country_code || '';
      const name = geoData.country !== 'your country' ? geoData.country : '';
      setInventory(prev => ({
        ...prev,
        country: name || prev.country,
        countryCode: code || prev.countryCode,
        selectedCountries: code ? [code] : prev.selectedCountries,
      }));
      setGeoApplied(true);
      onCountryChange([code]);
    }
  }, [geoData, geoApplied]);


  const durationDays = useCallback(() => {
    if (!schedule.startDate || !schedule.endDate) return 0;
    const start = new Date(schedule.startDate);
    const end = new Date(schedule.endDate);
    // Inclusive calendar days (matches how humans read date ranges).
    return Math.max(1, differenceInCalendarDays(end, start) + 1);
  }, [schedule.startDate, schedule.endDate])();

  // Summary text helpers
  const getSummaryText = (section: string): string => {
    switch (section) {
      case "setup": {
        const parts: string[] = [];
        if (setup.adName) parts.push(setup.adName);
        if (setup.campaignName) parts.push(setup.campaignName);
        return parts.join(" · ") || "Untitled";
      }
      case "schedule": {
        if (!schedule.startDate || !schedule.endDate) return "";
        const fmt = (d: string) =>
          new Date(d).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        return `${fmt(schedule.startDate)} - ${fmt(schedule.endDate)} (${durationDays} days)`;
      }
      case "inventory": {
        const parts: string[] = [];
        const selectedCities = inventory.selectedCities || [];
        if (selectedCities.length > 0) {
          
    
          const countriesWithoutCities = inventory.selectedCountries.filter(country => !selectedCities.some(city => city.country === country));
          if(countriesWithoutCities.length > 0) {
            countriesWithoutCities.forEach(country => {
              parts.push(country);
            });
          }

          if(selectedCities.length > 0) {
            const obj = {};
            selectedCities.forEach(city => {
              if(obj[city.country]) {
                obj[city.country].push(city.name);
              } else {
                obj[city.country] = [city.name];
              }
            });

            Object.keys(obj).forEach(country => {
              parts.push(`${country}( ${obj[country].join(", ")})`);
            });
          }

        } else if (inventory.selectedCountries && inventory.selectedCountries.length > 0) {
          parts.push(inventory.selectedCountries.join(", "));
        }
        if (inventory.businessLocations.length > 0)
          parts.push(`${inventory.businessLocations.length} location(s)`);
        return parts.join(", ") || "Not set";
      }
      case "targeting": {
        const parts: string[] = [];
        if (targeting.podcastTopics.length > 0) {
          const interests = targeting.podcastTopics;
          if (interests.length <= 2) {
            parts.push(interests.join(", "));
          } else {
            parts.push(
              `${interests.slice(0, 2).join(", ")} +${interests.length - 2}`,
            );
          }
        }
        parts.push(
          targeting.gender === "" ? "All genders" : targeting.gender === "m" ? "Male" : "Female",
        );
        if (targeting.ageRanges.length > 0)
          parts.push(
            targeting.ageRanges
              .slice(0, 2)
              .map(range => {
                const str = range.toString();
                return `${str.slice(0, 2)}${str.slice(2) === '00' ? '+' : '-'+str.slice(2)}`;
              })
              .join("/") +
              (targeting.ageRanges.length > 2 ? "..." : "")
          );
        return parts.join(", ");
      }
      case "budget":
        return budget.dailyBudget && budget.totalBudget
          ? `$${Number(budget.dailyBudget).toLocaleString()}/day, $${Number(budget.totalBudget).toLocaleString()} total`
          : budget.totalBudget
            ? `$${Number(budget.totalBudget).toLocaleString()} total`
            : "";
      default:
        return "";
    }
  };

  // Build summary items for sidebar
  const summaryLabels: Record<string, string> = {
    setup: "Your Ad",
    schedule: "Schedule",
    budget: "Budget",
    inventory: "Location",
    targeting: "Audience",
  };
  const summaryItems = (
    ["setup", "schedule", "budget", "inventory", "targeting"] as const
  )
    .filter((key) => {
      const doneMap: Record<string, boolean> = {
        setup: setupDone,
        budget: budgetDone,
        inventory: inventoryDone,
        targeting: targetingDone,
        schedule: scheduleDone,
      };
      return doneMap[key];
    })
    .map((key) => ({
      key,
      label: summaryLabels[key],
      value: getSummaryText(key),
      icon: CheckCircle2,
    }));



  const searchInputRef = useRef<HTMLInputElement>(null);
  const campaignNameRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const audioAdRef = useRef<HTMLDivElement>(null);



  const saveDraftCampaign = async () => {
    if(!setup.audioId){
      toast({
        title: "Error",
        description: "Please select an audio ad",
        variant: "destructive",
      });
      audioAdRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      return;
    }

    if(campaignNameRef.current?.value.trim() === "") {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      campaignNameRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await auth.getSession();
      if (!session || !session.user) throw new Error('Not authenticated');


      const campaignStartDate = schedule.startDate;
      const campaignStartTime = schedule.startTime;
      const campaignEndDate = schedule.endDate;
      const campaignEndTime = schedule.endTime;


      const geoCountries = [];

      if(inventory.selectedCountries && inventory.selectedCountries.length > 0) {


        const listOfCities = inventory?.selectedCities || [];
        const countriesWithoutCities = listOfCities.length ? inventory.selectedCountries.filter(country => !listOfCities.some(city => city.country === country)) : inventory.selectedCountries;

        if(countriesWithoutCities.length > 0) {
          countriesWithoutCities.forEach(country => {
            geoCountries.push("COUNTRY/" + country);
          });
        }
        if(listOfCities.length >0 ){
          listOfCities.forEach(city => {
            geoCountries.push("CITY/" + city.name + "/" + city.country);
          });
        }
      }



      const campaignObj = {
        id,
        campaignName: setup.campaignName,
        externalReference: setup.externalCampaignId ? setup.externalCampaignId : null,
        advertiserId: session.currentAdvertiserId,
        startDate: campaignStartDate,
        startTime: campaignStartTime,
        endDate: campaignEndDate,
        endTime: campaignEndTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        daysOfWeek: schedule.daysOfWeek,
        timeOfDay: schedule.timeSlots,
        budget: Number(budget.totalBudget),
        perDayBudget: Number(budget.dailyBudget),
        duration: durationDays,
        zones: [],
        audioId: setup.audioId,
        monthlyBilling: false,
        billingDuration: 1,
        inventoryType: targeting.inventoryType === "Podcast" ? "Podcast" : "Streaming",
        geoCountries: geoCountries,
        gender: targeting.gender === "all" ? "" : targeting.gender,
        age: targeting.ageRanges,
        deviceType: targeting.deviceTypes,
        podcastTopics: targeting.podcastTopics,
        podcastAudiences: targeting.podcastAudiences,
        streamingTopics: targeting.streamingTopics,
        streamingAudiences: targeting.streamingAudiences,
        bannerOne: null,
        bannerTwo: null,
        bannerThree: null,
        impressionPixel: audienceExtension.impressionPixel ? audienceExtension.impressionPixel : null,
        isSavedCard: false,
        discountCoupon: payment.couponCode ? payment.couponCode : null,
        adPosition: targeting.adPositions ? targeting.adPositions : null,
        cardId: payment.cardId ? payment.cardId : null,
      };


      if (audienceExtension.enabled && audienceExtension.banners.length > 0 && audienceExtension.banners[0].file) {
        const shapeWidthHeight = {
          rectangle: { width: 300, height: 250 },
          square: { width: 300, height: 300 },
          vertical: { width: 160, height: 600 },
        };
        const width = shapeWidthHeight[audienceExtension.banners[0].type].width;
        const height = shapeWidthHeight[audienceExtension.banners[0].type].height;
        const { data: bannerPayload, status: bannerStatus } = await targetingApi.uploadBanner(
          audienceExtension.banners[0].file,
          width,
          height,
        );
        if (bannerStatus === 200 && bannerPayload != null) {
          const url =
            typeof bannerPayload === "string"
              ? bannerPayload
              : (bannerPayload as { url?: string }).url ??
                (bannerPayload as { data?: string }).data;
          if (url) campaignObj.bannerOne = url;
        }
      }
      const {data, error, message, status} = await campaignApi.draftCampaign(campaignObj);

      if(status === 200) {
        toast({
          title: "Draft Saved",
        })
        navigate(`/dashboard/campaigns`);
      } else {
        toast({
          title: "Error",
          description: message || "Something went wrong",
          variant: "destructive",
        });
      }

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }



  const updateCampaign = async () => {

    if(!setup.audioId){
      toast({
        title: "Error",
        description: "Please select an audio ad",
        variant: "destructive",
      });
      audioAdRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      return;
    }

    if(!setup.campaignName.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      campaignNameRef.current?.focus();
      return;
    }

    if(!schedule.startDate || !schedule.endDate){
      toast({
        title: "Error",
        description: "Please select a start and end date",
        variant: "destructive",
      });
      return;
    }

    if(!budget.totalBudget || !budget.dailyBudget){
      toast({
        title: "Error",
        description: "Please set a budget",
        variant: "destructive",
      });
      return;
    }

    if(!inventory.selectedCountries || inventory.selectedCountries.length === 0){
      toast({
        title: "Error",
        description: "Please select a country",
        variant: "destructive",
      });
      countryRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await auth.getSession();
      if (!session || !session.user) throw new Error('Not authenticated');

      if(!setup.campaignName.trim()) {
        toast({
          title: "Error",
          description: "Campaign name is required",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }


      const campaignStartDate = schedule.startDate;
      const campaignStartTime = schedule.startTime;
      const campaignEndDate = schedule.endDate;
      const campaignEndTime = schedule.endTime;


      const completeStartDate = new Date(campaignStartDate);
      completeStartDate.setHours(Number(campaignStartTime.split(":")[0]));
      completeStartDate.setMinutes(Number(campaignStartTime.split(":")[1]));

      const completeEndDate = new Date(campaignEndDate);
      completeEndDate.setHours(Number(campaignEndTime.split(":")[0]));
      completeEndDate.setMinutes(Number(campaignEndTime.split(":")[1]));


      // if(completeStartDate.getTime() < new Date().getTime()) {
      //   toast({
      //     title: "Error",
      //     description: "Start date cannot be in the past",
      //     variant: "destructive",
      //   });
      //   setSaving(false);
      //   return;
      // }

      // // start time should be atleast 24 hour from now
      // if(completeStartDate.getTime() < new Date().getTime() + 86400000) {
      //   toast({
      //     title: "Error",
      //     description: "Start date should be atleast 24 hours from now",
      //     variant: "destructive",
      //   });
      //   setSaving(false);
      //   return;
      // }


      if(completeEndDate.getTime() < completeStartDate.getTime()) {
        toast({
          title: "Error",
          description: "End date cannot be before start date",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // end date should be atleast 1 day after start date
      if(completeEndDate.getTime() - completeStartDate.getTime() < 86400000){
        toast({
          title: "Error",
          description: "End date should be atleast 1 day after start date",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }


      const geoCountries = [];

      if(inventory.selectedCountries && inventory.selectedCountries.length > 0) {


        const listOfCities = inventory?.selectedCities || [];
        const countriesWithoutCities = listOfCities.length ? inventory.selectedCountries.filter(country => !listOfCities.some(city => city.country === country)) : inventory.selectedCountries;

        if(countriesWithoutCities.length > 0) {
          countriesWithoutCities.forEach(country => {
            geoCountries.push("COUNTRY/" + country);
          });
        }
        if(listOfCities.length >0 ){
          listOfCities.forEach(city => {
            geoCountries.push("CITY/" + city.name + "/" + city.country);
          });
        }
      }



      const campaignObj = {
        id: id || campaignId,
        campaignName: setup.campaignName,
        externalReference: setup.externalCampaignId ? setup.externalCampaignId : null,
        advertiserId: session.currentAdvertiserId,
        startDate: campaignStartDate,
        startTime: campaignStartTime,
        endDate: campaignEndDate,
        endTime: campaignEndTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        daysOfWeek: schedule.daysOfWeek,
        timeOfDay: schedule.timeSlots,
        budget: Number(budget.totalBudget),
        perDayBudget: Number(budget.dailyBudget),
        duration: durationDays,
        zones: [],
        audioId: setup.audioId,
        monthlyBilling: false,
        billingDuration: 1,
        inventoryType: targeting.inventoryType === "Podcast" ? "Podcast" : "Streaming",
        geoCountries: geoCountries,
        gender: targeting.gender === "all" ? "" : targeting.gender,
        age: targeting.ageRanges,
        deviceType: targeting.deviceTypes,
        podcastTopics: targeting.podcastTopics,
        podcastAudiences: targeting.podcastAudiences,
        streamingTopics: targeting.streamingTopics,
        streamingAudiences: targeting.streamingAudiences,
        bannerOne: null,
        bannerTwo: null,
        bannerThree: null,
        impressionPixel: null,
        isSavedCard: false,
        discountCoupon: payment.couponCode ? payment.couponCode : null,
        adPosition: targeting.adPositions ? targeting.adPositions : null,
        cardId: creditsDetails.availableCredit >= Number(budget.totalBudget) ? null : payment.cardId ? payment.cardId : null,
      };


      if(audienceExtension.enabled && audienceExtension.banners?.length === 0){
        toast({
          title: "Error",
          description: "Please upload a banner for audience extension",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (audienceExtension.enabled && audienceExtension.banners.length > 0 && audienceExtension.banners[0].file) {
        const shapeWidthHeight = {
          rectangle: { width: 300, height: 250 },
          square: { width: 300, height: 300 },
          vertical: { width: 160, height: 600 },
        };
        const width = shapeWidthHeight[audienceExtension.banners[0].type].width;
        const height = shapeWidthHeight[audienceExtension.banners[0].type].height;
        const { data: bannerPayload, status: bannerStatus } = await targetingApi.uploadBanner(
          audienceExtension.banners[0].file,
          width,
          height,
        );
        if (bannerStatus === 200 && bannerPayload != null) {
          const url =
            typeof bannerPayload === "string"
              ? bannerPayload
              : (bannerPayload as { url?: string }).url ??
                (bannerPayload as { data?: string }).data;
          if (url) campaignObj.bannerOne = url;
        }
      }
      const {data, error, message, status} = await campaignApi.updateCampaign(campaignObj);

      if(status === 200) {
        toast({
          title: "Success",
          description: "Campaign updated successfully",
          variant: "default",
        });
        navigate(`/dashboard/campaigns`);
      }

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveCampaign = async () => {

    if(!setup.audioId){
      toast({
        title: "Error",
        description: "Please select an audio ad",
        variant: "destructive",
      });
      audioAdRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      return;
    }

    if(!setup.campaignName.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      campaignNameRef.current?.focus();
      return;
    }

    if(!schedule.startDate || !schedule.endDate){
      toast({
        title: "Error",
        description: "Please select a start and end date",
        variant: "destructive",
      });
      return;
    }

    if(!budget.totalBudget || !budget.dailyBudget){
      toast({
        title: "Error",
        description: "Please set a budget",
        variant: "destructive",
      });
      return;
    }

    if(!inventory.selectedCountries || inventory.selectedCountries.length === 0){
      toast({
        title: "Error",
        description: "Please select a country",
        variant: "destructive",
      });
      countryRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await auth.getSession();
      if (!session || !session.user) throw new Error('Not authenticated');

      if(!setup.campaignName.trim()) {
        toast({
          title: "Error",
          description: "Campaign name is required",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }


      const campaignStartDate = schedule.startDate;
      const campaignStartTime = schedule.startTime;
      const campaignEndDate = schedule.endDate;
      const campaignEndTime = schedule.endTime;


      const completeStartDate = new Date(campaignStartDate);
      completeStartDate.setHours(Number(campaignStartTime.split(":")[0]));
      completeStartDate.setMinutes(Number(campaignStartTime.split(":")[1]));

      const completeEndDate = new Date(campaignEndDate);
      completeEndDate.setHours(Number(campaignEndTime.split(":")[0]));
      completeEndDate.setMinutes(Number(campaignEndTime.split(":")[1]));


      if(completeStartDate.getTime() < new Date().getTime()) {
        toast({
          title: "Error",
          description: "Start date cannot be in the past",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // start time should be atleast 1 hour from now
      if(completeStartDate.getTime() < new Date().getTime() + 3600000) {
        toast({
          title: "Error",
          description: "Start date should be atleast 1 hour from now",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }


      if(completeEndDate.getTime() < completeStartDate.getTime()) {
        toast({
          title: "Error",
          description: "End date cannot be before start date",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // end date should be atleast 1 day after start date
      if(completeEndDate.getTime() - completeStartDate.getTime() < 86400000){
        toast({
          title: "Error",
          description: "End date should be atleast 1 day after start date",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }


      const geoCountries = [];

      if(inventory.selectedCountries && inventory.selectedCountries.length > 0) {


        const listOfCities = inventory?.selectedCities || [];
        const countriesWithoutCities = listOfCities.length ? inventory.selectedCountries.filter(country => !listOfCities.some(city => city.country === country)) : inventory.selectedCountries;

        if(countriesWithoutCities.length > 0) {
          countriesWithoutCities.forEach(country => {
            geoCountries.push("COUNTRY/" + country);
          });
        }
        if(listOfCities.length >0 ){
          listOfCities.forEach(city => {
            geoCountries.push("CITY/" + city.name + "/" + city.country);
          });
        }
      }



      const campaignObj = {
        id: id || campaignId,
        campaignName: setup.campaignName,
        externalReference: setup.externalCampaignId ? setup.externalCampaignId : null,
        advertiserId: session.currentAdvertiserId,
        startDate: campaignStartDate,
        startTime: campaignStartTime,
        endDate: campaignEndDate,
        endTime: campaignEndTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        daysOfWeek: schedule.daysOfWeek,
        timeOfDay: schedule.timeSlots,
        budget: Number(budget.totalBudget),
        perDayBudget: Number(budget.dailyBudget),
        duration: durationDays,
        zones: [],
        audioId: setup.audioId,
        monthlyBilling: false,
        billingDuration: 1,
        inventoryType: targeting.inventoryType === "Podcast" ? "Podcast" : "Streaming",
        geoCountries: geoCountries,
        gender: targeting.gender === "all" ? "" : targeting.gender,
        age: targeting.ageRanges,
        deviceType: targeting.deviceTypes,
        podcastTopics: targeting.podcastTopics,
        podcastAudiences: targeting.podcastAudiences,
        streamingTopics: targeting.streamingTopics,
        streamingAudiences: targeting.streamingAudiences,
        bannerOne: null,
        bannerTwo: null,
        bannerThree: null,
        impressionPixel: null,
        isSavedCard: false,
        discountCoupon: payment.couponCode ? payment.couponCode : null,
        adPosition: targeting.adPositions ? targeting.adPositions : null,
        cardId: creditsDetails.availableCredit >= Number(budget.totalBudget) ? null : payment.cardId ? payment.cardId : null,
      };


      if(audienceExtension.enabled && audienceExtension.banners?.length === 0){
        toast({
          title: "Error",
          description: "Please upload a banner for audience extension",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (audienceExtension.enabled && audienceExtension.banners.length > 0 && audienceExtension.banners[0].file) {
        const shapeWidthHeight = {
          rectangle: { width: 300, height: 250 },
          square: { width: 300, height: 300 },
          vertical: { width: 160, height: 600 },
        };
        const width = shapeWidthHeight[audienceExtension.banners[0].type].width;
        const height = shapeWidthHeight[audienceExtension.banners[0].type].height;
        const { data: bannerPayload, status: bannerStatus } = await targetingApi.uploadBanner(
          audienceExtension.banners[0].file,
          width,
          height,
        );
        if (bannerStatus === 200 && bannerPayload != null) {
          const url =
            typeof bannerPayload === "string"
              ? bannerPayload
              : (bannerPayload as { url?: string }).url ??
                (bannerPayload as { data?: string }).data;
          if (url) campaignObj.bannerOne = url;
        }
      }
      const {data, error, message, status} = await campaignApi.createCampaign(campaignObj);

      if(status === 200 && data?.data?.id) {
        setCampaignId(data?.data?.id);
      }

      if(status === 200 && data?.payment_url) {
        setPaymentUrl(data.payment_url);
        setPaymentLinkId(data?.paymentLinkId);
      }else if( status === 200 && data?.paid){
        // Paid from credit/postpaid balance — no MamoPay redirect, so this is the
        // purchase completion point (the card path fires from PaymentSuccess instead).
        trackPurchase({
          transactionId: data?.data?.id ?? campaignId,
          // Net amount: post-coupon final when a coupon was applied, else full budget.
          value: payment.couponCode ? Number(payment.finalAmount) || 0 : Number(budget.totalBudget) || 0,
          campaignId: data?.data?.id ?? campaignId,
          campaignName: setup.campaignName,
          paymentMethod: "credit",
          plan: getPlanFromSession(),
          coupon: payment.couponCode || undefined,
          discount: payment.couponCode ? Number(payment.discountApplied) || 0 : undefined,
        });
        toast({
          title: "Success",
          description: "Campaign created successfully",
          variant: "default",
        });
        navigate(`/dashboard/campaigns`);
      } else {
        toast({
          title: "Error",
          description: message || "Something went wrong",
          variant: "destructive",
        });
      }

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Render a section card — always visible, no collapse
  let sectionCounter = 0;
  const renderSection = (
    title: string,
    tooltip: string,
    done: boolean,
    children: React.ReactNode,
  ) => {
    sectionCounter++;
    const num = sectionCounter;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
              {num}
            </span>
            <CardTitle className="text-lg flex items-center gap-2">{title} <MyTooltip html={tooltip} /> </CardTitle>
          </div>
        </CardHeader>
        <CardContent className={done ? "pt-0" : undefined}>
          {children}
        </CardContent>
      </Card>
    );
  };

  const onCountryChange = async (codes: string[]) => {
    setInventory((prev) => ({ ...prev, selectedCountries: codes }));
    const newCities: City[] = [];

    // check if the country is in the countryCityMap
    for (const code of codes) {
      const cities = countryCityMap[code];
      if (cities) {
        newCities.push(...cities);
      } else {
        if(!code) continue;
        const { data, error } = await targetingApi.getCities(code);
        const allCities = data?.data?.cities?.map((city) => ({
          country: code,
          id: code + "---" + city,
          name: city,
        }));
        setCountryCityMap((prev) => ({ ...prev, [code]: allCities }));
        newCities.push(...allCities);
      }
    }

    const newSelectedCities = newCities.filter((city) =>
      inventory.selectedCities?.find(
        (c) => c.id === city.id && c.country === city.country,
      ),
    );
    setInventory((prev) => ({ ...prev, selectedCities: newSelectedCities }));

    setCities(newCities);
  };

  const onCityChange = (ids: string[]) => {
    // const newCities = ids.map(id => {
    //   const city = countryCityMap[id.split('-')[0]]?.find(c => c.id === id);
    //   return city ? { ...city, id: id } : null;
    // }).filter(Boolean) as City[];
    // setInventory(prev => ({ ...prev, selectedCities: newCities }));
    // setCities(cities);
    setInventory((prev) => ({
      ...prev,
      selectedCities: ids.map(
        (id) =>
          countryCityMap[id.split("---")[0]]?.find((c) => c.id === id) || null,
      ),
    }));
  };


  const applyCoupon = async (couponCode: string, isManual: boolean = true) => {
    setIsApplyingCoupon(true);
    try {
      const { data: { session } } = await auth.getSession();
      if(!session) return;

      const { data, error, status } = await campaignApi.applyCoupon( Number(budget.totalBudget) || 0, couponCode, session.currentAdvertiserId);


      console.log({data, error, status});
      if(status !== 200) {
        toast({
          title: "Error",
          description: data?.message || error?.message || "Invalid coupon code",
          variant: "destructive",
        });
        setPayment((prev) => ({ ...prev, 
          couponCode: "",
          discountValue: 0,
          discountType: "",
          originalAmount: Number(budget.totalBudget),
          discountApplied: 0,
          finalAmount: Number(budget.totalBudget),
         }));
      }

      // if(status === 200 && d)
      if(status === 200 && data?.data && data?.data?.discountApplied){
        setPayment((prev) => ({ ...prev, 
          couponCode, 
          discountValue: data?.data?.discountValue, 
          discountType: data?.data?.discountType, 
          originalAmount: data?.data?.originalAmount, 
          discountApplied: data?.data?.discountApplied, 
          finalAmount: data?.data?.finalAmount 
        }));
        if(isManual)
        toast({
          title: "Success",
          description: "Coupon applied successfully",
          variant: "default",
        });
      }else {
        toast({
          title: "Error",
          description: data?.message || "Invalid coupon code",
          variant: "destructive",
        });
      }
      setIsApplyingCoupon(false);
    } catch (error) {
      console.error(error);
      setIsApplyingCoupon(false);
    }
  }

  useEffect(() => {
    if(skipScheduleUpdate.current) {
      skipScheduleUpdate.current = false;
      return;
    }

    const noOfDays = differenceInCalendarDays(new Date(schedule.endDate), new Date(schedule.startDate)) + 1;
    setBudget((prev) => ({ ...prev, totalBudget: (Number(prev.dailyBudget) * noOfDays).toString(), dailyBudget: String(Number(prev.dailyBudget)) }));
  }, [schedule]);

  useEffect(() => {

    if(couponCodeTimer.current) {
      clearTimeout(couponCodeTimer.current);
    }
    
    couponCodeTimer.current = setTimeout(async () => {
      if(payment.couponCode) {
        applyCoupon(payment.couponCode, false);
      }
    }, 1000);

  }, [budget, durationDays]);

  useEffect(() => {
    console.log({inventory});
    if(forecastTimer.current) {
      clearTimeout(forecastTimer.current);
    }
    const fetchForecast = async () => {
      const audienceTargeting = {
        groups: [
          {
            rules: []
          }
        ],
      };

      if ((schedule.daysOfWeek && schedule.daysOfWeek.length != 7) || (schedule.selectedHours && schedule.selectedHours.length != 24)) {
        audienceTargeting["groups"][0].rules.push({
          type: "HOURLY_WEEK_DAY",
          comparison: "CONTAIN",
          week: schedule.daysOfWeek.map((day) => ({
            day: day,
            hours: schedule.selectedHours,
          })),
        });
      }

      const totalAges = targetingSegments.filter(segment => segment.code === "age").length;

      if(targeting.gender || targeting.ageRanges && targeting.ageRanges.length != totalAges){
        const demographicGroups = [];
        if(targeting.gender){
          demographicGroups.push({
            segmentCode: "gender",
            segmentValues: [targeting.gender],
          });
        }
        if(targeting.ageRanges && targeting.ageRanges.length != totalAges){
          demographicGroups.push({
            segmentCode: "age",
            segmentValues: targeting.ageRanges,
          });
        }

        audienceTargeting["groups"][0].rules.push({
          type: "DEMOGRAPHIC_SEGMENTS",
          comparison: "IS_ANY_OF",
          groups: demographicGroups
        });
      }


      if(targeting.inventoryType === "Podcast"){
        
        let genreGroups = [];
        const segmentValues = {
          podcast: ["podcast"],
          streaming: ["Aggregator", "CTV", "Gaming", "OTA/Broadcast", "On-Demand", "Pure Player"]
        }
        if(targeting.podcastTopics && targeting.podcastTopics.length > 0){
          genreGroups.push({
            segmentCode: "genre",
            segmentValues: targeting.podcastTopics,
          });
        }


        audienceTargeting["groups"][0].rules.push({
          type: "PUBLISHER_ATTRIBUTES_SEGMENTS",
          comparison: "IS_ANY_OF",
          groups: [
           ...genreGroups,
           {
            "segmentCode": "type",
            "segmentValues": segmentValues[targeting.inventoryType?.toLowerCase()] || segmentValues.podcast
           }
          ],
        });



        if(targeting.podcastAudiences && targeting.podcastAudiences.length > 0){
          audienceTargeting["groups"][0].rules.push({
            type: "PODCAST_CONTEXTUAL",
            comparison: "IS_ANY_OF",
            groups: [
              {
                name: "context_to_behavioral",
                values: targeting.podcastAudiences,
              }
            ],
          });
        }

      }else {
        if(targeting.streamingTopics && targeting.streamingTopics.length > 0){
          audienceTargeting["groups"][0].rules.push({
            type: "PUBLISHER_ATTRIBUTES_SEGMENTS",
            comparison: "IS_ANY_OF",
            groups: [
              {
                segmentCode: "genre",
                segmentValues: targeting.streamingTopics,
              }
            ],
          });
        }
        if(targeting.streamingAudiences && targeting.streamingAudiences.length > 0){
          audienceTargeting["groups"][0].rules.push({
            type: "BEHAVIOURAL_SEGMENTS",
            comparison: "IS_ANY_OF",
            groups: [
              {
                segmentCode: "Behavioural",
                segmentValues: targeting.streamingAudiences,
              }
            ],
          });
        }
      }


      if(targeting.deviceTypes && targeting.deviceTypes.length > 0){

        const deviceTypeObj = [];


        if(targeting.deviceTypes.includes("desktop")){
          deviceTypeObj.push({
            segmentCode: "DESKTOPS_AND_LAPTOPS",
            segmentValues: ["desktop"],
          });
        }

        const others = targeting.deviceTypes.filter(device => device !== "desktop");
        if(others.length > 0){
          deviceTypeObj.push({
            segmentCode: "MOBILE_AND_TABLETS",
            segmentValues: others,
          });
        }

        audienceTargeting["groups"][0].rules.push({
          type: "DEVICE_TYPE_SEGMENTS",
          comparison: "IS_ANY_OF",
          groups: deviceTypeObj,
        });

      }

      if(targeting.adPositions && targeting.adPositions.length != 3){
      
        audienceTargeting["groups"][0].rules.push({
          type: "INVENTORY_ATTRIBUTES_SEGMENTS",
          comparison: "IS_ANY_OF",
          groups: [
            {
              segmentCode: "position",
              segmentValues: targeting.adPositions,
            }
          ],
        });
      
      }


      if(inventory.selectedCountries && inventory.selectedCountries?.filter(country => country !== "").length > 0) {

        let newCPM = 0;
        inventory.selectedCountries?.forEach(country => {
          newCPM += countryCPM[country.toLowerCase()] ? countryCPM[country.toLowerCase()] : 18;
        })

        setCPM(newCPM/inventory.selectedCountries.length);

        const listOfCities = inventory?.selectedCities || [];
        const countriesWithoutCities = listOfCities.length ? inventory.selectedCountries.filter(country => !listOfCities.some(city => city.country === country)) : inventory.selectedCountries;


        const exisintgRules = audienceTargeting["groups"][0].rules;

        let groupIndex = 0;



        if(countriesWithoutCities.length > 0) {

          if(listOfCities.length > 0) {
            countriesWithoutCities.forEach(country => {


              if(!audienceTargeting["groups"][groupIndex]){
                audienceTargeting["groups"][groupIndex] = {
                  rules: []
                }
              }

              audienceTargeting["groups"][groupIndex].rules = [...exisintgRules, {
                type: "LOCATION_COUNTRY",
                comparison: "CONTAIN",
                countries: [country],
              }];

              groupIndex++;
            })
          }else {
            
            audienceTargeting["groups"][groupIndex].rules = [...exisintgRules, {
              type: "LOCATION_COUNTRY",
              comparison: "CONTAIN",
              countries: countriesWithoutCities,
            }];

          }
        }



        if(listOfCities.length >0 ){
          
          const obj = {};

          listOfCities.forEach(city => {
            if(obj[city.country]) {
              obj[city.country].push(city.name);
            } else {
              obj[city.country] = [city.name];
            }
          });

          if(Object.keys(obj).length > 0) {
            Object.keys(obj).forEach(country => {

              if(!audienceTargeting["groups"][groupIndex]){
                audienceTargeting["groups"][groupIndex] = {
                  rules: []
                }
              }

              audienceTargeting["groups"][groupIndex].rules = [...exisintgRules, {
                type: "LOCATION_CITY",
                comparison: "CONTAIN",
                country: country,
                city: obj[country].toString(),
              }];
              groupIndex++;
            });
          }
        }
      }

      setIsLoadingForecast(true);
      try {
        const { data, error } = await targetingApi.getInventoryForecast({
          dateRange: {
            from: new Date(schedule.startDate).toISOString(),
            to: new Date(schedule.endDate).toISOString(),
          },
          adDuration: 30,
          audienceTargeting: audienceTargeting,
        });
        setIsLoadingForecast(false);

        if (error) {
          console.error(error);
          return;
        }
        const _forecastData = data?.data?.data[0];

        setForecastData({
          totalAvailableImpressions: _forecastData?.campaignAvails || 0,
          totalReach: _forecastData?.reach || 0,
        });
      }catch(error) {
        console.error(error);
      }

    }
    forecastTimer.current = setTimeout(fetchForecast, 500);
    //return () => clearTimeout(forecastTimer.current);
  }, [schedule, inventory, targeting]);
  
  

  useEffect(() => {
    const fetchCountries = async () => {
      const { data, error } = await targetingApi.getCountries();
      if (error) {
        console.error(error);
        return;
      }
      setCountries(data?.data || []);
    };

    const fetchPublisherSegments = async () => {
      const { data, error } = await targetingApi.getPublisherSegments();
      if (error) {
        console.error(error);
        return;
      }

      const _podcastTopics = [];
      const _streamingTopics = [];

      data?.data?.forEach((item) => {
        if (item.code === "genre") {
          if (item.label?.startsWith("[Spoken Word]")) {
            _podcastTopics.push(item.value);
          } else {
            _streamingTopics.push(item.value);
          }
        }
      });

      setPodcastTopics(_podcastTopics);
      setStreamingTopics(_streamingTopics);
    };

    const fetchPodcastAudiences = async () => {
      const { data, error } = await targetingApi.getPodcastAudiences("", "");
      if (error) {
        console.error(error);
        return;
      }
      setPodcastAudiences(data?.data || []);
    };

    const fetchStreamingAudiences = async () => {
      const { data, error } = await targetingApi.getStreamingAudiences("", "");
      if (error) {
        console.error(error);
        return;
      }
      setStreamingAudiences(data?.data || []);
    };

    const getTargetingSegments = async () => {
      const { data, error } = await targetingApi.getTargetingSegments(
        "DEMOGRAPHIC_SEGMENTS",
        "",
        "",
      );
      if (error) {
        console.error(error);
        return;
      }
      setTargetingSegments(data?.data || []);
    };

    const fetchDeviceTypes = async () => {
      const { data, error } = await targetingApi.getTargetingSegments(
        "DEVICE_TYPE_SEGMENTS",
        "",
        "",
      );
      if (error) {
        console.error(error);
        return;
      }
      setDeviceTypes(data?.data || []);
    }


    const fetchCards = async () => {
      const { data, error, status } = await walletApi.getCards();
      if (error || status !== 200) {
        console.error(error);
        return;
      }
      if(data?.data && data?.data.length > 0){
        setPayment({ ...payment, cardId: data?.data[0].cardId });
      }
      setCards(data?.data || []);
    }

    const getCreditsDetails = async () => {
      const { data: { session } } = await auth.getSession();
      if(!session) return;
      const { data, error, status } = await walletApi.getCreditsDetails(session.currentAdvertiserId || "", session.currentOrganizationId || "");
      console.log("getCreditsDetails here ", {data, error, status});

      if (error || status !== 200) {
        console.error(error);
        return;
      }

      
      setCreditsDetails({
        availableCredit: data?.availableCredit || 0,
        creditCycle: data?.creditCycle || null,
      });
    }

    Promise.allSettled([
      fetchCountries(),
      fetchPublisherSegments(),
      fetchPodcastAudiences(),
      fetchStreamingAudiences(),
      getTargetingSegments(),
      fetchDeviceTypes(),
      fetchCards(),
      getCreditsDetails(),
    ]).then(() => {
      // All data fetching attempts have completed, regardless of success or failure
    });
  }, []);


  useEffect(() => {
    
    console.log("id here ", id);

    if(id && id !== "new"){
      // Fetch existing campaign data and populate form for editing
      const getCampaignData = async () => {
      const { data: { session } } = await auth.getSession();
        const {status, data, message} = await campaignApi.getCampaign({id, advertiserId: session?.currentAdvertiserId});

        console.log("Existing campaign data:", {status, data, message});

        if(data?.data?.status){
          setCampaignStatus(data?.data?.status);
        }

        if(data?.transaction){
          setSavedTransaction(data.transaction);
        } else {
          setSavedTransaction(null);
        }

        if(status === 200 && data?.data) {

          let adId = data.data.audioId;
          let adName ="";
          if(adId){
            const ad = await adsApi.getAd(data.data.audioId, session?.currentAdvertiserId || "");
            if(ad?.data?.data){
              adName = ad.data.data.adName || "";
            }
          }
          setloadedExistingCampaign(true);
          setSetup({
            ...setup,
            audioId: data.data.audioId || "",
            campaignName: data.data.campaignName || "",
            adName: adName,
            externalCampaignId: data.data.externalReference || "",
          });

          const campaignStartDate = new Date(data.data.startDate);
          const campaignEndDate = new Date(data.data.endDate);

          const hours = [...new Set(TIME_SLOTS.filter(item => data.data.timeOfDay.includes(item.value)).flatMap(item => item.valueInHours))];

          const noOfDays = differenceInCalendarDays(campaignEndDate, campaignStartDate) + 1;
          const perDay = data.data.perDayBudget ? data.data.perDayBudget : (data.data.budget ? data.data.budget / noOfDays : 0);
          const budget = perDay * noOfDays;
          skipScheduleUpdate.current = true;
          setSchedule({
            startDate: `${campaignStartDate.getFullYear()}-${(campaignStartDate.getMonth() + 1).toString().padStart(2, "0")}-${campaignStartDate.getDate().toString().padStart(2, "0")}` || "",
            endDate: `${campaignEndDate.getFullYear()}-${(campaignEndDate.getMonth() + 1).toString().padStart(2, "0")}-${campaignEndDate.getDate().toString().padStart(2, "0")}` || "",
            daysOfWeek: data.data.daysOfWeek || [],
            timeSlots: data.data.timeOfDay || [],
            startTime: campaignStartDate.getHours().toString().padStart(2, "0")+ ":" + campaignStartDate.getMinutes().toString().padStart(2, "0")|| "",
            endTime: campaignEndDate.getHours().toString().padStart(2, "0") + ":" + campaignEndDate.getMinutes().toString().padStart(2, "0") || "",
            selectedHours: hours,
          })
          setBudget({
            dailyBudget: data.data.dailyCap ? data.data.dailyCap.toString() : perDay.toString(),
            totalBudget: data?.data?.totalBudget.toString() || budget.toString(),
            currency: "USD",
          });

          const adGroup:AdGroup = data.data.adGroups && data.data.adGroups.length > 0 ? data.data.adGroups[0] : null;
          console.log("Ad Group data:", adGroup);
          if(adGroup){
            let targetingObj = {
              ...targeting
            }
            if(adGroup.inventoryType === "Podcast"){
              
              targetingObj.inventoryType = "Podcast";
              if(adGroup.podcastTopics && adGroup.podcastTopics.length > 0){
                targetingObj.podcastTopics = adGroup.podcastTopics;
              }
              if(adGroup.podcastAudiences && adGroup.podcastAudiences.length > 0){
                targetingObj.podcastAudiences = adGroup.podcastAudiences;
              }
            }else {
              targetingObj.inventoryType = "Streaming"
              if(adGroup.streamingTopics && adGroup.streamingTopics.length > 0){
                targetingObj.streamingTopics = adGroup.streamingTopics;
              }
              if(adGroup.streamingAudiences && adGroup.streamingAudiences.length > 0){
                targetingObj.streamingAudiences = adGroup.streamingAudiences;
              }
            }

            console.log("Ad Group targeting data:", targetingObj);
            targetingObj = {
              ...targetingObj,
              adPositions: adGroup.adPosition || [],
              gender: adGroup.demogGender || "",
              ageRanges: adGroup.demogAge || [],
              deviceTypes: adGroup.deviceType || [], 
            
            }
            setTargeting({...targetingObj});


            if(adGroup.geoCountries && adGroup.geoCountries.length > 0){

              const selectedCountriesFromCountry = adGroup.geoCountries.filter(geo => geo.startsWith("COUNTRY/")).map(geo => geo.split("/")[1]);
              const selectedCountriesFromCities = adGroup.geoCountries.filter(geo => geo.startsWith("CITY/")).map(geo => geo.split("/")[2]);
              const selectedCities = adGroup.geoCountries.filter(geo => geo.startsWith("CITY/")).map(geo => {
                const parts = geo.split("/");
                return {
                  country: parts[2],
                  name: parts[1],
                  id: parts[2] + "---" + parts[1],
                };
              })


              console.log({selectedCountriesFromCountry, selectedCountriesFromCities, selectedCities});
              onCountryChange([...new Set([...selectedCountriesFromCountry, ...selectedCountriesFromCities])]);
              setTimeout(() => {
                setInventory((prev) => ({ ...prev, selectedCities: selectedCities }));
              }, 2000)

            }



            console.log("Ad Group banner data:", adGroup.bannerOne);
            if(adGroup.bannerOne && adGroup.bannerOne.length){
              const response = await fetch(adGroup.bannerOne);
              const blob = await response.blob();
              
              // 2. Create a File object from the blob
              const fileName = adGroup.bannerOne.split('/').pop() || 'uploaded-image';
              const file = new File([blob], fileName, { type: blob.type });
  
  
              const bannerSlot: BannerSlot = {
                file: file,
                type: "rectangle",
                fileName: "Uploaded Banner",
                preview: URL.createObjectURL(file),
              }
              console.log("Banner slot data:", bannerSlot);
              setAudienceExtension((prev) => ({ ...prev, enabled: true, banners: [bannerSlot], impressionPixel: data.data.displayPixel ? data.data.displayPixel : "" }));
            }

          }
          
        }
      }
      getCampaignData();
    } else {
      setCampaignStatus("");
    }
  
  }, [id])
  

  const cancelPayment = async () => {
    setPaymentUrl("");

    const {data, error, status} = await paymentApi.cancelPayment(paymentLinkId);
    console.log("cancelPayment here ", {data, error, status});
    setPaymentLinkId("");
    navigate(`/dashboard/campaigns/${campaignId}`);
    window.location.reload();

  }


  if(id && !loadedExistingCampaign)
    return (
      <div className="flex items-center justify-center h-64">
        <Helmet>
          <title>EARO | Campaign</title>
        </Helmet>
        <Loader2 className="animate-spin mr-2" />
        Loading campaign data...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">

        <Helmet>
          <title>EARO | Campaign</title>
        </Helmet>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
        Launch your campaign
        </h1>
        <p className="text-muted-foreground">
        Complete the steps below — your forecast updates as you go.
        </p>
      </div>

      {/* Main content + sidebar */}
      <div className="relative">
        {/* Main column */}
        <div className="space-y-4 lg:pr-[304px]">
          {/* Your Ad */}
          {renderSection(
            "Your audio ad",
            "Select a saved audio ad from your library. Only ads under the currently selected advertiser account are shown. You can create a new ad in the Audio Ads section before returning here.",
            setupDone,
            <CampaignSetupStep data={setup} onChange={setSetup} searchInputRef={searchInputRef} campaignNameRef={campaignNameRef}
            audioAdRef={audioAdRef}
            disabled={role === 'VIEWER' || role === 'VIEWER_RESTRICTED'}
            />,
          )}

          {/* Schedule */}
          {renderSection(
            "Schedule",
            scheduleTooltip,
            scheduleDone,
            <CampaignScheduleStep data={schedule} onChange={setSchedule} campaignStatus={campaignStatus} disabled={role === 'VIEWER' || role === 'VIEWER_RESTRICTED'} />,
          )}

          {/* Budget */}
          {renderSection(
            "Budget",
            budgetTooltip,
            budgetDone,
            <CampaignBudgetStep
              data={budget}
              onChange={setBudget}
              durationDays={durationDays || 7}
              inventoryCount={targeting.inventoryType === 'Podcast' ? 1 : 0}
              campaignStatus={campaignStatus}
              disabled={role === 'VIEWER' || role === 'VIEWER_RESTRICTED'}
            />,
          )}

          {/* Location */}
          {renderSection(
            "Location",
            locationTooltip,
            inventoryDone,
            <CampaignInventoryStep
              countries={countries}
              cities={cities}
              data={inventory}
              onCountryChange={onCountryChange}
              onCityChange={onCityChange}
              isLoading={geoLoading && !geoApplied}
              countryRef={countryRef}
              disabled={role === 'VIEWER' || role === 'VIEWER_RESTRICTED'}
            />,
          )}

          {/* Audience */}
          {renderSection(
            "Audience",
            audienceTooltip,
            targetingDone,
            <CampaignTargetingStep
              targetingSegments={targetingSegments}
              podcastTopics={podcastTopics}
              streamingTopics={streamingTopics}
              podcastAudiences={podcastAudiences}
              streamingAudiences={streamingAudiences}
              data={targeting}
              onChange={setTargeting}
              deviceTypes={deviceTypes}
              disabled={role === 'VIEWER' || role === 'VIEWER_RESTRICTED'}
            />,
          )}

          {/* Audience Extension — Pro only */}
          {isPro && (
            <Card className="hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
                    6
                  </span>
                  <CardTitle className="text-lg flex items-center gap-2">Audience Extension
                    <MyTooltip html={audienceExtensionTooltip} />
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AudienceExtensionStep
                  data={audienceExtension}
                  onChange={setAudienceExtension}
                  dailyBudget={Number(budget.dailyBudget) || 0}
                  disabled={role === 'VIEWER' || role === 'VIEWER_RESTRICTED'}
                />
              </CardContent>
            </Card>
          )}



          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
                  6
                </span>
                <CardTitle className="text-lg flex items-center gap-2">Payment

                  <MyTooltip html={paymentTooltip} />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CampaignPaymentStep campaignStatus={campaignStatus} totalBudget={Number(budget.totalBudget) || 0} creditsDetails={creditsDetails} cards={cards} campaignName={setup.campaignName} data={payment} onChange={setPayment} applyCoupon={applyCoupon} isApplyingCoupon={isApplyingCoupon} dailyBudget={Number(budget.dailyBudget) || 0} durationDays={durationDays || 7} disabled={role === 'VIEWER' || role === 'VIEWER_RESTRICTED'} savedTransaction={savedTransaction} />
            </CardContent>
          </Card>


          {/* Action bar */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/campaigns")}
              disabled={saving}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {
                ((id && campaignStatus?.toLowerCase() === "draft") || !id) && isAdminOrEditor && <Button
                variant="outline"
                onClick={saveDraftCampaign}
                disabled={saving}
              >
                Save Draft
              </Button>

              }
              {
               ( (id && campaignStatus?.toLowerCase() === "draft") || !id) && isAdminOrEditor && <Button
                onClick={saveCampaign}
                disabled={saving}
              >
                {saving
                  ? "Launching..."
                  : "Pay & Launch"}
              </Button>
              }
              
             {
                (id && ( campaignStatus?.toLowerCase() === "active" || campaignStatus?.toLowerCase() === "paused" ||  campaignStatus?.toLowerCase() === "processing" || campaignStatus?.toLowerCase() === "scheduled") ) && isAdminOrEditor && <Button
                onClick={updateCampaign}
                disabled={saving}
              >
                {saving
                  ? "Updating..."
                  : "Update Campaign"}
              </Button>
              }
             


            </div>
          </div>
        </div>

        {/* Forecast + Summary sidebar (fixed on lg so always visible) */}
        <div
          className="hidden lg:block fixed right-6 top-40 bottom-[100px] w-[280px] space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
          style={{ zIndex: 10 }}
        >
          <ForecastSidebar
            isLoading={isLoadingForecast}
            totalReach={forecastData.totalReach || 0}
            totalBudget={Number(budget.totalBudget) || 0}
            dailyBudget={Number(budget.dailyBudget) || 0}
            cpm={CPM}
            {...forecastData}
            noOfDays={durationDays}
          />
          <CampaignSummary items={summaryItems} />
        </div>
      </div>
      <CampaignLaunchModal
        open={showLaunchModal}
        onDone={() => navigate("/dashboard/campaigns")}
      />
      {
        paymentUrl && (
          <PaymentModal
            open={!!paymentUrl}
            onOpenChange={() => setPaymentUrl("")}
            paymentUrl={paymentUrl}
            onCancel={() => cancelPayment()}
          />
        )
      }
    </div>
  );
}
