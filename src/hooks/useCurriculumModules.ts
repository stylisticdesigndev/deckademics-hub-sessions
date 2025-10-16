import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurriculumModule {
  id: string;
  title: string;
  description: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useCurriculumModules = (level?: string) => {
  return useQuery({
    queryKey: ['curriculum-modules', level],
    queryFn: async () => {
      let query = supabase
        .from('curriculum_modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (level) {
        query = query.eq('level', level);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching curriculum modules:', error);
        throw error;
      }

      return (data || []) as CurriculumModule[];
    }
  });
};
