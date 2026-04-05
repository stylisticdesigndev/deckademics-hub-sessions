
import { eachDayOfInterval, getDay } from 'date-fns';

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Parse a time string like "2:00 PM" into fractional hours from midnight.
 */
function parseTime(timeStr: string): number {
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours + minutes / 60;
}

/**
 * Parse an hours string like "2:00 PM - 5:00 PM" or comma-separated
 * "3:30 PM - 5:00 PM, 5:30 PM - 7:00 PM" into total duration in hours.
 */
export function parseHoursDuration(hoursStr: string): number {
  // Split by comma first for multi-slot support
  const slots = hoursStr.split(',').map(s => s.trim()).filter(Boolean);
  let total = 0;

  for (const slot of slots) {
    const parts = slot.split(/\s*[-–]\s*/);
    if (parts.length !== 2) continue;

    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);

    if (end > start) {
      total += end - start;
    }
  }

  return total;
}

/**
 * Count how many times a specific day-of-week occurs in a date range.
 */
export function countDayOccurrences(
  startDate: Date,
  endDate: Date,
  dayName: string
): number {
  const dayIndex = DAY_MAP[dayName.toLowerCase()];
  if (dayIndex === undefined) return 0;

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(d => getDay(d) === dayIndex).length;
}

export interface ScheduleEntry {
  day: string;
  hours: string;
}

export interface GeneratedPayment {
  instructorId: string;
  instructorName: string;
  hourlyRate: number;
  totalHours: number;
  totalAmount: number;
}

/**
 * Calculate total hours and amount for an instructor given their schedule and a date range.
 */
export function calculateScheduledHours(
  schedules: ScheduleEntry[],
  startDate: Date,
  endDate: Date,
  hourlyRate: number
): { totalHours: number; totalAmount: number } {
  let totalHours = 0;

  for (const entry of schedules) {
    const occurrences = countDayOccurrences(startDate, endDate, entry.day);
    const hoursPerSession = parseHoursDuration(entry.hours);
    totalHours += occurrences * hoursPerSession;
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalAmount: Math.round(totalHours * hourlyRate * 100) / 100,
  };
}
