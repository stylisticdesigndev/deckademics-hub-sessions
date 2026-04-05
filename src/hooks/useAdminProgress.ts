import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StudentProgressOverview {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  instructorName: string | null;
  overallProgress: number;
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
      const [modulesRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('curriculum_modules').select('id, title, level'),
        supabase.from('curriculum_lessons').select('id, title, module_id'),
        supabase.from('student_progress').select('student_id, skill_name, proficiency'),
      ]);

      const modules = modulesRes.data || [];
      const lessons = lessonsRes.data || [];
      const allProgress = progressRes.data || [];

      // Build lesson lookup by module
      const lessonsByModule = new Map<string, any[]>();
      for (const lesson of lessons) {
        const arr = lessonsByModule.get(lesson.module_id) || [];
        arr.push(lesson);
        lessonsByModule.set(lesson.module_id, arr);
      }

      return (students || []).map((s: any) => {
        const profile = s.profiles;
        const instructor = s.instructors;
        const studentProgress = allProgress.filter((p: any) => p.student_id === s.id && p.skill_name !== 'Overall Progress');

        // Calculate overall progress: average of module completion percentages
        let overallProgress = 0;
        if (modules.length > 0) {
          const moduleCompletions = modules.map(mod => {
            const modLessons = lessonsByModule.get(mod.id) || [];
            if (modLessons.length === 0) return 0;

            const completedCount = modLessons.filter(lesson => {
              const skillName = `${mod.title} - ${lesson.title}`;
              return studentProgress.some((p: any) => p.skill_name === skillName && (p.proficiency ?? 0) > 0);
            }).length;

            return (completedCount / modLessons.length) * 100;
          });
          overallProgress = Math.round(moduleCompletions.reduce((sum, v) => sum + v, 0) / moduleCompletions.length);
        }

        return {
          id: s.id,
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          email: profile?.email || '',
          level: s.level || 'novice',
          instructorName: instructor
            ? `${instructor.profiles?.first_name || ''} ${instructor.profiles?.last_name || ''}`.trim()
            : null,
          overallProgress,
        };
      });
    },
  });
};
