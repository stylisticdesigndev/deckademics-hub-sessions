import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getInstructorDisplayName } from '@/utils/instructorName';
import { computeReadiness, nextLevelOf, normalizeLevel } from '@/lib/skillMilestones';

export interface DetailSkill {
  skillId: string;
  skillName: string;
  proficiency: number; // 0–3 milestone
  isCore: boolean;
}

export interface DetailNote {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  authorName: string;
}

export interface StudentClassDetail {
  level: string;
  masteredCount: number;
  skillTotal: number;
  isReady: boolean;
  nextLevel: string | null;
  skills: DetailSkill[];
  notes: DetailNote[];
}

async function fetchDetail(studentId: string, level: string): Promise<StudentClassDetail> {
  const normalizedLevel = normalizeLevel(level);

  const [skillsResult, progressResult, notesResult] = await Promise.all([
    supabase
      .from('progress_skills' as any)
      .select('id, name, level, is_core, order_index')
      .order('order_index', { ascending: true }),
    supabase
      .from('student_progress')
      .select('id, skill_name, proficiency')
      .eq('student_id', studentId),
    supabase
      .from('student_notes')
      .select('id, title, content, created_at, instructor_id')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),
  ]);

  if (skillsResult.error) throw skillsResult.error;
  if (progressResult.error) throw progressResult.error;
  if (notesResult.error) throw notesResult.error;

  const allSkills = (skillsResult.data as any[]) || [];
  const proficiencyByName: Record<string, number> = {};
  ((progressResult.data as any[]) || []).forEach((row) => {
    if (row.skill_name) proficiencyByName[row.skill_name] = row.proficiency || 0;
  });

  const skills: DetailSkill[] = allSkills
    .filter((s) => normalizeLevel(s.level) === normalizedLevel)
    .map((s) => ({
      skillId: s.id,
      skillName: s.name,
      proficiency: proficiencyByName[s.name] || 0,
      isCore: s.is_core ?? true,
    }));

  const readiness = computeReadiness(
    skills.map((s) => ({ proficiency: s.proficiency, is_core: s.isCore })),
  );

  // Resolve note author display names.
  const noteRows = (notesResult.data as any[]) || [];
  const authorIds = Array.from(new Set(noteRows.map((n) => n.instructor_id).filter(Boolean)));
  const nameById = new Map<string, string>();
  if (authorIds.length) {
    const { data: instructors } = await supabase.rpc('get_instructor_display_names' as any);
    ((instructors as any[]) || []).forEach((p) => {
      nameById.set(p.id, getInstructorDisplayName(p) || 'Instructor');
    });
  }

  const notes: DetailNote[] = noteRows.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    created_at: n.created_at,
    authorName: nameById.get(n.instructor_id) || 'Instructor',
  }));

  return {
    level: normalizedLevel,
    masteredCount: readiness.masteredCount,
    skillTotal: readiness.total,
    isReady: readiness.isReady,
    nextLevel: nextLevelOf(level),
    skills,
    notes,
  };
}

export function useStudentClassDetail(studentId?: string, level?: string) {
  return useQuery({
    queryKey: ['student-class-detail', studentId, level],
    queryFn: () => fetchDetail(studentId as string, level || 'novice'),
    enabled: !!studentId,
    staleTime: 30_000,
  });
}