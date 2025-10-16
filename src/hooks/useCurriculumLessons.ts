import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurriculumLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useCurriculumLessons = (moduleId?: string) => {
  return useQuery({
    queryKey: ['curriculum-lessons', moduleId],
    queryFn: async () => {
      let query = supabase
        .from('curriculum_lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching curriculum lessons:', error);
        throw error;
      }

      return (data || []) as CurriculumLesson[];
    }
  });
};
