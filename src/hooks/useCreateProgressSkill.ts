import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCreateProgressSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: { name: string; level: string; description?: string; order_index: number }) => {
      const { data, error } = await supabase
        .from('progress_skills' as any)
        .insert(skill as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-skills'] });
    },
  });
}
