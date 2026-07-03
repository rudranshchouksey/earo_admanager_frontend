import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BusinessHelperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: string;
  onApply: (text: string) => void;
}

type FieldType = 'input' | 'textarea';
interface FieldDef {
  key: string;
  label: string;
  bracket: string; // bracket label used in prompt e.g. "Brand website"
  placeholder?: string;
  type?: FieldType;
  quoted?: boolean; // wrap value in quotes (for hooks)
}

const GOAL_LABELS: Record<string, string> = {
  sales: 'sales',
  leads: 'lead generation',
  traffic: 'website traffic',
  consideration: 'consideration',
  awareness: 'brand awareness',
  app: 'app promotion',
  local: 'local store visit',
  podcast: 'podcast promotion',
};

const COMMON_HEADER: FieldDef[] = [
  { key: 'brand', label: 'Brand name', bracket: '', placeholder: 'e.g. My Brand Pizza' },
  { key: 'audience', label: 'Target audience', bracket: '', placeholder: 'e.g. young adults in Dubai' },
];

const GOAL_FIELDS: Record<string, FieldDef[]> = {
  sales: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website', placeholder: 'www.mybrand.com' },
    { key: 'hook', label: 'Opening hook', bracket: 'Opening hook', placeholder: 'Craving pizza tonight?', quoted: true },
    { key: 'product', label: 'Product', bracket: 'Product', type: 'textarea', placeholder: 'freshly made pizza delivered in under 30 minutes' },
    { key: 'offer', label: 'Offer', bracket: 'Offer', placeholder: '20% off the first order using promo code PIZZA20' },
    { key: 'urgency', label: 'Urgency', bracket: 'Urgency', placeholder: 'Tonight only' },
    { key: 'cta', label: 'CTA', bracket: 'CTA', placeholder: 'Order now at www.mybrand.com' },
    { key: 'tagline', label: 'Tagline', bracket: 'Tagline', placeholder: 'Delivering happiness to your door' },
  ],
  leads: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website', placeholder: 'www.mybrand.com' },
    { key: 'hook', label: 'Opening hook', bracket: 'Opening hook', placeholder: 'Craving something delicious tonight?', quoted: true },
    { key: 'product', label: 'Product', bracket: 'Product', type: 'textarea' },
    { key: 'leadMagnet', label: 'Lead magnet', bracket: 'Lead magnet', placeholder: 'a free 10-minute consultation, no commitment' },
    { key: 'trust', label: 'Trust signal', bracket: 'Trust signal', placeholder: 'rated 4.9 stars by over 5,000 customers' },
    { key: 'cta', label: 'CTA', bracket: 'CTA', placeholder: 'Order now at our website' },
  ],
  traffic: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website', placeholder: 'www.mybrand.com' },
    { key: 'hook', label: 'Opening hook', bracket: 'Opening hook', placeholder: 'Looking for something new this season?', quoted: true },
    { key: 'product', label: 'Product', bracket: 'Product', type: 'textarea' },
    { key: 'context', label: 'Context', bracket: 'Context', type: 'textarea' },
    { key: 'occasion', label: 'Occasion', bracket: 'Occasion', placeholder: 'Summer Sale' },
    { key: 'cta', label: 'CTA', bracket: 'CTA' },
  ],
  consideration: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website' },
    { key: 'hook', label: 'Opening hook', bracket: 'Opening hook', quoted: true },
    { key: 'product', label: 'Product', bracket: 'Product', type: 'textarea' },
    { key: 'differentiator', label: 'Key differentiator', bracket: 'Key differentiator', type: 'textarea' },
    { key: 'objection', label: 'Objection to address', bracket: 'Objection to address' },
    { key: 'trust', label: 'Trust signal', bracket: 'Trust signal' },
    { key: 'cta', label: 'CTA', bracket: 'CTA' },
  ],
  awareness: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website' },
    { key: 'personality', label: 'Brand personality', bracket: 'Brand personality', placeholder: 'modern, human, and approachable' },
    { key: 'mission', label: 'Brand mission', bracket: 'Brand mission', type: 'textarea' },
    { key: 'emotion', label: 'Emotional feeling', bracket: 'Emotional feeling', type: 'textarea' },
    { key: 'tagline', label: 'Tagline', bracket: 'Tagline' },
    { key: 'cta', label: 'Light CTA', bracket: 'Light CTA' },
  ],
  app: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website' },
    { key: 'hook', label: 'Opening hook', bracket: 'Opening hook', quoted: true },
    { key: 'appDesc', label: 'App description', bracket: 'App description', type: 'textarea' },
    { key: 'offer', label: 'Offer', bracket: 'Offer' },
    { key: 'platform', label: 'Platform', bracket: 'Platform', placeholder: 'available on iOS and Android' },
    { key: 'cta', label: 'CTA', bracket: 'CTA' },
  ],
  local: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website' },
    { key: 'hook', label: 'Opening hook', bracket: 'Opening hook', quoted: true },
    { key: 'product', label: 'Product', bracket: 'Product', type: 'textarea' },
    { key: 'offer', label: 'Offer', bracket: 'Offer' },
    { key: 'urgency', label: 'Urgency', bracket: 'Urgency' },
    { key: 'location', label: 'Location', bracket: 'Location', type: 'textarea' },
    { key: 'hours', label: 'Opening hours', bracket: 'Opening hours', placeholder: 'open daily from 7am to 10pm' },
    { key: 'cta', label: 'CTA', bracket: 'CTA' },
  ],
  podcast: [
    { key: 'website', label: 'Brand website', bracket: 'Brand website' },
    { key: 'podDesc', label: 'Podcast description', bracket: 'Podcast description', type: 'textarea' },
    { key: 'hook', label: 'Opening hook', bracket: 'Opening hook', quoted: true },
    { key: 'trust', label: 'Trust signal', bracket: 'Trust signal' },
    { key: 'host', label: 'Host', bracket: 'Host', placeholder: 'hosted by Ahmad Karimi' },
    { key: 'episode', label: 'Episode highlight', bracket: 'Episode highlight', type: 'textarea' },
    { key: 'platform', label: 'Platform', bracket: 'Platform', placeholder: 'available on Spotify and Apple Podcasts' },
    { key: 'cta', label: 'CTA', bracket: 'CTA' },
  ],
};

