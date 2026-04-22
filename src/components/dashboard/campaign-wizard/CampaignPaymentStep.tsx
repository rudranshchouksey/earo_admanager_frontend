import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Wallet, Building2 } from 'lucide-react';
// import { supabase } from '@/integrations/supabase/client';

interface PaymentData {
  paymentMethod: string;
  couponCode: string;
}

interface Props {
  data: PaymentData;
  onChange: (data: PaymentData) => void;
}

const methods = [
  { value: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { value: 'wallet', label: 'Digital Wallet', icon: Wallet },
  { value: 'bank', label: 'Bank Transfer', icon: Building2 },
];

interface SavedCard {
  last4: string;
  brand: string;
  expiry: string;
}

export default function CampaignPaymentStep({ data, onChange }: Props) {
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saveCard, setSaveCard] = useState(true);

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
    return <div className="space-y-3 animate-pulse"><div className="h-10 bg-muted rounded" /><div className="h-10 bg-muted rounded" /></div>;
  }

  // Existing user with saved card
  if (!isNewUser && savedCard && data.paymentMethod === 'card') {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#C8E6C9] bg-[#E6F4EA]">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{savedCard.brand} •••• {savedCard.last4}</p>
              <p className="text-xs text-muted-foreground">Expires {savedCard.expiry}</p>
            </div>
            <button
              type="button"
              className="text-xs text-foreground hover:underline"
              onClick={() => setIsNewUser(true)}
            >
              Change
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Discount Coupon (optional)</Label>
          <Input
            placeholder="Enter coupon code"
            value={data.couponCode}
            onChange={(e) => onChange({ ...data, couponCode: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Payment Method</Label>
        <RadioGroup
          value={data.paymentMethod}
          onValueChange={(v) => onChange({ ...data, paymentMethod: v })}
          className="space-y-2"
        >
          {methods.map((m) => (
            <div key={m.value}>
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  data.paymentMethod === m.value ? 'border-[#C8E6C9] bg-[#E6F4EA]' : 'border-border hover:border-[#C8E6C9]'
                }`}
              >
                <RadioGroupItem value={m.value} />
                <m.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{m.label}</span>
              </label>

              {/* Card fields expanded inline when card is selected */}
              {m.value === 'card' && data.paymentMethod === 'card' && (
                <div className="space-y-4 border border-t-0 border-border rounded-b-lg p-4 -mt-[1px]">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="1234 5678 9012 3456" className="pl-10" maxLength={19} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry Date</Label>
                      <Input placeholder="MM / YY" maxLength={7} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVV</Label>
                      <Input placeholder="•••" type="password" maxLength={4} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name on Card</Label>
                    <Input placeholder="Full name as on card" />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="save-card"
                      checked={saveCard}
                      onCheckedChange={(checked) => setSaveCard(!!checked)}
                    />
                    <label htmlFor="save-card" className="text-sm text-foreground cursor-pointer">
                      Save card for future campaigns
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Discount Coupon (optional)</Label>
        <Input
          placeholder="Enter coupon code"
          value={data.couponCode}
          onChange={(e) => onChange({ ...data, couponCode: e.target.value })}
        />
      </div>
    </div>
  );
}
