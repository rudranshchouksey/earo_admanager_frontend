import { useEffect, useState } from "react";
import {
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Loader2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert as SystemAlert, systemApi } from "@/services/system";
import { auth } from "@/services/api";
import { userApi } from "@/services/user";
import { toast } from "@/hooks/use-toast";
import { organizationApi, OrganizationDetails } from "@/services/organization";
import { Country, targetingApi } from "@/services/targeting";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import {
  INDUSTRY_CATEGORIES,
  IndustryCategoryKey,
  DEFAULT_INDUSTRY_CATEGORY,
  DEFAULT_SUB_INDUSTRY,
} from "@/constants/industryCategories";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AlertItem {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  cta_label: string | null;
  cta_url: string | null;
  cta_action?: () => Promise<void>;
  userId: string;
}

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  info: {
    bg: "bg-primary/5",
    border: "border-primary/15",
    text: "text-primary",
  },
  warning: {
    bg: "bg-yellow-500/5",
    border: "border-yellow-500/15",
    text: "text-yellow-700",
  },
  error: {
    bg: "bg-destructive/5",
    border: "border-destructive/15",
    text: "text-destructive",
  },
};

export default function AlertBar() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const [showCompleteProfileModal, setShowCompleteProfileModal] =
    useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState<string>(DEFAULT_INDUSTRY_CATEGORY);
  const [subIndustry, setSubIndustry] = useState<string>(DEFAULT_SUB_INDUSTRY);
  const [countries, setCountries] = useState<Country[]>([]);
  const [orgnaizationDetails, setOrgnaizationDetails] = useState<OrganizationDetails | null>(null);
  const { geoData } = useGeoLocation();

  useEffect(() => {
    if (!showCompleteProfileModal) return;
    const fetchCountries = async () => {
      const { data, error } = await targetingApi.getCountries();
      if (error) {
        console.error(error);
        return;
      }
      setCountries(data?.data || []);
    };
    fetchCountries();
  }, [showCompleteProfileModal]);

  useEffect(() => {
    if (!showCompleteProfileModal || country) return;
    if (geoData?.country) setCountry(geoData.country);
  }, [showCompleteProfileModal, country, geoData?.country]);

  const industryKey = (industry in INDUSTRY_CATEGORIES ? industry : DEFAULT_INDUSTRY_CATEGORY) as IndustryCategoryKey;
  const subIndustryOptions = INDUSTRY_CATEGORIES[industryKey]?.industries ?? INDUSTRY_CATEGORIES[DEFAULT_INDUSTRY_CATEGORY].industries;

  useEffect(() => {
    const load = async () => {
      const {
        data: { session: initialSession },
      } = await auth.getSession();
      if (!initialSession) return;

      const {
        data: userProfile,
        status,
        message,
      } = await userApi.getUserProfile();

      if (status !== 200) {
        toast({
          title: "Error",
          description: message || "Failed to load user profile",
          variant: "destructive",
        });
        return;
      }

      console.log({ userProfile });
      console.log({ session: initialSession });
      const allAlerts = [];
      setUserId(userProfile.data.id);

      if (!userProfile.data.isVerified) {
        const hasCancelledVerifyEmail = localStorage.getItem(
          "verify-email-" + userProfile.data.id,
        );
        if (!hasCancelledVerifyEmail) {
          allAlerts.push({
            id: "verify-email",
            title: "Verify Email",
            message: "Please verify your email to continue",
            alert_type: "error",
            cta_label: "Verify Email",
            cta_url: "/dashboard/verify-email",
            cta_action: async () => {
              const { data, error, status, message } = await auth.resendOtp(
                userProfile.data.email,
              );
              if (error || status !== 200) {
                toast({
                  title: "Error",
                  description: message || "Failed to send email verification",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Email Verification Sent",
                  description:
                    "Please check your email for the verification code",
                  variant: "default",
                });
              }
              localStorage.setItem(
                "hasCancelledVerifyEmail" + userProfile.data.id,
                "true",
              );
              setAlerts((prev) => prev.filter((a) => a.id !== "verify-email"));
            },
            userId: userProfile.data.id,
          });
        }
      }


      setFirstName(userProfile.data.firstName || "");
      setLastName(userProfile.data.lastName || "");


      const hasCancelledCompleteProfile = localStorage.getItem('complete-profile-'+userProfile.data.id);

      console.log({ hasCancelledCompleteProfile });

      if (hasCancelledCompleteProfile) {
        setAlerts(allAlerts);
        return;
      }

      const organizationId = initialSession?.currentOrganizationId;

      const {
        data: organizationDetails,
        status: organizationDetailsStatus,
        message: organizationDetailsMessage,
      } = await organizationApi.getOrganizationDetails(organizationId);
      console.log({ organizationDetails });

      if (organizationDetailsStatus !== 200) {
        toast({
          title: "Error",
          description:
            organizationDetailsMessage || "Failed to load organization details",
          variant: "destructive",
        });
        return;
      }
      

      const org = organizationDetails.data.organization;
      setOrgnaizationDetails(org);

      if (!userProfile.data.firstName || !org.orgName) {
        setFirstName(userProfile.data.firstName || "");
        setLastName(userProfile.data.lastName || "");
        setCompanyName(org.orgName || "");
        setCountry(org.country || "");
        if (org.industry && org.industry in INDUSTRY_CATEGORIES) {
          setIndustry(org.industry);
          setSubIndustry(
            org.subIndustry ||
              INDUSTRY_CATEGORIES[org.industry as IndustryCategoryKey].industries[0],
          );
        } else if (org.subIndustry) {
          const category = Object.entries(INDUSTRY_CATEGORIES).find(([, cat]) =>
            (cat.industries as readonly string[]).includes(org.subIndustry),
          )?.[0] as IndustryCategoryKey | undefined;
          if (category) {
            setIndustry(category);
            setSubIndustry(org.subIndustry);
          }
        }
        setShowCompleteProfileModal(true);
        allAlerts.push(
          {
            id: "complete-profile",
            title: "Complete Profile",
            message: "Please complete your profile and company details",
            alert_type: "error",
            cta_label: "Complete Profile",
            cta_url: "/dashboard/account",
            userId: userProfile.data.id,
          }
        );
      }
      setAlerts(allAlerts);
    };
    load();
  }, []);


  const onClose = () => {
    setShowCompleteProfileModal(false);
    setStep(1);
  
  }

  const dismiss = async (alert: AlertItem) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    //await systemApi.dismissAlert(id);
    localStorage.setItem(alert.id + "-" + alert.userId, "true");
  };

  console.log({ alerts });

  if (alerts.length === 0) return null;

  const visibleAlerts = expanded ? alerts : alerts.slice(0, 2);
  const hiddenCount = alerts.length - 2;
  const hasPendingAd = false;

  const handleBusinessSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep(2);
    const { error, status, message } = await userApi.updatePersonalInfo(userId,{
      firstName,
      lastName,
    });

    const { data, error: updateError, status: updateStatus, message: updateMessage } = await organizationApi.updateOrganizationDetails(orgnaizationDetails?.id, {
      ...orgnaizationDetails,
      id: orgnaizationDetails?.id,
      orgName: companyName,
      orgType: orgnaizationDetails?.orgType,
      industry,
      subIndustry,
      country,
      url: companyWebsite,
    });


    localStorage.removeItem('complete-profile-'+userId);
    localStorage.setItem("complete-profile-" + userId, "true");

    setAlerts((prev) => prev.filter((a) => a.id !== "complete-profile"));

  };

  return (
    <div className="border-b border-border bg-background">
      {visibleAlerts.map((alert) => {
        const Icon = iconMap[alert.alert_type] || Info;
        const colors = colorMap[alert.alert_type] || colorMap.info;
        return (
          <div
            key={alert.id}
            className={`flex items-center gap-3 px-4 lg:px-6 py-2.5 border-b last:border-b-0 ${colors.border} ${colors.bg}`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${colors.text}`} />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className={`text-sm font-medium ${colors.text}`}>
                {alert.title}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {alert.message}
              </span>
            </div>
            {alert.cta_label && alert.cta_url && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() =>
                  alert.cta_action
                    ? alert.cta_action()
                    : navigate(alert.cta_url!)
                }
              >
                {alert.cta_label}
              </Button>
            )}
            <button
              onClick={() => dismiss(alert)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-3 w-3" />
          Show {hiddenCount} more
        </button>
      )}
      {showCompleteProfileModal && (
        <Dialog
          open={showCompleteProfileModal}
          onOpenChange={(open) => {
            // Prevent dismiss via backdrop click / escape key.
            if (open) setShowCompleteProfileModal(true);
          }}
        >
          <DialogContent
            hideCloseButton
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className="p-0"
          >
            <DialogDescription className="p-0">
              {step == 1 ? (
                <div className="animate-in fade-in duration-200">
                  <div className="bg-[#00DA88] p-7">
                    <span className="inline-block bg-black text-white text-[11px] font-semibold tracking-wider px-3 py-1.5 rounded-full uppercase">
                      Step 1 of 2 · Account Setup
                    </span>
                    <h2 className="mt-4 text-3xl font-bold leading-tight text-black">
                      Tell us about your business
                    </h2>
                    <p className="mt-3 text-sm text-black/70 leading-relaxed">
                      A few details to get your account ready, tailor the
                      experience to your industry, and keep our communication
                      relevant to you.
                    </p>
                  </div>

                  <form
                    onSubmit={handleBusinessSubmit}
                    className="p-6 space-y-4"
                    noValidate
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs">
                          First name <sup>*</sup>
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="Jane"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs">
                          Last name <sup>*</sup>
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-xs">
                        Company name <sup>*</sup>
                      </Label>
                      <Input
                        id="companyName"
                        placeholder="Sunwave Coffee Co."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="companyWebsite" className="text-xs">
                        Company website
                      </Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyWebsite"
                          placeholder="sunwave.coffee"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select country..." />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Industry</Label>
                        <Select
                          value={industry}
                          onValueChange={(v) => {
                            const key = v as IndustryCategoryKey;
                            setIndustry(key);
                            setSubIndustry(INDUSTRY_CATEGORIES[key].industries[0]);
                          }}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select industry..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(INDUSTRY_CATEGORIES) as [
                              IndustryCategoryKey,
                              (typeof INDUSTRY_CATEGORIES)[IndustryCategoryKey],
                            ][]).map(([key, cat]) => (
                              <SelectItem key={key} value={key}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sub-industry</Label>
                        <Select value={subIndustry} onValueChange={setSubIndustry}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select sub-industry..." />
                          </SelectTrigger>
                          <SelectContent>
                            {subIndustryOptions.map((sub) => (
                              <SelectItem key={sub} value={sub}>
                                {sub}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 font-medium mt-2"
                      disabled={
                        isLoading ||
                        !firstName ||
                        !lastName ||
                        !companyName ||
                        !country
                      }
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Continue
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      We never share your details. You can edit them later in
                      account settings.
                    </p>
                  </form>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200">
                <div className="bg-[#00DA88] p-7">
                  <span className="inline-block bg-black text-white text-[11px] font-semibold tracking-wider px-3 py-1.5 rounded-full uppercase">
                    Step 2 of 2 · {hasPendingAd ? 'Launch your campaign' : 'Welcome to EARO'}
                  </span>
                  <h2 className="mt-4 text-3xl font-bold leading-tight text-black">
                    {hasPendingAd
                      ? "You're one step away from going live"
                      : 'Get your first audio ad live in minutes'}
                  </h2>
                  <p className="mt-3 text-sm text-black/70 leading-relaxed">
                    {hasPendingAd
                      ? 'Your ad is ready. Set up your campaign — schedule, audience, and budget — and launch.'
                      : 'Studio-quality. Zero studio fees. AI writes, voices, and mixes — you launch.'}
                  </p>
                </div>
    
                <div className="p-6 space-y-5">
                  <ul className="space-y-4">
                    {(hasPendingAd
                      ? [
                          { n: 1, title: 'Confirm your ad', desc: "We'll pre-select the ad you just created." },
                          { n: 2, title: 'Set schedule & budget', desc: 'Choose when your campaign runs and how much to spend.' },
                          { n: 3, title: 'Target & launch', desc: 'Pick your locations and audience, then go live.' },
                        ]
                      : [
                          { n: 1, title: 'Drop your URL', desc: 'We analyse your site to write a script in your brand voice.' },
                          { n: 2, title: 'Pick a voice & music', desc: 'Choose from 12 voices and a curated music library.' },
                          { n: 3, title: 'Launch a campaign', desc: 'Reach 100M+ listeners across 50K+ podcasts and music streams.' },
                        ]
                    ).map((item) => (
                      <li key={item.n} className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[#0A1A3C] text-white text-xs font-semibold flex items-center justify-center">
                          {item.n}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
    
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 font-medium"
                      onClick={() => {
                        if (hasPendingAd) {
                          const pendingAdId = localStorage.getItem('pendingAdId');
                          localStorage.removeItem('pendingAdId');
                          localStorage.removeItem('pendingBudget');
                          localStorage.removeItem('pendingCity');
                          onClose();
                          setStep(1);
                          navigate(`/dashboard/ads/${pendingAdId}`);
                        } else {
                          onClose();
                          setStep(1);
                        }
                      }}
                    >
                      {hasPendingAd ? 'Edit audio ad' : "I'll explore first"}
                    </Button>
                    <Button type="button" className="h-12 font-medium" onClick={() => {
                       onClose();
                      if (hasPendingAd) {
                        navigate('/dashboard/campaigns/new');
                      }
                      navigate('/dashboard/ads/new');
                    }}>
                      {hasPendingAd ? 'Create campaign' : 'Create my audio ad'}
                    </Button>
                  </div>
                </div>
              </div>
    
              )}
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
