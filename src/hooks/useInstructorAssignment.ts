
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InstructorWithProfile {
  id: string;
  status: string;
  specialties: string[];
  bio: string | null;
  hourly_rate: number;
  years_experience: number;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export const useInstructorAssignment = () => {
  const queryClient = useQueryClient();

  const { data: activeInstructors, isLoading: isLoadingInstructors } = useQuery({
    queryKey: ['active-instructors-for-assignment'],
    queryFn: async () => {
      try {
        console.log('Fetching active instructors for assignment...');
        
        const { data, error } = await supabase.rpc(
          'get_instructors_with_profiles',
          { status_param: 'active' }
        );
        
        if (error) {
          console.error('Error fetching active instructors:', error);
          return [];
        }

        console.log('Active instructors for assignment:', data);
        return data as InstructorWithProfile[] || [];
      } catch (error) {
        console.error('Error in activeInstructors query:', error);
        return [];
      }
    }
  });

  const assignInstructorToStudent = useMutation({
    mutationFn: async ({ studentId, instructorId }: { studentId: string; instructorId: string | null }) => {
      console.log(`Assigning instructor ${instructorId} to student ${studentId}`);
      
      const { error } = await supabase
        .from('students')
        .update({ instructor_id: instructorId } as any)
        .eq('id', studentId as any);

      if (error) throw error;
      return { success: true, studentId, instructorId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      
      if (data.instructorId) {
        toast.success('Instructor assigned successfully');
      } else {
        toast.success('Instructor removed successfully');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign instructor: ${error.message}`);
    }
  });

  return {
    activeInstructors: activeInstructors || [],
    isLoadingInstructors,
    assignInstructorToStudent
  };
};
