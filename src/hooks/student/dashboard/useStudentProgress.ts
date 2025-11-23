
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDataObject, processSafeItems, asDbType, asDatabaseParam } from '@/utils/supabaseHelpers';

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
        const { data, error } = await supabase
          .from('student_progress')
          .select('skill_name, proficiency')
          .eq('student_id', asDatabaseParam(userId));

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

    // Set up real-time subscription for progress updates
    const channel = supabase
      .channel('student_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_progress',
          filter: `student_id=eq.${userId}`
        },
        () => {
          console.log('Progress data changed, refetching...');
          fetchProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { progress, loading };
}
