
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  notes?: string[];
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

        // Get progress data for these students
        const { data: progressData, error: progressError } = await supabase
          .from('student_progress')
          .select('student_id, proficiency')
          .in('student_id', studentIds);

        if (progressError) {
          console.error('Error fetching progress:', progressError);
        }

        // Calculate average progress for each student - convert proficiency (1-10) back to percentage (0-100)
        const progressById: { [id: string]: number } = {};
        studentIds.forEach((id) => {
          const records = (progressData || []).filter((row) => row.student_id === id);
          const profs = records.map((r) => (r.proficiency || 1) * 10); // Convert 1-10 scale to 0-100 percentage
          progressById[id] = profs.length
            ? Math.round(profs.reduce((a, b) => a + b, 0) / profs.length)
            : 0;
        });

        // Format students data
        const formattedStudents: Student[] = assignedStudents.map((student) => {
          const profile = student.profiles;
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';
          
          // Convert notes from string to array format
          const notesArray = student.notes 
            ? student.notes.split('\n').filter(note => note.trim().length > 0)
            : [];
          
          return {
            id: student.id,
            name: `${firstName} ${lastName}`.trim() || profile?.email || 'Unknown Student',
            email: profile?.email || '',
            avatar: profile?.avatar_url,
            progress: progressById[student.id] || 0,
            level: student.level || 'Novice',
            initials: (firstName[0] || '') + (lastName[0] || ''),
            enrollmentDate: student.start_date?.slice(0, 10) || '',
            lastActive: '',
            nextClass: '',
            notes: notesArray,
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
