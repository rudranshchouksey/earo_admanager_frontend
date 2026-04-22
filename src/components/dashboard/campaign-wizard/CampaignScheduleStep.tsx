import { Label } from '@/components/ui/label';
import { Check, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useDevFlags } from '@/contexts/DevFlagsContext';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSessionFlags } from '@/hooks/useSessionFlags';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function TimeDropdown({ value, onChange, className }: { value: string; onChange: (val: string) => void; className?: string }) {
  const [h, m] = (value || '00:00').split(':');

  return (
    <div className={cn('flex gap-1', className)}>
      <Select value={h} onValueChange={(v) => onChange(`${v}:${m}`)}>
        <SelectTrigger className="w-[72px] h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
          {HOURS.map(hour => (
            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="self-center text-muted-foreground text-sm">:</span>
      <Select value={m} onValueChange={(v) => onChange(`${h}:${v}`)}>
        <SelectTrigger className="w-[72px] h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
          {MINUTES.map(min => (
            <SelectItem key={min} value={min}>{min}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const DURATION_PRESETS = [7, 14, 30, 60, 90];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning', desc: '6am – 12pm' },
  { value: 'afternoon', label: 'Afternoon', desc: '12pm – 6pm' },
  { value: 'evening', label: 'Evening', desc: '6pm – 12am' },
  { value: 'overnight', label: 'Overnight', desc: '12am – 6am' },
];

interface ScheduleData {
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: string[];
  timeSlots?: string[];
}

interface Props {
  data: ScheduleData;
  onChange: (data: ScheduleData) => void;
}

export default function CampaignScheduleStep({ data, onChange }: Props) {
  const { isPro } = useSessionFlags();

  const selectedDays = data.daysOfWeek || DAYS_OF_WEEK;
  const selectedSlots = data.timeSlots || TIME_SLOTS.map(s => s.value);

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }, []);

  const toggleDay = (day: string) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    onChange({ ...data, daysOfWeek: next });
  };

  const toggleSlot = (slot: string) => {
    const next = selectedSlots.includes(slot)
      ? selectedSlots.filter(s => s !== slot)
      : [...selectedSlots, slot];
    onChange({ ...data, timeSlots: next });
  };

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start campaign from ({timezone})</Label>
          <div className="flex gap-2">
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-10 justify-start text-left font-normal",
                    !data.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.startDate
                    ? format(parse(data.startDate, 'yyyy-MM-dd', new Date()), 'PPP')
                    : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.startDate ? parse(data.startDate, 'yyyy-MM-dd', new Date()) : undefined}
                  onSelect={(date) => {
                    onChange({ ...data, startDate: date ? format(date, 'yyyy-MM-dd') : '' });
                    setStartOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <TimeDropdown
              value={data.startTime || '00:00'}
              onChange={(val) => onChange({ ...data, startTime: val })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>End campaign at</Label>
          <div className="flex gap-2">
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-10 justify-start text-left font-normal",
                    !data.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.endDate
                    ? format(parse(data.endDate, 'yyyy-MM-dd', new Date()), 'PPP')
                    : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.endDate ? parse(data.endDate, 'yyyy-MM-dd', new Date()) : undefined}
                  onSelect={(date) => {
                    onChange({ ...data, endDate: date ? format(date, 'yyyy-MM-dd') : '' });
                    setEndOpen(false);
                  }}
                  disabled={(date) => {
                    const today = new Date(new Date().setHours(0, 0, 0, 0));
                    const start = data.startDate ? parse(data.startDate, 'yyyy-MM-dd', new Date()) : today;
                    return date < start;
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <TimeDropdown
              value={data.endTime || '23:59'}
              onChange={(val) => onChange({ ...data, endTime: val })}
            />
          </div>
        </div>
      </div>
      {data.startDate && data.endDate && (() => {
        const start = new Date(`${data.startDate}T${data.startTime || '00:00'}`);
        const end = new Date(`${data.endDate}T${data.endTime || '23:59'}`);
        const invalid = end <= start;
        return (
          <>
            <p className="text-sm text-muted-foreground">
              Campaign duration: {Math.max(1, Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)))} days
            </p>
            {invalid && (
              <p className="text-sm text-destructive">End date/time must be after start date/time</p>
            )}
          </>
        );
      })()}

      {/* Duration presets */}
      <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map(days => {
            const currentDuration = data.startDate && data.endDate
              ? Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const selected = currentDuration === days;
            return (
              <div
                key={days}
                onClick={() => {
                  const start = data.startDate || new Date().toISOString().slice(0, 10);
                  const end = new Date(new Date(start).getTime() + days * 86400000).toISOString().slice(0, 10);
                  onChange({ ...data, startDate: start, endDate: end });
                }}
                className={cn(
                  'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                  selected
                    ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                    : 'border-border hover:border-[#C8E6C9]'
                )}
              >
                {selected && (
                  <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium">{days} days</span>
              </div>
            );
          })}
        </div>

      {/* Day Parting — Pro only */}
      {isPro && (
        <>
          <div className="space-y-3">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => {
                const selected = selectedDays.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                      selected
                        ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                        : 'border-border hover:border-[#C8E6C9]'
                    )}
                  >
                    {selected && (
                      <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{day}</span>
                  </div>
                );
              })}
            </div>
            {selectedDays.length < DAYS_OF_WEEK.length && (
              <p className="text-xs text-muted-foreground">
                {selectedDays.length === 0 ? 'No days selected' : `${selectedDays.length} of 7 days selected`}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Time of Day</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map(({ value, label, desc }) => {
                const selected = selectedSlots.includes(value);
                return (
                  <div
                    key={value}
                    onClick={() => toggleSlot(value)}
                    className={cn(
                      'border rounded-lg p-3 text-left cursor-pointer transition-all flex items-start gap-1.5',
                      selected
                        ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                        : 'border-border hover:border-[#C8E6C9]'
                    )}
                  >
                    {selected && (
                      <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedSlots.length < TIME_SLOTS.length && (
              <p className="text-xs text-muted-foreground">
                {selectedSlots.length === 0 ? 'No time slots selected' : `${selectedSlots.length} of 4 time slots selected`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
