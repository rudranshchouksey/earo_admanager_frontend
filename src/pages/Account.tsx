import { useEffect, useLayoutEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle,
  AlertCircle,
  FileText,
  Tag,
  Download,
  Eye,
  EyeOff,
  Trash,
  ChevronDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { auth, AuthSession } from "@/services/auth";
import { userApi, UserProfile } from "@/services/user";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/contexts/TranslationContext";
import { useSessionFlags } from "@/hooks/useSessionFlags";
import UsersTab from "@/components/dashboard/account/UsersTab";
import AdvertisersTab, { AdvertiserCreateObj, AdvertiserUpdateObj } from "@/components/dashboard/account/AdvertisersTab";
import { Advertiser, advertiserApi } from "@/services/advertiser";
import { appNotifications } from "@/services/appNotifications";
import { SetupMFAModal } from "@/components/auth/mfa-modal";
import { organizationApi, OrganizationDetails, OrganizationDetailsResponse, OrganizationIndustry } from "@/services/organization";
import { CreditDetails, walletApi } from "@/services/wallet";
import PaymentModal from "@/components/dashboard/launch/PaymentModal";
import { paymentApi, PaymentHistory } from "@/services/payment";
import { useSearchParams } from "react-router-dom";
import { campaignApi } from "@/services/campaign";
import { Country, targetingApi } from "@/services/targeting";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import {
  INDUSTRY_CATEGORIES,
  IndustryCategoryKey,
  DEFAULT_INDUSTRY_CATEGORY,
  DEFAULT_SUB_INDUSTRY,
} from "@/constants/industryCategories";
import { Helmet } from "react-helmet-async";
import { countryList } from "@/lib/countries";
interface Cards {
  id: string;
  cardId: string;
  last_4: string;
  cardHolderName: string;
  type: string;
}

export default function Account() {
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    userId: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    newsletterOpt: true,
    isVerified: false,
    mfaEnabled: false,
    language: "en",
    affiliateCode: "",
    role: "USER",
    orgId: "",
    status: "ACTIVE",
    onboardingComplete: false,
    organizations: [],
  });
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);

  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);

  const [qrCode, setQrCode] = useState("");
  const [mfaToken, setMFAToken] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [cards, setCards] = useState<Cards[]>([])
  const [creditsDetails, setCreditsDetails] = useState<CreditDetails>({
    availableCredit: 0,
    creditUsed: 0,
    totalCredits: 0,
    utilizationPercentage: "0%",
  });
  const [paymentMethods, setPaymentMethods] = useState<[]>([]);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [paymentHistoryPage, setPaymentHistoryPage] = useState(1);
  const [paymentHistoryLimit, setPaymentHistoryLimit] = useState(10);
  const [paymentHistoryMeta, setPaymentHistoryMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [deletePaymentMethodAlertOpen, setDeletePaymentMethodAlertOpen] = useState(false);
  const [allAdvertisersSelected, setAllAdvertisersSelected] = useState(true);
  const [selectedAdvertisers, setSelectedAdvertisers] = useState<string[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [industry, setIndustry] = useState<string>("RETAIL");
  const [subIndustry, setSubIndustry] = useState<string>("Fashion & Apparel");
  const [country, setCountry] = useState("");
  // const [countries, setCountries] = useState<Country[]>([]);
  const { isPro, isAgency, role } = useSessionFlags();
  const [organizationCount, setorganizationCount] = useState(0);
  const countries:Country[] = countryList;

  const { geoData, isLoading: geoLoading } = useGeoLocation();

  const getPaymentHistory = async () => {
    const {data: {session: sessionData}} = await auth.getSession();
    if (!sessionData) {
      console.error("Not authenticated");
      return;
    }
    const advertiserIds = allAdvertisersSelected
      ? advertisers.map((advertiser) => advertiser.id)
      : selectedAdvertisers;

    if (advertiserIds.length === 0) {
      setPaymentHistory([]);
      setPaymentHistoryMeta({
        total: 0,
        page: 1,
        limit: paymentHistoryLimit,
        totalPages: 1,
      });
      setLoadingPaymentHistory(false);
      return;
    }

    setLoadingPaymentHistory(true);

    const { data, error, status } = await paymentApi.getPaymentHistory({
      page: paymentHistoryPage,
      limit: paymentHistoryLimit,
      advertiserIds,
    });

    if (error || status !== 200) {
      console.error(error);
      setLoadingPaymentHistory(false);
      toast({
        title: t("common.error"),
        description: error?.message || "Failed to load payment history",
        variant: "destructive",
      });
      return;
    }

    const rows = data?.data ?? [];
    const responseMeta = data?.meta;
    const total = responseMeta?.total ?? 0;
    const apiPage = responseMeta?.page ?? paymentHistoryPage;
    const apiLimit = responseMeta?.limit ?? paymentHistoryLimit;
    const apiTotalPages = responseMeta?.totalPages;
    const totalPages =
      typeof apiTotalPages === "number" && apiTotalPages > 0
        ? apiTotalPages
        : total > 0
          ? Math.max(1, Math.ceil(total / apiLimit))
          : rows.length < apiLimit
            ? Math.max(1, apiPage)
            : apiPage + 1;

    setPaymentHistoryMeta({
      total,
      page: apiPage,
      limit: apiLimit,
      totalPages,
    });
    setLoadingPaymentHistory(false);
    setPaymentHistory(rows);
  }

  useEffect(() => {
    if(organizationDetails?.country) setCountry(organizationDetails.country);
    if (organizationDetails?.industry) setIndustry(organizationDetails.industry);
    if (organizationDetails?.subIndustry) setSubIndustry(organizationDetails.subIndustry);
  }, [organizationDetails]);

  const getAdvertisers = async (orgId: string) => {
    const {
      data: advertisers,
      status: advertisersStatus,
      message: advertisersMessage,
    } = await advertiserApi.getAdvertisers(orgId, 1, 1000);
    if (advertisersStatus !== 200) {
      toast({
        title: t("common.error"),
        description: advertisersMessage || "Failed to load advertisers",
        variant: "destructive",
      });
      return;
    }
    setAdvertisers(advertisers.data ?? []);
  }

  useLayoutEffect(() => {
    setPaymentHistoryPage(1);
  }, [allAdvertisersSelected, selectedAdvertisers, paymentHistoryLimit]);

  useEffect(() => {
    if (advertisers.length > 0) {
      getPaymentHistory();
    }
  }, [advertisers, allAdvertisersSelected, selectedAdvertisers, paymentHistoryPage, paymentHistoryLimit]);

  const advertiserFilterLabel = allAdvertisersSelected
    ? "All Advertisers"
    : selectedAdvertisers.length === 0
      ? "Select advertisers"
      : selectedAdvertisers.length === 1
        ? advertisers.find((advertiser) => advertiser.id === selectedAdvertisers[0])?.advertiserName ??
          "1 advertiser"
        : `${selectedAdvertisers.length} advertisers`;

  const toggleAllAdvertisers = (checked: boolean) => {
    if (checked) {
      setAllAdvertisersSelected(true);
      setSelectedAdvertisers([]);
      return;
    }
    setAllAdvertisersSelected(false);
    setSelectedAdvertisers([]);
  };

  const toggleAdvertiser = (advertiserId: string, checked: boolean) => {
    const allIds = advertisers.map((advertiser) => advertiser.id);

    if (allAdvertisersSelected) {
      if (!checked) {
        setAllAdvertisersSelected(false);
        setSelectedAdvertisers(allIds.filter((id) => id !== advertiserId));
      }
      return;
    }

    if (checked) {
      const next = [...selectedAdvertisers, advertiserId];
      if (next.length === allIds.length) {
        setAllAdvertisersSelected(true);
        setSelectedAdvertisers([]);
      } else {
        setSelectedAdvertisers(next);
      }
      return;
    }

    setSelectedAdvertisers(selectedAdvertisers.filter((id) => id !== advertiserId));
  };
  

  useEffect(() => {
    const load = async () => {
      const {
        data: { session: initialSession },
      } = await auth.getSession();
      if (!initialSession) return;

      setSession(initialSession);
      const {
        data: userProfile,
        status,
        message,
      } = await userApi.getUserProfile();


      if (status !== 200) {
        toast({
          title: t("common.error"),
          description: message || "Failed to load user profile",
          variant: "destructive",
        });
        return;
      }

      console.log({ userProfile });
      console.log({ session: initialSession });

      if (userProfile && userProfile.data) {
        setorganizationCount(userProfile.data.organizations?.length ?? 0);
        setProfile((p) => ({
          ...p,
          ...userProfile.data,
        }));
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
          title: t("common.error"),
          description: organizationDetailsMessage || "Failed to load organization details",
          variant: "destructive",
        });
        return;
      }
      setOrganizationDetails(organizationDetails.data.organization);
      getAdvertisers(organizationId);


    };

    const fetchCards = async () => {
      const { data, error, status } = await walletApi.getCards();

      if (error || status !== 200) {
        console.error(error);
        return;
      }
      setCards(data?.data || []);
    }


    if(role === 'ADMIN') {
      fetchCards();
    }
    load();

  }, [role, isAgency, isPro]);


  // // Auto-fill country from geo-detect
  useEffect(() => {
    if (geoData && geoData.country && !country) {
      setCountry(geoData.country);
    }
  }, [geoData]);


  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if(isNaN(Number(profile.phone))) {
      toast({
        title: t("common.error"),
        description: "Invalid phone number",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const {
        data: { session },
      } = await auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error, status, message } = await userApi.updatePersonalInfo(session.user.id, {
        phone: profile.phone,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        // companyName: profile.company_name,
        // companyType: profile.company_type,
        // industry: profile.industry,
        language: profile.language,
        // newsletterOpt: profile.newsletterOpt,
      });

      if (error || status !== 200) {
        toast({
          title: t("common.error"),
          description: message || "Failed to save profile",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: t("common.success"),
        description: "Profile saved successfully",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: t("common.error"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (
      !password ||
      password.length < 8 ||
      !passwordConfirm ||
      passwordConfirm.length < 8
    ) {
      toast({
        title: t("account.password_min_length"),
        variant: "destructive",
      });
      return;
    }
    if (password !== passwordConfirm) {
      toast({
        title: t("account.passwords_dont_match"),
        variant: "destructive",
      });
      return;
    }
    ``;
    const { error, status, message } = await userApi.changePassword(password);
    if (error || status !== 200) {
      toast({
        title: t("common.error"),
        description: message || "Failed to change password",
        variant: "destructive",
      });
    } else {
      toast({
        title: t("account.password_changed"),
        description: t("account.password_changed_desc"),
        variant: "default",
      });
      setPassword("");
      setPasswordConfirm("");
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profile.affiliateCode);
  };

  const saveCompanyDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("save company details");


    const { error, status, message } = await organizationApi.updateOrganizationDetails(organizationDetails?.id ?? "", organizationDetails);
    if (error || status !== 200) {
      toast({
        title: t("common.error"),
        description: message || "Failed to save company details",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("common.success"),
      description: "Company details saved successfully",
      variant: "default",
    });
  }

  const updateMFASetup =  async(checked: boolean) => {
    console.log(checked);
    if(checked){
      setIsMfaModalOpen(true);
      // enable mfa 
      const { error, status, message, data } = await userApi.setup2fa(profile.id);
      if (error || status !== 200) {
        toast({
          title: t("common.error"),
          description: message || "Failed to setup MFA",
          variant: "destructive",
        });
        return;
      }

      setQrCode(data.data.qrCode);
      setMFAToken(data.data.mfaToken);
      setIsMfaModalOpen(true);
    }else {
      toast({
        title: t("common.error"),
        description: "Feature not implemented yet",
        variant: "destructive",
      });
    }
  }

  const createAdvertiser = async (advertiserObj: AdvertiserCreateObj) => {
    const { data, status, error, message } = await advertiserApi.createAdvertiser({
      ...advertiserObj,
      orgId: organizationDetails?.id ?? "",
    });
    if (error || status !== 200) {
      toast({
        title: t("common.error"),
        description: message || "Failed to create advertiser",
        variant: "destructive",
      });
      return { status, error, message };
    }
    getAdvertisers(session?.currentOrganizationId ?? "");
    appNotifications.notify("advertisers:changed", {
      organizationId: session?.currentOrganizationId ?? organizationDetails?.id,
    });

    toast({
      title: t("common.success"),
      description: "Advertiser created successfully",
      variant: "default",
    });
    return { status, error: null, message: message || "Advertiser created successfully" };
  }

  const updateAdvertiser = async (advertiserObj: AdvertiserUpdateObj) => {
    const { data, status, error, message } = await advertiserApi.updateAdvertiser({
      advertiserId: advertiserObj.advertiserId,
      advertiserName: advertiserObj.advertiserName,
      industry: advertiserObj.industry,
      subIndustry: advertiserObj.subIndustry,
      status: advertiserObj.status,
      extId: advertiserObj.extId,
    });
    if (error || status !== 200) {
      toast({
        title: t("common.error"),
        description: message || "Failed to create advertiser",
        variant: "destructive",
      });
      return { status, error, message };
    }
    getAdvertisers(session?.currentOrganizationId ?? "");
    appNotifications.notify("advertisers:changed", {
      organizationId: session?.currentOrganizationId ?? organizationDetails?.id,
    });

    toast({
      title: t("common.success"),
      description: "Advertiser created successfully",
      variant: "default",
    });
    return { status, error: null, message: message || "Advertiser created successfully" };
  }

  const verifyMFAComplete = async (code: string) => {
    const { error, status, message, data } = await userApi.verify2fa(profile.id, code, mfaToken);
    if (error || status !== 200) {
      toast({
        title: t("common.error"),
        description: message || "Failed to verify MFA",
        variant: "destructive",
      });
      return { error, status, message };
    }
    toast({
      title: t("common.success"),
      description: "MFA verified successfully",
      variant: "default",
    });
    setIsMfaModalOpen(false);
    setProfile((p) => ({ ...p, mfaEnabled: true }));
    toast({
      title: t("common.success"),
      description: "MFA verified successfully",
      variant: "default",
    });
    return { error: null, status, message };
  }

  const update = (field: keyof UserProfile, value: any) =>
    setProfile((p) => ({ ...p, [field]: value }));


  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page");
  const message = searchParams.get("message");
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (page === "advertisers" && isAgency) {
      setActiveTab("advertisers");
    }

    if(page === "billing") {
      setActiveTab("billing");
    }
  }, [page, isAgency]);

  useEffect(() => {
    if(message) {
      toast({
        title: t("common.success"),
        description: message,
        variant: "default",
      });
    }
  }, [message]);


  const addPaymentMethod = async () => {
    console.log("add payment method");
    setGeneratingPaymentLink(true);
    const { data, error, status } = await paymentApi.addCard();
    console.log({ data, error, status });
    if (error || status !== 200) {
      console.error(error);
      return;
    }

    if(data?.data?.payment_url){
      setPaymentUrl(data.data.payment_url);
    } else {
      toast({
        title: t("common.error"),
        description: "Failed to add payment method",
        variant: "destructive",
      });
    }
    setGeneratingPaymentLink(false);
  }

  const deletePaymentMethod = () => {
    setDeletePaymentMethodAlertOpen(true);
  };

    let gridRows: number = 5;

    if (isAgency) {
      if (role === 'ADMIN') {
        gridRows = 5;
      } else if (role === 'EDITOR') {
        gridRows = 2;
      } else {
        gridRows = 1;
      }
    } else {
      if (role === 'ADMIN') {
        gridRows = isPro ? 4 : 3;
      } else if (role === 'EDITOR') {
        gridRows = 1;
      } else {
        gridRows = 1;
      }
    }



  console.log({isAgency, role, isPro, gridRows});

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Helmet>
        <title>EARO | Account</title>
      </Helmet>
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("account.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("account.subtitle")}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        key={isPro ? "pro" : "express"}
      >
        <TabsList
          className={`flex flex-row  justify-around w-full `}
        >
          {(
            <TabsTrigger value="profile" className=" min-w-[200px]">
              {t("account.tab_profile")} 
            </TabsTrigger>
          )}
          {isPro && role === "ADMIN" && (
            <TabsTrigger value="users" className=" min-w-[200px]">{t("account.tab_users")}</TabsTrigger>
          )}
          {isAgency && (role === 'ADMIN' || role === 'EDITOR') && (
            <TabsTrigger value="advertisers" className=" min-w-[200px]">
              {t("account.tab_advertisers")}
            </TabsTrigger>
          )}
          {
            role === 'ADMIN' && <TabsTrigger value="company" className=" min-w-[200px]">{t("account.tab_company")}</TabsTrigger>

          }
          {
            role === 'ADMIN' && <TabsTrigger value="billing" className=" min-w-[200px]">{t("account.tab_billing")}</TabsTrigger>
          }
          {/* <TabsTrigger value="tracking">
            {t("account.tab_tracking")}
          </TabsTrigger> */}

        </TabsList>

        {/* PROFILE TAB (Express only) */}
        {/* {!isPro && ( */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("account.personal_info")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("account.first_name")} <sup>*</sup></Label>
                      <Input
                        value={profile.firstName}
                        onChange={(e) => update("firstName", e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("account.last_name")} <sup>*</sup></Label>
                      <Input
                        value={profile.lastName}
                        onChange={(e) => update("lastName", e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("account.email")} <sup>*</sup></Label>
                    <Input value={profile.email} disabled />
                    <p className="text-xs text-muted-foreground">
                      {t("account.contact_support_email")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("account.phone")}</Label>
                    <Input
                      value={profile.phone}
                      type="tel"
                      onChange={(e) => update("phone", e.target.value.replace(/(?!^\+)[^0-9]/g, ""))}
                      placeholder="+971..."
                      maxLength={15}
                    />
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? t("common.saving") : t("common.save_changes")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("account.change_password")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={changePassword} className="space-y-4">
                  <div className="space-y-2 relative">
                    <Label>{t("account.new_password")}</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("account.password_placeholder")}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 relative ">
                    <Label>{t("account.confirm_password")}</Label>
                    <Input
                      type={showPasswordConfirm ? "text" : "password"}
                      value={passwordConfirm}
                      required
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder={t("account.password_placeholder")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button variant="outline" type="submit">
                    {t("account.update_password")}
                  </Button>
                </form>
              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle>{t("account.mfa_setup")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Switch checked={profile.mfaEnabled} onCheckedChange={(checked) => updateMFASetup(checked)} />
              </CardContent>
            </Card>

          </TabsContent>
        {/* // )} */}

        {/* USERS TAB (Pro only) */}
        {isPro && role === "ADMIN" && (
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
        )}

        {/* ADVERTISERS TAB (Pro Agency only) */}
        {isAgency && ( role === 'ADMIN' || role === 'EDITOR' ) && (
          <TabsContent value="advertisers" className="mt-4">
            <AdvertisersTab advertisers={advertisers} createAdvertiser={createAdvertiser} updateAdvertiser={updateAdvertiser} />
          </TabsContent>
        )}

        {/* COMPANY TAB */}
        {
          role === 'ADMIN' && (
          <TabsContent value="company" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("account.company_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={saveCompanyDetails} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("account.company_name")}</Label>
                  <Input
                    value={organizationDetails?.orgName ?? ""}
                    onChange={(e) => setOrganizationDetails({...organizationDetails, orgName: e.target.value})}
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("account.company_type")}</Label>
                  <Input
                    value={organizationDetails?.orgType ?? ""}
                    placeholder="Company Type"
                    readOnly
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("account.industry")}</Label>
                  <Select
                    value={industry}
                    onValueChange={(v) => {
                      setIndustry(v);
                      setSubIndustry(INDUSTRY_CATEGORIES[v] && INDUSTRY_CATEGORIES[v].industries ? INDUSTRY_CATEGORIES[v].industries : "" );
                      setOrganizationDetails({
                        ...organizationDetails!,
                        industry: v,
                        subIndustry: INDUSTRY_CATEGORIES[v] && INDUSTRY_CATEGORIES[v].industries ? INDUSTRY_CATEGORIES[v].industries : "",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("account.select_industry")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(INDUSTRY_CATEGORIES) as [IndustryCategoryKey, (typeof INDUSTRY_CATEGORIES)[IndustryCategoryKey]][]).map(
                        ([key, cat]) => (
                          <SelectItem key={key} value={key}>
                            {cat.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sub-industry</Label>
                  <Select
                    value={
                      subIndustry
                    }
                    onValueChange={(v) => {
                      setSubIndustry(v);
                      setOrganizationDetails({
                        ...organizationDetails!,
                        subIndustry: v,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-industry" />
                    </SelectTrigger>
                    <SelectContent>
                      { INDUSTRY_CATEGORIES[industry] ?   INDUSTRY_CATEGORIES[industry].industries?.map((sub:string) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t("account.affiliateCode")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={profile.affiliateCode}
                      disabled
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyReferralCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                </div>

                <div className="space-y-2">
                  <Label>{t("account.language")}</Label>
                  <Select
                    value={profile.language?.toLowerCase() ?? "en"}
                    onValueChange={(v) => update("language", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="tr">Turkish</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                      <SelectItem value="te">Telugu</SelectItem>
                      <SelectItem value="ml">Malayalam</SelectItem>
                      <SelectItem value="kn">Kannada</SelectItem>
                      <SelectItem value="gu">Gujarati</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                      <SelectItem value="pa">Punjabi</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                      <SelectItem value="fa">Persian</SelectItem>
                      <SelectItem value="th">Thai</SelectItem>
                      <SelectItem value="vi">Vietnamese</SelectItem>
                      <SelectItem value="id">Indonesian</SelectItem>
                      <SelectItem value="ms">Malay</SelectItem>
                      <SelectItem value="nl">Dutch</SelectItem>
                      <SelectItem value="pl">Polish</SelectItem>
                      <SelectItem value="uk">Ukrainian</SelectItem>
                      <SelectItem value="sv">Swedish</SelectItem>
                      <SelectItem value="da">Danish</SelectItem>
                      <SelectItem value="fi">Finnish</SelectItem>
                      <SelectItem value="no">Norwegian</SelectItem>
                      <SelectItem value="el">Greek</SelectItem>
                      <SelectItem value="he">Hebrew</SelectItem>
                      <SelectItem value="cs">Czech</SelectItem>
                      <SelectItem value="ro">Romanian</SelectItem>
                      <SelectItem value="hu">Hungarian</SelectItem>
                      <SelectItem value="sk">Slovak</SelectItem>
                      <SelectItem value="bg">Bulgarian</SelectItem>
                      <SelectItem value="hr">Croatian</SelectItem>
                      <SelectItem value="sr">Serbian</SelectItem>
                      <SelectItem value="sl">Slovenian</SelectItem>
                      <SelectItem value="et">Estonian</SelectItem>
                      <SelectItem value="lv">Latvian</SelectItem>
                      <SelectItem value="lt">Lithuanian</SelectItem>
                      <SelectItem value="sw">Swahili</SelectItem>
                      <SelectItem value="am">Amharic</SelectItem>
                      <SelectItem value="fil">Filipino</SelectItem>
                      <SelectItem value="ne">Nepali</SelectItem>
                      <SelectItem value="si">Sinhala</SelectItem>
                      <SelectItem value="my">Burmese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={country}
                    onValueChange={(v) => {
                      setCountry(v)
                      setOrganizationDetails({
                        ...organizationDetails!,
                        country: v,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("account.newsletter")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("account.newsletter_hint")}
                    </p>
                  </div>
                  <Switch
                    checked={profile.newsletterOpt}
                    onCheckedChange={(v) => update("newsletterOpt", v)}
                  />
                </div>

                {
                  (role === "ADMIN" || role === "EDITOR" ) && (
                    <Button type="submit" disabled={saving}>
                    {saving ? t("common.saving") : t("common.save_changes")}
                  </Button>
    
                  )
                }
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          )
        }
        {/* TRACKING TAB */}
        <TabsContent value="tracking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("account.conversion_tracking")}</CardTitle>
              <CardDescription>
                {t("account.conversion_tracking_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {t("account.no_conversion_events")}
                </p>
                <Button variant="outline" size="sm">
                  {t("account.create_pixel_event")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("account.pixels_hint")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BILLING TAB */}
        {
          role === 'ADMIN' && (
            <TabsContent value="billing" className="mt-4 space-y-4">
            <Tabs defaultValue="prepaid">
              {/* <TabsList
                className={`grid w-full ${isAgency ? "grid-cols-2" : "grid-cols-1"}`}
              >
                <TabsTrigger value="prepaid">{t("account.prepaid")}</TabsTrigger>
                {isAgency && (
                  <TabsTrigger value="postpaid">
                    {t("account.postpaid")}
                  </TabsTrigger>
                )}
              </TabsList> */}
  
              {/* PREPAID SUB-TAB */}
              <TabsContent value="prepaid" className="mt-4 space-y-4">
                <div className="hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          $1,240.00
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("account.spent_this_month")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          $2,500.00
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("account.paid_this_month")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
  
                <Card>
                  <CardHeader>
                    <CardTitle>{t("account.payment_methods")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {
                      cards.length > 0 ? (
                        cards.map((card) => (
                          <div key={card.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {card.last_4}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {card.type}
                                </p>
                              </div>
                              </div>
                              <span>
                                <Button variant="secondary" size="sm" onClick={deletePaymentMethod}>
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center rounded-lg border border-border p-3">
                          <button className="text-sm text-muted-foreground">
                            No payment methods found
                          </button>
                        </div>
                      )
                    }
                    
                    <Button variant="outline" size="sm" onClick={addPaymentMethod}>
                      {t("account.add_payment_method")}
                    </Button> 
                  </CardContent>
                </Card>
  
                <Card className="hidden">
                  <CardHeader>
                    <CardTitle>{t("account.coupons")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder={t("account.enter_coupon")} />
                      <Button variant="outline">{t("account.apply")}</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            WELCOME25
                          </p>
                          <p className="text-xs text-muted-foreground">
                            25% off — applied automatically
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        {t("account.active")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
  
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <div className="flex items-center justify-between">
                      {t("account.payment_history")}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 min-w-[180px] justify-between gap-2 font-normal"
                          >
                            <span className="truncate">{advertiserFilterLabel}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[260px] p-2">
                          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
                            <Checkbox
                              checked={allAdvertisersSelected}
                              onCheckedChange={(checked) => toggleAllAdvertisers(checked === true)}
                            />
                            <span className="text-sm">All Advertisers</span>
                          </label>
                          <div className="my-1 h-px bg-border" />
                          <div className="max-h-[240px] space-y-0.5 overflow-y-auto">
                            {advertisers.map((advertiser) => (
                              <label
                                key={advertiser.id}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-accent",
                                )}
                              >
                                <Checkbox
                                  checked={
                                    allAdvertisersSelected ||
                                    selectedAdvertisers.includes(advertiser.id)
                                  }
                                  onCheckedChange={(checked) =>
                                    toggleAdvertiser(advertiser.id, checked === true)
                                  }
                                />
                                <span className="truncate text-sm">{advertiser.advertiserName}</span>
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("account.date")}</TableHead>
                          <TableHead>{t("account.description")}</TableHead>
                          <TableHead>{t("account.amount")}</TableHead>
                          <TableHead>{t("account.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {
                          paymentHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                <p className="text-xs text-muted-foreground">
                                  No payment history found
                                </p>
                              </TableCell>
                            </TableRow>
                          ) : ( paymentHistory.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{row.createdAt}</TableCell>
                            <TableCell className="text-sm">{
                            
                            row.campaign?.campaignName ? <p>

                              <p>Campaign: {row.campaign.campaignName}</p>
                              <p>Period: {row.campaign.startDate} - {row.campaign.endDate}</p>
                              <p>Budget: ${row.campaign.totalBudget.toLocaleString()}</p>
                              <p>
                                Advertiser: {advertisers.find((advertiser) => advertiser.id === row.campaign?.advertiserId)?.advertiserName}
                              </p>

                            </p> : row.description
                            }</TableCell>
                            <TableCell className="text-sm font-medium">
                              ${row.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {row.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                            )
                          ))
                        }
                      </TableBody>
                    </Table>
                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        {paymentHistoryMeta.total > 0
                          ? `Showing ${(paymentHistoryMeta.page - 1) * paymentHistoryMeta.limit + 1}-${Math.min(
                              paymentHistoryMeta.page * paymentHistoryMeta.limit,
                              paymentHistoryMeta.total,
                            )} of ${paymentHistoryMeta.total}`
                          : paymentHistory.length > 0
                            ? `Showing ${paymentHistory.length}`
                            : "Showing 0"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={String(paymentHistoryLimit)}
                          onValueChange={(value) => setPaymentHistoryLimit(Number(value))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentHistoryPage((page) => Math.max(1, page - 1))}
                          disabled={loadingPaymentHistory || paymentHistoryPage <= 1}
                        >
                          Prev
                        </Button>
                        <div className="text-sm text-foreground px-2">
                          {paymentHistoryMeta.page} / {paymentHistoryMeta.totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPaymentHistoryPage((page) =>
                              Math.min(paymentHistoryMeta.totalPages, page + 1),
                            )
                          }
                          disabled={
                            loadingPaymentHistory || paymentHistoryPage >= paymentHistoryMeta.totalPages
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
  
              {/* POSTPAID SUB-TAB (Pro only) */}
              {/* {isAgency && (
                <TabsContent value="postpaid" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("account.credit_approval")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {t("account.credit_check_passed")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("account.approved_on")}
                          </p>
                        </div>
                        <Badge className="ml-auto bg-green-100 text-green-700 border-0">
                          {t("account.approved")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("account.approved_credit_limit")}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          $50,000
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("account.credit_usage")}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          $18,750
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("account.credit_utilization")}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          37.5%
                        </p>
                        <Progress value={37.5} className="mt-2 h-2" />
                      </CardContent>
                    </Card>
                  </div>
  
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("account.invoice_history")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("account.invoice")}</TableHead>
                            <TableHead>{t("account.date")}</TableHead>
                            <TableHead>{t("account.amount")}</TableHead>
                            <TableHead>{t("account.due_date")}</TableHead>
                            <TableHead>{t("account.status")}</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            {
                              inv: "INV-2026-003",
                              date: "Feb 01, 2026",
                              amount: "$8,250.00",
                              due: "Mar 03, 2026",
                              status: "Pending",
                            },
                            {
                              inv: "INV-2026-002",
                              date: "Jan 01, 2026",
                              amount: "$6,500.00",
                              due: "Jan 31, 2026",
                              status: "Paid",
                            },
                            {
                              inv: "INV-2025-012",
                              date: "Dec 01, 2025",
                              amount: "$4,000.00",
                              due: "Dec 31, 2025",
                              status: "Paid",
                            },
                          ].map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm font-medium text-primary">
                                {row.inv}
                              </TableCell>
                              <TableCell className="text-sm">
                                {row.date}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {row.amount}
                              </TableCell>
                              <TableCell className="text-sm">{row.due}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    row.status === "Paid"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {row.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )} */}
            </Tabs>
          </TabsContent>  
          )
        }
      </Tabs>

      <SetupMFAModal
        open={isMfaModalOpen}
        onOpenChange={(open) => setIsMfaModalOpen(open)}
        qrCode={qrCode}
        onVerify={verifyMFAComplete}
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

      <AlertDialog open={deletePaymentMethodAlertOpen} onOpenChange={setDeletePaymentMethodAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Please contact at help@earo.ai to delete your payment method
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
