
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

interface InstructorWithProfile {
  id: string;
  status: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface StudentWithProfile {
  id: string;
  level: string;
  enrollment_status: string;
  instructor_id?: string;
  start_date?: string | null;
  class_day?: string | null;
  class_time?: string | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  instructor?: InstructorWithProfile;
}

const mapStudentData = (studentObj: any): StudentWithProfile | null => {
  const id = studentObj.id;
  const level = studentObj.level || 'novice';
  const enrollment_status = studentObj.enrollment_status;
  const instructor_id = studentObj.instructor_id;
  const start_date = studentObj.start_date;
  const class_day = studentObj.class_day;
  const class_time = studentObj.class_time;
  const profiles = studentObj.profiles;
  const instructors = studentObj.instructors;

  if (!id || !profiles) return null;

  return {
    id,
    level,
    enrollment_status,
    instructor_id,
    start_date,
    class_day,
    class_time,
    profile: {
      first_name: profiles.first_name,
      last_name: profiles.last_name,
      email: profiles.email || ''
    },
    instructor: instructors ? {
      id: instructors.id,
      status: instructors.status,
      profile: {
        first_name: instructors.profiles?.first_name,
        last_name: instructors.profiles?.last_name,
        email: instructors.profiles?.email || ''
      }
    } : undefined
  };
};

export const useAdminStudents = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const fetchStudentsByStatus = async (statuses: string[], includeInstructor = false): Promise<StudentWithProfile[]> => {
    try {
      const selectQuery = includeInstructor
        ? `id, level, enrollment_status, instructor_id, start_date, class_day, class_time, profiles (first_name, last_name, email), instructors (id, status, profiles (first_name, last_name, email))`
        : `id, level, enrollment_status, instructor_id, start_date, class_day, class_time, profiles (first_name, last_name, email)`;

      let query = supabase.from('students').select(selectQuery);

      if (statuses.length === 1) {
        query = query.eq('enrollment_status', statuses[0] as any);
      } else {
        query = query.in('enrollment_status', statuses as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }

      const students: StudentWithProfile[] = [];
      if (data && Array.isArray(data)) {
        for (const student of data) {
          const mapped = mapStudentData(student);
          if (mapped) students.push(mapped);
        }
      }
      return students;
    } catch (error) {
      console.error('Error in fetchStudentsByStatus:', error);
      return [];
    }
  };

  const { data: activeStudents = [], isLoading: isLoadingActive, refetch: refetchActive } = useQuery({
    queryKey: ['admin', 'students', 'active'],
    queryFn: () => fetchStudentsByStatus(['active'], true),
  });

  const { data: pendingStudents = [], isLoading: isLoadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: () => fetchStudentsByStatus(['pending']),
  });

  const { data: inactiveStudents = [], isLoading: isLoadingInactive, refetch: refetchInactive } = useQuery({
    queryKey: ['admin', 'students', 'inactive'],
    queryFn: () => fetchStudentsByStatus(['inactive', 'declined']),
  });

  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'active' } as any)
        .eq('id', studentId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Student approved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve student: ${error.message}`);
    }
  });

  const declineStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'declined' } as any)
        .eq('id', studentId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Student declined successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline student: ${error.message}`);
    }
  });

  const deactivateStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'inactive' } as any)
        .eq('id', studentId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Student deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate student: ${error.message}`);
    }
  });

  const reactivateStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'active' } as any)
        .eq('id', studentId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Student reactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reactivate student: ${error.message}`);
    }
  });

  const updateStudentLevel = useMutation({
    mutationFn: async ({ studentId, level }: { studentId: string; level: string }) => {
      const { error } = await supabase
        .from('students')
        .update({ level } as any)
        .eq('id', studentId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student level updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update student level: ${error.message}`);
    }
  });

  const refetchData = async () => {
    await Promise.all([refetchActive(), refetchPending(), refetchInactive()]);
  };

  return {
    activeStudents,
    pendingStudents,
    inactiveStudents,
    isLoading: isLoadingActive || isLoadingPending || isLoadingInactive,
    approveStudent,
    declineStudent,
    deactivateStudent,
    reactivateStudent,
    updateStudentLevel,
    refetchData
  };
};
