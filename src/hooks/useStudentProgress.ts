
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentProgress {
  id: string;
  skill_name: string;
  proficiency: number;
  assessment_date: string;
  notes?: string;
}

export const useStudentProgress = (studentId: string) => {
  return useQuery({
    queryKey: ['student-progress', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      try {
        const { data, error } = await supabase
          .from('student_progress')
          .select('*')
          .eq('student_id', studentId as any);

        if (error) {
          console.error('Error fetching student progress:', error);
          throw error;
        }

        return (data || []).map((item: any) => ({
          id: item.id,
          skill_name: item.skill_name || '',
          proficiency: item.proficiency || 0,
          assessment_date: item.assessment_date || '',
          notes: item.notes || ''
        })) as StudentProgress[];
      } catch (error) {
        console.error('Error in student progress query:', error);
        return [];
      }
    },
    enabled: !!studentId
  });
};
