
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface StudentNote {
  id: string;
  content: string;
  title?: string | null;
  created_at: string;
}

export interface SkillProgress {
  skillId: string;
  skillName: string;
  proficiency: number;
  progressRecordId?: string;
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
  skillProgress?: SkillProgress[];
  classDay?: string;
  classTime?: string;
}


interface StudentWithProfile {
  id: string;
  level: string;
  start_date: string;
  notes: string | null;
  class_day: string | null;
  class_time: string | null;
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
            class_day,
            class_time,
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

        // Get progress data, notes, curriculum, and progress_skills in parallel
        const [progressResult, notesResult, skillsResult] = await Promise.all([
          supabase
            .from('student_progress')
            .select('id, student_id, skill_name, proficiency')
            .in('student_id', studentIds),
          supabase
            .from('student_notes')
            .select('id, student_id, content, title, created_at')
            .eq('instructor_id', instructorId)
            .in('student_id', studentIds)
            .order('created_at', { ascending: false }),
          supabase
            .from('progress_skills' as any)
            .select('id, name, level, order_index')
            .order('order_index', { ascending: true }),
        ]);

        if (progressResult.error) {
          console.error('Error fetching progress:', progressResult.error);
        }
        if (notesResult.error) {
          console.error('Error fetching notes:', notesResult.error);
        }

        const allProgressSkills = (skillsResult.data || []) as any[];

        // Build a set of admin-defined skill names for filtering
        const adminSkillNames = new Set(allProgressSkills.map((s: any) => s.name));

        // Build a map of student_id -> skill_name -> { proficiency, id }
        // Only include records matching admin-defined skills
        const progressRecordMap: { [studentId: string]: { [skillName: string]: { proficiency: number; id: string } } } = {};
        (progressResult.data || []).forEach((row) => {
          if (row.skill_name && adminSkillNames.has(row.skill_name)) {
            if (!progressRecordMap[row.student_id]) progressRecordMap[row.student_id] = {};
            progressRecordMap[row.student_id][row.skill_name] = {
              proficiency: row.proficiency || 0,
              id: row.id,
            };
          }
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
          
          const studentLevel = student.level || 'novice';
          const normalizedLevel = studentLevel.toLowerCase();

          // Build skillProgress from admin-defined progress_skills
          const levelSkills = allProgressSkills.filter((s: any) => s.level.toLowerCase() === normalizedLevel);
          const studentProgressMap = progressRecordMap[student.id] || {};
          const skillProgress: SkillProgress[] = levelSkills.map((skill: any) => {
            const record = studentProgressMap[skill.name];
            return {
              skillId: skill.id,
              skillName: skill.name,
              proficiency: record?.proficiency || 0,
              progressRecordId: record?.id,
            };
          });

          const overallProgress = skillProgress.length
            ? Math.round(skillProgress.reduce((sum, s) => sum + s.proficiency, 0) / skillProgress.length)
            : 0;

          return {
            id: student.id,
            name: `${firstName} ${lastName}`.trim() || profile?.email || 'Unknown Student',
            email: profile?.email || '',
            avatar: profile?.avatar_url,
            progress: overallProgress,
            level: student.level || 'novice',
            initials: (firstName[0] || '') + (lastName[0] || ''),
            enrollmentDate,
            lastActive: '',
            nextClass: '',
            notes: notesById[student.id] || [],
            skillProgress,
            classDay: student.class_day || undefined,
            classTime: student.class_time || undefined,
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
