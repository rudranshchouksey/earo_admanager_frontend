import { useEffect, useState } from "react";
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
} from "lucide-react";
import { auth } from "@/services/auth";
import { userApi, UserProfile } from "@/services/user";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/TranslationContext";
import { useSessionFlags } from "@/hooks/useSessionFlags";
import UsersTab from "@/components/dashboard/account/UsersTab";
import AdvertisersTab from "@/components/dashboard/account/AdvertisersTab";
import { advertiserApi } from "@/services/advertiser";
import { SetupMFAModal } from "@/components/auth/mfa-modal";
import { organizationApi, OrganizationDetails, OrganizationDetailsResponse, OrganizationIndustry } from "@/services/organization";


const industries = Object.values(OrganizationIndustry).map(i => i.toString());

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
  });
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);

  const [qrCode, setQrCode] = useState("");


  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await auth.getSession();
      if (!session) return;

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
      console.log({ session });

      if (userProfile && userProfile.data) {
        setProfile((p) => ({
          ...p,
          ...userProfile.data,
        }));
      }

      const organizationId = session?.currentOrganizationId;

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
    };
    load();
  }, []);

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
        status: "ACTIVE",
        role: "ADMIN",
        orgId: session.user.app_metadata?.organizations[0]?.orgId,
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
      setIsMfaModalOpen(true);
    }else {
      // disable mfa 
    }

  }


  const verifyMFAComplete = (type: string, value: { error: Error | null, status: number, message: string, data: any }) => {
    if (value.error || value.status !== 200) {
      toast({
        title: t("common.error"),
        description: value.message || "Failed to verify " + type,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("common.success"),
      description: type + " verified successfully",
      variant: "default",
    });
    setIsMfaModalOpen(false);
    if(type === "MFA")
      setProfile((p) => ({ ...p, mfaEnabled: true }));
  }

  const update = (field: keyof UserProfile, value: any) =>
    setProfile((p) => ({ ...p, [field]: value }));

  const { isPro, isAgency } = useSessionFlags();
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("account.title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("account.subtitle")}</p>
      </div>

      <Tabs
        defaultValue={isPro ? "users" : "profile"}
        key={isPro ? "pro" : "express"}
      >
        <TabsList
          className={`grid w-full ${isAgency ? "grid-cols-5" : isPro ? "grid-cols-4" : "grid-cols-4"}`}
        >
          {!isPro && (
            <TabsTrigger value="profile">
              {t("account.tab_profile")}
            </TabsTrigger>
          )}
          {isPro && (
            <TabsTrigger value="users">{t("account.tab_users")}</TabsTrigger>
          )}
          {isAgency && (
            <TabsTrigger value="advertisers">
              {t("account.tab_advertisers")}
            </TabsTrigger>
          )}
          <TabsTrigger value="company">{t("account.tab_company")}</TabsTrigger>
          <TabsTrigger value="tracking">
            {t("account.tab_tracking")}
          </TabsTrigger>
          <TabsTrigger value="billing">{t("account.tab_billing")}</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB (Express only) */}
        {!isPro && (
          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("account.personal_info")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("account.first_name")}</Label>
                      <Input
                        value={profile.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("account.last_name")}</Label>
                      <Input
                        value={profile.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("account.email")}</Label>
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
                      required
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+971..."
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
        )}

        {/* USERS TAB (Pro only) */}
        {isPro && (
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
        )}

        {/* ADVERTISERS TAB (Pro Agency only) */}
        {isAgency && (
          <TabsContent value="advertisers" className="mt-4">
            <AdvertisersTab />
          </TabsContent>
        )}

        {/* COMPANY TAB */}
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
                <Select
                  value={organizationDetails?.orgType ?? ""}
                  onValueChange={(v) => setOrganizationDetails({...organizationDetails, orgType: v as "SME" | "AGENCY"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SME">
                      {t("account.company_type_sme")}
                    </SelectItem>
                    <SelectItem value="AGENCY">
                      {t("account.company_type_agency")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("account.industry")}</Label>
                <Select
                  value={organizationDetails?.industry ?? ""}
                  onValueChange={(v) => setOrganizationDetails({...organizationDetails, industry: v as "RETAIL" | "FOOD_AND_BEVERAGE" | "TECHNOLOGY" | "HEALTHCARE" | "EDUCATION" | "REAL_ESTATE" | "AUTOMOTIVE" | "FASHION" | "FINANCE" | "TRAVEL" | "ENTERTAINMENT" | "OTHER"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("account.select_industry")} />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
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
                <p className="text-xs text-muted-foreground">
                  {t("account.affiliateCode_hint")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("account.language")}</Label>
                <Select
                  value={profile.language}
                  onValueChange={(v) => update("language", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">
                      {t("layout.language_en")}
                    </SelectItem>
                    <SelectItem value="ar">
                      {t("layout.language_ar")}
                    </SelectItem>
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

              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("common.save_changes")}
              </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

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
        <TabsContent value="billing" className="mt-4 space-y-4">
          <Tabs defaultValue="prepaid">
            <TabsList
              className={`grid w-full ${isAgency ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <TabsTrigger value="prepaid">{t("account.prepaid")}</TabsTrigger>
              {isAgency && (
                <TabsTrigger value="postpaid">
                  {t("account.postpaid")}
                </TabsTrigger>
              )}
            </TabsList>

            {/* PREPAID SUB-TAB */}
            <TabsContent value="prepaid" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Visa •••• 4242
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires 08/27
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{t("account.default")}</Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    {t("account.add_payment_method")}
                  </Button>
                </CardContent>
              </Card>

              <Card>
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
                  <CardTitle>{t("account.payment_history")}</CardTitle>
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
                      {[
                        {
                          date: "Feb 12, 2026",
                          desc: "Campaign top-up",
                          amount: "$500.00",
                          status: "Paid",
                        },
                        {
                          date: "Feb 01, 2026",
                          desc: "Campaign top-up",
                          amount: "$2,000.00",
                          status: "Paid",
                        },
                        {
                          date: "Jan 15, 2026",
                          desc: "Campaign top-up",
                          amount: "$750.00",
                          status: "Paid",
                        },
                        {
                          date: "Jan 02, 2026",
                          desc: "Coupon credit",
                          amount: "-$200.00",
                          status: "Applied",
                        },
                      ].map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{row.date}</TableCell>
                          <TableCell className="text-sm">{row.desc}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {row.amount}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* POSTPAID SUB-TAB (Pro only) */}
            {isAgency && (
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
            )}
          </Tabs>
        </TabsContent>
      </Tabs>

      <SetupMFAModal
        open={isMfaModalOpen}
        onOpenChange={(open) => setIsMfaModalOpen(open)}
        qrCode={qrCode}
        onComplete={verifyMFAComplete}
        onChange={(code) => console.log("mfa code", code)}
        userId={profile.id}
      />


    </div>
  );
}
