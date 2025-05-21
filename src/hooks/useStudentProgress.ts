
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { processSafeItems, safelyAccessProperty } from '@/utils/supabaseHelpers';

export interface StudentProgressItem {
  id: string;
  skillName: string;
  proficiency: number;
  notes?: string;
  assessmentDate: string;
}

export const useStudentProgress = (studentId?: string) => {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;
  
  // Use the provided studentId (for instructor view) or current user id (for student view)
  const targetStudentId = studentId || currentUserId;

  const fetchStudentProgress = async () => {
    if (!targetStudentId) {
      console.error("No student ID available for progress fetch");
      return [];
    }

    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', targetStudentId);

    if (error) {
      console.error("Error fetching student progress:", error);
      throw new Error(`Failed to load progress data: ${error.message}`);
    }

    return processSafeItems(data || [], (item): StudentProgressItem => {
      return {
        id: safelyAccessProperty<string, 'id'>(item, 'id') || '',
        skillName: safelyAccessProperty<string, 'skill_name'>(item, 'skill_name') || 'Unknown Skill',
        proficiency: safelyAccessProperty<number, 'proficiency'>(item, 'proficiency') || 0,
        notes: safelyAccessProperty<string, 'notes'>(item, 'notes'),
        assessmentDate: safelyAccessProperty<string, 'assessment_date'>(item, 'assessment_date') || ''
      };
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['student', targetStudentId, 'progress'],
    queryFn: fetchStudentProgress,
    enabled: !!targetStudentId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return {
    progressItems: data || [],
    isLoading,
    error
  };
};
