
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentForAssignment {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  level: string;
  enrollment_status: string;
  instructor_id?: string;
}

interface AssignStudentsParams {
  instructorId: string;
  studentIds: string[];
}

const transformStudentRows = (students: any[]): StudentForAssignment[] => {
  const result: StudentForAssignment[] = [];
  if (!students || !Array.isArray(students)) return result;
  for (const s of students) {
    if (!s || typeof s !== 'object') continue;
    const obj = s as any;
    const profiles = obj.profiles;
    if (obj.id && profiles) {
      result.push({
        id: obj.id,
        level: obj.level || 'beginner',
        enrollment_status: obj.enrollment_status,
        instructor_id: obj.instructor_id,
        first_name: profiles.first_name || '',
        last_name: profiles.last_name || '',
        email: profiles.email || '',
      });
    }
  }
  return result;
};

export const useStudentAssignment = (instructorId?: string | null) => {
  const queryClient = useQueryClient();

  const fetchUnassignedStudents = async (): Promise<StudentForAssignment[]> => {
    const { data, error } = await supabase
      .from('students')
      .select(`id, level, enrollment_status, instructor_id, profiles ( first_name, last_name, email )`)
      .eq('enrollment_status', 'active' as any)
      .is('instructor_id', null);
    if (error) { toast.error('Failed to load unassigned students'); throw error; }
    return transformStudentRows(data || []);
  };

  const fetchAssignedStudents = async (): Promise<StudentForAssignment[]> => {
    if (!instructorId) return [];
    const { data, error } = await supabase
      .from('students')
      .select(`id, level, enrollment_status, instructor_id, profiles ( first_name, last_name, email )`)
      .eq('enrollment_status', 'active' as any)
      .eq('instructor_id', instructorId as any);
    if (error) { toast.error('Failed to load assigned students'); throw error; }
    return transformStudentRows(data || []);
  };

  const {
    data: unassignedStudents = [],
    isLoading: isLoadingStudents,
    refetch: refetchUnassignedStudents,
  } = useQuery({
    queryKey: ['admin', 'unassigned-students'],
    queryFn: fetchUnassignedStudents,
  });

  const {
    data: assignedStudents = [],
    isLoading: isLoadingAssigned,
  } = useQuery({
    queryKey: ['admin', 'assigned-students', instructorId],
    queryFn: fetchAssignedStudents,
    enabled: !!instructorId,
  });

  const assignStudentsToInstructor = useMutation({
    mutationFn: async ({ instructorId, studentIds }: AssignStudentsParams) => {
      if (!instructorId || !studentIds.length) throw new Error('Missing instructor ID or student IDs');
      const updates = studentIds.map(async (studentId) => {
        const { data, error } = await supabase.rpc('assign_student_to_instructor', {
          student_id: studentId,
          instructor_id: instructorId,
        });
        if (error) {
          console.error('assign_student_to_instructor error:', error);
          throw new Error(error.message || 'Failed to assign student');
        }
        return data;
      });
      await Promise.all(updates);
      return { success: true, instructorId, studentIds };
    },
    onSuccess: (result) => {
      toast.success(`${result.studentIds.length} students assigned to instructor`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'assigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to assign students: ${error.message || 'Unknown error'}`);
    },
  });

  const unassignStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ instructor_id: null } as any)
        .eq('id', studentId as any);
      if (error) throw error;
      return studentId;
    },
    onSuccess: () => {
      toast.success('Student unassigned');
      queryClient.invalidateQueries({ queryKey: ['admin', 'unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'assigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to unassign student: ${error.message || 'Unknown error'}`);
    },
  });

  return {
    unassignedStudents,
    assignedStudents,
    isLoadingStudents,
    isLoadingAssigned,
    assignStudentsToInstructor,
    unassignStudent,
    refetchUnassignedStudents,
  };
};
