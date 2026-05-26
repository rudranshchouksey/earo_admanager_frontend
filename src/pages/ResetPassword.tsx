import { useMemo, useState } from "react";
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/services/auth";
import { AuthPageBackground } from "@/components/dashboard/MockDashboardPreview";
import { Helmet } from "react-helmet-async";

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
    <AuthPageBackground>

      <Helmet>
        <title>EARO | Reset Password</title>
      </Helmet>

      <div className="w-full space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <img src="/og-image.png" alt="logo" className="h-10 w-auto" />
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {t("auth.reset_password_token_title")}
          </h2>
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
          <button
            type="button"
            className="text-primary font-medium hover:underline"
            onClick={() => navigate("/login")}
          >
            {t("auth.back_to_login")}
          </button>
        </p>
      </div>
    </AuthPageBackground>
  );
}

