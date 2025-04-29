
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

  // Debug function to directly fetch all database data
  const debugFetchStudents = async () => {
    console.log("Debug: Directly fetching all data");
    
    try {
      // Query all students
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*');
      
      if (error) {
        console.error("Debug: Error fetching all students:", error);
        throw error;
      }
      
      console.log("Debug: All students in database:", allStudents || []);
      
      // Query all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error("Debug: Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Debug: All profiles in database:", allProfiles || []);
      
      // Create students manually from profiles
      if (allProfiles && allProfiles.length > 0) {
        const manuallyCreatedStudents = allProfiles
          .filter(profile => profile.role === 'student')
          .map(profile => {
            // Check if a corresponding student record exists
            const existingStudent = allStudents?.find(s => s.id === profile.id);
            
            return {
              id: profile.id,
              level: existingStudent?.level || 'beginner',
              enrollment_status: existingStudent?.enrollment_status || 'active',
              notes: existingStudent?.notes || null,
              start_date: existingStudent?.start_date || null,
              profile: {
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || ''
              }
            };
          });
        
        console.log("Manually created students from profiles:", manuallyCreatedStudents);
      }
      
      // Return both for debugging
      return { allStudents, allProfiles };
    } catch (err) {
      console.error("Debug: Unexpected error in debugFetchStudents:", err);
      throw err;
    }
  };

  // Get all students
  const fetchAllStudents = async () => {
    try {
      console.log("Fetching all students...");
      
      // Get all profiles that have a student role
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');
      
      if (profilesError) {
        console.error("Error fetching student profiles:", profilesError);
        throw profilesError;
      }

      console.log("Found student profiles:", studentProfiles || []);
      
      if (!studentProfiles || studentProfiles.length === 0) {
        console.log("No student profiles found");
        return { activeStudents: [], pendingStudents: [] };
      }
      
      // Get all student records
      const { data: studentRecords, error: studentsError } = await supabase
        .from('students')
        .select('*');
      
      if (studentsError) {
        console.error("Error fetching student records:", studentsError);
        throw studentsError;
      }

      console.log("Found student records:", studentRecords || []);
      
      // Create complete student objects by merging profiles with student records
      const allStudents = studentProfiles.map(profile => {
        // Find the corresponding student record if it exists
        const studentRecord = studentRecords?.find(s => s.id === profile.id) || {
          id: profile.id,
          level: 'beginner',
          enrollment_status: 'pending',
          notes: null,
          start_date: null
        };
        
        return {
          ...studentRecord,
          profile: {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || ''
          },
          instructor: null // Initialize instructor as null for now
        };
      });
      
      console.log("Merged student objects:", allStudents);
      
      // Filter for active and pending students
      const activeStudents = allStudents.filter(
        student => student.enrollment_status === 'active'
      );
      
      const pendingStudents = allStudents.filter(
        student => student.enrollment_status === 'pending'
      );
      
      console.log("Active students:", activeStudents);
      console.log("Pending students:", pendingStudents);
      
      return { activeStudents, pendingStudents };
    } catch (err) {
      console.error("Unexpected error in fetchAllStudents:", err);
      throw err;
    }
  };

  // Query setup for all students
  const { 
    data: studentsData, 
    isLoading,
    refetch: refetchStudents,
    error: studentsError
  } = useQuery({
    queryKey: ['admin', 'students', 'all'],
    queryFn: fetchAllStudents,
    // Add staleTime to ensure data is refetched when needed
    staleTime: 10000 // 10 seconds
  });

  // Function to create a demo student
  const createDemoStudent = async () => {
    try {
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
          return null;
        }
        
        // Success!
        const result = response.data;
        console.log("Demo student created successfully:", result);
        
        // Force invalidation of queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
        
        // Use setTimeout to ensure the database has time to update
        setTimeout(() => {
          console.log("Refreshing student data after creating demo student...");
          refetchStudents();
        }, 2000);
        
        return result;
      } catch (err) {
        console.error("Exception in createDemoStudent:", err);
        return null;
      }
    } catch (err) {
      console.error("Unexpected error in createDemoStudent:", err);
      return null;
    }
  };

  // Mutation to approve a student - FIXED to ensure proper synchronization
  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Approving student with ID:", studentId);
      
      // Update the student record directly
      const { data, error } = await supabase
        .from('students')
        .update({ enrollment_status: 'active' })
        .eq('id', studentId)
        .select();

      if (error) {
        console.error("Error in approveStudent mutation:", error);
        throw new Error(error.message);
      }
      
      console.log("Student approved successfully in database:", data);
      
      // Return result data for later use
      return { success: true, studentId, data };
    },
    onSuccess: (result) => {
      console.log("Student approved successfully:", result);
      
      // Explicitly invalidate and refetch queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
      
      toast({
        title: "Success",
        description: `Student approved successfully`,
      });
      
      // Move this student from pendingStudents to activeStudents immediately
      if (studentsData) {
        // Find the student in pendingStudents
        const approvedStudent = studentsData.pendingStudents.find(s => s.id === result.studentId);
        
        if (approvedStudent) {
          // Create updated data structure
          const updatedData = {
            activeStudents: [
              ...studentsData.activeStudents,
              { ...approvedStudent, enrollment_status: 'active' }
            ],
            pendingStudents: studentsData.pendingStudents.filter(s => s.id !== result.studentId)
          };
          
          // Update the cache with this new data structure
          queryClient.setQueryData(['admin', 'students', 'all'], updatedData);
        }
      }
      
      // Force a refetch to ensure data is up-to-date with server
      setTimeout(() => {
        console.log("Refreshing student data after approval...");
        refetchStudents();
      }, 500);
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
      console.log("Declining student with ID:", studentId);
      const { data, error } = await supabase
        .from('students')
        .update({ enrollment_status: 'declined' })
        .eq('id', studentId)
        .select();

      if (error) {
        console.error("Error in declineStudent mutation:", error);
        throw new Error(error.message);
      }
      
      console.log("Student declined successfully in database:", data);
      return { success: true, studentId, data };
    },
    onSuccess: (result) => {
      console.log("Student declined successfully:", result);
      
      // Force invalidation to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
      
      toast({
        title: "Success",
        description: `Student declined successfully`,
      });
      
      // Update local cache immediately for UI responsiveness
      if (studentsData) {
        // Create updated data structure removing the student from pendingStudents
        const updatedData = {
          activeStudents: [...studentsData.activeStudents],
          pendingStudents: studentsData.pendingStudents.filter(s => s.id !== result.studentId)
        };
        
        // Update the cache with this new data structure
        queryClient.setQueryData(['admin', 'students', 'all'], updatedData);
      }
      
      // Force a refetch to ensure data is up-to-date
      setTimeout(() => {
        console.log("Refreshing student data after declining...");
        refetchStudents();
      }, 500);
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
      console.log("Deactivating student with ID:", studentId);
      const { data, error } = await supabase
        .from('students')
        .update({ enrollment_status: 'inactive' })
        .eq('id', studentId)
        .select();

      if (error) {
        console.error("Error in deactivateStudent mutation:", error);
        throw new Error(error.message);
      }
      
      console.log("Student deactivated successfully in database:", data);
      return { success: true, studentId, data };
    },
    onSuccess: (result) => {
      console.log("Student deactivated successfully:", result);
      
      // Force invalidation to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
      
      toast({
        title: "Success",
        description: `Student deactivated successfully`,
      });
      
      // Update local cache immediately for UI responsiveness
      if (studentsData) {
        // Create updated data structure removing the student from activeStudents
        const updatedData = {
          activeStudents: studentsData.activeStudents.filter(s => s.id !== result.studentId),
          pendingStudents: [...studentsData.pendingStudents]
        };
        
        // Update the cache with this new data structure
        queryClient.setQueryData(['admin', 'students', 'all'], updatedData);
      }
      
      // Force a refetch to ensure data is up-to-date
      setTimeout(() => {
        console.log("Refreshing student data after deactivation...");
        refetchStudents();
      }, 500);
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

  // Handle any errors
  if (studentsError) {
    console.error("Error in students query:", studentsError);
  }

  return {
    activeStudents: studentsData?.activeStudents || [],
    pendingStudents: studentsData?.pendingStudents || [],
    isLoading,
    approveStudent,
    declineStudent,
    deactivateStudent,
    createDemoStudent,
    debugFetchStudents,
    refetchData: refetchStudents
  };
};
