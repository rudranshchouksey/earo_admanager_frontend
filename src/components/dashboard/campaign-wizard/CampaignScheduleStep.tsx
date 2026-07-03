import { Label } from '@/components/ui/label';
import { Check, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useDevFlags } from '@/contexts/DevFlagsContext';
import { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { MyTooltip } from '@/components/ui/MyTooltip';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function TimeDropdown({ value, onChange, className, disabled=false, isToday=false }: { value: string; onChange: (val: string) => void; className?: string; disabled?: boolean; isToday?: boolean }) {
  const [h, m] = (value || '00:00').split(':');

  const now = new Date();

  return (
    <div className={cn('flex gap-1', className)}>
      <Select value={h} onValueChange={(v) => onChange(`${v}:${m}`)} disabled={disabled}>
        <SelectTrigger className="w-[72px] h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
          {
          isToday ? 
          HOURS.filter(hour => Number(hour) > Number(now.getHours().toString().padStart(2, '0'))).map(hour => (
            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
          )): 
          HOURS.map(hour => (
            <SelectItem key={hour} value={hour}>{hour}</SelectItem>
          ))
          }
        </SelectContent>
      </Select>
      <span className="self-center text-muted-foreground text-sm">:</span>
      <Select value={m} onValueChange={(v) => onChange(`${h}:${v}`)} disabled={disabled}>
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

export const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
export const DAYS_OF_WEEK_LABELS = {
  SUNDAY: 'Sun',
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
};

export const TIME_SLOTS = [
  { value: 'morning', valueInHours: [6,7,8,9,10,11,12], label: 'Morning', desc: '6am - 12pm', tooltip: 'Reaches commuters and early-day listeners. Typically a high-performance slot for business, news, and fitness advertisers.' },
  { value: 'afternoon', valueInHours: [12,13,14,15,16,17,18], label: 'Afternoon', desc: '12pm - 6pm', tooltip: 'Captures lunchtime and afternoon listeners. Effective for lifestyle, food, and retail advertisers.' },
  { value: 'evening', valueInHours: [18,19,20,21,22,23,0], label: 'Evening', desc: '6pm - 12am', tooltip: 'High engagement period as listeners wind down. Strong for entertainment, home, and finance advertisers.' },
  { value: 'overnight', valueInHours: [0,1,2,3,4,5,6], label: 'Overnight', desc: '12am - 6am', tooltip: 'Lower volume but lower cost per impression. Consider deselecting if your audience is unlikely to be active at this time.' },
];

interface ScheduleData {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  timeSlots: string[];
  selectedHours?: number[];
}

interface Props {
  data: ScheduleData;
  onChange: (data: ScheduleData) => void;
  campaignStatus: string;
  disabled: boolean;
}

export default function CampaignScheduleStep({ data, onChange, campaignStatus, disabled }: Props) {
  const { isPro } = useSessionFlags();

  const selectedDays = data.daysOfWeek || DAYS_OF_WEEK;
  const selectedSlots = data.timeSlots || TIME_SLOTS.map(s => s.value);

  const [daysOfWeek, setDaysOfWeek] = useState(data.daysOfWeek || DAYS_OF_WEEK);
  const [timeSlots, setTimeSlots] = useState(data.timeSlots || TIME_SLOTS.map(s => s.value));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    
    const selectedHours = new Set(TIME_SLOTS.filter(item => next.includes(item.value)).flatMap(item => item.valueInHours));
    onChange({ ...data, timeSlots: next, selectedHours: Array.from(selectedHours) });
  };


  // useEffect(() => {
  
  //   console.log("date changed ");
  //   const newStartDate = new Date(startDate);
  //   newStartDate.setHours(Number(startTime.split(':')[0]), Number(startTime.split(':')[1]), 0, 0);
  //   const newEndDate = new Date(endDate);
  //   newEndDate.setHours(Number(endTime.split(':')[0]), Number(endTime.split(':')[1]), 0, 0);
  //   // onChange({ ...data, startDate: newStartDate, endDate: newEndDate });
  //   console.log("newStartDate", newStartDate.toISOString());
  //   console.log("newEndDate", newEndDate.toISOString());

  //   onChange({ ...data, startDate: newStartDate.toISOString(), endDate: newEndDate.toISOString() });

  // }, [startDate, endDate, startTime, endTime])
  

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const shouldDisable = disabled || !(campaignStatus === "" || campaignStatus?.toLowerCase() === "draft");


  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  return (
    <div className="space-y-6">
      <div className=" flex flex-col lg:flex-row gap-4">
        <div className="space-y-2 w-full">
          <Label className='flex items-center gap-2'><span>Start date and time ({timezone}) <sup>*</sup></span> </Label>
          <div className="flex gap-2">
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-10 justify-start text-left font-normal",
                    !data.startDate && "text-muted-foreground"
                  )}
                  disabled={shouldDisable}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.startDate
                    ? format(data.startDate, 'yyyy-MM-dd')
                    : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.startDate ? new Date(data.startDate) : undefined}
                  onSelect={(date) => {
                    const nextDate = new Date(date);
                    nextDate.setHours(nextDate.getHours() + 1);
                    onChange({ ...data, startDate: formatDate(date), endDate: new Date(data.endDate) <= date ? formatDate(nextDate) : data.endDate });
                    // setStartDate(date);
                    setStartOpen(false);
                  }}
                  disabled={(date) => date < today}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <TimeDropdown
              value={data.startTime || '00:00'}
              onChange={(val) => onChange({ ...data, startTime: val })}
              disabled={shouldDisable}
              isToday={data.startDate ? formatDate(new Date()) === formatDate(new Date(data.startDate)) : false}
            />
          </div>
        </div>
        <div className="space-y-2 w-full">
          <Label className='flex items-center gap-2'><span>End campaign at <sup>*</sup></span></Label>
          <div className="flex gap-2">
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 h-10 justify-start text-left font-normal",
                    !data.endDate && "text-muted-foreground"
                  )}
                  disabled={shouldDisable}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.endDate
                    ? format(data.endDate, 'yyyy-MM-dd')
                    : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.endDate ? new Date(data.endDate) : undefined}
                  onSelect={(date) => {
                    onChange({ ...data, endDate: formatDate(date)});
                    setEndOpen(false);
                  }}
                  disabled={(date) => {
                    const today = new Date(new Date().setHours(0, 0, 0, 0));
                    const start = data.startDate ? new Date(data.startDate) : today;
                    return date < start || date < today;
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <TimeDropdown
              value={data.endTime || '23:59'}
              onChange={(val) => onChange({ ...data, endTime: val })}
              disabled={shouldDisable}
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
            <p className="text-sm">
              Duration: {Math.max(1, differenceInCalendarDays(new Date(data.endDate), new Date(data.startDate)) + 1)} days
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
              ? Math.max(1, differenceInCalendarDays(new Date(data.endDate), new Date(data.startDate)) + 1)
              : 0;
            const selected = currentDuration === days;
            return (
              <div
                key={days}
                title='Select a common campaign length and the end date is set automatically from your start date.'
                onClick={() => {
                  const start = new Date(data.startDate);
                  const end = new Date(data.startDate);
                  end.setDate(end.getDate() + days - 1);
                  onChange({ ...data, startDate: formatDate(start), endDate: formatDate(end) });
                }}
                className={cn(
                  'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                  selected
                    ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                    : 'border-border hover:border-[#C8E6C9]',
                  shouldDisable && 'opacity-50 cursor-not-allowed'
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
            <Label className='flex items-center gap-2'>Active days  </Label>
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
                        : 'border-border hover:border-[#C8E6C9]',
                      shouldDisable && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {selected && (
                      <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-foreground" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{DAYS_OF_WEEK_LABELS[day]}</span>
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
            <Label className='flex items-center gap-2'>Active time slots </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map(({ value, label, desc, tooltip }) => {
                const selected = selectedSlots.includes(value);
                return (
                  <div
                    key={value}
                    onClick={() => toggleSlot(value)}
                    className={cn(
                      'border rounded-lg p-3 text-left cursor-pointer transition-all flex items-start gap-1.5',
                      selected
                        ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                        : 'border-border hover:border-[#C8E6C9]',
                      shouldDisable && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {selected && (
                      <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">{label} </p>
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
