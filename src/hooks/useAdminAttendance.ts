
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  className?: string;
}

export const useAdminAttendance = () => {
  const queryClient = useQueryClient();

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['admin', 'attendance'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            id,
            student_id,
            class_id,
            date,
            status,
            notes,
            students!inner (
              id,
              profiles (
                first_name,
                last_name
              )
            ),
            classes (
              title
            )
          `)
          .eq('status', 'present' as any);

        if (error) {
          console.error('Error fetching attendance:', error);
          throw error;
        }

        const records: AttendanceRecord[] = [];
        
        if (data && Array.isArray(data)) {
          for (const record of data) {
            if (record && typeof record === 'object') {
              const recordObj = record as any;
              const id = recordObj.id;
              const student_id = recordObj.student_id;
              const date = recordObj.date;
              const status = recordObj.status;
              const notes = recordObj.notes;
              const students = recordObj.students;
              const classes = recordObj.classes;

              if (id && student_id && students) {
                const profile = students.profiles;
                const firstName = profile?.first_name || '';
                const lastName = profile?.last_name || '';
                const className = classes?.title || 'Unknown Class';

                records.push({
                  id,
                  studentId: student_id,
                  studentName: `${firstName} ${lastName}`.trim(),
                  date: date || '',
                  status: status || 'present',
                  notes: notes || '',
                  className
                });
              }
            }
          }
        }

        return records;
      } catch (error) {
        console.error('Error in attendance query:', error);
        return [];
      }
    }
  });

  const { data: attendanceStats } = useQuery({
    queryKey: ['admin', 'attendance-stats'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('date')
          .eq('student_id', 'dummy' as any)
          .eq('status', 'present' as any);

        if (error) {
          console.error('Error fetching attendance stats:', error);
          return { totalClasses: 0, averageAttendance: 0 };
        }

        const totalClasses = data?.length || 0;
        const averageAttendance = totalClasses > 0 ? 85 : 0; // Mock calculation

        return { totalClasses, averageAttendance };
      } catch (error) {
        console.error('Error in attendance stats query:', error);
        return { totalClasses: 0, averageAttendance: 0 };
      }
    }
  });

  const { data: studentAttendance } = useQuery({
    queryKey: ['admin', 'student-attendance'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('status')
          .eq('student_id', 'dummy' as any)
          .eq('date', new Date().toISOString().split('T')[0] as any);

        if (error) {
          console.error('Error fetching student attendance:', error);
          return null;
        }

        const record = data?.[0];
        return record?.status || null;
      } catch (error) {
        console.error('Error in student attendance query:', error);
        return null;
      }
    }
  });

  const updateAttendance = useMutation({
    mutationFn: async ({ recordId, status }: { recordId: string; status: AttendanceStatus }) => {
      const { error } = await supabase
        .from('attendance')
        .update({ status } as any)
        .eq('id', recordId as any);

      if (error) throw error;
      return { success: true, recordId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
      toast.success('Attendance updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update attendance: ${error.message}`);
    }
  });

  const deleteAttendance = useMutation({
    mutationFn: async (recordId: string) => {
      const { data, error } = await supabase
        .from('attendance')
        .select('class_id')
        .eq('id', recordId as any)
        .single();

      if (error) throw error;

      const record = data as any;
      const class_id = record?.class_id;

      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordId as any);

      if (deleteError) throw deleteError;

      return { success: true, recordId, classId: class_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
      toast.success('Attendance record deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete attendance: ${error.message}`);
    }
  });

  const createAttendance = useMutation({
    mutationFn: async (newRecord: {
      studentId: string;
      classId: string;
      date: string;
      status: string;
      notes: string;
    }) => {
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: newRecord.studentId,
          class_id: newRecord.classId,
          date: newRecord.date,
          status: newRecord.status,
          notes: newRecord.notes
        } as any);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
      toast.success('Attendance record created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create attendance: ${error.message}`);
    }
  });

  return {
    attendanceRecords: attendanceRecords || [],
    attendanceStats: attendanceStats || { totalClasses: 0, averageAttendance: 0 },
    studentAttendance,
    isLoading,
    updateAttendance,
    deleteAttendance,
    createAttendance
  };
};
