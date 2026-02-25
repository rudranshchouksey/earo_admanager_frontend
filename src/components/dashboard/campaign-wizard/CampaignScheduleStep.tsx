import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { useTranslation } from '@/contexts/TranslationContext';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const TIME_SLOT_KEYS = ['morning', 'afternoon', 'evening', 'overnight'] as const;

// Legacy: map old display values to keys for backwards compatibility
const DAY_LEGACY: Record<string, string> = { Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun' };

interface ScheduleData {
  startDate: string;
  endDate: string;
  daysOfWeek?: string[];
  timeSlots?: string[];
}

interface Props {
  data: ScheduleData;
  onChange: (data: ScheduleData) => void;
}

export default function CampaignScheduleStep({ data, onChange }: Props) {
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();

  const timeSlots = TIME_SLOT_KEYS.map(k => ({ value: k, label: t(`wizard.schedule.${k}`), desc: t(`wizard.schedule.${k}_desc`) }));

  const selectedDays = data.daysOfWeek?.map(d => DAY_LEGACY[d] || d).filter((d): d is (typeof DAY_KEYS)[number] => DAY_KEYS.includes(d as any)) ?? [...DAY_KEYS];

  const selectedSlots = data.timeSlots || timeSlots.map(s => s.value);

  const toggleDay = (key: string) => {
    const next = selectedDays.includes(key)
      ? selectedDays.filter(d => d !== key)
      : [...selectedDays, key];
    onChange({ ...data, daysOfWeek: next });
  };

  const toggleSlot = (slot: string) => {
    const next = selectedSlots.includes(slot)
      ? selectedSlots.filter(s => s !== slot)
      : [...selectedSlots, slot];
    onChange({ ...data, timeSlots: next });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('wizard.schedule.start_date')}</Label>
          <Input
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('wizard.schedule.end_date')}</Label>
          <Input
            type="date"
            value={data.endDate}
            onChange={(e) => onChange({ ...data, endDate: e.target.value })}
          />
        </div>
      </div>
      {data.startDate && data.endDate && (
        <p className="text-sm text-muted-foreground">
          {t('wizard.schedule.duration', { days: String(Math.max(1, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)))) })}
        </p>
      )}

      {/* Day Parting — Pro only */}
      {isPro && (
        <>
          <div className="space-y-3">
            <Label>{t('wizard.schedule.days_of_week')}</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_KEYS.map(key => {
                const selected = selectedDays.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    {t(`wizard.schedule.${key}`)}
                  </button>
                );
              })}
            </div>
            {selectedDays.length < DAY_KEYS.length && (
              <p className="text-xs text-muted-foreground">
                {selectedDays.length === 0 ? t('wizard.schedule.no_days') : t('wizard.schedule.days_selected', { count: String(selectedDays.length) })}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>{t('wizard.schedule.time_of_day')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {timeSlots.map(({ value, label, desc }) => {
                const selected = selectedSlots.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleSlot(value)}
                    className={cn(
                      'border rounded-lg p-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </button>
                );
              })}
            </div>
            {selectedSlots.length < timeSlots.length && (
              <p className="text-xs text-muted-foreground">
                {selectedSlots.length === 0 ? t('wizard.schedule.no_slots') : t('wizard.schedule.slots_selected', { count: String(selectedSlots.length) })}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
