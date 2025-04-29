
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
      
      // First, get all active student records
      const { data: studentRecords, error } = await supabase
        .from('students')
        .select('*')
        .eq('enrollment_status', 'active');
      
      if (error) {
        console.error("Error fetching active students:", error);
        throw error;
      }

      console.log("Raw active students data:", studentRecords);

      if (!studentRecords || studentRecords.length === 0) {
        console.log("No active students found");
        return [];
      }
      
      // Then get all the profiles for these students in a separate query
      const studentIds = studentRecords.map(student => student.id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);
      
      if (profilesError) {
        console.error("Error fetching profiles for active students:", profilesError);
        throw profilesError;
      }
      
      console.log("Profiles for active students:", profilesData);
      
      // Combine the student records with their profiles
      const formattedStudents = studentRecords.map(student => {
        const profile = profilesData?.find(p => p.id === student.id);
        
        return {
          ...student,
          instructor: null, // Initialize instructor as null for now
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
      
      // First, get all pending student records
      const { data: studentRecords, error } = await supabase
        .from('students')
        .select('*')
        .eq('enrollment_status', 'pending');
      
      if (error) {
        console.error("Error fetching pending students:", error);
        throw error;
      }

      console.log("Raw pending students data:", studentRecords);

      if (!studentRecords || studentRecords.length === 0) {
        console.log("No pending students found");
        return [];
      }
      
      // Then get all the profiles for these students in a separate query
      const studentIds = studentRecords.map(student => student.id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);
      
      if (profilesError) {
        console.error("Error fetching profiles for pending students:", profilesError);
        throw profilesError;
      }
      
      console.log("Profiles for pending students:", profilesData);
      
      // Combine the student records with their profiles
      const formattedStudents = studentRecords.map(student => {
        const profile = profilesData?.find(p => p.id === student.id);
        
        return {
          ...student,
          instructor: null, // Initialize instructor as null for now
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
    queryFn: fetchActiveStudents
  });

  const { 
    data: pendingStudents, 
    isLoading: isLoadingPending,
    refetch: refetchPending,
    error: pendingError
  } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: fetchPendingStudents
  });

  // Function to create a demo student
  const createDemoStudent = async () => {
    try {
      const { toast } = await import('@/components/ui/use-toast');
      toast({
        title: "Creating demo student...",
        description: "Please wait while we set up a demo student account.",
      });
      
      // Generate a unique timestamp to create unique email
      const timestamp = Date.now();
      const email = `demo${timestamp}@example.com`;
      
      console.log(`Using email: ${email} for demo student`);

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
          toast({
            title: "Error",
            description: `Failed to create demo student: ${response.error || response.data?.error || 'Unknown error'}`,
            variant: "destructive",
          });
          return null;
        }
        
        // Success!
        const result = response.data;
        console.log("Demo student created successfully:", result);
        toast({
          title: "Success",
          description: "Demo student created successfully!",
        });
        
        // Force refetching of students data after successful creation
        // Use setTimeout to ensure the database has time to update
        setTimeout(() => {
          console.log("Refreshing student data after creating demo student...");
          refetchActive();
          refetchPending();
          debugFetchStudents();  // Also run debug fetch to verify data
          toast({
            title: "Refreshing",
            description: "Refreshing student data...",
          });
        }, 2000);
        
        return result;
      } catch (err) {
        console.error("Exception in createDemoStudent:", err);
        toast({
          title: "Error",
          description: "Failed to create demo student. Please try again later.",
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      console.error("Unexpected error in createDemoStudent:", err);
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
      toast({
        title: "Success",
        description: "Student approved successfully"
      });
    },
    onError: (error) => {
      console.error("Error approving student:", error);
      toast({
        title: "Error",
        description: `Failed to approve student: ${error.message}`,
        variant: "destructive"
      });
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
      toast({
        title: "Success",
        description: "Student declined successfully"
      });
    },
    onError: (error) => {
      console.error("Error declining student:", error);
      toast({
        title: "Error",
        description: `Failed to decline student: ${error.message}`,
        variant: "destructive"
      });
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
      toast({
        title: "Success",
        description: "Student deactivated successfully"
      });
    },
    onError: (error) => {
      console.error("Error deactivating student:", error);
      toast({
        title: "Error",
        description: `Failed to deactivate student: ${error.message}`,
        variant: "destructive"
      });
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
