import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useDeleteCurriculumModule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from('curriculum_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum-modules'] });
      queryClient.invalidateQueries({ queryKey: ['curriculum-lessons'] });
      toast.success('Module deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  });
};
