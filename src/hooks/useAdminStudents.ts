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
  instructor?: Instructor | null;  // Added as optional property
}

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
        // Direct query to check if there are any active students
        const { data: countResult, error: countError } = await supabase
          .from('students')
          .select('count')
          .eq('enrollment_status', 'active');
        
        if (countError) {
          console.error("Error checking student count:", countError);
          return [];
        }
        
        console.log("Active student count check:", countResult);
        
        // Query profiles first to make sure we have valid data
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'student');
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          return [];
        }
        
        if (!profiles || profiles.length === 0) {
          console.log("No student profiles found");
          return [];
        }
        
        console.log("Found student profiles:", profiles.length);
        
        // Now get active students with their profiles
        const { data: students, error } = await supabase
          .from('students')
          .select(`
            id,
            level,
            enrollment_status,
            profile:profiles!inner(first_name, last_name, email)
          `)
          .eq('enrollment_status', 'active');

        if (error) {
          console.error("Error fetching active students:", error);
          return [];
        }
        
        console.log("Active students query result:", students);
        
        if (!students || students.length === 0) {
          console.log("No active students found");
          return [];
        }

        // Ensure all students have valid profiles
        const validStudents = students.filter(student => 
          student && student.profile && student.profile.first_name && student.profile.last_name
        ) as Student[];
        
        console.log("Valid active students with profiles:", validStudents.length);
        
        // Don't try to fetch instructor data if there are no valid students
        if (validStudents.length === 0) {
          return [];
        }
        
        // Get instructor assignments
        try {
          const studentIds = validStudents.map(student => student.id);
          
          // Create a manual mapping since the RPC function might be failing
          const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select(`
              student_id,
              class:classes(
                instructor_id,
                instructor:instructors(
                  profile:profiles(first_name, last_name)
                )
              )
            `)
            .in('student_id', studentIds);
          
          if (enrollError) {
            console.error("Error fetching enrollments:", enrollError);
          } else if (enrollments && enrollments.length > 0) {
            console.log("Found enrollments:", enrollments);
            
            // Map instructors to students
            const instructorMap: Record<string, Instructor> = {};
            
            enrollments.forEach(enrollment => {
              if (enrollment && 
                  enrollment.class && 
                  enrollment.class.instructor && 
                  enrollment.class.instructor.profile) {
                    
                const instructor = enrollment.class.instructor;
                instructorMap[enrollment.student_id] = {
                  id: enrollment.class.instructor_id,
                  profile: {
                    first_name: instructor.profile.first_name || '',
                    last_name: instructor.profile.last_name || ''
                  }
                };
              }
            });
            
            // Add instructor info to student records
            validStudents.forEach(student => {
              student.instructor = instructorMap[student.id] || null;
            });
          }
        } catch (err) {
          console.error("Error processing instructor data:", err);
        }
        
        return validStudents;
      } catch (err) {
        console.error("Unexpected error in useAdminStudents (active):", err);
        return [];
      }
    }
  });

  const { data: pendingStudents, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: async () => {
      console.log("Fetching pending students");
      try {
        // Direct query to check if there are any pending students
        const { data: countResult, error: countError } = await supabase
          .from('students')
          .select('count')
          .eq('enrollment_status', 'pending');
        
        if (countError) {
          console.error("Error checking pending student count:", countError);
          return [];
        }
        
        console.log("Pending student count check:", countResult);
        
        // Query profiles first
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'student');
          
        if (profilesError) {
          console.error("Error fetching profiles for pending students:", profilesError);
          return [];
        }
        
        if (!profiles || profiles.length === 0) {
          console.log("No student profiles found for pending check");
          return [];
        }
        
        // Get pending students with their profiles
        const { data: students, error } = await supabase
          .from('students')
          .select(`
            id,
            level,
            enrollment_status,
            profile:profiles!inner(first_name, last_name, email)
          `)
          .eq('enrollment_status', 'pending');

        if (error) {
          console.error("Error fetching pending students:", error);
          return [];
        }
        
        console.log("Pending students query result:", students);
        
        if (!students || students.length === 0) {
          console.log("No pending students found");
          return [];
        }

        // Ensure all students have valid profiles
        const validStudents = students.filter(student => 
          student && student.profile && student.profile.first_name && student.profile.last_name
        ) as Student[];
        
        console.log("Valid pending students with profiles:", validStudents.length);
        
        return validStudents;
      } catch (err) {
        console.error("Unexpected error in useAdminStudents (pending):", err);
        return [];
      }
    }
  });

  // Modified function to create a student that bypasses RLS
  const createDemoStudent = async () => {
    try {
      console.log("Creating demo student...");
      
      // Generate a unique ID
      const studentId = crypto.randomUUID();
      const timestamp = Date.now();
      const email = `demo${timestamp}@example.com`;
      
      // First, check if a student already exists with this email to avoid duplicates
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email);
      
      if (checkError) {
        console.error("Error checking existing profiles:", checkError);
        toast.error("Failed to check for existing profiles");
        return;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log("A student with this email already exists");
        toast.error("A student with this email already exists");
        return;
      }

      // Use a stored function or direct SQL to bypass RLS
      // This requires the function to be defined in the database with SECURITY DEFINER
      const { data: result, error: functionError } = await supabase
        .rpc('create_demo_student', {
          student_id: studentId,
          email_address: email,
          first_name: 'Demo',
          last_name: 'Student'
        });

      if (functionError) {
        console.error("Error creating demo student:", functionError);
        toast.error(`Failed to create demo student: ${functionError.message}`);
        return;
      }
      
      console.log("Demo student created:", result);
      toast.success("Demo student created successfully");
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      return result;
    } catch (err) {
      console.error("Error in createDemoStudent:", err);
      toast.error("Failed to create demo student");
      return null;
    }
  };

  // Let's add a debug function to directly fetch students
  const debugFetchStudents = async () => {
    try {
      console.log("Debug: Directly fetching all data");
      
      // Query without filters to see all students
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*');
      
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
    createDemoStudent,
    debugFetchStudents
  };
};
