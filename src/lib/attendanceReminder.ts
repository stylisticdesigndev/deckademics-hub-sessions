import { addDays, getDay, startOfDay, format, isBefore, differenceInDays } from 'date-fns';

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

// How long after a class ends before logging attendance is considered overdue.
const OVERDUE_AFTER_HOURS = 2;

export interface ReminderStudent {
  id: string;
  name: string;
  classDay?: string | null;
  classTime?: string | null;
}

function getClassDayNumber(day?: string | null): number {
  const normalized = (day || '').trim().toLowerCase().replace(/s$/, '');
  return DAY_NAME_TO_NUMBER[normalized] ?? -1;
}

// Parse the END time from a range like "3:30 PM - 5:00 PM" -> { h, m }.
function parseClassEndTime(classTime?: string | null): { h: number; m: number } | null {
  if (!classTime) return null;
  const parts = classTime.split('-');
  const endPart = (parts[1] ?? parts[0]).trim();
  const match = endPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return { h, m };
}

// Most recent occurrence (today or earlier) of the given weekday.
function mostRecentOccurrence(dayOfWeek: number, now: Date): Date {
  const today = startOfDay(now);
  const todayDow = getDay(today);
  let diff = dayOfWeek - todayDow;
  if (diff > 0) diff -= 7;
  return addDays(today, diff);
}

/**
 * Returns the names of students whose most recent class already ended more than
 * OVERDUE_AFTER_HOURS ago (within the last 7 days) and still has no attendance
 * record for that class date.
 */
export function getOverdueAttendanceStudents(
  students: ReminderStudent[],
  attendanceMap: Record<string, Record<string, 'present' | 'absent'>>,
  now: Date = new Date(),
): string[] {
  const overdue: string[] = [];

  for (const s of students) {
    const dow = getClassDayNumber(s.classDay);
    if (dow === -1) continue;
    const end = parseClassEndTime(s.classTime);
    if (!end) continue;

    const classDate = mostRecentOccurrence(dow, now);
    // Ignore occurrences older than a week to avoid nagging about stale history.
    if (differenceInDays(startOfDay(now), classDate) > 7) continue;

    const classEnd = new Date(classDate);
    classEnd.setHours(end.h, end.m, 0, 0);
    const deadline = new Date(classEnd.getTime() + OVERDUE_AFTER_HOURS * 60 * 60 * 1000);
    if (isBefore(now, deadline)) continue; // class hasn't passed the grace window yet

    const dateStr = format(classDate, 'yyyy-MM-dd');
    const marked = attendanceMap[s.id]?.[dateStr];
    if (!marked) overdue.push(s.name);
  }

  return overdue;
}
