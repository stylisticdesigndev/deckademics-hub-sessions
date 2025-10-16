import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateLessonData {
  module_id: string;
  title: string;
  description: string;
  order_index: number;
}

export const useCreateCurriculumLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLessonData) => {
      const { data: result, error } = await supabase
        .from('curriculum_lessons')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-lessons'] });
      toast.success('Lesson created successfully');
    },
    onError: (error) => {
      console.error('Error creating lesson:', error);
      toast.error('Failed to create lesson');
    }
  });
};
