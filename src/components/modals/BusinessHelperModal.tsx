import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface BusinessHelperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: string;
  onApply: (text: string) => void;
}

type FieldType = 'input' | 'textarea' | 'dropdown' | 'url';

interface SelectOption {
  value: string;
  label: string;
}

interface FieldDef {
  key: string;
  label: string;
  bracket: string;
  placeholder?: string;
  type: FieldType;
  quoted?: boolean;
  maxLength?: number;
  options?: SelectOption[];
  optionsByGoal?: Record<string, SelectOption[]>;
}

interface GoalFieldConfig {
  key: string;
  required: boolean;
  label?: string;
}

const GOAL_LABELS: Record<string, string> = {
  sales: 'Sales',
  leads: 'Leads',
  traffic: 'Traffic',
  consideration: 'Consideration',
  awareness: 'Awareness',
  app: 'App promotion',
  local: 'Store visits',
  podcast: 'Podcast promotion',
};

const AD_DURATION_OPTIONS: SelectOption[] = [
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '45', label: '45 seconds' },
  { value: '60', label: '60 seconds' },
];

const TARGET_AUDIENCE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All' },
  { value: 'families', label: 'Families' },
  { value: 'young_adults', label: 'Young adults' },
  { value: 'adults', label: 'Adults' },
  { value: 'seniors', label: 'Seniors' },
  { value: 'kids_teens', label: 'Kids & teens' },
  { value: 'professionals', label: 'Professionals' },
  { value: 'sme', label: 'Small & medium businesses' },
  { value: 'enterprise', label: 'Large enterprises' },
];

const TONE_OPTIONS: SelectOption[] = [
  { value: 'any', label: 'Any' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'soothing', label: 'Soothing' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'nostalgic', label: 'Nostalgic' },
  { value: 'inspiring', label: 'Inspiring' },
];

const SCRIPT_LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'hi', label: 'Hindi' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'ur', label: 'Urdu' },
  { value: 'ml', label: 'Malayalam' },
];

const ENGLISH_ACCENT_OPTIONS: SelectOption[] = [
  { value: 'en_us', label: 'Standard American' },
  { value: 'en_gb', label: 'Standard British' },
  { value: 'en_au', label: 'Australian' },
];

const ARABIC_ACCENT_OPTIONS: SelectOption[] = [
  { value: 'ar_msa', label: 'MSA — Modern Standard Arabic' },
  { value: 'ar_gulf', label: 'Gulf / Khaleeji' },
  { value: 'ar_egyptian', label: 'Egyptian / Masri' },
  { value: 'ar_levantine', label: 'Levantine / Shami' },
  { value: 'ar_maghrebi', label: 'Maghrebi / Darija' },
];

const CALL_TO_ACTION_OPTIONS: SelectOption[] = [
  { value: 'info_discovery', label: 'Information / Discovery' },
  { value: 'action_acquisition', label: 'Action / Acquisition' },
  { value: 'navigation_visit', label: 'Navigation / Visit' },
  { value: 'contact_direct', label: 'Contact / Direct response' },
  { value: 'event_participation', label: 'Event participation' },
  { value: 'social_engagement', label: 'Social engagement' },
  { value: 'support_donation', label: 'Support / Donation' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None' },
];

const OCCASION_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None / evergreen' },
  { value: 'valentines', label: "Valentine's Day" },
  { value: 'spring_holiday', label: 'Spring holiday season' },
  { value: 'mothers_day', label: "Mother's Day" },
  { value: 'fathers_day', label: "Father's Day" },
  { value: 'independence_day', label: 'Independence Day' },
  { value: 'summer_sale', label: 'Summer Sale' },
  { value: 'back_to_school', label: 'Back to School' },
  { value: 'halloween', label: 'Halloween' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'black_friday', label: 'Black Friday' },
  { value: 'cyber_monday', label: 'Cyber Monday' },
  { value: 'winter_holiday', label: 'Winter holiday season' },
  { value: 'new_year', label: 'New Year' },
  { value: 'other', label: 'Other' },
];

