import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Wallet, Building2, TriangleAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Coupon, CreditDetails, walletApi } from "@/services/wallet";
import { SavedTransaction } from "@/services/campaign";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/services/payment";
import { logger } from "@/lib/logger";
import PaymentModal from "../launch/PaymentModal";
// import { supabase } from '@/integrations/supabase/client';

interface PaymentData {
  paymentMethod: string;
  couponCode: string;
  discountValue: number;
  discountType: string;
  remainingUsages: number;
  originalAmount: number;
  discountApplied: number;
  finalAmount: number;
  cardId: string | null;
  expiryDate: string | null;
}

interface Props {
  coupons: Coupon[];
  campaignStatus: string;
  campaignName: string;
  data: PaymentData;
  onChange: (data: PaymentData) => void;
  applyCoupon: (couponCode: string) => void;
  isApplyingCoupon: boolean;
  dailyBudget: number;
  durationDays: number;
  creditsDetails: CreditDetails;
  cards: Cards[];
  totalBudget: number;
  disabled: boolean;
  savedTransaction: SavedTransaction | null;
  saveDraftCampaign: (redirectToCampaigns: boolean) => Promise<{data: any, status: number}>;
}

interface Cards {
  id: string;
  cardId: string;
  last_4: string;
  cardHolderName: string;
  type: string;
  isPrimary?: boolean;
}

