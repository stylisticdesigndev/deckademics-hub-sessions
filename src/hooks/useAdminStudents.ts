
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

  // Get active students
  const fetchActiveStudents = async () => {
    try {
      console.log("Fetching active students...");
      
      // First get all students with active status
      const { data: activeStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('enrollment_status', 'active');
      
      if (studentsError) {
        console.error("Error fetching active students:", studentsError);
        return [];
      }

      if (!activeStudents || activeStudents.length === 0) {
        console.log("No active students found");
        return [];
      }

      console.log("Found active students:", activeStudents);
      
      // Get profiles for these students
      const activeStudentIds = activeStudents.map(student => student.id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', activeStudentIds);
        
      if (profilesError) {
        console.error("Error fetching profiles for active students:", profilesError);
        return [];
      }
      
      // Combine student data with profile data
      const studentsWithProfiles = activeStudents.map(student => {
        const profile = profiles?.find(p => p.id === student.id);
        return {
          ...student,
          profile: profile ? {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || ''
          } : {
            first_name: '',
            last_name: '',
            email: ''
          }
        };
      });
      
      console.log("Active students with profiles:", studentsWithProfiles);
      return studentsWithProfiles;
    } catch (err) {
      console.error("Unexpected error in fetchActiveStudents:", err);
      return [];
    }
  };

  // Get pending students
  const fetchPendingStudents = async () => {
    try {
      console.log("Fetching pending students...");
      
      // First get all students with pending status
      const { data: pendingStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('enrollment_status', 'pending');
      
      if (studentsError) {
        console.error("Error fetching pending students:", studentsError);
        return [];
      }

      if (!pendingStudents || pendingStudents.length === 0) {
        console.log("No pending students found");
        return [];
      }

      console.log("Found pending students:", pendingStudents);
      
      // Get profiles for these students
      const pendingStudentIds = pendingStudents.map(student => student.id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', pendingStudentIds);
        
      if (profilesError) {
        console.error("Error fetching profiles for pending students:", profilesError);
        return [];
      }
      
      // Combine student data with profile data
      const studentsWithProfiles = pendingStudents.map(student => {
        const profile = profiles?.find(p => p.id === student.id);
        return {
          ...student,
          profile: profile ? {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || ''
          } : {
            first_name: '',
            last_name: '',
            email: ''
          }
        };
      });
      
      console.log("Pending students with profiles:", studentsWithProfiles);
      return studentsWithProfiles;
    } catch (err) {
      console.error("Unexpected error in fetchPendingStudents:", err);
      return [];
    }
  };

  // Query setup
  const { 
    data: activeStudents, 
    isLoading: isLoadingActive,
    refetch: refetchActive
  } = useQuery({
    queryKey: ['admin', 'students', 'active'],
    queryFn: fetchActiveStudents
  });

  const { 
    data: pendingStudents, 
    isLoading: isLoadingPending,
    refetch: refetchPending
  } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: fetchPendingStudents
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

      // Make the request to the edge function with retries
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let result = null;
      
      while (attempts < maxAttempts && !success) {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} to create demo student`);
        
        try {
          const response = await supabase.functions.invoke('create-demo-student', {
            body: {
              email_address: email,
              first_name: 'Demo',
              last_name: 'Student'
            }
          });
          
          if (response.error) {
            console.error(`Attempt ${attempts} failed:`, response.error);
            
            if (attempts >= maxAttempts) {
              toast.dismiss();
              toast.error(`Failed to create demo student: ${response.error}`);
              return null;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          // Success!
          result = response.data;
          console.log("Demo student created successfully:", result);
          success = true;
          toast.dismiss();
          toast.success("Demo student created successfully!");
          
          // Force refetching of students data after successful creation
          await Promise.all([refetchActive(), refetchPending()]);
          break;
        } catch (err) {
          console.error(`Attempt ${attempts} exception:`, err);
          
          if (attempts >= maxAttempts) {
            toast.dismiss();
            toast.error("Failed after multiple attempts. Please try again later.");
            return null;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      return result;
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
