import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, addDays, subDays, getDay, isBefore } from 'date-fns';

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

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

function getClassDateForWeek(dayOfWeek: number, referenceDate: Date): Date {
  const refDay = getDay(referenceDate);
  let diff = dayOfWeek - refDay;
  if (diff < 0) diff += 7;
  return addDays(startOfDay(referenceDate), diff);
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
          classDay: s.class_day || '',
          classTime: s.class_time || '',
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
      // Use a deterministic class_id based on schedule (no classes table rows needed)
      // Convention: 'schedule' — same as student side uses
      const classId = 'schedule';

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
        // Insert
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            class_id: classId,
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
      toast({ title: 'Error', description: 'Failed to update attendance.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Group students by class day for the current week
  const today = startOfDay(new Date());
  const currentWeekStudents = students
    .filter(s => s.classDay)
    .map(s => {
      const dow = DAY_NAME_TO_NUMBER[s.classDay] ?? -1;
      if (dow === -1) return null;
      const classDate = getClassDateForWeek(dow, today);
      // Only include if class date is today or earlier in this week
      // Adjust: show dates from Mon of this week through today
      const startOfWeek = addDays(today, -(getDay(today) === 0 ? 6 : getDay(today) - 1)); // Monday
      const dateStr = format(classDate, 'yyyy-MM-dd');
      const isPast = isBefore(classDate, addDays(today, 1)); // today or before
      const isThisWeek = !isBefore(classDate, startOfWeek);
      return {
        student: s,
        classDate,
        dateStr,
        isPast,
        isThisWeek,
        status: attendanceMap[s.id]?.[dateStr] || null,
      };
    })
    .filter(Boolean) as Array<{
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
      const dow = DAY_NAME_TO_NUMBER[s.classDay] ?? -1;
      if (dow === -1) return [];
      const dates = getPastClassDates(dow, 9); // get 9 to skip current
      const startOfWeek = addDays(today, -(getDay(today) === 0 ? 6 : getDay(today) - 1));
      return dates
        .filter(d => isBefore(d, startOfWeek)) // exclude current week
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

  return {
    students,
    currentWeekStudents,
    pastWeeksData,
    loading,
    saving,
    markAttendance,
    refetch: fetchData,
  };
}
