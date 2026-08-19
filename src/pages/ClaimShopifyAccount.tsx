import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/services/auth";
import { logger } from "@/lib/logger";

type ClaimStatus = "loading" | "success" | "error";

export default function ClaimShopifyAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ClaimStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const claimed = useRef(false);

  useEffect(() => {
    if (claimed.current) return;
    claimed.current = true;

    const claimAccount = async () => {
      const token = searchParams.get("token")?.trim() ?? "";

      if (!token) {
        setStatus("error");
        setErrorMessage("Missing claim token. Please use the link from your email.");
        return;
      }

      setStatus("loading");

      try {
        const { error, status: httpStatus, message, data } = await auth.claimShopifyAccountVerify(
          token,
        );

        if (error || httpStatus !== 200) {
          logger.warn("claimShopifyAccount verify failed", {
            httpStatus,
            message,
            error: error?.message,
          });
          setStatus("error");
          setErrorMessage(
            (data as { message?: string } | null)?.message ||
              message ||
              "Failed to claim Shopify account",
          );
          return;
        }

        setStatus("success");
      } catch (err) {
        logger.captureException(err, { context: "claimShopifyAccount" });
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    };

    claimAccount();
  }, [searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Helmet>
        <title>EARO | Claim Shopify Account</title>
      </Helmet>

      {status === "loading" ? (
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Claiming your Shopify account…</p>
        </div>
      ) : status === "success" ? (
        <Card className="w-full max-w-md text-center shadow-sm">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
            </div>
            <CardTitle className="text-xl">Account claimed successfully</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Your Shopify account has been claimed. Please check your email for the login details to access your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-6">
            <Button className="min-w-[200px]" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full max-w-md text-center shadow-sm">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" aria-hidden />
            </div>
            <CardTitle className="text-xl">Claim failed</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {errorMessage || "We could not claim your Shopify account. Please try again."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-6">
            <Button className="min-w-[200px]" variant="outline" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
