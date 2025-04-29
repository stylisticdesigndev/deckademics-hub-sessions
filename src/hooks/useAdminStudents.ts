
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

  // Get all students with improved error handling and reliable data merging
  const fetchAllStudents = async () => {
    try {
      console.log("Fetching all students with improved reliability...");
      
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
      
      // Get all student records with a longer timeout
      const { data: studentRecords, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .abortSignal(AbortSignal.timeout(10000)); // 10 second timeout
      
      if (studentsError) {
        console.error("Error fetching student records:", studentsError);
        throw studentsError;
      }

      console.log("Found student records:", studentRecords || []);
      
      // Create complete student objects by merging profiles with student records
      // Enhanced to ensure proper enrollment status handling
      const allStudents = studentProfiles.map(profile => {
        // Find the corresponding student record if it exists
        const studentRecord = studentRecords?.find(s => s.id === profile.id);
        
        // If no student record exists, create a default one
        const student = {
          id: profile.id,
          level: studentRecord?.level || 'beginner',
          enrollment_status: studentRecord?.enrollment_status || 'pending',
          notes: studentRecord?.notes || null,
          start_date: studentRecord?.start_date || null,
          profile: {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || ''
          },
          instructor: null // Initialize instructor as null for now
        };
        
        return student;
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

  // Query setup for all students with reduced stale time
  const { 
    data: studentsData, 
    isLoading,
    refetch: refetchStudents,
    error: studentsError
  } = useQuery({
    queryKey: ['admin', 'students', 'all'],
    queryFn: fetchAllStudents,
    staleTime: 0, // Always refetch when requested
    refetchOnWindowFocus: true // Refetch when window regains focus
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

  // Completely revamped mutation to approve a student with proper synchronization
  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Approving student with ID:", studentId);
      
      try {
        // First, verify the current status to avoid race conditions
        const { data: currentStudent, error: fetchError } = await supabase
          .from('students')
          .select('enrollment_status')
          .eq('id', studentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching current student status:", fetchError);
          throw new Error("Could not verify current student status");
        }
        
        if (currentStudent.enrollment_status === 'active') {
          console.log("Student is already approved, no action needed");
          return { success: true, studentId, alreadyApproved: true };
        }
        
        // Update the student record directly with explicit return of all fields
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
        
        // Important: Double-check that the update actually happened
        const { data: verifyUpdate } = await supabase
          .from('students')
          .select('enrollment_status')
          .eq('id', studentId)
          .single();
          
        console.log("Verification after update:", verifyUpdate);
        
        if (!verifyUpdate || verifyUpdate.enrollment_status !== 'active') {
          console.error("Verification failed: Student not updated correctly");
          throw new Error("Student status update verification failed");
        }
        
        return { success: true, studentId, data };
      } catch (error: any) {
        console.error("Error in approveStudent mutation:", error);
        throw error;
      }
    },
    onMutate: async (studentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'students', 'all'] });
      
      // Snapshot current data
      const previousData = queryClient.getQueryData(['admin', 'students', 'all']);
      
      // Optimistically update the UI 
      if (studentsData) {
        // Find the student in pendingStudents
        const approvedStudent = studentsData.pendingStudents.find(s => s.id === studentId);
        
        if (approvedStudent) {
          console.log("Optimistic update: Moving student from pending to active", studentId);
          
          // Create updated data structure
          const updatedData = {
            activeStudents: [
              ...studentsData.activeStudents,
              { ...approvedStudent, enrollment_status: 'active' }
            ],
            pendingStudents: studentsData.pendingStudents.filter(s => s.id !== studentId)
          };
          
          // Update the cache with this new data structure
          queryClient.setQueryData(['admin', 'students', 'all'], updatedData);
        }
      }
      
      return { previousData };
    },
    onSuccess: (result, studentId) => {
      console.log("Student approved successfully with server confirmation:", result);
      
      // Explicitly invalidate and refetch queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
      
      toast({
        title: "Success",
        description: `Student approved successfully`,
      });
      
      // Force a guaranteed refetch after a delay to ensure UI is in sync with server
      setTimeout(() => {
        console.log("Forcing data refresh after approval...");
        refetchStudents().then(() => {
          console.log("Data refreshed after approval");
        });
      }, 500);
    },
    onError: (error, studentId, context: any) => {
      console.error("Error approving student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      toast({
        title: "Error",
        description: `Failed to approve student: ${error.message}`,
        variant: "destructive"
      });
      
      // Refetch to ensure UI is in sync with server
      refetchStudents();
    },
    onSettled: () => {
      // Always refetch after error or success to ensure synchronization
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
    }
  });

  // Similarly improved mutation to decline a student
  const declineStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Declining student with ID:", studentId);
      
      try {
        // First verify the student exists and check current status
        const { data: currentStudent, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching student for decline:", fetchError);
          throw new Error("Could not find student to decline");
        }
        
        // Update the student record to declined status
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
        
        // Verify the update happened
        const { data: verifyUpdate } = await supabase
          .from('students')
          .select('enrollment_status')
          .eq('id', studentId)
          .single();
          
        console.log("Verification after decline:", verifyUpdate);
        
        if (!verifyUpdate || verifyUpdate.enrollment_status !== 'declined') {
          throw new Error("Student decline verification failed");
        }
        
        return { success: true, studentId, data };
      } catch (error: any) {
        console.error("Error in declineStudent operation:", error);
        throw error;
      }
    },
    onMutate: async (studentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'students', 'all'] });
      
      // Snapshot the current data
      const previousData = queryClient.getQueryData(['admin', 'students', 'all']);
      
      // Optimistically update to remove from pending
      if (studentsData) {
        console.log("Optimistic update: Removing declined student from UI", studentId);
        
        const updatedData = {
          activeStudents: [...studentsData.activeStudents],
          pendingStudents: studentsData.pendingStudents.filter(s => s.id !== studentId)
        };
        
        queryClient.setQueryData(['admin', 'students', 'all'], updatedData);
      }
      
      return { previousData };
    },
    onSuccess: (result) => {
      console.log("Student declined successfully with server confirmation:", result);
      
      // Explicitly invalidate queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
      
      toast({
        title: "Success",
        description: `Student declined successfully`,
      });
      
      // Force refetch to ensure synchronization
      setTimeout(() => {
        refetchStudents().then(() => {
          console.log("Data refreshed after declining student");
        });
      }, 500);
    },
    onError: (error, studentId, context: any) => {
      console.error("Error declining student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      toast({
        title: "Error",
        description: `Failed to decline student: ${error.message}`,
        variant: "destructive"
      });
      
      refetchStudents();
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
    }
  });

  // Revamped mutation to deactivate a student with similar improvements
  const deactivateStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Deactivating student with ID:", studentId);
      
      try {
        // Verify student exists and check current status
        const { data: currentStudent, error: fetchError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
          
        if (fetchError) {
          console.error("Error fetching student for deactivation:", fetchError);
          throw new Error("Could not find student to deactivate");
        }
        
        // Update the student record
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
        
        // Verify the update happened
        const { data: verifyUpdate } = await supabase
          .from('students')
          .select('enrollment_status')
          .eq('id', studentId)
          .single();
          
        console.log("Verification after deactivation:", verifyUpdate);
        
        if (!verifyUpdate || verifyUpdate.enrollment_status !== 'inactive') {
          throw new Error("Student deactivation verification failed");
        }
        
        return { success: true, studentId, data };
      } catch (error: any) {
        console.error("Error in deactivateStudent operation:", error);
        throw error;
      }
    },
    onMutate: async (studentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'students', 'all'] });
      
      // Snapshot the current data
      const previousData = queryClient.getQueryData(['admin', 'students', 'all']);
      
      // Optimistically update to remove from active
      if (studentsData) {
        console.log("Optimistic update: Removing deactivated student from UI", studentId);
        
        const updatedData = {
          activeStudents: studentsData.activeStudents.filter(s => s.id !== studentId),
          pendingStudents: [...studentsData.pendingStudents]
        };
        
        queryClient.setQueryData(['admin', 'students', 'all'], updatedData);
      }
      
      return { previousData };
    },
    onSuccess: (result) => {
      console.log("Student deactivated successfully with server confirmation:", result);
      
      // Explicitly invalidate queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
      
      toast({
        title: "Success",
        description: `Student deactivated successfully`,
      });
      
      // Force refetch to ensure synchronization
      setTimeout(() => {
        refetchStudents().then(() => {
          console.log("Data refreshed after deactivating student");
        });
      }, 500);
    },
    onError: (error, studentId, context: any) => {
      console.error("Error deactivating student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      toast({
        title: "Error",
        description: `Failed to deactivate student: ${error.message}`,
        variant: "destructive"
      });
      
      refetchStudents();
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
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