const LANGUAGES = [
  'English (Standard American)',
  'English (Standard British)',
  'Arabic (Gulf - Khaleeji)',
  'Arabic (Modern Standard)',
];
const TONES = [
  'energetic',
  'warm, conversational',
  'inspiring, aspirational',
  'authoritative, confident',
  'inspiring, warm',
  'energetic, fun',
  'warm, inviting',
  'energetic, authoritative',
];

export default function BusinessHelperModal({ open, onOpenChange, onApply }: BusinessHelperModalProps) {
  const [goal, setGoal] = useState("sales");
  const goalKey = GOAL_FIELDS[goal] ? goal : 'sales';
  const fields = GOAL_FIELDS[goalKey];
  const goalLabel = GOAL_LABELS[goalKey];

  const [brand, setBrand] = useState('');
  const [audience, setAudience] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [values, setValues] = useState<Record<string, string>>({});

  // Reset values when goal changes
  useEffect(() => {
    setValues({});
  }, [goalKey]);

  const canApply = brand.trim().length > 0 || Object.values(values).some((v) => v?.trim());

  const handleApply = () => {
    const lines: string[] = [];
    const brandName = brand.trim() || 'your brand';
    const audienceText = audience.trim() ? ` targeting ${audience.trim()}` : '';
    lines.push(`Write a ${goalLabel} ad for ${brandName}${audienceText}.`);
    lines.push(`[Language] ${language}`);
    lines.push(`[Tone] ${tone}`);
    lines.push('');
    if (audience.trim()) {
      lines.push(`[Target audience] ${audience.trim()}`);
    }
    for (const f of fields) {
      const raw = values[f.key]?.trim();
      if (!raw) continue;
      const val = f.quoted ? `"${raw.replace(/^"|"$/g, '')}"` : raw;
      lines.push(`[${f.bracket}] ${val}`);
    }
    onApply(lines.join('\n'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Describe your business</DialogTitle>
          <DialogDescription>
            Fill in the fields below and we'll build a structured prompt tailored to your campaign goal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
              <Label className="text-sm">Campaign Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(GOAL_LABELS).map((g) => <SelectItem key={g} value={g}>{GOAL_LABELS[g]}</SelectItem>)}
                </SelectContent>
              </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMON_HEADER.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label className="text-sm">{f.label}</Label>
                <Input
                  placeholder={f.placeholder}
                  value={f.key === 'brand' ? brand : audience}
                  onChange={(e) => (f.key === 'brand' ? setBrand : setAudience)(e.target.value.slice(0, 200))}
                  maxLength={200}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label className="text-sm">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label className="text-sm">{f.label}</Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    placeholder={f.placeholder}
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value.slice(0, 300) }))}
                    maxLength={300}
                    rows={2}
                  />
                ) : (
                  <Input
                    placeholder={f.placeholder}
                    value={values[f.key] || ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value.slice(0, 200) }))}
                    maxLength={200}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={!canApply}>Apply to description</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
