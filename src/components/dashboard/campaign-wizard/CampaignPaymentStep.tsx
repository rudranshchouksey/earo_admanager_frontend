import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Wallet, Building2, TriangleAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Coupon, CreditDetails } from "@/services/wallet";
import { SavedTransaction } from "@/services/campaign";
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
}

interface Cards {
  id: string;
  cardId: string;
  last_4: string;
  cardHolderName: string;
  type: string;
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
}: Props) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedCards, setSavedCards] = useState([]);

  const shouldDisable = disabled || !(campaignStatus === "" || campaignStatus?.toLowerCase() === "draft");

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

  const finalAmountAfterCoupon = (creditsDetails.availableCredit - (data?.couponCode ? data.finalAmount : totalBudget));


  return (
    <div className="space-y-6">


      {cards && cards.length > 0 ? (
        <div className={`space-y-3 mb-5 ${creditsDetails.availableCredit > totalBudget ? 'hidden opacity-50 cursor-not-allowed' : ''}`}>
          <Label>Pay using your saved card</Label>
          {cards?.map((card) => (
            <div key={card.id} className="flex items-center gap-2 w-full">
              <Checkbox checked={data?.cardId === card.cardId} onCheckedChange={() => onChange({ ...data, cardId: card.cardId })} />
              <div className={`flex items-center gap-3 p-3 rounded-lg border border-[#C8E6C9] ${ data?.cardId === card.cardId ? 'bg-[#E6F4EA]' : 'bg-background' } w-full`}>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{card.last_4}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.type}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 w-full">
          <Checkbox checked={data?.cardId === ""} onCheckedChange={() => onChange({ ...data, cardId: "" })} />
            <p className="text-sm font-medium pl-1">Use a new card</p>
          </div>


        </div>
      ) : (
        <></>
      )}


      <div className="space-y-2 mt-0 pt-0" style={{ marginTop: 0, paddingTop: 0 }}>
        <Label>Discount Coupon (optional)</Label>
        {coupons && coupons.length > 0 ? (
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
                      Number(coupon.minimumCampaignBudget) > 0 && <p className="text-xs text-muted-foreground">{`Minimum campaign budget: $${coupon.minimumCampaignBudget} ${coupon.minimumBudgetCurrency}`}</p>
                    }
                    {
                      Number(coupon.maxDiscountCap) > 0 && <p className="text-xs text-muted-foreground">{`Maximum discount cap: $${coupon.maxDiscountCap} ${coupon.maxDiscountCurrency}`}</p>
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-primary" onClick={() => handleApplyCoupon(coupon.couponCode)}>Apply</button>
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

      {
        creditsDetails?.creditCycle?.amount > 0  && ( savedTransaction === null) ? (
          <div className={`space-y-3 p-3 border border-border rounded-md ${creditsDetails.availableCredit > totalBudget ? '' : 'opacity-90 cursor-not-allowed'}`}>
            <Label className="text-sm font-medium">Pay using your credits</Label>
            <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Available Credits</p>
                  <h6 className="text-2xl font-bold"> ${creditsDetails.availableCredit.toLocaleString()}</h6>
                </div>
                <div>
                  <p className="text-sm font-medium">After this campaign</p>
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


    </div>
  );
}
