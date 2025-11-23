import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export const LEVEL_DISPLAY_MAP: Record<StudentLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

export const LEVEL_VALUE_MAP: Record<string, StudentLevel> = {
  'Beginner': 'beginner',
  'Novice': 'beginner',
  'beginner': 'beginner',
  'Intermediate': 'intermediate',
  'intermediate': 'intermediate',
  'Advanced': 'advanced',
  'advanced': 'advanced'
};

export const useUpdateStudentLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, level }: { studentId: string; level: StudentLevel }) => {
      console.log('Updating student level:', { studentId, level });

      const { data, error } = await supabase
        .from('students')
        .update({ level })
        .eq('id', studentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating student level:', error);
        throw error;
      }

      console.log('Student level updated successfully:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['instructor', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      
      toast.success(`Student level updated to ${LEVEL_DISPLAY_MAP[variables.level]}`);
    },
    onError: (error: Error) => {
      console.error('Failed to update student level:', error);
      toast.error(`Failed to update student level: ${error.message}`);
    }
  });
};
