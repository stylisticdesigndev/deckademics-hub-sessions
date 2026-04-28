import { addDays, startOfDay, format, differenceInCalendarDays } from 'date-fns';

// Bi-weekly Monday → Sunday periods, anchored at this reference Monday.
// Adjust if the school changes its cadence.
const ANCHOR_MONDAY = new Date(2024, 0, 1); // Mon, Jan 1, 2024
const PERIOD_DAYS = 14;

export interface PayPeriod {
  start: Date;
  end: Date;
  startStr: string; // yyyy-MM-dd
  endStr: string;
}

export function getPayPeriodForDate(input: Date | string): PayPeriod {
  const date = startOfDay(typeof input === 'string' ? new Date(input) : input);
  const diff = differenceInCalendarDays(date, ANCHOR_MONDAY);
  const periodIndex = Math.floor(diff / PERIOD_DAYS);
  const start = addDays(ANCHOR_MONDAY, periodIndex * PERIOD_DAYS);
  const end = addDays(start, PERIOD_DAYS - 1);
  return {
    start,
    end,
    startStr: format(start, 'yyyy-MM-dd'),
    endStr: format(end, 'yyyy-MM-dd'),
  };
}

export function formatPayPeriodUS(input: Date | string): string {
  const p = getPayPeriodForDate(input);
  return `${format(p.start, 'MM/dd/yyyy')} – ${format(p.end, 'MM/dd/yyyy')}`;
}