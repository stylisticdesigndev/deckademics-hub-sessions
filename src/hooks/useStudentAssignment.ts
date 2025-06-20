
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

export const useStudentAssignment = () => {
  const queryClient = useQueryClient();

  // Function to fetch unassigned students (students without an instructor)
  const fetchUnassignedStudents = async (): Promise<StudentForAssignment[]> => {
    console.log('Fetching unassigned students...');
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          instructor_id,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('enrollment_status', 'active' as any)
        .is('instructor_id', null);

      if (error) {
        console.error('Error fetching unassigned students:', error);
        toast.error('Failed to load unassigned students');
        throw error;
      }

      console.log('Raw unassigned students data:', students);

      const studentsList: StudentForAssignment[] = [];

      if (students && Array.isArray(students)) {
        for (const student of students) {
          if (student && typeof student === 'object') {
            const studentObj = student as any;
            const id = studentObj.id;
            const level = studentObj.level || 'beginner';
            const enrollment_status = studentObj.enrollment_status;
            const instructor_id = studentObj.instructor_id;
            const profiles = studentObj.profiles;

            if (id && profiles) {
              studentsList.push({
                id,
                level,
                enrollment_status,
                instructor_id,
                first_name: profiles.first_name || '',
                last_name: profiles.last_name || '',
                email: profiles.email || ''
              });
            }
          }
        }
      }

      console.log('Transformed unassigned students:', studentsList);
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

      // Use the database function to assign each student
      const updates = studentIds.map(async (studentId) => {
        const { data, error } = await supabase
          .rpc('assign_student_to_instructor', {
            student_id: studentId,
            instructor_id: instructorId
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
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