const OFFER_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'discount', label: 'Discounts and price reductions' },
  { value: 'free', label: 'Free offers' },
  { value: 'rebate_cashback', label: 'Rebates and cashbacks' },
  { value: 'financing', label: 'Financing and payment plans' },
  { value: 'loyalty', label: 'Loyalty and rewards programs' },
  { value: 'bundle', label: 'Bundle deals' },
  { value: 'competition', label: 'Competitions and giveaways' },
  { value: 'limited_time', label: 'Limited-time offers' },
  { value: 'trade_in', label: 'Trade-in and buyback' },
  { value: 'subscription', label: 'Subscription-based promotions' },
  { value: 'personalised', label: 'Personalised or targeted offers' },
  { value: 'cause', label: 'Charitable or cause-based promotions' },
  { value: 'early_access', label: 'Early access / pre-order' },
  { value: 'price_guarantee', label: 'Price guarantees' },
  { value: 'other_promo', label: 'Other' },
];

const APP_PLATFORM_OPTIONS: SelectOption[] = [
  { value: 'ios', label: 'iOS only' },
  { value: 'android', label: 'Android only' },
  { value: 'ios_android', label: 'iOS and Android' },
  { value: 'ios_android_huawei', label: 'iOS, Android, and Huawei AppGallery' },
];

const PODCAST_PLATFORM_OPTIONS: SelectOption[] = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'apple', label: 'Apple Podcasts' },
  { value: 'spotify_apple', label: 'Spotify and Apple Podcasts' },
  { value: 'all_platforms', label: 'All major podcast apps' },
];

