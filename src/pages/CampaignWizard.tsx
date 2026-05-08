import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import type { LocationData } from "@/components/dashboard/campaign-wizard/CampaignInventoryStep";
import { MOCK_CITIES_DATA } from "@/components/dashboard/campaign-wizard/CampaignInventoryStep";
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
import type { AudienceExtensionData } from "@/components/dashboard/campaign-wizard/AudienceExtensionStep";
import CampaignLaunchModal from "@/components/dashboard/campaign-wizard/CampaignLaunchModal";
import { useSessionFlags } from "@/hooks/useSessionFlags";
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
import { campaignApi } from "@/services/campaign";
import PaymentModal from "@/components/dashboard/launch/PaymentModal";
import { walletApi } from "@/services/wallet";

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

export default function CampaignWizard() {
  const navigate = useNavigate();
  const { isPro } = useSessionFlags();
  const [saving, setSaving] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  const [setup, setSetup] = useState<{
    audioId: string;
    campaignName: string;
    adName?: string;
    externalCampaignId?: string;
  }>({ audioId: "", campaignName: "" });
  const [schedule, setSchedule] = useState(() => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const end = new Date(new Date().setDate(new Date().getDate() + 29));
    return {  startDate: formatDate(today), endDate: formatDate(end), startTime: "00:00", endTime: "23:59", daysOfWeek: DAYS_OF_WEEK, timeSlots: TIME_SLOTS.flatMap(item => item.value), selectedHours: [...new Set(TIME_SLOTS.flatMap(item => item.valueInHours))] };
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
    deviceTypes: ["tablet", "desktop", "phone"] as string[],
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
    totalBudget: "25",
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
  });

  const [paymentUrl, setPaymentUrl] = useState("");

  const [cards, setCards] = useState<Cards[]>([])

  const [audienceExtension, setAudienceExtension] =
    useState<AudienceExtensionData>({
      enabled: false,
      banners: [],
      impressionPixel: "",
    });
  const [CPM, setCPM] = useState(18);
  const [deviceTypes, setDeviceTypes] = useState<TargetingSegment[]>([]);


  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const couponCodeTimer = useRef<NodeJS.Timeout | null>(null);


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

  const canLaunch = setupDone && scheduleDone && inventoryDone && budgetDone;

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
        const fmt = (d: Date) =>
          new Date(d).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        return `${fmt(schedule.startDate)} – ${fmt(schedule.endDate)} (${durationDays} days)`;
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
            targeting.ageRanges.slice(0, 2).join("/") +
              (targeting.ageRanges.length > 2 ? "+" : ""),
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



  const saveCampaign = async () => {
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
        budget: Number(budget.dailyBudget) * durationDays,
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
      const {data, error, message, status} = await campaignApi.createCampaign(campaignObj);

      if(status === 200 && data?.payment_url) {
        setPaymentUrl(data.payment_url);
      }else if( status === 200 && data?.paid){
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
            <CardTitle className="text-lg">{title}</CardTitle>
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


  const applyCoupon = async (couponCode: string) => {
    setIsApplyingCoupon(true);
    try {
      const { data, error, status } = await campaignApi.applyCoupon( Number(budget.dailyBudget) * durationDays, couponCode);

      if(status !== 200) {
        toast({
          title: "Error",
          description: data?.message || error?.message || "Invalid coupon code",
          variant: "destructive",
        });
      }

      // if(status === 200 && d)
      if(status === 200 && data?.discountApplied){
        setPayment((prev) => ({ ...prev, couponCode, discountValue: data.discountValue, discountType: data.discountType, originalAmount: data.originalAmount, discountApplied: data.discountApplied, finalAmount: data.finalAmount }));
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

    if(couponCodeTimer.current) {
      clearTimeout(couponCodeTimer.current);
    }
    
    couponCodeTimer.current = setTimeout(async () => {
      if(payment.couponCode) {
        applyCoupon(payment.couponCode);
      }
    }, 1000);

  }, [budget, durationDays]);

  useEffect(() => {
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
        if(targeting.podcastTopics && targeting.podcastTopics.length > 0){
          audienceTargeting["groups"][0].rules.push({
            type: "PUBLISHER_ATTRIBUTES_SEGMENTS",
            comparison: "IS_ANY_OF",
            groups: [
              {
                segmentCode: "genre",
                segmentValues: targeting.podcastTopics,
              }
            ],
          });
        }


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
    fetchCountries();
    fetchPublisherSegments();
    fetchPodcastAudiences();
    fetchStreamingAudiences();
    getTargetingSegments();
    fetchDeviceTypes();
    fetchCards();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Create Campaign
        </h1>
        <p className="text-muted-foreground">
          Fill in each section to configure your campaign
        </p>
      </div>

      {/* Main content + sidebar */}
      <div className="relative">
        {/* Main column */}
        <div className="space-y-4 lg:pr-[304px]">
          {/* Your Ad */}
          {renderSection(
            "Your Ad",
            setupDone,
            <CampaignSetupStep data={setup} onChange={setSetup} />,
          )}

          {/* Schedule */}
          {renderSection(
            "Schedule",
            scheduleDone,
            <CampaignScheduleStep data={schedule} onChange={setSchedule} />,
          )}

          {/* Budget */}
          {renderSection(
            "Budget",
            budgetDone,
            <CampaignBudgetStep
              data={budget}
              onChange={setBudget}
              durationDays={durationDays || 7}
              inventoryCount={targeting.inventoryType === 'Podcast' ? 1 : 0}
            />,
          )}

          {/* Location */}
          {renderSection(
            "Location",
            inventoryDone,
            <CampaignInventoryStep
              countries={countries}
              cities={cities}
              data={inventory}
              onCountryChange={onCountryChange}
              onCityChange={onCityChange}
              isLoading={geoLoading && !geoApplied}
            />,
          )}

          {/* Audience */}
          {renderSection(
            "Audience",
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
            />,
          )}

          {/* Audience Extension — Pro only */}
          {isPro && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
                    6
                  </span>
                  <CardTitle className="text-lg">Audience Extension</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AudienceExtensionStep
                  data={audienceExtension}
                  onChange={setAudienceExtension}
                  dailyBudget={Number(budget.dailyBudget) || 0}
                />
              </CardContent>
            </Card>
          )}



          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-7 w-7 rounded-lg text-sm font-semibold shrink-0 bg-foreground text-background">
                  7
                </span>
                <CardTitle className="text-lg">Payment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CampaignPaymentStep cards={cards} campaignName={setup.campaignName} data={payment} onChange={setPayment} applyCoupon={applyCoupon} isApplyingCoupon={isApplyingCoupon} dailyBudget={Number(budget.dailyBudget) || 0} durationDays={durationDays || 7} />
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
              <Button
                variant="outline"
                onClick={saveCampaign}
                disabled={saving || !setupDone}
              >
                Save Draft
              </Button>
              <Button
                onClick={saveCampaign}
                disabled={saving || !canLaunch}
              >
                {saving
                  ? "Launching..."
                  : isPro
                    ? "Pay & Launch"
                    : "Pay & Launch"}
              </Button>
            </div>
          </div>
        </div>

        {/* Forecast + Summary sidebar (fixed on lg so always visible) */}
        <div
          className="hidden lg:block fixed right-6 top-40 w-[280px] space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto"
          style={{ zIndex: 10 }}
        >
          <CampaignSummary items={summaryItems} />
          <ForecastSidebar
            isLoading={isLoadingForecast}
            budget={Number(budget.dailyBudget) || 0}
            cpm={CPM}
            {...forecastData}
            noOfDays={durationDays}
          />
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
            onCancel={() => setPaymentUrl("")}
          />
        )
      }
    </div>
  );
}
