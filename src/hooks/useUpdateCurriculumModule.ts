import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UpdateModuleData {
  id: string;
  title?: string;
  description?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  order_index?: number;
}

export const useUpdateCurriculumModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateModuleData) => {
      const { data: result, error } = await supabase
        .from('curriculum_modules')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-modules'] });
      toast.success('Module updated successfully');
    },
    onError: (error) => {
      console.error('Error updating module:', error);
      toast.error('Failed to update module');
    }
  });
};