const HEADERS: Record<string, FieldDef> = {
  brand: {
    key: 'brand',
    label: 'Brand / app name',
    bracket: 'Brand / app name',
    placeholder: 'e.g. My Brand Pizza',
    maxLength: 60,
    type: 'input',
  },
  website: {
    key: 'website',
    label: 'Website URL',
    bracket: 'Website URL',
    placeholder: 'www.mybrand.com',
    maxLength: 150,
    type: 'url',
  },
  ad_duration: {
    key: 'ad_duration',
    label: 'Ad duration',
    bracket: 'Ad duration',
    type: 'dropdown',
    options: AD_DURATION_OPTIONS,
  },
  target_audience: {
    key: 'target_audience',
    label: 'Target audience',
    bracket: 'Target audience',
    type: 'dropdown',
    options: TARGET_AUDIENCE_OPTIONS,
  },
  audience_detail: {
    key: 'audience_detail',
    label: 'Audience detail',
    bracket: 'Audience detail',
    placeholder: 'e.g. in Dubai, aged 25–40',
    maxLength: 80,
    type: 'input',
  },
  tone: {
    key: 'tone',
    label: 'Tone',
    bracket: 'Tone',
    type: 'dropdown',
    options: TONE_OPTIONS,
  },
  script_language: {
    key: 'script_language',
    label: 'Script language',
    bracket: 'Script language',
    type: 'dropdown',
    options: SCRIPT_LANGUAGE_OPTIONS,
  },
  language_accent: {
    key: 'language_accent',
    label: 'Language accent',
    bracket: 'Language accent',
    type: 'dropdown',
  },
  call_to_action: {
    key: 'call_to_action',
    label: 'Call to action',
    bracket: 'CTA',
    type: 'dropdown',
    options: CALL_TO_ACTION_OPTIONS,
  },
  call_to_action_phrase: {
    key: 'call_to_action_phrase',
    label: 'CTA phrase',
    bracket: 'CTA phrase',
    placeholder: 'e.g. Order now, Learn more, Book now',
    maxLength: 100,
    type: 'input',
  },
  tagline: {
    key: 'tagline',
    label: 'Tagline',
    bracket: 'Tagline',
    placeholder: 'e.g. Delivering happiness to your door',
    maxLength: 120,
    type: 'input',
  },
  occasion: {
    key: 'occasion',
    label: 'Occasion',
    bracket: 'Occasion',
    type: 'dropdown',
    options: OCCASION_OPTIONS,
  },
  occasion_detail: {
    key: 'occasion_detail',
    label: 'Occasion detail',
    bracket: 'Occasion detail',
    placeholder: 'e.g. Summer Sale',
    maxLength: 60,
    type: 'input',
  },
  product_service_app_description: {
    key: 'product_service_app_description',
    label: 'Product / service description',
    bracket: 'Product / service description',
    placeholder: 'e.g. Freshly made pizza delivered in under 30 minutes',
    maxLength: 250,
    type: 'textarea',
  },
  opening_hook: {
    key: 'opening_hook',
    label: 'Opening hook',
    bracket: 'Opening hook',
    placeholder: 'e.g. Craving pizza tonight?',
    maxLength: 120,
    type: 'input',
    quoted: true,
  },
  offer_or_incentive: {
    key: 'offer_or_incentive',
    label: 'Offer or incentive',
    bracket: 'Offer or incentive',
    type: 'dropdown',
    options: OFFER_OPTIONS,
  },
  offer_detail: {
    key: 'offer_detail',
    label: 'Offer detail',
    bracket: 'Offer detail',
    placeholder: 'e.g. 20% off your first order',
    maxLength: 150,
    type: 'input',
  },
  promo_code: {
    key: 'promo_code',
    label: 'Promo code',
    bracket: 'Promo code',
    placeholder: 'e.g. PIZZA20',
    maxLength: 12,
    type: 'input',
  },
  urgency_signal: {
    key: 'urgency_signal',
    label: 'Urgency signal',
    bracket: 'Urgency signal',
    placeholder: 'e.g. Tonight only',
    maxLength: 80,
    type: 'input',
  },
  trust_signal: {
    key: 'trust_signal',
    label: 'Trust signal',
    bracket: 'Trust signal',
    placeholder: 'e.g. Rated 4.9 stars by over 5,000 customers',
    maxLength: 180,
    type: 'textarea',
  },
  lead_magnet: {
    key: 'lead_magnet',
    label: 'Lead magnet',
    bracket: 'Lead magnet',
    placeholder: 'e.g. a free 10-minute consultation, no commitment',
    maxLength: 150,
    type: 'input',
  },
  key_differentiator: {
    key: 'key_differentiator',
    label: 'Key differentiator',
    bracket: 'Key differentiator',
    placeholder: 'e.g. Made fresh to order with locally sourced ingredients',
    maxLength: 180,
    type: 'textarea',
  },
  objection_to_address: {
    key: 'objection_to_address',
    label: 'Objection to address',
    bracket: 'Objection to address',
    placeholder: "e.g. Worried about delivery time?",
    maxLength: 150,
    type: 'input',
  },
  brand_personality: {
    key: 'brand_personality',
    label: 'Brand personality / values',
    bracket: 'Brand personality / values',
    placeholder: 'e.g. modern, human, and approachable',
    maxLength: 150,
    type: 'textarea',
  },
  brand_mission: {
    key: 'brand_mission',
    label: 'Brand story / mission',
    bracket: 'Brand story / mission',
    placeholder: 'e.g. To deliver happiness to your door',
    maxLength: 300,
    type: 'textarea',
  },
  emotional_feeling: {
    key: 'emotional_feeling',
    label: 'Emotional feeling to leave behind',
    bracket: 'Emotional feeling to leave behind',
    placeholder: 'e.g. inspired, confident, reassured',
    maxLength: 100,
    type: 'input',
  },
  platform_availability: {
    key: 'platform_availability',
    label: 'Platform availability',
    bracket: 'Platform availability',
    type: 'dropdown',
    optionsByGoal: {
      app: APP_PLATFORM_OPTIONS,
      podcast: PODCAST_PLATFORM_OPTIONS,
    },
  },
  store_location: {
    key: 'store_location',
    label: 'Store location / address',
    bracket: 'Store location / address',
    placeholder: 'e.g. 123 Main St, Anytown, USA',
    maxLength: 200,
    type: 'textarea',
  },
  opening_hours: {
    key: 'opening_hours',
    label: 'Opening hours',
    bracket: 'Opening hours',
    placeholder: 'e.g. open daily from 7am to 10pm',
    maxLength: 100,
    type: 'input',
  },
  episode_highlight: {
    key: 'episode_highlight',
    label: 'Episode highlight',
    bracket: 'Episode highlight',
    placeholder: 'e.g. Episode 1: The history of pizza',
    maxLength: 250,
    type: 'textarea',
  },
  host_name: {
    key: 'host_name',
    label: 'Host / guest name',
    bracket: 'Host / guest name',
    placeholder: 'e.g. Ahmad Karimi',
    maxLength: 100,
    type: 'input',
  },
};

