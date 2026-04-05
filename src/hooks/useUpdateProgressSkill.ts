import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUpdateProgressSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: { id: string; name?: string; level?: string; description?: string | null; order_index?: number }) => {
      const { id, ...updates } = skill;
      const { data, error } = await supabase
        .from('progress_skills' as any)
        .update(updates as any)
        .eq('id', id)
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
