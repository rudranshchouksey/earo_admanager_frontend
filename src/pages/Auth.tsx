import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { Eye, EyeOff, Loader2, Store, Users, Check } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { AuthSession } from "@/services/auth";
import { Headphones } from "lucide-react";
import spotifyLogo from "@/assets/logos/spotify.svg";
import anghamiLogo from "@/assets/logos/anghami.svg";
import mbcLogo from "@/assets/logos/mbc.svg";
import arnLogo from "@/assets/logos/arn.png";
import { cn } from "@/lib/utils";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { OtpModal } from "@/components/ui/otp-modal";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userOrgType, setUserOrgType] = useState("SME");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
  }>({});

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes
    const {
      data: { subscription },
    } = api.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      if (event === "SIGNED_IN" && nextSession?.user) {
        navigate("/dashboard");
      }
    });

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await api.auth.getSession();
        if (!isMounted) return;
        setSession(initialSession);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // clear the fields if user toggles between login and signup
  useEffect(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUserOrgType("SME");
  }, [step]);

  // Show loading state during initial auth check
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already signed in, don't bounce away from /login (prevents flicker/redirect loop).
  // Instead, show an explicit "Continue" / "Sign out" choice.
  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">
              {t("auth.already_signed_in")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.signed_in_as")}{" "}
              <span className="font-medium text-foreground">
                {session.user.email ?? t("auth.your_account")}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              {t("auth.continue")}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={async () => {
                await api.auth.signOut();
                setSession(null);
              }}
            >
              {t("auth.sign_out")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      const {credential} = credentialResponse;
      const { error } = await api.auth.signInWithGoogle(credential, userOrgType);
      if (error) {
        toast({
          title: t("common.error"),
          description: error.message  || "Something went wrong",
          variant: "destructive",
        });
      }else {

        navigate("/dashboard");
      }
    } catch (err) {
      toast({
        title: t("common.error"),
        description: t("auth.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const loginSchema = z.object({
      email: z.string().trim().email(t("auth.invalid_email")),
      password: z
        .string()
        .min(8, t("auth.password_min_length"))
        .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, t("auth.password_must_be_at_least_8_characters")),
    });

    const signupSchema = z
      .object({
        email: z.string().trim().email(t("auth.invalid_email")),
        password: z
          .string()
          .min(8, t("auth.password_min_length"))
          .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, t("auth.password_must_be_at_least_8_characters")),
        confirmPassword: z
          .string()
          .min(8, t("auth.password_min_length"))
          .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, t("auth.password_must_be_at_least_8_characters")),
        orgType: z.enum(["SME", "AGENCY"]),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t("auth.passwords_dont_match"),
        path: ["confirmPassword"],
      });

    const resetPasswordSchema = z.object({
      email: z.string().trim().email(t("auth.invalid_email")),
    });

    try {
      if (step === 'login') {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: typeof errors = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as keyof typeof errors] = err.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }

        setIsLoading(true);
        const { error } = await api.auth.signInWithPassword({
          email: email,
          password,
        });

        if (error) {
          if (error.message.includes("Email does not exist!")) {
            setErrors({
              email: t("auth.email_does_not_exist"),
            });
          } else if (error.message.includes("Invalid credentials!")) {
              setErrors({
                password: t("auth.invalid_credentials"),
              });
          } else  if(error.message.includes("Please verify your email")){
            toast({
              title: t("auth.login_failed"),
              description: "Please verify your email",
              variant: "destructive",
            });
          } else{
            toast({
              title: t("auth.login_failed"),
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        navigate("/dashboard");
      } else if(step === 'signup') {
        const result = signupSchema.safeParse({
          email,
          password,
          confirmPassword,
          orgType: userOrgType,
        });
        if (!result.success) {
          const fieldErrors: typeof errors = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as keyof typeof errors] = err.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }

        setIsLoading(true);

        const { error } = await api.auth.signUpWithPassword({
          email: email.trim(),
          password,
          confirmPassword,
          orgType: userOrgType,
        });

        if (error) {
          if (error.message.includes("Email already exists")) {
            setErrors({
              email: t("auth.email_already_exists"),
            });
          } else if (error.message.includes("Password must be")) {
            setErrors({
              password: t("auth.password_must_be_at_least_8_characters"),
            });
          } else {
            toast({
              title: t("auth.signup_failed"),
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

      } else {
        const result = resetPasswordSchema.safeParse({ email });
        if (!result.success) {
          const fieldErrors: typeof errors = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as keyof typeof errors] = err.message;
            }
          });
        }
        setIsLoading(true);
        const { error } = await api.resetPassword(email);
        if (error) {

          if(error.message.includes("Email does not exist")) {
            setErrors({
              email: t("auth.email_does_not_exist"),
            });
          } else {
            toast({
              title: t("auth.reset_password_failed"),
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        toast({
          title: t("auth.reset_password_sent"),
          description: t("auth.reset_password_sent_description"),
          variant: "default",
        });
        setEmail("");
      }
    } catch (err) {
      toast({
        title: t("common.error"),
        description: t("auth.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpComplete = async (otp: string) => {
    console.log('otp', otp);
    setErrors({});
    const { error } = await api.auth.verifySignupOtp(email, otp);
    if (error) {
      setErrors({
        otp: error.message,
      });
      return;
    }
    toast({
      title: t("auth.otp_verified"),
      description: t("auth.otp_verified_description"),
      variant: "default",
    });
    setStep('login');
    setIsOtpModalOpen(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-white/5 translate-x-1/4 translate-y-1/4" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Headphones className="h-6 w-6 text-white" />
              <span className="text-xl font-bold text-white">{t("auth.brand_name")}</span>
            </Link>
          </div>

          {/* Headline */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight">
                {t("auth.audio_advertising")}
              </h1>
              <p className="text-2xl font-semibold text-white/80">
                {t("auth.made_simple")}
              </p>
            </div>
            <p className="text-lg text-white/70 max-w-md">
              {t("auth.tagline_1")}
              <br />
              {t("auth.tagline_2")}
            </p>

            {/* Partner logos */}
            <div className="flex items-center gap-6 pt-4">
              <img src={spotifyLogo} alt="Spotify" className="h-6 opacity-80" />
              <img
                src={anghamiLogo}
                alt="Anghami"
                className="h-5 opacity-80 invert"
              />
              <img src={mbcLogo} alt="MBC" className="h-6 opacity-80 invert" />
              <img src={arnLogo} alt="ARN" className="h-6 opacity-80 invert" />
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/50 text-sm">
            {t("auth.footer_copyright")}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-background">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <Headphones className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">{t("auth.brand_name")}</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              {step === 'login' ? t("auth.welcome_back") : step === 'signup' ? t("auth.create_account") : t("auth.reset_password")}
            </h2>
            <p className="text-muted-foreground">
              {step === 'login' ? t("auth.login_details") : step === 'signup' ? t("auth.details_to_start") : t("auth.reset_password_details")}
            </p>
          </div>

          {/* Social login */}
          {step === 'login' || step === 'signup' && (
            <>
              <div className="space-y-3">
                <GoogleOAuthProvider clientId="182678201673-5tm3q5bqpq0e4mkg3eovuiqtorfuc5gb.apps.googleusercontent.com">
                  <GoogleLogin  
                    onSuccess={handleGoogleLogin}
                    onError={() => console.log('Login Failed')}
                    shape="square"
                  />
                </GoogleOAuthProvider>
              </div>
              {/* Divider */}
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
                  {t("common.or")}
                </span>
              </div>            
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">
                {t("auth.email_label")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {(step === 'login' || step === 'signup') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  {t("auth.password_label")} <span className="text-destructive">*</span>
                </Label>
                {step === 'login' && (
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      setStep('reset-password');
                    ``}}
                  >
                    {t("auth.forgot_password")}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password_placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={
                    errors.password ? "border-destructive pr-10" : "pr-10"
                  }
                  disabled={isLoading}
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
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            )}

            {step === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("auth.confirm_password_label")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.confirm_password_placeholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={
                      errors.confirmPassword
                        ? "border-destructive pr-10"
                        : "pr-10"
                    }
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {step === 'signup' && (
              <div className="space-y-3">
                <Label>
                  {t("auth.i_am")} <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => !isLoading && setUserOrgType("SME")}
                    disabled={isLoading}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200",
                      "hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      userOrgType === "SME"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        userOrgType === "SME" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                      )}
                    >
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="w-full space-y-0.5">
                      <span className="block font-semibold text-foreground">{t("auth.role_sme")}</span>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {t("auth.role_sme_desc")}
                      </p>
                    </div>
                    {userOrgType === "SME" && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => !isLoading && setUserOrgType("AGENCY")}
                    disabled={isLoading}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200",
                      "hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      userOrgType === "AGENCY"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        userOrgType === "AGENCY" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                      )}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="w-full space-y-0.5">
                      <span className="block font-semibold text-foreground">{t("auth.role_agency")}</span>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {t("auth.role_agency_desc")}
                      </p>
                    </div>
                    {userOrgType === "AGENCY" && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {step === 'login' ? t("auth.logging_in") : step === 'signup' ? t("auth.creating_account") : t("auth.resetting_password")}
                </>
              ) : step === 'login' ? (
                t("auth.log_in")
              ) : step === 'signup' ? (
                t("auth.sign_up")
              ) : (
                t("auth.reset_password")
              )}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-muted-foreground">
            {step === 'login' ? t("auth.no_account") : t("auth.has_account")}
            <button
              type="button"
              onClick={() => {
                setStep(step === 'login' ? 'signup' : 'login');
                setErrors({});
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-primary font-medium hover:underline"
            >
              {step === 'login' ? t("auth.sign_up_now") : t("auth.log_in")}
            </button>
          </p>

          {/* Privacy policy */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            {t("auth.privacy_intro")}{" "}
            <a href="#" className="text-primary hover:underline">
              {t("auth.privacy_policy")}
            </a>
            .
          </p>
        </div>
      </div>
      <OtpModal
        open={isOtpModalOpen}
        onOpenChange={setIsOtpModalOpen}
        onComplete={handleOtpComplete}
        length={6}
        sentToEmail={true}
        errorMessage={errors.otp}
      />
    </div>
  );
}
