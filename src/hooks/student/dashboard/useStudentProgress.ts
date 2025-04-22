
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useStudentProgress(userId?: string) {
  const [progress, setProgress] = useState<any[]>([]);
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
          .eq('student_id', userId as string);

        setProgress(Array.isArray(data) ? data : []);
      } catch (e) {
        setProgress([]);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  return { progress, loading };
}