const GOAL_FIELDS: Record<string, GoalFieldConfig[]> = {
  sales: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'product_service_app_description', required: true },
    { key: 'opening_hook', required: true },
    { key: 'offer_or_incentive', required: true },
    { key: 'offer_detail', required: false },
    { key: 'promo_code', required: false },
    { key: 'urgency_signal', required: false },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
  leads: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'product_service_app_description', required: true },
    { key: 'opening_hook', required: true },
    { key: 'lead_magnet', required: true },
    { key: 'trust_signal', required: false },
    { key: 'offer_or_incentive', required: true },
    { key: 'offer_detail', required: false },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
  traffic: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'product_service_app_description', required: true },
    { key: 'opening_hook', required: true },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
  consideration: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'product_service_app_description', required: true },
    { key: 'opening_hook', required: true },
    { key: 'key_differentiator', required: true },
    { key: 'objection_to_address', required: false },
    { key: 'trust_signal', required: false },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
  awareness: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'brand_mission', required: true },
    { key: 'brand_personality', required: false },
    { key: 'emotional_feeling', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
  app: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'product_service_app_description', required: true, label: 'Product / app description' },
    { key: 'opening_hook', required: true },
    { key: 'platform_availability', required: true },
    { key: 'offer_or_incentive', required: false },
    { key: 'offer_detail', required: false },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
  local: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'product_service_app_description', required: true },
    { key: 'opening_hook', required: true },
    { key: 'store_location', required: true },
    { key: 'opening_hours', required: false },
    { key: 'offer_or_incentive', required: false },
    { key: 'offer_detail', required: false },
    { key: 'urgency_signal', required: false },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
  podcast: [
    { key: 'brand', required: true },
    { key: 'website', required: true },
    { key: 'ad_duration', required: true },
    { key: 'target_audience', required: true },
    { key: 'audience_detail', required: false },
    { key: 'tone', required: true },
    { key: 'script_language', required: true },
    { key: 'language_accent', required: false },
    { key: 'call_to_action', required: true },
    { key: 'call_to_action_phrase', required: true },
    { key: 'product_service_app_description', required: true, label: 'Podcast description' },
    { key: 'opening_hook', required: true },
    { key: 'platform_availability', required: true },
    { key: 'episode_highlight', required: false },
    { key: 'host_name', required: false },
    { key: 'trust_signal', required: false },
    { key: 'tagline', required: false },
    { key: 'occasion', required: false },
    { key: 'occasion_detail', required: true },
  ],
};

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function shouldShowField(key: string, values: Record<string, string>): boolean {
  if (key === 'language_accent') {
    return values.script_language === 'en' || values.script_language === 'ar';
  }
  if (key === 'call_to_action_phrase') {
    return values.call_to_action === 'other';
  }
  if (key === 'occasion_detail') {
    return values.occasion === 'other';
  }
  if (key === 'offer_detail') {
    return Boolean(values.offer_or_incentive && values.offer_or_incentive !== 'none');
  }
  return true;
}

