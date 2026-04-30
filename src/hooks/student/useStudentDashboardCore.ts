import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { addDays, getDay, startOfDay, format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { useUpcomingClasses } from './dashboard/useUpcomingClasses';
import { useStudentProgress } from './dashboard/useStudentProgress';
import { supabase } from '@/integrations/supabase/client';

export interface StudentData {
  level: string;
  totalProgress: number;
  currentModule: string;
  moduleProgress: number;
  hoursCompleted: number;
  instructor: string;
  nextClass: string;
}

export function useStudentDashboardCore() {
  const { session, userData } = useAuth();
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentLevel, setStudentLevel] = useState('Novice');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [assignedInstructor, setAssignedInstructor] = useState<string | null>(null);
  const [classDay, setClassDay] = useState<string | null>(null);
  const [classTime, setClassTime] = useState<string | null>(null);
  const [classRoom, setClassRoom] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const dataFetchedRef = useRef(false);

  // Only resolve userId once role is confirmed to prevent flicker
  const userId = userData?.role === 'student' ? session?.user?.id : undefined;

  const { upcomingClasses, loading: classesLoading } = useUpcomingClasses();
  const { progress: progressData, loading: progressLoading } = useStudentProgress(userId);

  // Reset refs on mount (fixes React StrictMode double-mount)
  useEffect(() => {
    isMountedRef.current = true;
    dataFetchedRef.current = false;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch student record independently - no waiting for classes/progress
  const fetchStudentInfo = useCallback(async () => {
    if (!userId || !isMountedRef.current) return;

    try {
      setStudentLoading(true);
      setFetchError(null);

      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select('level, enrollment_status, notes, instructor_id, class_day, class_time, class_room')
        .eq('id', userId as any)
        .maybeSingle();

      if (!isMountedRef.current) return;

      if (studentError) {
        if (studentError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('students')
            .insert({ id: userId } as any);

          if (insertError && isMountedRef.current) {
            setFetchError(`Failed to create student record: ${insertError.message}`);
          }
        } else {
          setFetchError(studentError.message);
        }
      } else if (studentInfo && typeof studentInfo === 'object') {
        const rawLevel = studentInfo.level || 'Novice';
        setStudentLevel(rawLevel.charAt(0).toUpperCase() + rawLevel.slice(1));
        setClassDay(studentInfo.class_day || null);
        setClassTime(studentInfo.class_time || null);
        setClassRoom((studentInfo as any).class_room || null);
        // Fetch assigned instructor name
        if (studentInfo.instructor_id) {
          const { data: instructorProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, dj_name')
            .eq('id', studentInfo.instructor_id)
            .single();
          
          if (isMountedRef.current && instructorProfile) {
            const dj = ((instructorProfile as any).dj_name || '').trim();
            const full = `${instructorProfile.first_name || ''} ${instructorProfile.last_name || ''}`.trim();
            setAssignedInstructor(dj || full || null);
          }
        }
      }

      dataFetchedRef.current = true;
    } catch (e: any) {
      if (isMountedRef.current) {
        setFetchError(e.message || 'An unknown error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setStudentLoading(false);
      }
    }
  }, [userId]);

  // Fetch immediately when userId is available
  useEffect(() => {
    if (userId && !dataFetchedRef.current) {
      fetchStudentInfo();
    } else if (!userId) {
      setStudentLoading(false);
    }
  }, [userId, fetchStudentInfo]);

  // Derive totalProgress reactively from progressData
  const totalProgress = useMemo(() => {
    if (!progressData || !Array.isArray(progressData) || progressData.length === 0) return 0;
    const total = progressData.reduce((sum: number, item: any) =>
      sum + (typeof item.proficiency === 'number' ? item.proficiency : 0), 0);
    return Math.round(total / progressData.length);
  }, [progressData]);

  // Derive nextClass from student's assigned schedule (class_day/class_time)
  const nextClassInfo = useMemo(() => {
    if (classDay && classTime) {
      // Calculate the next occurrence of classDay
      const dayNameToNumber: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6,
      };
      const targetDay = dayNameToNumber[classDay] ?? -1;
      if (targetDay >= 0) {
        const today = startOfDay(new Date());
        const todayDow = getDay(today);
        let diff = targetDay - todayDow;
        if (diff <= 0) diff += 7; // next week if today or past
        const nextDate = addDays(today, diff);
        const dateStr = format(nextDate, 'M/d/yyyy');
        return {
          nextClass: `${classDay}, ${dateStr} at ${classTime.split(' - ')[0]}`,
          instructor: assignedInstructor || 'Not assigned',
        };
      }
    }
    if (upcomingClasses.length > 0) {
      return {
        nextClass: `${upcomingClasses[0].date} at ${upcomingClasses[0].time}`,
        instructor: assignedInstructor || upcomingClasses[0].instructor,
      };
    }
    return { nextClass: 'Not scheduled', instructor: assignedInstructor || 'Not assigned' };
  }, [classDay, classTime, upcomingClasses, assignedInstructor]);

  // Build a synthetic "today's class" from the student's assigned weekly slot
  // so the dashboard's "Today's Class" card reflects the real schedule
  // (the `classes` table is not populated per-week for recurring student slots).
  const scheduledClasses = useMemo(() => {
    if (!classDay || !classTime) return upcomingClasses;

    const dayNameToNumber: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6,
    };
    const targetDay = dayNameToNumber[classDay] ?? -1;
    if (targetDay < 0) return upcomingClasses;

    const today = startOfDay(new Date());
    const todayDow = getDay(today);
    let diff = targetDay - todayDow;
    if (diff < 0) diff += 7;
    const nextDate = addDays(today, diff);
    const dateStr = format(nextDate, 'MM/dd/yyyy'); // matches formatDateUS

    // Parse "3:30 PM - 5:00 PM" into start/end and compute duration
    const [startStr, endStr] = classTime.split(' - ').map((s) => s.trim());
    const parseTo24 = (t: string) => {
      const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!m) return null;
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const period = m[3]?.toUpperCase();
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + min;
    };
    const startMin = parseTo24(startStr || '');
    const endMin = parseTo24(endStr || '');
    let duration = '1h 30m';
    if (startMin !== null && endMin !== null && endMin > startMin) {
      const d = endMin - startMin;
      duration = `${Math.floor(d / 60)}h ${d % 60}m`;
    }

    const synthetic = {
      id: `assigned-${classDay}-${startStr}`,
      title: 'DJ Class',
      instructor: assignedInstructor || 'Not assigned',
      date: dateStr,
      time: startStr || classTime,
      duration,
      location: classRoom || 'Not assigned',
      attendees: 0,
      isUpcoming: true,
    };

    // Avoid duplicating if a real class already exists for the same date+time
    const dedup = upcomingClasses.filter(
      (c) => !(c.date === synthetic.date && c.time === synthetic.time)
    );
    return [synthetic, ...dedup];
  }, [classDay, classTime, classRoom, assignedInstructor, upcomingClasses]);

  // Derive first-time user status
  useEffect(() => {
    if (!classesLoading && !progressLoading && dataFetchedRef.current) {
      setIsFirstTimeUser(upcomingClasses.length === 0 && (!progressData || progressData.length === 0));
    }
  }, [classesLoading, progressLoading, upcomingClasses, progressData]);

  const studentData: StudentData = useMemo(() => ({
    level: studentLevel,
    totalProgress,
    currentModule: 'Not started',
    moduleProgress: 0,
    hoursCompleted: 0,
    instructor: nextClassInfo.instructor,
    nextClass: nextClassInfo.nextClass,
  }), [studentLevel, totalProgress, nextClassInfo]);

  return {
    userId,
    loading: studentLoading || classesLoading || progressLoading,
    studentData,
    isFirstTimeUser,
    progressData,
    upcomingClasses: scheduledClasses,
    fetchStudentInfo,
    fetchError
  };
}
