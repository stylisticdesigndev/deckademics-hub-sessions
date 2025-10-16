import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useDeleteCurriculumLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('curriculum_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-lessons'] });
      toast.success('Lesson deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  });
};
