import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, addDays, subDays, getDay, isBefore } from 'date-fns';

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const DAY_DISPLAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CLASS_TIME_ORDER = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];

function normalizeClassDay(day?: string | null): string {
  const normalized = (day || '').trim().toLowerCase().replace(/s$/, '');
  const dayNumber = DAY_NAME_TO_NUMBER[normalized];
  return dayNumber === undefined ? (day || '').trim() : DAY_DISPLAY_NAMES[dayNumber];
}

function getClassDayNumber(day: string): number {
  return DAY_NAME_TO_NUMBER[day.trim().toLowerCase()] ?? -1;
}

function getClassTimeSortValue(time: string): number {
  const index = CLASS_TIME_ORDER.indexOf(time);
  return index === -1 ? 999 : index;
}

interface StudentSchedule {
  id: string;
  name: string;
  initials: string;
  avatar?: string | null;
  level: string;
  classDay: string;
  classTime: string;
}

export interface AttendanceEntry {
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | null; // null = unmarked
}

function getClassDateForCurrentWeek(dayOfWeek: number, weekStart: Date): Date {
  // weekStart is Monday of the current week
  // Monday=1, Tuesday=2, ..., Sunday=0
  // Offset from Monday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDays(weekStart, offset);
}

function getPastClassDates(dayOfWeek: number, weeksBack: number): Date[] {
  const today = startOfDay(new Date());
  const dates: Date[] = [];
  // Find the most recent occurrence of this day (could be today)
  const todayDow = getDay(today);
  let diff = dayOfWeek - todayDow;
  if (diff > 0) diff -= 7; // go to past
  if (diff === 0 && !isBefore(today, today)) diff = 0; // today counts
  const lastOccurrence = addDays(today, diff);

  for (let i = 0; i < weeksBack; i++) {
    const d = subDays(lastOccurrence, i * 7);
    if (isBefore(d, today) || format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      dates.push(d);
    }
  }
  return dates;
}

export function useInstructorAttendance(instructorId: string | undefined) {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentSchedule[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, 'present' | 'absent'>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!instructorId) { setLoading(false); return; }
    setLoading(true);

    try {
      // Fetch assigned students with profile
      const { data: assignedStudents, error } = await supabase
        .from('students')
        .select('id, level, class_day, class_time, profiles!inner(first_name, last_name, avatar_url)')
        .eq('instructor_id', instructorId)
        .eq('enrollment_status', 'active') as any;

      if (error) { console.error(error); setLoading(false); return; }
      if (!assignedStudents?.length) { setStudents([]); setLoading(false); return; }

      const formatted: StudentSchedule[] = assignedStudents.map((s: any) => {
        const p = s.profiles;
        const fn = p?.first_name || '';
        const ln = p?.last_name || '';
        return {
          id: s.id,
          name: `${fn} ${ln}`.trim() || 'Unknown',
          initials: (fn[0] || '') + (ln[0] || ''),
          avatar: p?.avatar_url,
          level: s.level || 'novice',
          classDay: normalizeClassDay(s.class_day),
          classTime: (s.class_time || '').trim(),
        };
      });
      setStudents(formatted);

      // Fetch attendance records for these students
      const studentIds = formatted.map(s => s.id);
      const { data: records } = await supabase
        .from('attendance')
        .select('student_id, date, status')
        .in('student_id', studentIds);

      const map: Record<string, Record<string, 'present' | 'absent'>> = {};
      (records || []).forEach((r: any) => {
        if (!map[r.student_id]) map[r.student_id] = {};
        map[r.student_id][r.date] = r.status as 'present' | 'absent';
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error('Error fetching instructor attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markAttendance = async (studentId: string, date: string, status: 'present' | 'absent') => {
    setSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', studentId)
        .eq('date', date)
        .limit(1) as any;

      if (existing && existing.length > 0) {
        // Update
        const { error } = await supabase
          .from('attendance')
          .update({ status } as any)
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        // Insert — class_id is now nullable; schedule-based attendance has no class row
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            date,
            status,
          } as any);
        if (error) throw error;
      }

      // Update local state
      setAttendanceMap(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], [date]: status },
      }));
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update attendance.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Group students by class day for the current week
  const today = startOfDay(new Date());
  const startOfWeekDate = addDays(today, -(getDay(today) === 0 ? 6 : getDay(today) - 1)); // Monday
  const currentWeekStudents = students
    .filter(s => s.classDay)
    .map(s => {
      const dow = getClassDayNumber(s.classDay);
      if (dow === -1) return null;
      const classDate = getClassDateForCurrentWeek(dow, startOfWeekDate);
      const dateStr = format(classDate, 'yyyy-MM-dd');
      const isPast = isBefore(classDate, addDays(today, 1)); // today or before
      return {
        student: s,
        classDate,
        dateStr,
        isPast,
        isThisWeek: true,
        status: attendanceMap[s.id]?.[dateStr] || null,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const dateDiff = a.classDate.getTime() - b.classDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      return getClassTimeSortValue(a.student.classTime) - getClassTimeSortValue(b.student.classTime);
    }) as Array<{
      student: StudentSchedule;
      classDate: Date;
      dateStr: string;
      isPast: boolean;
      isThisWeek: boolean;
      status: 'present' | 'absent' | null;
    }>;

  // Past weeks data (last 8 weeks, excluding current week)
  const pastWeeksData = students
    .filter(s => s.classDay)
    .flatMap(s => {
      const dow = getClassDayNumber(s.classDay);
      if (dow === -1) return [];
      const dates = getPastClassDates(dow, 9); // get 9 to skip current
      return dates
        .filter(d => isBefore(d, startOfWeekDate)) // exclude current week
        .map(d => {
          const dateStr = format(d, 'yyyy-MM-dd');
          return {
            student: s,
            classDate: d,
            dateStr,
            status: attendanceMap[s.id]?.[dateStr] || null,
          };
        });
    });

  // Today's students for dashboard widget
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayStudents = currentWeekStudents.filter(s => s.dateStr === todayStr);

  return {
    students,
    currentWeekStudents,
    todayStudents,
    pastWeeksData,
    loading,
    saving,
    markAttendance,
    refetch: fetchData,
  };
}
