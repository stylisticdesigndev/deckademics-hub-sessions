
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface StudentCounts {
  total: number;
  pending: number;
  active: number;
}

interface InstructorCounts {
  total: number;
  pending: number;
  active: number;
  inactive: number;
}

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log("Fetching admin dashboard data");
      
      try {
        // Get counts using aggregate functions to avoid RLS issues
        const { data: studentCounts, error: studentsError } = await supabase
          .rpc<StudentCounts>('get_student_counts');

        if (studentsError) {
          console.error("Error fetching student counts:", studentsError);
          throw new Error('Failed to fetch student data');
        }
        
        console.log("Student counts data:", studentCounts);

        // Get instructor counts
        const { data: instructorCounts, error: instructorsError } = await supabase
          .rpc<InstructorCounts>('get_instructor_counts');

        if (instructorsError) {
          console.error("Error fetching instructor counts:", instructorsError);
          throw new Error('Failed to fetch instructor data');
        }
        
        console.log("Instructor counts data:", instructorCounts);

        if (!studentCounts || !instructorCounts) {
          throw new Error('Failed to fetch counts data');
        }

        // For now, we'll return recent activities as an empty array since we haven't implemented activity logging yet
        const recentActivities: {
          id: string;
          action: string;
          details: string;
          timestamp: Date;
        }[] = [];

        return {
          totalStudents: studentCounts.total,
          pendingStudents: studentCounts.pending,
          totalInstructors: instructorCounts.total,
          pendingInstructors: instructorCounts.pending,
          recentActivities
        };
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        toast.error("Failed to load dashboard data");
        throw error;
      }
    },
    staleTime: 60000 // Cache data for 1 minute
  });
};
