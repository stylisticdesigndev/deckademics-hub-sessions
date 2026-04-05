
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
        // Get student level
        const { data: studentData } = await supabase
          .from('students')
          .select('level')
          .eq('id', userId)
          .single();

        const level = studentData?.level || 'novice';

        // Get admin-defined skills for this level
        const { data: skillDefs } = await supabase
          .from('progress_skills' as any)
          .select('name')
          .eq('level', level);

        const skillNames = new Set((skillDefs || []).map((s: any) => s.name));

        // Get student progress
        const { data, error } = await supabase
          .from('student_progress')
          .select('skill_name, proficiency')
          .eq('student_id', userId);

        if (error) {
          console.error('Error fetching student progress:', error);
          setProgress([]);
        } else if (data && Array.isArray(data)) {
          // Only include skills that match admin-defined progress_skills
          const filtered = data
            .filter((item: any) => skillNames.has(item.skill_name))
            .map((item: any) => ({
              skill_name: item.skill_name,
              proficiency: item.proficiency || 0,
            }));
          
          setProgress(filtered);
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
