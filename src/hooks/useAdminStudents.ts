
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
}

interface InstructorProfile {
  first_name: string;
  last_name: string;
}

interface Instructor {
  id: string;
  profile: InstructorProfile;
}

interface Student {
  id: string;
  level: string;
  enrollment_status: string;
  profile: Profile;
  instructor?: Instructor | null;
}

export const useAdminStudents = () => {
  const queryClient = useQueryClient();

  const { data: activeStudents, isLoading: isLoadingActive } = useQuery({
    queryKey: ['admin', 'students', 'active'],
    queryFn: async () => {
      console.log("Fetching active students");
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          profile:profiles(first_name, last_name, email)
        `)
        .eq('enrollment_status', 'active');

      if (error) {
        console.error("Error fetching active students:", error);
        throw error;
      }
      
      console.log("Active students data:", data);
      
      // Get the students with instructor information using a custom query
      if (data && data.length > 0) {
        try {
          const studentIds = data.map(student => student.id);
          
          // Here we use a raw SQL query to get instructor info since the students_instructors junction table
          // isn't defined in the TypeScript types
          const { data: instructorAssignments, error: instructorError } = await supabase
            .rpc('get_students_with_instructors', { student_ids: studentIds });
          
          if (instructorError) {
            console.error("Error fetching instructor assignments:", instructorError);
          } else if (instructorAssignments) {
            console.log("Instructor assignments:", instructorAssignments);
            
            // Map instructors to students
            const instructorMap: Record<string, Instructor> = {};
            instructorAssignments.forEach((item: any) => {
              if (item && item.student_id && item.instructor_id) {
                instructorMap[item.student_id] = {
                  id: item.instructor_id,
                  profile: {
                    first_name: item.instructor_first_name || '',
                    last_name: item.instructor_last_name || ''
                  }
                };
              }
            });
            
            // Add instructor info to student records
            data.forEach(student => {
              student.instructor = instructorMap[student.id] || null;
            });
          }
        } catch (err) {
          console.error("Error processing instructor data:", err);
        }
      }
      
      return data as Student[];
    }
  });

  const { data: pendingStudents, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: async () => {
      console.log("Fetching pending students");
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          profile:profiles(first_name, last_name, email)
        `)
        .eq('enrollment_status', 'pending');

      if (error) {
        console.error("Error fetching pending students:", error);
        throw error;
      }
      
      console.log("Pending students data:", data);
      return data as Student[];
    }
  });

  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'active' })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student approved successfully');
    },
    onError: (error) => {
      console.error("Error approving student:", error);
      toast.error('Failed to approve student: ' + error.message);
    }
  });

  const declineStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'declined' })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student declined successfully');
    },
    onError: (error) => {
      console.error("Error declining student:", error);
      toast.error('Failed to decline student: ' + error.message);
    }
  });

  const deactivateStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'inactive' })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student deactivated successfully');
    },
    onError: (error) => {
      console.error("Error deactivating student:", error);
      toast.error('Failed to deactivate student: ' + error.message);
    }
  });

  return {
    activeStudents: activeStudents || [],
    pendingStudents: pendingStudents || [],
    isLoading: isLoadingActive || isLoadingPending,
    approveStudent,
    declineStudent,
    deactivateStudent
  };
};
