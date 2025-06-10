
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { asProfile, asRpcParam, asRpcResult, asUpdateParam } from '@/utils/supabaseHelpers';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface InstructorWithProfile {
  id: string;
  status: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface StudentWithProfile {
  id: string;
  level: string;
  enrollment_status: string;
  instructor_id?: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  instructor?: InstructorWithProfile;
}

export const useAdminStudents = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  // Fetch active students with instructor information
  const fetchActiveStudents = async (): Promise<StudentWithProfile[]> => {
    console.log('Fetching active students with instructors...');
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          instructor_id,
          profiles (
            first_name,
            last_name,
            email
          ),
          instructors (
            id,
            status,
            profiles (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('enrollment_status', 'active');

      if (error) {
        console.error('Error fetching active students:', error);
        return [];
      }

      console.log('Raw active students data:', data);

      return (data || []).map(student => ({
        id: student.id,
        level: student.level || 'beginner',
        enrollment_status: student.enrollment_status,
        instructor_id: student.instructor_id,
        profile: {
          first_name: student.profiles?.first_name,
          last_name: student.profiles?.last_name,
          email: student.profiles?.email || ''
        },
        instructor: student.instructors ? {
          id: student.instructors.id,
          status: student.instructors.status,
          profile: {
            first_name: student.instructors.profiles?.first_name,
            last_name: student.instructors.profiles?.last_name,
            email: student.instructors.profiles?.email || ''
          }
        } : undefined
      }));
    } catch (error) {
      console.error('Error in fetchActiveStudents:', error);
      return [];
    }
  };

  // Fetch pending students
  const fetchPendingStudents = async (): Promise<StudentWithProfile[]> => {
    console.log('Fetching pending students...');
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          instructor_id,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('enrollment_status', 'pending');

      if (error) {
        console.error('Error fetching pending students:', error);
        return [];
      }

      console.log('Raw pending students data:', data);

      return (data || []).map(student => ({
        id: student.id,
        level: student.level || 'beginner',
        enrollment_status: student.enrollment_status,
        instructor_id: student.instructor_id,
        profile: {
          first_name: student.profiles?.first_name,
          last_name: student.profiles?.last_name,
          email: student.profiles?.email || ''
        }
      }));
    } catch (error) {
      console.error('Error in fetchPendingStudents:', error);
      return [];
    }
  };

  // Debug function to fetch all data
  const debugFetchStudents = async () => {
    try {
      console.log('Fetching debug data...');
      
      const [profilesResult, studentsResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('students').select(`
          *,
          profiles (*),
          instructors (
            *,
            profiles (*)
          )
        `)
      ]);

      return {
        allProfiles: profilesResult.data || [],
        allStudents: studentsResult.data || []
      };
    } catch (error) {
      console.error('Error in debugFetchStudents:', error);
      return {
        allProfiles: [],
        allStudents: []
      };
    }
  };

  const { data: activeStudents = [], isLoading: isLoadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['admin', 'students', 'active'],
    queryFn: fetchActiveStudents,
  });

  const { data: pendingStudents = [], isLoading: isLoadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: fetchPendingStudents,
  });

  // Approve student mutation
  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'active' })
        .eq('id', studentId);

      if (error) throw error;
      return { success: true, studentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student approved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve student: ${error.message}`);
    }
  });

  // Decline student mutation
  const declineStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'declined' })
        .eq('id', studentId);

      if (error) throw error;
      return { success: true, studentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student declined successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline student: ${error.message}`);
    }
  });

  // Deactivate student mutation
  const deactivateStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'inactive' })
        .eq('id', studentId);

      if (error) throw error;
      return { success: true, studentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate student: ${error.message}`);
    }
  });

  // Create demo student function
  const createDemoStudent = async () => {
    try {
      const demoId = crypto.randomUUID();
      const demoEmail = `demo.student.${Date.now()}@example.com`;
      
      const { data, error } = await supabase.rpc('create_demo_student', {
        student_id: demoId,
        email_address: demoEmail,
        first_name: 'Demo',
        last_name: `Student ${Date.now().toString().slice(-4)}`
      });

      if (error) {
        console.error('Error creating demo student:', error);
        return null;
      }

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      
      return data;
    } catch (error) {
      console.error('Error in createDemoStudent:', error);
      return null;
    }
  };

  const refetchData = async () => {
    await Promise.all([refetchActive(), refetchPending()]);
  };

  return {
    activeStudents,
    pendingStudents,
    isLoading: isLoadingActive || isLoadingPending,
    approveStudent,
    declineStudent,
    deactivateStudent,
    createDemoStudent,
    debugFetchStudents,
    refetchData
  };
};
