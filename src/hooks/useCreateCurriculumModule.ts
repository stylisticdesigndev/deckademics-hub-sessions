import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateModuleData {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  order_index: number;
}

export const useCreateCurriculumModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateModuleData) => {
      const { data: result, error } = await supabase
        .from('curriculum_modules')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-modules'] });
      toast.success('Module created successfully');
    },
    onError: (error) => {
      console.error('Error creating module:', error);
      toast.error('Failed to create module');
    }
  });
};
