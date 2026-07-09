import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeReadiness, normalizeLevel } from '@/lib/skillMilestones';

interface StudentProgressOverview {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  instructorName: string | null;
  masteredCount: number;
  skillTotal: number;
  isReady: boolean;
}

export const useAdminProgress = () => {
  return useQuery({
    queryKey: ['admin', 'progress-overview'],
    queryFn: async (): Promise<StudentProgressOverview[]> => {
      // Fetch active students with profiles and instructor info
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          level,
          instructor_id,
          profiles (first_name, last_name, email),
          instructors (
            id,
            profiles (first_name, last_name)
          )
        `)
        .eq('enrollment_status', 'active' as any);

      if (studentsError) {
        console.error('Error fetching students for progress:', studentsError);
        return [];
      }

      // Fetch all curriculum modules and lessons
      // Fetch admin-defined skills (with Core flag) and all student progress rows.
      const [skillsRes, progressRes] = await Promise.all([
        supabase.from('progress_skills' as any).select('name, level, is_core'),
        supabase.from('student_progress').select('student_id, skill_name, proficiency'),
      ]);

      const allSkills = (skillsRes.data as any[]) || [];
      const allProgress = progressRes.data || [];

      // Group skills by (normalized) level.
      const skillsByLevel = new Map<string, { name: string; is_core: boolean }[]>();
      for (const sk of allSkills) {
        const key = normalizeLevel(sk.level);
        const arr = skillsByLevel.get(key) || [];
        arr.push({ name: sk.name, is_core: sk.is_core ?? true });
        skillsByLevel.set(key, arr);
      }

      return (students || []).map((s: any) => {
        const profile = s.profiles;
        const instructor = s.instructors;
        const level = normalizeLevel(s.level);
        const levelSkills = skillsByLevel.get(level) || [];

        const profByName = new Map<string, number>();
        allProgress
          .filter((p: any) => p.student_id === s.id)
          .forEach((p: any) => profByName.set(p.skill_name, p.proficiency ?? 0));

        const readiness = computeReadiness(
          levelSkills.map(sk => ({ proficiency: profByName.get(sk.name) || 0, is_core: sk.is_core })),
        );

        return {
          id: s.id,
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          email: profile?.email || '',
          level: s.level || 'novice',
          instructorName: instructor
            ? `${instructor.profiles?.first_name || ''} ${instructor.profiles?.last_name || ''}`.trim()
            : null,
          masteredCount: readiness.masteredCount,
          skillTotal: readiness.total,
          isReady: readiness.isReady,
        };
      });
    },
  });
};
