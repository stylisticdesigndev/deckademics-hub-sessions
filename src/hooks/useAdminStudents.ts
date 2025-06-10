
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

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
        .eq('enrollment_status', 'active' as any);

      if (error) {
        console.error('Error fetching active students:', error);
        return [];
      }

      console.log('Raw active students data:', data);

      return (data || [])
        .filter(student => student && typeof student === 'object')
        .map(student => {
          // Add type guards for safe property access
          if (!student || typeof student !== 'object') return null;
          
          const id = (student as any).id;
          const level = (student as any).level || 'beginner';
          const enrollment_status = (student as any).enrollment_status;
          const instructor_id = (student as any).instructor_id;
          const profiles = (student as any).profiles as any;
          const instructors = (student as any).instructors as any;

          if (!id) return null;

          return {
            id,
            level,
            enrollment_status,
            instructor_id,
            profile: {
              first_name: profiles?.first_name,
              last_name: profiles?.last_name,
              email: profiles?.email || ''
            },
            instructor: instructors ? {
              id: instructors.id,
              status: instructors.status,
              profile: {
                first_name: instructors.profiles?.first_name,
                last_name: instructors.profiles?.last_name,
                email: instructors.profiles?.email || ''
              }
            } : undefined
          };
        })
        .filter(Boolean) as StudentWithProfile[];
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
        .eq('enrollment_status', 'pending' as any);

      if (error) {
        console.error('Error fetching pending students:', error);
        return [];
      }

      console.log('Raw pending students data:', data);

      return (data || [])
        .filter(student => student && typeof student === 'object')
        .map(student => {
          // Add type guards for safe property access
          if (!student || typeof student !== 'object') return null;
          
          const id = (student as any).id;
          const level = (student as any).level || 'beginner';
          const enrollment_status = (student as any).enrollment_status;
          const instructor_id = (student as any).instructor_id;
          const profiles = (student as any).profiles as any;

          if (!id) return null;

          return {
            id,
            level,
            enrollment_status,
            instructor_id,
            profile: {
              first_name: profiles?.first_name,
              last_name: profiles?.last_name,
              email: profiles?.email || ''
            }
          };
        })
        .filter(Boolean) as StudentWithProfile[];
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
        .update({ enrollment_status: 'active' as any })
        .eq('id', studentId as any);

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
        .update({ enrollment_status: 'declined' as any })
        .eq('id', studentId as any);

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
        .update({ enrollment_status: 'inactive' as any })
        .eq('id', studentId as any);

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
