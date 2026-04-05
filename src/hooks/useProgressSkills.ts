import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProgressSkill {
  id: string;
  name: string;
  level: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function useProgressSkills(level?: string) {
  return useQuery({
    queryKey: ['progress-skills', level],
    queryFn: async () => {
      let query = supabase
        .from('progress_skills' as any)
        .select('*')
        .order('order_index', { ascending: true });

      if (level) {
        query = query.eq('level', level);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ProgressSkill[];
    },
  });
}
