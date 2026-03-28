
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface StudentNote {
  id: string;
  content: string;
  title?: string | null;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  level: string;
  progress: number;
  lastActive: string;
  avatar?: string;
  initials: string;
  nextClass?: string;
  email: string;
  enrollmentDate: string;
  notes?: StudentNote[];
  moduleProgress?: ModuleProgress[];
}

interface ModuleProgress {
  moduleId: string;
  moduleName: string; 
  progress: number;
  lessons: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

interface StudentWithProfile {
  id: string;
  level: string;
  start_date: string;
  notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
  };
}

export function useInstructorStudentsSimple(instructorId: string | undefined) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!instructorId) {
      setLoading(false);
      return;
    }
      setLoading(true);
      try {
        console.log('Fetching students for instructor:', instructorId);
        
        // Fetch students directly assigned to this instructor
        const { data: assignedStudents, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            level,
            start_date,
            notes,
            profiles!inner(first_name, last_name, email, avatar_url)
          `)
          .eq('instructor_id', instructorId) as { data: StudentWithProfile[] | null, error: any };
          
        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          setLoading(false);
          return;
        }

        console.log('Found assigned students:', assignedStudents);

        if (!assignedStudents?.length) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const studentIds = assignedStudents.map(s => s.id);

        // Get progress data, notes, and curriculum in parallel
        const [progressResult, notesResult, modulesResult, lessonsResult] = await Promise.all([
          supabase
            .from('student_progress')
            .select('student_id, skill_name, proficiency')
            .in('student_id', studentIds),
          supabase
            .from('student_notes')
            .select('id, student_id, content, title, created_at')
            .eq('instructor_id', instructorId)
            .in('student_id', studentIds)
            .order('created_at', { ascending: false }),
          supabase
            .from('curriculum_modules')
            .select('id, title, level, order_index')
            .order('order_index', { ascending: true }),
          supabase
            .from('curriculum_lessons')
            .select('id, module_id, title, order_index')
            .order('order_index', { ascending: true }),
        ]);

        if (progressResult.error) {
          console.error('Error fetching progress:', progressResult.error);
        }
        if (notesResult.error) {
          console.error('Error fetching notes:', notesResult.error);
        }

        const allModules = modulesResult.data || [];
        const allLessons = lessonsResult.data || [];

        // Group lessons by module
        const lessonsByModule: { [moduleId: string]: typeof allLessons } = {};
        allLessons.forEach((lesson) => {
          if (!lessonsByModule[lesson.module_id]) lessonsByModule[lesson.module_id] = [];
          lessonsByModule[lesson.module_id].push(lesson);
        });

        // Group student_progress skill_names by student
        const progressSkillsByStudent: { [studentId: string]: Set<string> } = {};
        (progressResult.data || []).forEach((row) => {
          if (!progressSkillsByStudent[row.student_id]) progressSkillsByStudent[row.student_id] = new Set();
          if (row.skill_name) progressSkillsByStudent[row.student_id].add(row.skill_name);
        });

        // Calculate average progress for each student
        const progressById: { [id: string]: number } = {};
        studentIds.forEach((id) => {
          const records = (progressResult.data || []).filter((row) => row.student_id === id);
          const profs = records.map((r) => r.proficiency || 0);
          progressById[id] = profs.length
            ? Math.round(profs.reduce((a, b) => a + b, 0) / profs.length)
            : 0;
        });

        // Group notes by student
        const notesById: { [id: string]: StudentNote[] } = {};
        (notesResult.data || []).forEach((note) => {
          if (!notesById[note.student_id]) notesById[note.student_id] = [];
          notesById[note.student_id].push({
            id: note.id,
            content: note.content,
            title: note.title,
            created_at: note.created_at,
          });
        });

        // Format students data
        const formattedStudents: Student[] = assignedStudents.map((student) => {
          const profile = student.profiles;
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';

          let enrollmentDate = '';
          if (student.start_date) {
            try {
              enrollmentDate = format(new Date(student.start_date), 'MM/dd/yyyy');
            } catch {
              enrollmentDate = student.start_date;
            }
          }
          
          // Build moduleProgress for this student
          const studentLevel = student.level || 'beginner';
          const studentSkills = progressSkillsByStudent[student.id] || new Set<string>();
          const studentModules = allModules.filter((m) => m.level === studentLevel);
          const moduleProgress: ModuleProgress[] = studentModules.map((mod) => {
            const modLessons = lessonsByModule[mod.id] || [];
            const lessons = modLessons.map((l) => ({
              id: l.id,
              title: l.title,
              completed: studentSkills.has(l.title),
            }));
            const completedCount = lessons.filter((l) => l.completed).length;
            return {
              moduleId: mod.id,
              moduleName: mod.title,
              progress: modLessons.length ? Math.round((completedCount / modLessons.length) * 100) : 0,
              lessons,
            };
          });

          return {
            id: student.id,
            name: `${firstName} ${lastName}`.trim() || profile?.email || 'Unknown Student',
            email: profile?.email || '',
            avatar: profile?.avatar_url,
            progress: progressById[student.id] || 0,
            level: student.level || 'beginner',
            initials: (firstName[0] || '') + (lastName[0] || ''),
            enrollmentDate,
            lastActive: '',
            nextClass: '',
            notes: notesById[student.id] || [],
            moduleProgress,
          };
        });

        console.log('Formatted students:', formattedStudents);
        setStudents(formattedStudents);
      } catch (err) {
        console.error('Unexpected error:', err);
      }
      setLoading(false);
    };

  useEffect(() => {
    fetchStudents();
  }, [instructorId]);

  const refetch = async () => {
    console.log('Refetching students data...');
    await fetchStudents();
    console.log('Students data refetched successfully');
  };

  return { students, loading, refetch, setStudents };
}
