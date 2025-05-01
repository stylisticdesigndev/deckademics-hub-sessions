
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

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
  const { session } = useAuth();
  
  // Check if the current user is the mock admin
  const isMockAdmin = session?.user?.id === "00000000-0000-0000-0000-000000000000";

  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log("Fetching admin dashboard data");
      
      try {
        // For mock admin, return mock dashboard data
        if (isMockAdmin) {
          console.log("Using mock dashboard data for demo admin");
          
          // Create mock recent activities
          const recentActivities = [
            {
              id: "act-1",
              action: "Approval",
              details: "Student Jane Smith was approved",
              timestamp: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
              id: "act-2",
              action: "Payment",
              details: "Payment of $150 received from John Doe",
              timestamp: new Date(Date.now() - 7200000) // 2 hours ago
            },
            {
              id: "act-3",
              action: "Instructor",
              details: "New instructor David Johnson registered",
              timestamp: new Date(Date.now() - 86400000) // 1 day ago
            }
          ];
          
          return {
            totalStudents: 42,
            pendingStudents: 5,
            totalInstructors: 8,
            pendingInstructors: 2,
            recentActivities
          };
        }
        
        // Get counts using aggregate functions to avoid RLS issues
        const { data: studentCounts, error: studentsError } = await supabase
          .rpc('get_student_counts');

        if (studentsError) {
          console.error("Error fetching student counts:", studentsError);
          throw new Error('Failed to fetch student data');
        }
        
        console.log("Student counts data:", studentCounts);

        // Get instructor counts
        const { data: instructorCounts, error: instructorsError } = await supabase
          .rpc('get_instructor_counts');

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
        
        // Since these functions return arrays with a single object, we need to access the first element
        const studentData = Array.isArray(studentCounts) ? studentCounts[0] : studentCounts;
        const instructorData = Array.isArray(instructorCounts) ? instructorCounts[0] : instructorCounts;

        return {
          totalStudents: studentData.total,
          pendingStudents: studentData.pending,
          totalInstructors: instructorData.total,
          pendingInstructors: instructorData.pending,
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
