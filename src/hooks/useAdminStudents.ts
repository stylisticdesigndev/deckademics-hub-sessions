
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

// Define the structure of the data returned by the get_students_with_instructors function
interface InstructorAssignment {
  student_id: string;
  instructor_id: string;
  instructor_first_name: string;
  instructor_last_name: string;
}

export const useAdminStudents = () => {
  const queryClient = useQueryClient();

  const { data: activeStudents, isLoading: isLoadingActive } = useQuery({
    queryKey: ['admin', 'students', 'active'],
    queryFn: async () => {
      console.log("Fetching active students");
      try {
        // First, directly query the students table to check if it has data
        const studentsCheck = await supabase
          .from('students')
          .select('count')
          .eq('enrollment_status', 'active')
          .single();
        
        console.log("Students table check:", studentsCheck);
        
        // Now perform the actual query with all the joins
        const { data: students, error } = await supabase
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
        
        console.log("Active students raw data:", students);
        
        // Make sure we have valid data before proceeding
        if (!students || students.length === 0) {
          console.log("No active students found");
          return [] as Student[];
        }
        
        // Type the data correctly
        const typedStudents = students as Student[];
        
        try {
          // Get all student IDs
          const studentIds = typedStudents.map(student => student.id);
          console.log("Student IDs for instructor lookup:", studentIds);
          
          if (studentIds.length > 0) {
            // Use the raw SQL function we created in the migration
            const { data: instructorAssignments, error: instructorError } = await supabase
              .rpc('get_students_with_instructors', { student_ids: studentIds });
            
            if (instructorError) {
              console.error("Error fetching instructor assignments:", instructorError);
            } else if (instructorAssignments) {
              console.log("Instructor assignments returned:", instructorAssignments);
              
              // Map instructors to students
              const instructorMap: Record<string, Instructor> = {};
              
              // Type assertion to handle the returned data properly
              (instructorAssignments as InstructorAssignment[]).forEach((item) => {
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
              typedStudents.forEach(student => {
                // Explicitly type the student object to include the instructor property
                (student as Student).instructor = instructorMap[student.id] || null;
              });
            }
          }
        } catch (err) {
          console.error("Error processing instructor data:", err);
        }
        
        return typedStudents;
      } catch (err) {
        console.error("Unexpected error in useAdminStudents:", err);
        throw err;
      }
    }
  });

  const { data: pendingStudents, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: async () => {
      console.log("Fetching pending students");
      try {
        // First, directly query the students table to check if it has data
        const studentsCheck = await supabase
          .from('students')
          .select('count')
          .eq('enrollment_status', 'pending')
          .single();
        
        console.log("Pending students check:", studentsCheck);
        
        const { data: students, error } = await supabase
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
        
        console.log("Pending students raw data:", students);
        return students as Student[];
      } catch (err) {
        console.error("Unexpected error fetching pending students:", err);
        throw err;
      }
    }
  });

  // Let's add a debug function to manually fetch students
  const debugFetchStudents = async () => {
    try {
      console.log("Debug: Directly fetching all students");
      
      // Query without filters to see all students
      const { data: allStudents, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          profile:profiles(first_name, last_name, email)
        `);
      
      if (error) {
        console.error("Debug: Error fetching all students:", error);
        return;
      }
      
      console.log("Debug: All students in database:", allStudents);
      
      // Also check profiles table
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error("Debug: Error fetching profiles:", profilesError);
        return;
      }
      
      console.log("Debug: All profiles in database:", allProfiles);
      
      // Return both for debugging
      return { allStudents, allProfiles };
    } catch (err) {
      console.error("Debug: Unexpected error in debugFetchStudents:", err);
    }
  };

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

  // Call the debug function immediately to log current state
  debugFetchStudents().then(result => {
    console.log("Debug fetch complete:", result);
  }).catch(err => {
    console.error("Debug fetch error:", err);
  });

  return {
    activeStudents: activeStudents || [],
    pendingStudents: pendingStudents || [],
    isLoading: isLoadingActive || isLoadingPending,
    approveStudent,
    declineStudent,
    deactivateStudent,
    debugFetchStudents
  };
};
