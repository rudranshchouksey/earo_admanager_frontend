import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState("ACCOUNT_ADMIN");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const loginSchema = z.object({
      email: z.string().trim().email(t("auth.invalid_email")),
      password: z.string().min(6, t("auth.password_min_length")),
    });

    const signupSchema = z
      .object({
        email: z.string().trim().email(t("auth.invalid_email")),
        password: z.string().min(8, t("auth.password_min_length")),
        confirmPassword: z.string().min(8, t("auth.password_min_length")),
        role: z.enum(["ACCOUNT_ADMIN", "ORG_ADMIN"]),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: t("auth.passwords_dont_match"),
        path: ["confirmPassword"],
      });

    try {
      if (isLogin) {
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
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: t("auth.login_failed"),
              description: t("auth.invalid_credentials"),
              variant: "destructive",
            });
          } else {
            toast({
              title: t("auth.login_failed"),
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }

        navigate("/dashboard");
      } else {
        const result = signupSchema.safeParse({
          email,
          password,
          confirmPassword,
          role: userRole,
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
          role: userRole,
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: t("auth.account_exists"),
              description: t("auth.account_exists_desc"),
              variant: "destructive",
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

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await api.auth.signInWithPassword({
        email: "demo@example.com",
        password: "demo123456",
      });

      if (error) {
        toast({
          title: t("auth.demo_login_failed"),
          description: t("auth.demo_not_available"),
          variant: "destructive",
        });
        return;
      }

      navigate("/dashboard");
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
              {isLogin ? t("auth.welcome_back") : t("auth.create_account")}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? t("auth.login_details") : t("auth.details_to_start")}
            </p>
          </div>

          {/* Social login */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              {t("auth.continue_demo")}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
              {t("common.or")}
            </span>
          </div>

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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  {t("auth.password_label")} <span className="text-destructive">*</span>
                </Label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => {}}
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

            {!isLogin && (
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

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="userRole">
                  I am <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Select
                    value={userRole}
                    onValueChange={(value) => setUserRole(value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("auth.select_user_role")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCOUNT_ADMIN">SME</SelectItem>
                      <SelectItem value="ORG_ADMIN">Agency</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {isLogin ? t("auth.logging_in") : t("auth.creating_account")}
                </>
              ) : isLogin ? (
                t("auth.log_in")
              ) : (
                t("auth.sign_up")
              )}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? t("auth.no_account") : t("auth.has_account")}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? t("auth.sign_up_now") : t("auth.log_in")}
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
    </div>
  );
}
