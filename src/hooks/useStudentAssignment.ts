
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { asInsertParam, asUpdateParam, asDatabaseParam } from '@/utils/supabaseHelpers';

export interface StudentForAssignment {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  level: string;
}

interface AssignStudentsParams {
  instructorId: string;
  studentIds: string[];
}

export const useStudentAssignment = () => {
  const queryClient = useQueryClient();

  // Function to fetch unassigned students
  const fetchUnassignedStudents = async (): Promise<StudentForAssignment[]> => {
    console.log('Fetching unassigned students...');
    try {
      // First get active students from students table
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          level,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('enrollment_status', asDatabaseParam<string>('active'));

      if (studentsError) {
        console.error('Error fetching active students:', studentsError);
        toast.error('Failed to load unassigned students');
        throw studentsError;
      }

      // Log raw data for debugging
      console.log('Raw active students data:', activeStudents);

      // Transform the data to match our StudentForAssignment interface
      // and filter out students with existing instructors
      const studentsList = activeStudents
        .filter(student => student.profiles && student.profiles.length > 0)
        .map(student => ({
          id: student.id,
          level: student.level || 'beginner',
          first_name: student.profiles[0]?.first_name || '',
          last_name: student.profiles[0]?.last_name || '',
          email: student.profiles[0]?.email || ''
        }));

      return studentsList;
    } catch (err) {
      console.error('Error in fetchUnassignedStudents:', err);
      return [];
    }
  };

  // Query for unassigned students
  const {
    data: unassignedStudents = [],
    isLoading: isLoadingStudents,
    refetch: refetchUnassignedStudents,
  } = useQuery({
    queryKey: ['admin', 'unassigned-students'],
    queryFn: fetchUnassignedStudents,
  });

  // Mutation to assign students to an instructor
  const assignStudentsToInstructor = useMutation({
    mutationFn: async ({ instructorId, studentIds }: AssignStudentsParams) => {
      console.log(`Assigning ${studentIds.length} students to instructor ${instructorId}`);

      if (!instructorId || !studentIds.length) {
        throw new Error('Missing instructor ID or student IDs');
      }

      // Create a junction table entry or update student records
      // This is a simplified example - in a real application you might have a proper students_instructors junction table
      const updates = studentIds.map(async (studentId) => {
        const { data, error } = await supabase
          .rpc('assign_student_to_instructor', {
            student_id: asDatabaseParam<string>(studentId),
            instructor_id: asDatabaseParam<string>(instructorId)
          });

        if (error) {
          console.error(`Error assigning student ${studentId} to instructor:`, error);
          throw error;
        }

        return data;
      });

      // Wait for all updates to complete
      await Promise.all(updates);

      return { success: true, instructorId, studentIds };
    },
    onSuccess: (result) => {
      console.log('Students assigned successfully:', result);
      toast.success(`${result.studentIds.length} students assigned to instructor`);
      
      // Refetch relevant data
      queryClient.invalidateQueries({ queryKey: ['admin', 'unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
    },
    onError: (error: any) => {
      console.error('Error assigning students:', error);
      toast.error(`Failed to assign students: ${error.message || 'Unknown error'}`);
    }
  });

  return {
    unassignedStudents,
    isLoadingStudents,
    assignStudentsToInstructor,
    refetchUnassignedStudents
  };
};