function isFieldRequired(config: GoalFieldConfig, values: Record<string, string>): boolean {
  if (!shouldShowField(config.key, values)) return false;
  if (config.key === 'call_to_action_phrase') return values.call_to_action === 'other';
  if (config.key === 'occasion_detail') return values.occasion === 'other';
  return config.required;
}

function getFieldOptions(field: FieldDef, goal: string, values: Record<string, string>): SelectOption[] {
  if (field.key === 'language_accent') {
    if (values.script_language === 'en') return ENGLISH_ACCENT_OPTIONS;
    if (values.script_language === 'ar') return ARABIC_ACCENT_OPTIONS;
    return [];
  }
  if (field.optionsByGoal?.[goal]) return field.optionsByGoal[goal];
  return field.options ?? [];
}

function getDisplayValue(field: FieldDef, rawValue: string, options: SelectOption[]): string {
  if (field.type === 'dropdown') {
    return options.find((option) => option.value === rawValue)?.label ?? rawValue;
  }
  if (field.key === 'promo_code') return rawValue.toUpperCase();
  if (field.type === 'url') return normalizeUrl(rawValue);
  return rawValue;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(normalizeUrl(value));
    return true;
  } catch {
    return false;
  }
}

function validateField(
  fieldConfig: GoalFieldConfig,
  field: FieldDef,
  values: Record<string, string>,
): string | null {
  if (!shouldShowField(fieldConfig.key, values)) return null;

  const raw = values[fieldConfig.key]?.trim() ?? '';
  const label = fieldConfig.label ?? field.label;

  if (isFieldRequired(fieldConfig, values) && !raw) {
    return `${label} is required`;
  }

  if (field.type === 'url' && raw && !isValidUrl(raw)) {
    return 'Please enter a valid URL';
  }

  return null;
}

