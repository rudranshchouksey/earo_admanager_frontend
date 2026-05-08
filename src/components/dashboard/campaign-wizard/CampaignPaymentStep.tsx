import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, Wallet, Building2 } from "lucide-react";
// import { supabase } from '@/integrations/supabase/client';

interface PaymentData {
  paymentMethod: string;
  couponCode: string;
  discountValue: number;
  discountType: string;
  originalAmount: number;
  discountApplied: number;
  finalAmount: number;
  cardId: string | null;
}

interface Props {
  campaignName: string;
  data: PaymentData;
  onChange: (data: PaymentData) => void;
  applyCoupon: (couponCode: string) => void;
  isApplyingCoupon: boolean;
  dailyBudget: number;
  durationDays: number;
  cards: Cards[];
}

interface Cards {
  id: string;
  cardId: string;
  last_4: string;
  cardHolderName: string;
  type: string;
}

export default function CampaignPaymentStep({
  cards,
  campaignName,
  data,
  onChange,
  applyCoupon,
  isApplyingCoupon = false,
  dailyBudget,
  durationDays,
}: Props) {
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedCards, setSavedCards] = useState([]);

  const handleApplyCoupon = () => {
    applyCoupon(couponCode);
    setCouponCode("");
  };

  const totalAmount = dailyBudget * durationDays;

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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Discount Coupon (optional)</Label>
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
          />
          <button
            className="bg-primary text-white px-4 py-2 rounded-md"
            onClick={handleApplyCoupon}
            disabled={isApplyingCoupon}
          >
            {isApplyingCoupon ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      {savedCards.length ? (
        <div className="space-y-2">
          <Label>Saved Cards</Label>
          {savedCards.map((card) => (
            <div key={card.id}>
              <p>
                {card.brand} •••• {card.last4}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}

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
              ${(dailyBudget * durationDays).toLocaleString()}
            </label>
          </div>
        </div>
        {data?.couponCode ? (
          <div className="flex items-start justify-between gap-2">
            <div>
              <label className="text-sm text-primary">
                Coupon - {data.couponCode}
              </label>
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
                : totalAmount.toLocaleString()}
            </label>
          </div>
        </div>
      </div>

      {cards && cards.length > 0 ? (
        <div className="space-y-3">
          <Label>Pay using your saved card</Label>
          {cards?.map((card) => (
            <div key={card.id} className="flex items-center gap-2 w-full">
              <Checkbox checked={data?.cardId === card.cardId} onCheckedChange={() => onChange({ ...data, cardId: card.cardId })} />
              <div className="flex items-center gap-3 p-3 rounded-lg border border-[#C8E6C9] bg-[#E6F4EA] w-full">
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
    </div>
  );
}
