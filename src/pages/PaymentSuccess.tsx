import { useEffect, useRef } from "react";
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
import { trackPurchase } from "@/lib/gtm";
import { getPlanFromSession } from "@/hooks/useSessionFlags";
import { Helmet } from "react-helmet-async";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Guard against React StrictMode double-invoking the effect (GA4 also dedupes on transaction_id).
  const purchaseTracked = useRef(false);

  useEffect(() => {
    const campaignId = searchParams.get("campaignId") ?? "";
    const chargeUID = searchParams.get("chargeUID") ?? "";
    const paymentLinkId = searchParams.get("paymentLinkId") ?? "";
    // Net (post-coupon) amount charged. Campaign_Service puts it in MamoPay custom_data,
    // which MamoPay echoes onto the return URL (same channel as campaignId).
    const amountParam = searchParams.get("amount");

    const activateCampaign = async () => {
      const { data, status } = await campaignApi.activateCampaign(chargeUID, paymentLinkId);
      if (status === 200 && data && !purchaseTracked.current) {
        purchaseTracked.current = true;

        const resolvedCampaignId = data.id || campaignId;
        const grossBudget = Number(data.totalBudget ?? data.budget ?? 0);
        // Prefer the net charged amount from the URL; fall back to gross budget if absent
        // (e.g. backend not yet deployed), so this never breaks or under-reports to 0.
        const netAmount = amountParam != null && amountParam !== "" ? Number(amountParam) : NaN;
        const value = Number.isFinite(netAmount) ? netAmount : grossBudget;
        const discount = Number.isFinite(netAmount) && grossBudget > netAmount ? grossBudget - netAmount : undefined;

        trackPurchase({
          transactionId: chargeUID || resolvedCampaignId,
          value,
          campaignId: resolvedCampaignId,
          campaignName: data.campaignName,
          paymentMethod: "card",
          plan: getPlanFromSession(),
          coupon: data.discountCoupon || undefined,
          discount,
        });
      }
    };
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
