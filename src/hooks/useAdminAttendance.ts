
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { isDataObject, hasProperty } from '@/utils/supabaseHelpers';

type AttendanceStatus = 'missed' | 'attended' | 'made-up';

interface StudentProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface StudentsData {
  id?: string;
  profiles?: StudentProfile[];
}

interface ClassData {
  title?: string;
  start_time?: string;
}

export interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  classDate: Date;
  status: AttendanceStatus;
  makeupDate: Date | null;
  classTitle: string;
  notes: string | null;
}

export const useAdminAttendance = () => {
  const queryClient = useQueryClient();
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); 
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });

  // Fetch all attendance records for current week to calculate stats
  const { data: weeklyAttendance, isLoading: isLoadingWeeklyAttendance } = useQuery({
    queryKey: ['admin', 'attendance', 'weekly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          class_id
        `)
        .gte('date', format(startOfCurrentWeek, 'yyyy-MM-dd'))
        .lte('date', format(endOfCurrentWeek, 'yyyy-MM-dd'));

      if (error) {
        console.error('Error fetching weekly attendance:', error);
        throw error;
      }
      return data || [];
    }
  });

  // Fetch missed attendance records
  const { data: missedAttendance, isLoading: isLoadingMissedAttendance } = useQuery({
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
            profiles(first_name, last_name, email)
          ),
          classes:class_id(
            title,
            start_time
          )
        `)
        .eq('status', 'missed' as any);

      if (error) throw error;

      // Transform the data to match our Student interface - with proper access to nested data
      const transformedData = attendanceData
        .filter(record => isDataObject(record))
        .map(record => {
          // Safely access nested properties
          if (!isDataObject(record) || 
              !hasProperty(record, 'students') || 
              !hasProperty(record, 'classes') ||
              !hasProperty(record, 'id') ||
              !hasProperty(record, 'student_id') ||
              !hasProperty(record, 'date') ||
              !hasProperty(record, 'status')) {
            return null;
          }
          
          const students = record.students as StudentsData;
          const studentProfile = students?.profiles?.[0] as StudentProfile;
          
          const firstName = studentProfile?.first_name || '';
          const lastName = studentProfile?.last_name || '';
          const email = studentProfile?.email || '';
          
          const classes = record.classes as ClassData;
          
          return {
            id: record.id,
            studentId: record.student_id,
            name: `${firstName} ${lastName}`.trim(),
            email: email,
            classDate: new Date(record.date),
            status: record.status as AttendanceStatus,
            makeupDate: null, // We'll get this from a separate query
            classTitle: classes?.title || 'Unnamed Class',
            notes: record.notes
          };
        })
        .filter(Boolean) as Student[];

      // Now fetch makeup dates for these records
      for (const record of transformedData) {
        const { data: makeupData } = await supabase
          .from('attendance')
          .select('date')
          .eq('student_id', record.studentId as any)
          .eq('status', 'makeup' as any)
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
              .eq('student_id', record.studentId as any)
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
        .update({ status: status as any })
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
      // First, get the class_id from the missed attendance record
      const { data: missedAttendance, error: fetchError } = await supabase
        .from('attendance')
        .select('class_id')
        .eq('id', missedClassId)
        .single();

      if (fetchError) throw fetchError;

      // Create a new attendance record for the makeup class using the same class_id
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: studentId as any,
          class_id: missedAttendance.class_id, // Include the class_id from the missed class
          date: format(date, 'yyyy-MM-dd'),
          status: 'makeup' as any,
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

  // Calculate stats from actual data
  const calculateStats = () => {
    if (!weeklyAttendance || weeklyAttendance.length === 0) {
      return {
        missedCount: 0,
        scheduledMakeups: 0,
        attendanceRate: 0
      };
    }

    // Count total classes for the week
    const totalClasses = weeklyAttendance.length;
    
    // Count missed classes
    const missedCount = weeklyAttendance.filter(record => 
      isDataObject(record) && hasProperty(record, 'status') && record.status === 'missed'
    ).length;
    
    // Count scheduled makeups
    const scheduledMakeups = weeklyAttendance.filter(record => 
      isDataObject(record) && hasProperty(record, 'status') && record.status === 'makeup'
    ).length;
    
    // Calculate attendance rate
    const attendedClasses = weeklyAttendance.filter(record =>
      isDataObject(record) && hasProperty(record, 'status') && 
      (record.status === 'attended' || record.status === 'made-up')
    ).length;
    
    const attendanceRate = totalClasses > 0 
      ? Math.round((attendedClasses / totalClasses) * 100) 
      : 0;

    return {
      missedCount,
      scheduledMakeups,
      attendanceRate
    };
  };

  const isLoading = isLoadingWeeklyAttendance || isLoadingMissedAttendance;
  const stats = calculateStats();

  return {
    missedAttendance,
    isLoading,
    updateStatus: (studentId: string, attendanceId: string, status: AttendanceStatus) => 
      updateStatus.mutate({ studentId, attendanceId, status }),
    scheduleMakeup: (studentId: string, date: Date, missedClassId: string) => 
      scheduleMakeup.mutate({ studentId, date, missedClassId }),
    stats
  };
};