export default function BusinessHelperModal({ open, onOpenChange, goal: goalProp, onApply }: BusinessHelperModalProps) {
  const [goal, setGoal] = useState(goalProp || 'sales');
  const goalKey = GOAL_FIELDS[goal] ? goal : 'sales';
  const fields = GOAL_FIELDS[goalKey];
  const goalLabel = GOAL_LABELS[goalKey];
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorsSummary, setShowErrorsSummary] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      setGoal(goalProp || 'sales');
      setErrors({});
      setShowErrorsSummary(false);
    }
  }, [open, goalProp]);

  useEffect(() => {
    setValues({});
    setErrors({});
    setShowErrorsSummary(false);
  }, [goalKey]);

  useEffect(() => {
    setValues((current) => {
      const next = { ...current };
      let changed = false;

      if (!shouldShowField('language_accent', next) && next.language_accent) {
        delete next.language_accent;
        changed = true;
      }
      if (!shouldShowField('call_to_action_phrase', next) && next.call_to_action_phrase) {
        delete next.call_to_action_phrase;
        changed = true;
      }
      if (!shouldShowField('occasion_detail', next) && next.occasion_detail) {
        delete next.occasion_detail;
        changed = true;
      }
      if (!shouldShowField('offer_detail', next) && next.offer_detail) {
        delete next.offer_detail;
        changed = true;
      }

      return changed ? next : current;
    });
  }, [
    values.script_language,
    values.call_to_action,
    values.occasion,
    values.offer_or_incentive,
  ]);

  const visibleFields = useMemo(
    () => fields.filter((field) => shouldShowField(field.key, values)),
    [fields, values],
  );

  const setFieldValue = (key: string, value: string, field?: FieldDef) => {
    let nextValue = value;
    if (field?.key === 'promo_code') {
      nextValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    if (field?.maxLength) {
      nextValue = nextValue.slice(0, field.maxLength);
    }
    setValues((current) => ({ ...current, [key]: nextValue }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setShowErrorsSummary(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    for (const fieldConfig of fields) {
      const field = HEADERS[fieldConfig.key];
      if (!field || !shouldShowField(fieldConfig.key, values)) continue;

      const error = validateField(fieldConfig, field, values);
      if (error) nextErrors[fieldConfig.key] = error;
    }

    setErrors(nextErrors);
    setShowErrorsSummary(Object.keys(nextErrors).length > 0);

    if (Object.keys(nextErrors).length > 0) {
      const firstErrorKey = fields.find((field) => nextErrors[field.key])?.key;
      if (firstErrorKey) {
        formRef.current
          ?.querySelector(`#field-${firstErrorKey}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const lines: string[] = [];
    const brandName = values.brand?.trim() || 'your brand';
    const audienceDetail = values.audience_detail?.trim();
    const audienceText = audienceDetail ? ` targeting ${audienceDetail}` : '';
    lines.push(`Write a ${values.ad_duration}-seconds ${goalLabel.toLowerCase()} generatation ad for <b>${brandName}</b> targeting <b>${values.target_audience}</b>.`);
    lines.push('');

    for (const fieldConfig of visibleFields) {
      const field = HEADERS[fieldConfig.key];
      const raw = values[fieldConfig.key]?.trim();
      if (!raw) continue;

      const options = getFieldOptions(field, goalKey, values);
      const displayValue = getDisplayValue(field, raw, options);
      const bracket = field.bracket || field.label;
      const val = field.quoted ? `"${displayValue.replace(/^"|"$/g, '')}"` : displayValue;
      lines.push(`[${bracket}] ${val}`);
    }

    onApply(lines.join('<br />'));
    onOpenChange(false);
  };

  const renderField = (fieldConfig: GoalFieldConfig) => {
    const field = HEADERS[fieldConfig.key];
    if (!field || !shouldShowField(fieldConfig.key, values)) return null;

    const required = isFieldRequired(fieldConfig, values);
    const label = fieldConfig.label ?? field.label;
    const options = getFieldOptions(field, goalKey, values);
    const value = values[fieldConfig.key] ?? '';
    const error = errors[fieldConfig.key];

    return (
      <div key={fieldConfig.key} id={`field-${fieldConfig.key}`} className="space-y-2">
        <Label className={cn('text-sm', error && 'text-destructive')} htmlFor={`input-${fieldConfig.key}`}>
          {label}
          {required ? ' *' : ''}
        </Label>

        {field.type === 'dropdown' ? (
          <Select value={value} onValueChange={(next) => setFieldValue(fieldConfig.key, next, field)}>
            <SelectTrigger id={`input-${fieldConfig.key}`} className={cn(error && 'border-destructive')}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'textarea' ? (
          <Textarea
            id={`input-${fieldConfig.key}`}
            placeholder={field.placeholder}
            value={value}
            onChange={(event) => setFieldValue(fieldConfig.key, event.target.value, field)}
            maxLength={field.maxLength}
            rows={3}
            aria-invalid={Boolean(error)}
            className={cn(error && 'border-destructive')}
          />
        ) : (
          <Input
            id={`input-${fieldConfig.key}`}
            placeholder={field.placeholder}
            value={value}
            onChange={(event) => setFieldValue(fieldConfig.key, event.target.value, field)}
            maxLength={field.maxLength}
            type={field.type === 'url' ? 'url' : 'text'}
            aria-invalid={Boolean(error)}
            className={cn(error && 'border-destructive')}
          />
        )}

        {error ? (
          <p className="text-sm font-medium text-destructive">{error}</p>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Describe your business</DialogTitle>
          <DialogDescription>
            Fill in the fields below and we&apos;ll build a structured prompt tailored to your campaign goal.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-2" noValidate>
          <div className="space-y-2">
            <Label className="text-sm">Campaign goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(GOAL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showErrorsSummary ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Please fix {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'error' : 'errors'} below before applying.
            </p>
          ) : null}

          <div className="border-t pt-4 space-y-4">
            {fields.map(renderField)}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Apply to description</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
