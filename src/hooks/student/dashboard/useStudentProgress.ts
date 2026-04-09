
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
        } else {
          // Build progress from admin skill definitions, defaulting missing to 0%
          const progressMap = new Map<string, number>();
          if (data && Array.isArray(data)) {
            data.forEach((item: any) => {
              if (skillNames.has(item.skill_name)) {
                progressMap.set(item.skill_name, item.proficiency || 0);
              }
            });
          }
          
          const result: ProgressItem[] = (skillDefs || []).map((s: any) => ({
            skill_name: s.name,
            proficiency: progressMap.get(s.name) || 0,
          }));
          
          setProgress(result);
        }
      } catch (e) {
        setProgress([]);
        console.error('Exception in fetchProgress:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Realtime subscription was removed — student_progress was never in
    // supabase_realtime publication so the channel silently did nothing.
    // Progress refreshes when the student navigates back to the dashboard.

  }, [userId]);

  return { progress, loading };
}
