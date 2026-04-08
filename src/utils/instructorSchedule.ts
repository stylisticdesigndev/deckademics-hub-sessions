export const CLASS_SLOTS = [
  '3:30 PM - 5:00 PM',
  '5:30 PM - 7:00 PM',
  '7:30 PM - 9:00 PM',
] as const;

export const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const classSlotSet = new Set<string>(CLASS_SLOTS);

export type TeachingScheduleItem = {
  id?: string;
  day: string;
  hours: string;
};

export const sanitizeScheduleHours = (hours: string | null | undefined) => {
  if (!hours) return '';

  return hours
    .split(',')
    .map((slot) => slot.trim())
    .filter((slot) => classSlotSet.has(slot))
    .sort((a, b) => CLASS_SLOTS.indexOf(a as (typeof CLASS_SLOTS)[number]) - CLASS_SLOTS.indexOf(b as (typeof CLASS_SLOTS)[number]))
    .join(', ');
};

export const sanitizeScheduleItems = <T extends TeachingScheduleItem>(items: T[]) => {
  return items
    .map((item) => ({
      ...item,
      hours: sanitizeScheduleHours(item.hours),
    }))
    .filter((item) => item.hours.length > 0)
    .sort((a, b) => DAY_ORDER.indexOf(a.day as (typeof DAY_ORDER)[number]) - DAY_ORDER.indexOf(b.day as (typeof DAY_ORDER)[number]));
};
