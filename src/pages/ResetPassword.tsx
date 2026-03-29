import { useMemo, useState } from "react";
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { Eye, EyeOff, Loader2, Headphones } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/services/auth";
import spotifyLogo from "@/assets/logos/spotify.svg";
import anghamiLogo from "@/assets/logos/anghami.svg";
import mbcLogo from "@/assets/logos/mbc.svg";
import arnLogo from "@/assets/logos/arn.png";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = useMemo(() => {
    return params.token ?? searchParams.get("token") ?? "";
  }, [params.token, searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    token?: string;
  }>({});

  const passwordSchema = z
    .string()
    .min(8, t("auth.password_min_length"))
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, t("auth.password_must_be_at_least_8_characters"));

  const resetSchema = z
    .object({
      password: passwordSchema,
      confirmPassword: passwordSchema,
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwords_dont_match"),
      path: ["confirmPassword"],
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ token: t("auth.reset_password_token_missing") });
      return;
    }

    const result = resetSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as keyof typeof errors] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { error, status, message } = await auth.resetPassword(token, password);
      if (status !== 200) {
        toast({
          title: t("auth.reset_password_failed"),
          description: message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("auth.reset_password_success"),
        description: t("auth.reset_password_success_desc"),
        variant: "default",
      });
      navigate("/login");
    } catch {
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
              <h1 className="text-4xl font-bold text-white leading-tight">{t("auth.audio_advertising")}</h1>
              <p className="text-2xl font-semibold text-white/80">{t("auth.made_simple")}</p>
            </div>
            <p className="text-lg text-white/70 max-w-md">
              {t("auth.tagline_1")}
              <br />
              {t("auth.tagline_2")}
            </p>

            {/* Partner logos */}
            <div className="flex items-center gap-6 pt-4">
              <img src={spotifyLogo} alt="Spotify" className="h-6 opacity-80" />
              <img src={anghamiLogo} alt="Anghami" className="h-5 opacity-80 invert" />
              <img src={mbcLogo} alt="MBC" className="h-6 opacity-80 invert" />
              <img src={arnLogo} alt="ARN" className="h-6 opacity-80 invert" />
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/50 text-sm">{t("auth.footer_copyright")}</div>
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
            <h2 className="text-3xl font-bold text-foreground">{t("auth.reset_password_token_title")}</h2>
            <p className="text-muted-foreground">{t("auth.reset_password_token_desc")}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.token && <p className="text-sm text-destructive">{errors.token}</p>}

            <div className="space-y-2">
              <Label htmlFor="password">
                {t("auth.password_label")} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.password_placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

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
                  className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.resetting_password")}
                </>
              ) : (
                t("auth.reset_password_token_button")
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground pt-2">
            <button type="button" className="text-primary font-medium hover:underline" onClick={() => navigate("/login")}>
              {t("auth.back_to_login")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

