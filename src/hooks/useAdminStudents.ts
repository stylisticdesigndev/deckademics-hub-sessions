
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
  instructor?: Instructor;
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
      
      // Fetch instructor assignments separately
      if (data && data.length > 0) {
        const studentIds = data.map(student => student.id);
        
        const { data: instructorAssignments, error: instructorError } = await supabase
          .from('students_instructors')
          .select(`
            student_id,
            instructor:instructor_id(
              id,
              profile:profiles(first_name, last_name)
            )
          `)
          .in('student_id', studentIds);
        
        if (instructorError) {
          console.error("Error fetching instructor assignments:", instructorError);
        } else if (instructorAssignments) {
          // Map instructors to students
          const instructorMap = instructorAssignments.reduce((map, item) => {
            map[item.student_id] = item.instructor;
            return map;
          }, {});
          
          // Add instructor info to student records
          data.forEach(student => {
            student.instructor = instructorMap[student.id];
          });
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