export default function CampaignPaymentStep({
  campaignStatus,
  coupons,
  creditsDetails,
  cards,
  campaignName,
  data,
  onChange,
  applyCoupon,
  isApplyingCoupon = false,
  dailyBudget,
  totalBudget,
  durationDays,
  disabled,
  savedTransaction,
  saveDraftCampaign,
}: Props) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(false);
  const [settingPrimaryCardId, setSettingPrimaryCardId] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState([]);
  const [paymentUrl, setPaymentUrl] = useState("");
  const campaignId = useRef<string | null>(null);

  const shouldDisable = disabled || !(campaignStatus === "" || campaignStatus?.toLowerCase() === "draft");

  const handleSelectCard = async (cardId: string) => {
    if (shouldDisable || settingPrimaryCardId) return;

    onChange({ ...data, cardId });

    if (!cardId) {
      void addPaymentMethod();
      return;
    }

    try {
      const { status, error, message } = await walletApi.setPrimaryCard(cardId);
      if (status !== 200 || error) {
        toast({
          title: "Could not set primary card",
          description: message || "Please try again",
          variant: "destructive",
        });
        return;
      }
      setSettingPrimaryCardId(cardId);

    } catch (err) {
      logger.captureException(err, { context: "Set primary card error:" });
      toast({
        title: "Could not set primary card",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSettingPrimaryCardId(null);
    }
  };

  const handleApplyCoupon = (existingCouponCode: string | null = null) => {


    if(existingCouponCode) {

      if(data.couponCode === existingCouponCode) {
        toast({
          title: "Coupon already applied",
          description: "You have already applied this coupon code.",
          variant: "destructive",
        })
        return;
      }

      applyCoupon(existingCouponCode);
      return;
    }



    if(couponCode.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      })
      return;
    }

    if(data.couponCode == couponCode) {
      toast({
        title: "Coupon already applied",
        description: "You have already applied this coupon code.",
        variant: "destructive",
      })
      setCouponCode("");
      return;
    }

    applyCoupon(couponCode);
    setCouponCode("");
  };


  useEffect(() => {
    const checkPreviousPayment = async () => {
      try {
        // const { data: session } = await supabase.auth.getSession();
        // if (!session.session) {
        //   setLoading(false);
        //   return;
        // }
        // const { data: payments } = await supabase
        //   .from('payments')
        //   .select('payment_method, created_at')
        //   .eq('user_id', session.session.user.id)
        //   .eq('status', 'paid')
        //   .order('created_at', { ascending: false })
        //   .limit(1);
        // if (payments && payments.length > 0) {
        //   setSavedCard({ last4: '4242', brand: 'Visa', expiry: '12/28' });
        //   setIsNewUser(false);
        // }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };
    checkPreviousPayment();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  const addPaymentMethod = async () => {
    setGeneratingPaymentLink(true);

    const {data: saveDraftCampaignData, status: saveDraftCampaignStatus} = await saveDraftCampaign(false);
    if(saveDraftCampaignStatus !== 200) {
      toast({
        title: "Error",
        description: "Failed to save draft campaign",
        variant: "destructive",
      });
      setGeneratingPaymentLink(false);
      return;
    }
    console.log({saveDraftCampaignData});
    campaignId.current = saveDraftCampaignData?.data?.id;
    const { data, error, status } = await paymentApi.addCard(saveDraftCampaignData?.data?.id);
    if (error || status !== 200) {
      logger.captureException(error, { context: 'Add payment method card error:' });
      setGeneratingPaymentLink(false);
      return;
    }

    if(data?.data?.payment_url){
      setPaymentUrl(data.data.payment_url);
    } else {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive",
      });
    }
    setGeneratingPaymentLink(false);
  }

  const finalAmountAfterCoupon = (creditsDetails.availableCredit - (data?.couponCode ? data.finalAmount : totalBudget));


  return (
    <div className="space-y-6">


      {cards && cards.length > 0 ? (
        <div className={`space-y-3 mb-5 ${creditsDetails.availableCredit > totalBudget ? 'hidden opacity-50 cursor-not-allowed' : ''}`}>
          <Label>Available Cards</Label>
          {cards?.map((card) => (
            <div key={card.id} className="flex items-center gap-2 w-full">
              <div className={`flex items-center gap-3 p-3 rounded-lg border border-[#C8E6C9] ${ data?.cardId === card.cardId ? 'bg-[#E6F4EA]' : 'bg-background' } w-full`}>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{card.last_4}</p>
                    {(data?.cardId ? data.cardId === card.cardId : card.isPrimary) ? (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-medium uppercase tracking-wide">
                        Primary Card
                      </span>
                    ) : <span className="text-xs text-muted-foreground cursor-pointer text-primary" onClick={() => void handleSelectCard(card.cardId)}>Make this primary</span>}
                    </div>
                  <p className="text-xs text-muted-foreground">
                    {card.type}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 w-full justify-start">
            <Button variant="outline" className="min-w-32" size="sm" onClick={addPaymentMethod}>
              Add New Card
            </Button> 
          </div>


        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-3 border border-border rounded-lg mb-3 gap-2">
          <p className="text-xs font-medium">You don't have any cards saved</p>
          <Button variant="outline" className="min-w-32" size="sm" onClick={addPaymentMethod}>
            Add card
          </Button> 
        </div>
      )}


      <div className="space-y-2 mt-0 pt-0" style={{ marginTop: 0, paddingTop: 0 }}>
        <Label>Discount Coupon (optional)</Label>
        {coupons && coupons.length > 0 && (campaignStatus === 'DRAFT' || campaignStatus === '')  ? (
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors border-border hover:border-[#C8E6C9] cursor-pointer">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{coupon.couponCode} · {coupon.discountType === "PERCENT" ? `${coupon.discountValue}% off` : `$${coupon.discountValue} off`}</p>
                    {
                      coupon.expiryDate && <p className="text-xs text-muted-foreground">{`Expires on ${new Date(coupon.expiryDate).toDateString()}`}</p>
                    }
                    {
                      Number(coupon.minimumCampaignBudget) > 0 && <p className="text-xs text-muted-foreground">{`Minimum campaign budget: $${coupon.minimumCampaignBudget}${coupon.minimumBudgetCurrency ? ` ${coupon.minimumBudgetCurrency}` : ""}`}</p>
                    }
                    {
                      Number(coupon.maxDiscountCap) > 0 && <p className="text-xs text-muted-foreground">{`Maximum discount cap: $${coupon.maxDiscountCap}${coupon.maxDiscountCurrency ? ` ${coupon.maxDiscountCurrency}` : ""}`}</p>
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {
                    data?.couponCode === coupon.couponCode ? (
                      <button className="text-sm text-primary" onClick={() => onChange({ ...data, couponCode: "" })}>Remove</button>
                    ) : (
                      <button className="text-sm text-primary" onClick={() => handleApplyCoupon(coupon.couponCode)}>Apply</button>
                    )
                  }
                </div>
              </div>
            ))}
          </div>
        ) : (
          <></>
        )}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                handleApplyCoupon();
              }
            }}
            disabled={shouldDisable}
          />
          <button
            className={`${shouldDisable ? ' cursor-not-allowed opacity-50 bg-primary/50' : 'bg-primary'} text-white px-4 py-2 rounded-md`}
            onClick={() => handleApplyCoupon()}
            disabled={isApplyingCoupon || shouldDisable}
          >
            {isApplyingCoupon ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      <div className="space-y-2 bg-muted p-3 rounded-md">
        <label className="text-sm font-bold text-foreground">
          Charge Summary
        </label>
        <div className="flex items-center justify-between gap-2">
          <div>
            <label className="text-sm text-foreground">
              {campaignName ? campaignName : "Untitled Campaign"} (
              {durationDays} days)
            </label>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">
              ${(totalBudget).toLocaleString()}
            </label>
          </div>
        </div>
        {data?.couponCode ? (
          <div className="flex items-start justify-between gap-2">
            <div>
              <label className="text-sm text-primary">
                Coupon - {data.couponCode}
              </label>
              <h6 className="text-xs text-muted-foreground capitalize">
                {
                  data.discountType === "FIXED" ? `Fixed $${data.discountValue} Off` : `${data.discountValue}% Off`
                }
              </h6>
              <h6 className="text-xs text-muted-foreground">
                {data.remainingUsages > 0 ? `${data.remainingUsages} usages remaining` : ''}
              </h6>
              <h6 className="text-xs text-muted-foreground">
                {
                  data.expiryDate ? `Expires on ${new Date(data.expiryDate).toDateString()}` : ''
                }

              </h6>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-semibold text-primary">
                -${data.discountApplied.toLocaleString()}
              </label>
              <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => onChange({ ...data, couponCode: "" })}>remove</span>
            </div>
          </div>
        ) : (
          <></>
        )}
        {savedTransaction?.pre?.couponCode ? (
          <div className="flex items-start justify-between gap-2">
            <div>
              <label className="text-sm text-primary">
                Coupon - {savedTransaction?.pre?.couponCode}
              </label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-semibold text-primary">
                -${Math.abs(Number(savedTransaction?.pre?.amount) - Number(savedTransaction?.pre?.originalAmount)).toLocaleString()}
              </label>
            </div>
          </div>
        ) : (
          <></>
        )}

        {savedTransaction?.post?.couponCode ? (
          <div className="flex items-start justify-between gap-2">
            <div>
              <label className="text-sm text-primary">
                Coupon - {savedTransaction?.post?.couponCode}
              </label>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-semibold text-primary">
                -${Math.abs(Number(Math.abs(Number(savedTransaction?.post?.amount))) - Number(Math.abs(Number(savedTransaction?.post?.originalAmount)))).toLocaleString()}
              </label>
            </div>
          </div>
        ) : (
          <></>
        )}


        <hr />
        <div className="flex items-center justify-between gap-2">
          <div>
            <label className="text-sm text-foreground">Total</label>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">
              $
              {data?.couponCode
                ? data.finalAmount.toLocaleString()
                : savedTransaction?.pre?.amount ? Number(savedTransaction?.pre?.amount) : savedTransaction?.post?.amount ? Math.abs(Number(savedTransaction?.post?.amount)) : totalBudget.toLocaleString()}
            </label>
          </div>
        </div>
      </div>
      {
        creditsDetails?.creditCycle?.amount > 0  && (campaignStatus === 'DRAFT' || campaignStatus === '')  ? (
          <div className={`space-y-3 p-3 border border-border rounded-md ${creditsDetails.availableCredit > totalBudget ? '' : 'opacity-90 cursor-not-allowed'}`}>
            <div className="flex flex-col justify-start items-start gap-1 mb-3">
              <Label className="text-sm font-medium">Pay by invoice</Label>
              <span className="text-xs text-muted-foreground">Your campaigns are billed at the end of the month. Your credit limit controls how much you can run before payment is due.</span>
              <label className="text-xs text-muted-foreground">Approved Monthly Credit Limit - ${Number(creditsDetails.creditCycle.amount).toLocaleString()}</label>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
                <div>
                  <p className="text-sm font-medium">Available Credit Limit</p>
                  <h6 className="text-2xl font-bold"> ${creditsDetails.availableCredit.toLocaleString()} </h6>
                </div>
                <div>
                  <p className="text-sm font-medium">Remaining limit after this campaign</p>
                  <h6 className="text-2xl font-bold text-right text-primary"> {
                  
                  (finalAmountAfterCoupon < 0 ? '-$' + (finalAmountAfterCoupon * -1).toLocaleString() : '$'+finalAmountAfterCoupon.toLocaleString())
                  
                  }</h6>
                </div>
            </div>           
            {
                  creditsDetails.availableCredit < totalBudget ? (
                    <h6 className="text-xs text-destructive flex items-center gap-2">
                      <TriangleAlert size={16} className="text-destructive" /> This campaign exceeds your available credits
                    </h6>
                  ) : <></>
                }
          </div>
        ) :<></>
      }



      {
        paymentUrl && (
          <PaymentModal
            open={!!paymentUrl}
            onOpenChange={() => setPaymentUrl("")}
            paymentUrl={paymentUrl}
            onCancel={() =>  {
              setPaymentUrl("");
              location.href = "/dashboard/campaigns/" + campaignId.current;
            }}
          />
        )
      }

    </div>
  );
}
