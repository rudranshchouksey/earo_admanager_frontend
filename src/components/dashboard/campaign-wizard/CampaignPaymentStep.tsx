import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Building2 } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

interface PaymentData {
  paymentMethod: string;
  couponCode: string;
}

interface Props {
  data: PaymentData;
  onChange: (data: PaymentData) => void;
}

export default function CampaignPaymentStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const methods = [
    { value: 'card', label: t('wizard.payment.card'), icon: CreditCard },
    { value: 'wallet', label: t('wizard.payment.wallet'), icon: Wallet },
    { value: 'bank', label: t('wizard.payment.bank'), icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>{t('wizard.payment.method')}</Label>
        <RadioGroup
          value={data.paymentMethod}
          onValueChange={(v) => onChange({ ...data, paymentMethod: v })}
          className="space-y-2"
        >
          {methods.map((m) => (
            <label
              key={m.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.paymentMethod === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              <RadioGroupItem value={m.value} />
              <m.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{m.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>{t('wizard.payment.coupon')}</Label>
        <Input
          placeholder={t('wizard.payment.coupon_placeholder')}
          value={data.couponCode}
          onChange={(e) => onChange({ ...data, couponCode: e.target.value })}
        />
      </div>
    </div>
  );
}
