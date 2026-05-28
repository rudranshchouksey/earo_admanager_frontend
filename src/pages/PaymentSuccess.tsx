import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { campaignApi } from "@/services/campaign";
import { Helmet } from "react-helmet-async";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const params = useEffect(() => {
    const getParams = () => {
      const campaignId = searchParams.get("campaignId") ?? "";
      const chargeUID = searchParams.get("chargeUID") ?? "";
      const paymentLinkId = searchParams.get("paymentLinkId") ?? "";
      return { campaignId, chargeUID, paymentLinkId };
    }
    const activateCampaign = async () => {
      const {chargeUID, paymentLinkId} = getParams();
      const {data, error, status, message} = await campaignApi.activateCampaign(chargeUID, paymentLinkId);
      if(status === 200 && data) {
        return {
          campaignId: data.id,
          status: data.status,
        };
      }
    }
    activateCampaign();

  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Helmet>
        <title>EARO | Payment Sucess </title>
      </Helmet>
      <Card className="w-full max-w-md text-center shadow-sm">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-xl">Payment successful</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Your payment was successful. Your campaign will launch soon.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pb-6">
          <Button className="min-w-[200px]" onClick={() => navigate("/dashboard/campaigns")}>
            Go to Campaigns
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
