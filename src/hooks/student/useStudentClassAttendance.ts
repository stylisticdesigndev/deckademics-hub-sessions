import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

/** Parse "3:30 PM" → hours (0-23) */
function parseTimeToHours(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 12;
  let h = parseInt(match[1], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h;
}

/** Parse "3:30 PM" → minutes */
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  return parseInt(match[2], 10);
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  classId: string;
}

export interface ClassInfo {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  instructorId: string | null;
  instructorName: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
}

export function useStudentClassAttendance() {
  const { session } = useAuth();
  const { toast } = useToast();
  const studentId = session?.user?.id;

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get student's schedule info (class_day, class_time) and instructor
      const { data: studentData } = await supabase
        .from('students')
        .select('class_day, class_time, instructor_id')
        .eq('id', studentId)
        .single();

      if (!studentData || !studentData.class_day || !studentData.class_time) {
        // Fallback: try enrollments-based approach
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', studentId)
          .eq('status', 'active');

        if (!enrollments || enrollments.length === 0) {
          setLoading(false);
          return;
        }

        const classIds = enrollments.map(e => e.class_id);

        const { data: classes } = await supabase
          .from('classes')
          .select('id, title, location, start_time, end_time, instructor_id')
          .in('id', classIds)
          .limit(1);

        if (!classes || classes.length === 0) {
          setLoading(false);
          return;
        }

        const cls = classes[0];
        const startDate = new Date(cls.start_time);
        const dayOfWeek = startDate.getDay();

        let instructorName = 'Not assigned';
        if (cls.instructor_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', cls.instructor_id)
            .single();
          if (profile) {
            instructorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Instructor';
          }
        }

        setClassInfo({
          id: cls.id,
          title: cls.title,
          location: cls.location || 'Classroom 1',
          startTime: cls.start_time,
          endTime: cls.end_time,
          instructorId: cls.instructor_id,
          instructorName,
          dayOfWeek,
        });

        // Get attendance records
        const { data: attendance } = await supabase
          .from('attendance')
          .select('date, status, class_id')
          .eq('student_id', studentId)
          .in('class_id', classIds);

        if (attendance) {
          setAttendanceRecords(
            attendance.map(a => ({
              date: a.date,
              status: (a.status as 'present' | 'absent') || 'present',
              classId: a.class_id,
            }))
          );
        }

        setLoading(false);
        return;
      }

      // Use student schedule data (class_day, class_time)
      const dayNameToNumber: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6,
      };
      const dayOfWeek = dayNameToNumber[studentData.class_day] ?? 1;

      // Parse time slot to create start/end times
      const timeSlot = studentData.class_time; // e.g. "3:30 PM - 5:00 PM"
      const timeParts = timeSlot.split(' - ');
      const startTimeStr = timeParts[0] || '3:30 PM';
      const endTimeStr = timeParts[1] || '5:00 PM';

      // Create representative dates for display
      const now = new Date();
      const startTime = new Date(now);
      startTime.setHours(parseTimeToHours(startTimeStr), parseTimeToMinutes(startTimeStr), 0);
      const endTime = new Date(now);
      endTime.setHours(parseTimeToHours(endTimeStr), parseTimeToMinutes(endTimeStr), 0);

      // Get instructor name
      let instructorName = 'Not assigned';
      if (studentData.instructor_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', studentData.instructor_id)
          .single();
        if (profile) {
          instructorName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Instructor';
        }
      }

      setClassInfo({
        id: 'schedule',
        title: `${studentData.class_day} Class`,
        location: 'Classroom 1',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        instructorId: studentData.instructor_id,
        instructorName,
        dayOfWeek,
      });

      // Get attendance records from attendance table
      const { data: attendance } = await supabase
        .from('attendance')
        .select('date, status, class_id')
        .eq('student_id', studentId);

      if (attendance) {
        setAttendanceRecords(
          attendance.map(a => ({
            date: a.date,
            status: (a.status as 'present' | 'absent') || 'present',
            classId: a.class_id,
          }))
        );
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);



  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAbsent = async (classId: string, absenceDate: Date, reason?: string) => {
    if (!studentId) return;
    setMarking(true);

    try {
      const dateStr = absenceDate.toISOString().split('T')[0];

      // The synthetic 'schedule' id is not a real UUID — don't send it to UUID columns.
      const realClassId = classId && classId !== 'schedule' ? classId : null;

      // Insert into student_absences
      // student_absences.class_id is NOT NULL, so only insert there if we have a real class id.
      if (realClassId) {
        const { error: absenceError } = await supabase
          .from('student_absences' as any)
          .insert({
            student_id: studentId,
            class_id: realClassId,
            absence_date: dateStr,
            reason: reason || null,
          });

        if (absenceError) throw absenceError;
      }

      // Insert into attendance table so instructor/admin see it
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          class_id: realClassId,
          date: dateStr,
          status: 'absent',
          notes: reason ? `Student marked absent: ${reason}` : 'Student marked absent',
        });

      if (attendanceError) throw attendanceError;

      // Update local state
      setAttendanceRecords(prev => [
        ...prev,
        { date: dateStr, status: 'absent', classId: realClassId || classId },
      ]);

      toast({
        title: 'Marked absent',
        description: 'Your instructor has been notified. This class will be available for makeup.',
      });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('markAbsent error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMarking(false);
    }
  };

  return {
    classInfo,
    attendanceRecords,
    loading,
    marking,
    markAbsent,
    refetch: fetchData,
  };
}
