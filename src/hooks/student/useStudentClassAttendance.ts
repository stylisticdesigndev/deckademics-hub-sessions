import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
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

      // Get student's enrolled classes
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

      // Get the class details (use the first/primary class)
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

      // Get instructor name
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
        location: cls.location || 'Main Studio',
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
            status: (a.status as 'present' | 'absent' | 'late') || 'present',
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

      // Insert into student_absences
      const { error: absenceError } = await supabase
        .from('student_absences' as any)
        .insert({
          student_id: studentId,
          class_id: classId,
          absence_date: dateStr,
          reason: reason || null,
        });

      if (absenceError) throw absenceError;

      // Insert into attendance table so instructor/admin see it
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          class_id: classId,
          date: dateStr,
          status: 'absent',
          notes: reason ? `Student marked absent: ${reason}` : 'Student marked absent',
        });

      if (attendanceError) throw attendanceError;

      // Update local state
      setAttendanceRecords(prev => [
        ...prev,
        { date: dateStr, status: 'absent', classId },
      ]);

      toast({
        title: 'Marked absent',
        description: 'Your instructor has been notified. This class will be available for makeup.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark absence.',
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
