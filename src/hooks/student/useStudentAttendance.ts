import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AttendanceCounts {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export const useStudentAttendance = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-attendance-counts', studentId],
    queryFn: async (): Promise<AttendanceCounts> => {
      if (!studentId) return { present: 0, absent: 0, late: 0, total: 0 };

      const { data, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId as any);

      if (error) throw error;

      const counts: AttendanceCounts = { present: 0, absent: 0, late: 0, total: 0 };
      (data || []).forEach((row: any) => {
        counts.total++;
        const s = (row.status || 'present').toLowerCase();
        if (s === 'present') counts.present++;
        else if (s === 'absent') counts.absent++;
        else if (s === 'late') counts.late++;
        else counts.present++;
      });
      return counts;
    },
    enabled: !!studentId,
  });
};
