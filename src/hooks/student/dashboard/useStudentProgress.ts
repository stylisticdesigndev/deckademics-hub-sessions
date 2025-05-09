
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDataObject, asUUID, processSafeItems } from '@/utils/supabaseHelpers';

interface ProgressItem {
  skill_name: string;
  proficiency: number;
}

export function useStudentProgress(userId?: string) {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProgress([]);
      setLoading(false);
      return;
    }
    const fetchProgress = async () => {
      setLoading(true);
      try {
        // Use any to bypass the type check and then manually verify the data
        const { data, error } = await supabase
          .from('student_progress')
          .select('skill_name, proficiency')
          .eq('student_id', userId);

        if (error) {
          console.error('Error fetching student progress:', error);
          setProgress([]);
        } else if (data && Array.isArray(data)) {
          // Safely process progress data
          const validProgressItems = processSafeItems<ProgressItem>(data, item => ({
            skill_name: item.skill_name,
            proficiency: item.proficiency
          }));
          
          setProgress(validProgressItems);
        } else {
          setProgress([]);
        }
      } catch (e) {
        setProgress([]);
        console.error('Exception in fetchProgress:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  return { progress, loading };
}
