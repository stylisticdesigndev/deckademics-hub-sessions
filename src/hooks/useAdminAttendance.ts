
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

type AttendanceStatus = 'missed' | 'attended' | 'made-up';

export interface Student {
  id: string;
  name: string;
  email: string;
  classDate: Date;
  status: AttendanceStatus;
  makeupDate: Date | null;
}

export const useAdminAttendance = () => {
  const queryClient = useQueryClient();

  // Fetch missed attendance records
  const { data: missedAttendance, isLoading } = useQuery({
    queryKey: ['admin', 'attendance', 'missed'],
    queryFn: async () => {
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          notes,
          student_id,
          class_id,
          students:student_id(
            id,
            profile:profiles(first_name, last_name, email)
          ),
          classes:class_id(
            title,
            start_time
          )
        `)
        .eq('status', 'missed');

      if (error) throw error;

      // Transform the data to match our Student interface
      const transformedData = attendanceData.map(record => ({
        id: record.id,
        studentId: record.student_id,
        name: `${record.students.profile.first_name} ${record.students.profile.last_name}`,
        email: record.students.profile.email,
        classDate: new Date(record.date),
        status: record.status as AttendanceStatus,
        makeupDate: null, // We'll get this from a separate query
        classTitle: record.classes.title,
        notes: record.notes
      }));

      // Now fetch makeup dates for these records
      for (const record of transformedData) {
        const { data: makeupData } = await supabase
          .from('attendance')
          .select('date')
          .eq('student_id', record.studentId)
          .eq('status', 'makeup')
          .gt('date', record.classDate.toISOString())
          .order('date', { ascending: true })
          .limit(1);

        if (makeupData && makeupData.length > 0) {
          record.makeupDate = new Date(makeupData[0].date);
          if (new Date() > record.makeupDate) {
            // If the makeup date has passed, check if they attended
            const { data: attendedData } = await supabase
              .from('attendance')
              .select('status')
              .eq('student_id', record.studentId)
              .eq('date', format(record.makeupDate, 'yyyy-MM-dd'));
            
            if (attendedData && attendedData.length > 0 && attendedData[0].status === 'attended') {
              record.status = 'made-up';
            }
          }
        }
      }

      return transformedData;
    }
  });

  // Update attendance status
  const updateStatus = useMutation({
    mutationFn: async ({ studentId, attendanceId, status }: { studentId: string, attendanceId: string, status: AttendanceStatus }) => {
      const { error } = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', attendanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
      toast.success('Attendance status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update attendance status: ' + error.message);
    }
  });

  // Schedule makeup class
  const scheduleMakeup = useMutation({
    mutationFn: async ({ studentId, date, missedClassId }: { studentId: string, date: Date, missedClassId: string }) => {
      // Create a new attendance record for the makeup class
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId,
          date: format(date, 'yyyy-MM-dd'),
          status: 'makeup',
          notes: `Makeup class for missed class on ${missedClassId}`
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
      toast.success('Makeup class scheduled successfully');
    },
    onError: (error) => {
      toast.error('Failed to schedule makeup class: ' + error.message);
    }
  });

  // Calculate stats
  const missedCount = missedAttendance?.filter(s => s.status === 'missed').length || 0;
  const scheduledMakeups = missedAttendance?.filter(s => s.makeupDate !== null).length || 0;
  
  // Calculate attendance rate (assuming 90% is baseline if no missed classes)
  const attendanceRate = missedCount > 0 ? 90 - (missedCount * 5) : 90;

  return {
    missedAttendance,
    isLoading,
    updateStatus: (studentId: string, attendanceId: string, status: AttendanceStatus) => 
      updateStatus.mutate({ studentId, attendanceId, status }),
    scheduleMakeup: (studentId: string, date: Date, missedClassId: string) => 
      scheduleMakeup.mutate({ studentId, date, missedClassId }),
    stats: {
      missedCount,
      scheduledMakeups,
      attendanceRate
    }
  };
};
