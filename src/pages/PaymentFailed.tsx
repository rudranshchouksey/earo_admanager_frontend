import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaignId")?.trim() || undefined;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">

      <Helmet>
        <title>EARO | Payment Failed </title>
      </Helmet>

      <Card className="w-full max-w-md text-center shadow-sm">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" aria-hidden />
          </div>
          <CardTitle className="text-xl">Payment unsuccessful</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Something went wrong with your payment. Please try again or contact support if the
            problem continues.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col items-center gap-2 pb-6 sm:flex-row sm:justify-center">
          {campaignId ? (
            <Button
              className="min-w-[200px]"
              onClick={() => navigate(`/dashboard/campaigns/${campaignId}`)}
            >
              Return to campaign
            </Button>
          ) : null}
          <Button
            className="min-w-[200px]"
            variant="outline"
            onClick={() => navigate("/dashboard/campaigns")}
          >
            Go to Campaigns
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
