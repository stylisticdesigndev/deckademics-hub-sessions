
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
    dj_name?: string | null;
    email: string;
  };
}

export const useInstructorAssignment = () => {
  const queryClient = useQueryClient();

  const { data: activeInstructors, isLoading: isLoadingInstructors } = useQuery({
    queryKey: ['active-instructors-for-assignment'],
    queryFn: async () => {
      try {
        if (import.meta.env.DEV) console.log('Fetching active instructors for assignment...');
        
        const { data, error } = await supabase.rpc(
          'get_instructors_with_profiles',
          { status_param: 'active' }
        );
        
        if (error) {
          console.error('Error fetching active instructors:', error);
          return [];
        }

        if (import.meta.env.DEV) console.log('Active instructors for assignment:', data);
        return data as InstructorWithProfile[] || [];
      } catch (error) {
        console.error('Error in activeInstructors query:', error);
        return [];
      }
    }
  });

  const assignInstructorToStudent = useMutation({
    mutationFn: async ({ studentId, instructorId }: { studentId: string; instructorId: string | null }) => {
      if (import.meta.env.DEV) console.log(`Assigning instructor ${instructorId} to student ${studentId}`);
      
      const { error } = await supabase
        .from('students')
        .update({ instructor_id: instructorId } as any)
        .eq('id', studentId as any);

      if (error) throw error;

      // Keep student_instructors in sync — primary role mirrors students.instructor_id.
      // 1. Remove any existing primary link.
      await supabase
        .from('student_instructors' as any)
        .delete()
        .eq('student_id', studentId)
        .eq('role', 'primary');
      // 2. Upsert the new primary link if one is provided.
      if (instructorId) {
        await supabase
          .from('student_instructors' as any)
          .upsert(
            { student_id: studentId, instructor_id: instructorId, role: 'primary' },
            { onConflict: 'student_id,instructor_id' }
          );
      }
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
      toast.error('Failed to assign instructor. Please try again.');
    }
  });

  const setSecondaryInstructor = useMutation({
    mutationFn: async ({ studentId, instructorId, action }: { studentId: string; instructorId: string; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        const { error } = await supabase
          .from('student_instructors' as any)
          .upsert(
            { student_id: studentId, instructor_id: instructorId, role: 'secondary' },
            { onConflict: 'student_id,instructor_id' }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_instructors' as any)
          .delete()
          .eq('student_id', studentId)
          .eq('instructor_id', instructorId);
        if (error) throw error;
      }
      return { success: true };
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['student-instructors', vars.studentId] });
      toast.success(vars.action === 'add' ? 'Secondary instructor added' : 'Secondary instructor removed');
    },
    onError: () => toast.error('Failed to update secondary instructor.'),
  });

  return {
    activeInstructors: activeInstructors || [],
    isLoadingInstructors,
    assignInstructorToStudent,
    setSecondaryInstructor,
  };
};
