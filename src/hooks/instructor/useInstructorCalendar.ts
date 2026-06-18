import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getInstructorDisplayName } from '@/utils/instructorName';

export interface CalendarInstructor {
  id: string;
  name: string;
  role: 'primary' | 'secondary';
}

export interface CalendarClass {
  studentId: string;
  studentName: string;
  initials: string;
  avatarUrl?: string | null;
  level: string;
  /** 0 = Sunday ... 6 = Saturday */
  dayIndex: number;
  classDay: string;
  classTime: string;
  instructors: CalendarInstructor[];
}

export interface InstructorLegendEntry {
  id: string;
  name: string;
  color: string;
}

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function normalizeDayIndex(day?: string | null): number {
  const n = (day || '').trim().toLowerCase().replace(/s$/, '');
  const num = DAY_NAME_TO_NUMBER[n];
  return num === undefined ? -1 : num;
}

/** Deterministic, distinct color per instructor index (data-viz only). */
export function instructorColor(index: number): string {
  const hue = (index * 67) % 360;
  return `hsl(${hue} 65% 50%)`;
}

interface CalendarData {
  classes: CalendarClass[];
  legend: InstructorLegendEntry[];
  colorByInstructor: Record<string, string>;
}

async function fetchCalendar(): Promise<CalendarData> {
  // 1. All active, non-mock students with their recurring class slot.
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      level,
      class_day,
      class_time,
      profiles!inner(first_name, last_name, avatar_url, is_mock)
    `)
    .eq('enrollment_status', 'active')
    .eq('profiles.is_mock', false);
  if (studentsError) throw studentsError;

  const studentRows = (students as any[]) || [];
  const studentIds = studentRows.map((s) => s.id);

  // 2. All student/instructor links + instructor display names (in parallel).
  const [linksResult, instructorsResult, activeInstructorsResult] = await Promise.all([
    studentIds.length
      ? supabase
          .from('student_instructors' as any)
          .select('student_id, instructor_id, role')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [], error: null } as any),
    supabase.rpc('get_instructor_display_names' as any),
    supabase
      .from('instructors')
      .select('id, status, profiles!inner(is_mock)')
      .eq('status', 'active')
      .eq('profiles.is_mock', false),
  ]);
  if (linksResult.error) throw linksResult.error;
  if (instructorsResult.error) throw instructorsResult.error;
  if (activeInstructorsResult.error) throw activeInstructorsResult.error;

  // Only instructors that are active AND not mock should ever appear.
  const activeInstructorIds = new Set<string>(
    ((activeInstructorsResult.data as any[]) || []).map((i) => i.id),
  );

  const instructorRows = (instructorsResult.data as any[]) || [];
  const nameById = new Map<string, string>();
  instructorRows.forEach((p) => {
    nameById.set(p.id, getInstructorDisplayName(p) || 'Instructor');
  });

  // Map student -> instructors.
  const linksByStudent: Record<string, CalendarInstructor[]> = {};
  ((linksResult.data as any[]) || []).forEach((l) => {
    if (!activeInstructorIds.has(l.instructor_id)) return; // skip deactivated/mock instructors
    if (!linksByStudent[l.student_id]) linksByStudent[l.student_id] = [];
    linksByStudent[l.student_id].push({
      id: l.instructor_id,
      name: nameById.get(l.instructor_id) || 'Instructor',
      role: l.role === 'secondary' ? 'secondary' : 'primary',
    });
  });

  // Build the class list (only students with a real day + time).
  const classes: CalendarClass[] = studentRows
    .filter((s) => s.class_day && s.class_time && normalizeDayIndex(s.class_day) >= 0)
    .map((s) => {
      const profile = s.profiles;
      const firstName = profile?.first_name || '';
      const lastName = profile?.last_name || '';
      const studentInstructors = (linksByStudent[s.id] || []).sort((a, b) =>
        a.role === b.role ? 0 : a.role === 'primary' ? -1 : 1,
      );
      return {
        studentId: s.id,
        studentName: `${firstName} ${lastName}`.trim() || 'Unknown Student',
        initials: (firstName[0] || '') + (lastName[0] || ''),
        avatarUrl: profile?.avatar_url || null,
        level: (s.level || 'novice').toLowerCase(),
        dayIndex: normalizeDayIndex(s.class_day),
        classDay: s.class_day,
        classTime: (s.class_time || '').trim(),
        instructors: studentInstructors,
      };
    });

  // Legend: every instructor that actually teaches at least one class, colored.
  const teachingIds = new Set<string>();
  classes.forEach((c) => c.instructors.forEach((i) => teachingIds.add(i.id)));
  const sortedTeaching = Array.from(teachingIds).sort((a, b) =>
    (nameById.get(a) || '').localeCompare(nameById.get(b) || ''),
  );
  const colorByInstructor: Record<string, string> = {};
  const legend: InstructorLegendEntry[] = sortedTeaching.map((id, idx) => {
    const color = instructorColor(idx);
    colorByInstructor[id] = color;
    return { id, name: nameById.get(id) || 'Instructor', color };
  });

  return { classes, legend, colorByInstructor };
}

export function useInstructorCalendar() {
  return useQuery({
    queryKey: ['instructor-calendar'],
    queryFn: fetchCalendar,
    staleTime: 60_000,
  });
}