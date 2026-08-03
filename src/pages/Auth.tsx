import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { Eye, EyeOff, Loader2, Store, Users, Check } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { auth, createSessionAndNotify, handleLandingPageAudioAdDownload } from "@/services/auth";
import { request } from "@/services/api";
import type { AuthSession } from "@/services/auth";
import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GoogleOAuthProvider,
  GoogleLogin,
  CredentialResponse,
} from "@react-oauth/google";
import { OtpModal } from "@/components/auth/otp-modal";
import { MfaSelector } from "@/components/auth/mfa-selector";
import { userApi } from "@/services/user";
import { AuthPageBackground } from "@/components/dashboard/MockDashboardPreview";
import { Helmet } from "react-helmet-async";
import { logger } from "@/lib/logger";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const register = searchParams.get("register");


  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [showMfaSelector, setShowMfaSelector] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  // const [userOrgType, setUserOrgType] = useState("SME");
  const [userId, setuserId] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
  }>({});

  useEffect(() => {
    if (register === "true") {
      setStep("signup");
    }
  }, [register]);
  
  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange((event, nextSession) => {
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
        } = await auth.getSession();
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
    // setUserOrgType("SME");
  }, [step]);

  // Show loading state during initial auth check
  if (isInitializing) {
    return (
      <AuthPageBackground>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AuthPageBackground>
    );
  }

  // If already signed in, don't bounce away from /login (prevents flicker/redirect loop).
  // Instead, show an explicit "Continue" / "Sign out" choice.
  if (session?.user) {
    return (
      <AuthPageBackground>
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 id="auth-dialog-title" className="text-xl font-semibold text-foreground">
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
                await auth.signOut();
                setSession(null);
              }}
            >
              {t("auth.sign_out")}
            </Button>
          </div>
        </div>
      </AuthPageBackground>
    );
  }

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {


      const url = new URL(window.location.href);
      const jobId = url.searchParams.get("jobid");
      const recommendedVersion = url.searchParams.get("recommendedVersion");


      
      const { credential } = credentialResponse;
      const { error, status, message, data } = await auth.signInWithGoogle(credential, jobId, recommendedVersion);

      if (error || status !== 200) {
        logger.error("Google login error", { status, error, message, data });
        logger.captureException(error, { context: 'Google login error:' });
        if (status === 400 && data?.mfaEnabled) {
          setuserId(data?.id);
          setMfaToken(data?.mfaToken);
          setShowMfaSelector(true);
          return;
        }

        toast({
          title: t("common.error"),
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      } else {
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


    const url = new URL(window.location.href);
    const jobId = url.searchParams.get("jobid");
    const recommendedVersion = url.searchParams.get("recommendedVersion");

    logger.info("jobId ", { value: jobId });
    logger.info("recommendedVersion ", { value: recommendedVersion });

    const loginSchema = z.object({
      email: z.string().trim().email(t("auth.invalid_email")),
      password: z
        .string()
        .min(8, t("auth.password_min_length"))
        .regex(
          /^(?=.*[A-Za-z])(?=.*\d).+$/,
          t("auth.password_must_be_at_least_8_characters"),
        ),
    });

    const signupSchema = z
      .object({
        email: z.string().trim().email(t("auth.invalid_email")),
        password: z
          .string()
          .max(64, t("auth.password_max_length"))
          .min(8, t("auth.password_min_length"))          
          .regex(
            /^(?=.*[A-Za-z])(?=.*\d).+$/,
            t("auth.password_must_be_at_least_8_characters"),
          ),
        confirmPassword: z
          .string()
          .max(64, t("auth.password_max_length"))
          .min(8, t("auth.password_min_length"))
          .regex(
            /^(?=.*[A-Za-z])(?=.*\d).+$/,
            t("auth.password_must_be_at_least_8_characters"),
          ),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t("auth.passwords_dont_match"),
        path: ["confirmPassword"],
      });

    const resetPasswordSchema = z.object({
      email: z.string().trim().email(t("auth.invalid_email")),
    });

    try {
      if (step === "login") {
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
        const { error, status, message, data } = await auth.signInWithPassword(
          email,
          password,
        );

        if (status !== 200) {
          logger.error("Login error", { status, error, message, data });
          logger.captureException(error, { context: 'Login error:' });
          if (status === 400 && data?.mfaRequired) {
            setuserId(data.data?.id);
            setMfaToken(data.data?.mfaToken);
            setShowMfaSelector(true);
            return;
          }

          if (message.includes("Email does not exist!")) {
            setErrors({
              email: t("auth.email_does_not_exist"),
            });
          } else if (message.includes("Invalid credentials!")) {
            setErrors({
              password: t("auth.invalid_credentials"),
            });
          } else if (message.includes("Please verify your email")) {
            toast({
              title: t("auth.login_failed"),
              description: "Please verify your email",
              variant: "destructive",
            });
          } else {
            toast({
              title: t("auth.login_failed"),
              description: message,
              variant: "destructive",
            });
          }
          return;
        }

        navigate("/dashboard");
      } else if (step === "signup") {
        const result = signupSchema.safeParse({
          email,
          password,
          confirmPassword,
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

        const { data, error, status, message } = await auth.signUpWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          confirmPassword: confirmPassword.trim(),
          jobId: jobId,
          recommendedVersion: recommendedVersion,
        });

        if (status !== 200) {
          if (message.includes("Email already exists")) {
            setErrors({
              email: t("auth.email_already_exists"),
            });
          } else if (message.includes("Password must be")) {
            setErrors({
              password: t("auth.password_must_be_at_least_8_characters"),
            });
          } else {
            toast({
              title: t("auth.signup_failed"),
              description: message,
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
        const { error, status, message } = await auth.forgotPassword(email);
        if (status !== 200) {
          if (message.includes("Email does not exist")) {
            setErrors({
              email: t("auth.email_does_not_exist"),
            });
          } else {
            toast({
              title: t("auth.reset_password_failed"),
              description: message,
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

  const handleMfaComplete = async (code: string) => {
    const { error, status, message, data } = await userApi.verify2fa(userId, code, mfaToken);
    
    if (error || status !== 200) {
      logger.error("MFA verification error", { status, error, message, data });
      logger.captureException(error, { context: 'MFA verification error:' });
      toast({
        title: t("common.error"),
        description: message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("common.success"),
      description: message,
      variant: "default",
    });

    createSessionAndNotify(data);
    setShowMfaSelector(false);
    navigate("/dashboard");
    logger.info("navigating to dashboard");
  }

  return (
    <AuthPageBackground>
        <Helmet>
          <title>EARO | Join</title>
        </Helmet>

        <div className="w-full space-y-6">
          <Link to="/" className="flex items-center justify-center gap-2">
            <img src="/og-image.png" alt="logo" className="h-10 w-auto" />
          </Link>

          {/* Header */}
          <div className="text-center space-y-2">
            <h2 id="auth-dialog-title" className="text-2xl font-bold text-foreground">
              {step === "login"
                ? t("auth.welcome_back")
                : step === "signup"
                  ? t("auth.create_account")
                  : t("auth.reset_password")}
            </h2>
            <p className="text-muted-foreground">
              {step === "login"
                ? t("auth.login_details")
                : step === "signup"
                  ? t("auth.details_to_start")
                  : t("auth.reset_password_details")}
            </p>
          </div>

          {/* Social login */}
          {(step === "login" || step === "signup") && (
            <>
              <div className="space-y-3">
                <GoogleOAuthProvider clientId="1085309377183-aclhjrmig48tsqgpecmv84tj4fgbv0jc.apps.googleusercontent.com">
                <div className="[&>div]:w-full [&_iframe]:w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => logger.info("Login Failed")}
                    shape="square"                    
                    width="400"
                  />
                </div>
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

            {(step === "login" || step === "signup") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {t("auth.password_label")}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  {step === "login" && (
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => {
                        setStep("reset-password");
                        ``;
                      }}
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
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {step === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("auth.confirm_password_label")}{" "}
                  <span className="text-destructive">*</span>
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
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
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

            {/* {step === "signup" && (
              <div className="hidden space-y-3">
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
                        : "border-border bg-card",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        userOrgType === "SME"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary",
                      )}
                    >
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="w-full space-y-0.5">
                      <span className="block font-semibold text-foreground">
                        {t("auth.role_sme")}
                      </span>
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
                        : "border-border bg-card",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        userOrgType === "AGENCY"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary",
                      )}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="w-full space-y-0.5">
                      <span className="block font-semibold text-foreground">
                        {t("auth.role_agency")}
                      </span>
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
            )} */}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {step === "login"
                    ? t("auth.logging_in")
                    : step === "signup"
                      ? t("auth.creating_account")
                      : t("auth.resetting_password")}
                </>
              ) : step === "login" ? (
                t("auth.log_in")
              ) : step === "signup" ? (
                t("auth.sign_up")
              ) : (
                t("auth.reset_password")
              )}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-muted-foreground">
            {step === "login" ? t("auth.no_account") : t("auth.has_account")}
            <button
              type="button"
              onClick={() => {
                setStep(step === "login" ? "signup" : "login");
                setErrors({});
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-primary font-medium hover:underline"
            >
              {step === "login" ? t("auth.sign_up_now") : t("auth.log_in")}
            </button>
          </p>

          {/* Privacy policy */}
          <p className="text-center text-xs text-muted-foreground pt-4">
            {t("auth.privacy_intro")}{" "}
            <a href="https://earo.ai/privacy" className="text-primary hover:underline">
              {t("auth.privacy_policy")}
            </a>
            .
          </p>
        </div>

      <MfaSelector
        open={showMfaSelector}
        onOpenChange={(open) => setShowMfaSelector(open)}
        email={email}
        onVerifyEmail={(otp) => auth.verifyEmailVerificationOtp2fa(userId, mfaToken, otp)}
        onResendEmail={() => auth.sendEmailVerificationOtp2fa(userId, mfaToken)}
        onVerifyAuthenticator={handleMfaComplete}
        authDefaultScreen="verify"
      />
    </AuthPageBackground>
  );
}
