
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
        throw new Error('Failed to fetch student data');
      }

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
        throw new Error('Failed to fetch instructor data');
      }

      // For now, we'll return recent activities as an empty array since we haven't implemented activity logging yet
      const recentActivities = [];

      return {
        totalStudents: students?.length || 0,
        pendingStudents: pendingStudents?.length || 0,
        totalInstructors: instructors?.length || 0,
        pendingInstructors: pendingInstructors?.length || 0,
        recentActivities
      };
    }
  });
};
