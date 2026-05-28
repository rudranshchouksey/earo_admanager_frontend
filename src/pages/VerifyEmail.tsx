import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { campaignApi } from "@/services/campaign";
import { auth } from "@/services/auth";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setverifying] = useState(false);
  const [verified, setverified] = useState(false);
  const [error, seterror] = useState<string | null>(null);

  const params = useEffect(() => {
    const getParams = () => {
      const token = searchParams.get("token") ?? "";
      return { token };
    }
    const veirfyEmailWithToken = async () => {
      setverifying(true);
      const {token} = getParams();
      const {data, error, status, message} = await auth.verifyEmailWithToken(token);
      console.log("verifyEmailWithToken", {data, error, status, message});
      if(error || status !== 200) {
        toast({
          title: "Verification failed",
          description: data?.data?.message || "Failed to verify email",
          variant: "destructive",
        });
        setverified(false);
        seterror(data?.data?.message || "Failed to verify email");
      }
      setverifying(false);
      setverified(true);
    }
    veirfyEmailWithToken();

  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Helmet>
        <title>EARO | Verify Email </title>
      </Helmet>
      {
        verifying ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : verified ? (
          <Card className="w-full max-w-md text-center shadow-sm">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
            </div>
            <CardTitle className="text-xl">Email verified successfully</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Your email has been verified successfully. You can now login to your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-6">
            <Button className="min-w-[200px]" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>

        ): (
          <Card className="w-full max-w-md text-center shadow-sm">
            <CardHeader className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" aria-hidden />
              </div>
              <CardTitle className="text-xl">Email verification failed</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Your email verification failed. Please try again.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      }

    </div>
  );
}
