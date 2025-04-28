
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
  notes?: string | null;
  start_date?: string | null;
  instructor?: Instructor | null;
}

export const useAdminStudents = () => {
  const queryClient = useQueryClient();

  // Get active students
  const fetchActiveStudents = async () => {
    try {
      console.log("Fetching active students...");
      
      // Fetch students and profiles in one query with a join
      const { data: studentsWithProfiles, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          notes,
          start_date,
          profiles:id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('enrollment_status', 'active');
      
      if (error) {
        console.error("Error fetching active students with profiles:", error);
        throw error;
      }

      console.log("Raw active students with profiles data:", studentsWithProfiles);

      if (!studentsWithProfiles || studentsWithProfiles.length === 0) {
        console.log("No active students found");
        return [];
      }
      
      // Transform the data to match the Student interface
      const formattedStudents = studentsWithProfiles.map(student => {
        return {
          ...student,
          instructor: null,
          profile: student.profiles ? {
            first_name: student.profiles.first_name || '',
            last_name: student.profiles.last_name || '',
            email: student.profiles.email || ''
          } : {
            first_name: '',
            last_name: '',
            email: ''
          }
        };
      });
      
      console.log("Formatted active students:", formattedStudents);
      return formattedStudents;
    } catch (err) {
      console.error("Unexpected error in fetchActiveStudents:", err);
      throw err;
    }
  };

  // Get pending students
  const fetchPendingStudents = async () => {
    try {
      console.log("Fetching pending students...");
      
      // Fetch students and profiles in one query with a join
      const { data: studentsWithProfiles, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          notes,
          start_date,
          profiles:id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('enrollment_status', 'pending');
      
      if (error) {
        console.error("Error fetching pending students with profiles:", error);
        throw error;
      }

      console.log("Raw pending students with profiles data:", studentsWithProfiles);

      if (!studentsWithProfiles || studentsWithProfiles.length === 0) {
        console.log("No pending students found");
        return [];
      }
      
      // Transform the data to match the Student interface
      const formattedStudents = studentsWithProfiles.map(student => {
        return {
          ...student,
          instructor: null,
          profile: student.profiles ? {
            first_name: student.profiles.first_name || '',
            last_name: student.profiles.last_name || '',
            email: student.profiles.email || ''
          } : {
            first_name: '',
            last_name: '',
            email: ''
          }
        };
      });
      
      console.log("Formatted pending students:", formattedStudents);
      return formattedStudents;
    } catch (err) {
      console.error("Unexpected error in fetchPendingStudents:", err);
      throw err;
    }
  };

  // Query setup
  const { 
    data: activeStudents, 
    isLoading: isLoadingActive,
    refetch: refetchActive,
    error: activeError
  } = useQuery({
    queryKey: ['admin', 'students', 'active'],
    queryFn: fetchActiveStudents,
    retry: 1
  });

  const { 
    data: pendingStudents, 
    isLoading: isLoadingPending,
    refetch: refetchPending,
    error: pendingError
  } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: fetchPendingStudents,
    retry: 1
  });

  // Function to create a demo student
  const createDemoStudent = async () => {
    try {
      toast.loading("Creating demo student...");
      
      // Generate a unique timestamp to create unique email
      const timestamp = Date.now();
      const email = `demo${timestamp}@example.com`;
      
      console.log(`Using email: ${email} for demo student`);

      // First, check if a profile already exists with this email
      const { data: existingProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email);
      
      if (checkError) {
        console.error("Error checking existing profiles:", checkError);
        toast.dismiss();
        toast.error("Failed to check for existing profiles");
        return null;
      }
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log("A profile with this email already exists");
        toast.dismiss();
        toast.error("A profile with this email already exists");
        return null;
      }

      // Make the request to the edge function
      try {
        const response = await supabase.functions.invoke('create-demo-student', {
          body: {
            email_address: email,
            first_name: 'Demo',
            last_name: 'Student'
          }
        });
        
        if (response.error || !response.data?.success) {
          console.error("Failed to create demo student:", response.error || response.data?.error);
          toast.dismiss();
          toast.error(`Failed to create demo student: ${response.error || response.data?.error || 'Unknown error'}`);
          return null;
        }
        
        // Success!
        const result = response.data;
        console.log("Demo student created successfully:", result);
        toast.dismiss();
        toast.success("Demo student created successfully!");
        
        // Force refetching of students data after successful creation
        // Use setTimeout to ensure the database has time to update
        setTimeout(() => {
          refetchActive();
          refetchPending();
          toast.info("Refreshing student data...");
        }, 2000);
        
        return result;
      } catch (err) {
        console.error("Exception in createDemoStudent:", err);
        toast.dismiss();
        toast.error("Failed to create demo student. Please try again later.");
        return null;
      }
    } catch (err) {
      console.error("Unexpected error in createDemoStudent:", err);
      toast.dismiss();
      toast.error("An unexpected error occurred");
      return null;
    }
  };

  // Debug function to directly fetch all database data
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
      throw err;
    }
  };

  // Mutation to approve a student
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

  // Mutation to decline a student
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

  // Mutation to deactivate a student
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

  // Handle any errors
  if (activeError) {
    console.error("Error in active students query:", activeError);
  }
  
  if (pendingError) {
    console.error("Error in pending students query:", pendingError);
  }

  return {
    activeStudents: activeStudents || [],
    pendingStudents: pendingStudents || [],
    isLoading: isLoadingActive || isLoadingPending,
    approveStudent,
    declineStudent,
    deactivateStudent,
    createDemoStudent,
    debugFetchStudents,
    refetchData: () => {
      refetchActive();
      refetchPending();
    }
  };
};
