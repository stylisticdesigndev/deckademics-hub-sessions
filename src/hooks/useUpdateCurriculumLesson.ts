import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UpdateLessonData {
  id: string;
  title?: string;
  description?: string;
  order_index?: number;
}

export const useUpdateCurriculumLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateLessonData) => {
      const { data: result, error } = await supabase
        .from('curriculum_lessons')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-lessons'] });
      toast.success('Lesson updated successfully');
    },
    onError: (error) => {
      console.error('Error updating lesson:', error);
      toast.error('Failed to update lesson');
    }
  });
};
