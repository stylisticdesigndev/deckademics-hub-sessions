
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalStudents: number;
  pendingStudents: number;
  totalInstructors: number;
  pendingInstructors: number;
  recentActivities: {
    id: string;
    action: string;
    details: string;
    timestamp: Date;
  }[];
}

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log("Fetching admin dashboard data");
      
      // Get total and pending students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, enrollment_status')
        .eq('enrollment_status', 'active');

      const { data: pendingStudents, error: pendingStudentsError } = await supabase
        .from('students')
        .select('id')
        .eq('enrollment_status', 'pending');

      if (studentsError || pendingStudentsError) {
        console.error("Error fetching students:", { studentsError, pendingStudentsError });
        throw new Error('Failed to fetch student data');
      }
      
      console.log("Students data:", { total: students?.length, pending: pendingStudents?.length });

      // Get total and pending instructors
      const { data: instructors, error: instructorsError } = await supabase
        .from('instructors')
        .select('id, status')
        .eq('status', 'active');

      const { data: pendingInstructors, error: pendingInstructorsError } = await supabase
        .from('instructors')
        .select('id')
        .eq('status', 'pending');

      if (instructorsError || pendingInstructorsError) {
        console.error("Error fetching instructors:", { instructorsError, pendingInstructorsError });
        throw new Error('Failed to fetch instructor data');
      }
      
      console.log("Instructors data:", { total: instructors?.length, pending: pendingInstructors?.length });

      // For now, we'll return recent activities as an empty array since we haven't implemented activity logging yet
      const recentActivities: {
        id: string;
        action: string;
        details: string;
        timestamp: Date;
      }[] = [];

      return {
        totalStudents: students?.length || 0,
        pendingStudents: pendingStudents?.length || 0,
        totalInstructors: instructors?.length || 0,
        pendingInstructors: pendingInstructors?.length || 0,
        recentActivities
      };
    },
    staleTime: 60000 // Cache data for 1 minute
  });
};
