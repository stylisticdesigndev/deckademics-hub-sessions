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

  // Completely revised mutation to approve a student
  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Starting approval process for student ID:", studentId);
      
      try {
        // First, check if a student record exists
        const { data: checkStudent, error: checkError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (checkError) {
          // If the error is not found, we need to create the student record
          if (checkError.code === 'PGRST116') {
            console.log("Student record doesn't exist yet. Creating one...");
            
            // Insert a new student record
            const { data: newStudent, error: insertError } = await supabase
              .from('students')
              .insert([
                { 
                  id: studentId,
                  level: 'beginner',
                  enrollment_status: 'active'
                }
              ])
              .select();
            
            if (insertError) {
              console.error("Error creating new student record:", insertError);
              throw new Error(`Failed to create student record: ${insertError.message}`);
            }
            
            console.log("Created new student record successfully:", newStudent);
            return { success: true, studentId, action: 'created', data: newStudent };
          } else {
            console.error("Error checking for existing student:", checkError);
            throw new Error(`Failed to check for existing student: ${checkError.message}`);
          }
        }
        
        console.log("Found existing student record:", checkStudent);
        
        // Update the existing student record to active
        const { data: updatedStudent, error: updateError } = await supabase
          .from('students')
          .update({ enrollment_status: 'active' })
          .eq('id', studentId)
          .select();
        
        if (updateError) {
          console.error("Error updating student status:", updateError);
          throw new Error(`Failed to update student status: ${updateError.message}`);
        }
        
        console.log("Updated student status successfully:", updatedStudent);
        return { success: true, studentId, action: 'updated', data: updatedStudent };
      } catch (error: any) {
        console.error("Error in approveStudent:", error);
        throw new Error(error.message || 'Unknown error approving student');
      }
    },
    onMutate: async (studentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'students', 'all'] });
      
      // Snapshot the current data
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
    onSuccess: (result) => {
      console.log("Student approved successfully with server confirmation:", result);
      
      // Explicitly invalidate and refetch queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'students', 'all'] });
      
      toast.success(`Student approved successfully`);
      
      // Force a guaranteed refetch after a delay to ensure UI is in sync with server
      setTimeout(() => {
        console.log("Forcing data refresh after approval...");
        refetchStudents();
      }, 500);
    },
    onError: (error, studentId, context: any) => {
      console.error("Error approving student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      toast.error(`Failed to approve student: ${error.message}`);
      
      // Refetch to ensure UI is in sync with server
      refetchStudents();
    }
  });

  // Similarly revised mutation to decline a student
  const declineStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Starting decline process for student ID:", studentId);
      
      try {
        // First, check if a student record exists
        const { data: checkStudent, error: checkError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (checkError) {
          // If the error is not found, we need to create the student record
          if (checkError.code === 'PGRST116') {
            console.log("Student record doesn't exist yet. Creating one with declined status...");
            
            // Insert a new student record with declined status
            const { data: newStudent, error: insertError } = await supabase
              .from('students')
              .insert([
                { 
                  id: studentId,
                  level: 'beginner',
                  enrollment_status: 'declined'
                }
              ])
              .select();
            
            if (insertError) {
              console.error("Error creating new declined student record:", insertError);
              throw new Error(`Failed to create declined student record: ${insertError.message}`);
            }
            
            console.log("Created new declined student record successfully:", newStudent);
            return { success: true, studentId, action: 'created_declined', data: newStudent };
          } else {
            console.error("Error checking for existing student:", checkError);
            throw new Error(`Failed to check for existing student: ${checkError.message}`);
          }
        }
        
        console.log("Found existing student record:", checkStudent);
        
        // Update the existing student record to declined
        const { data: updatedStudent, error: updateError } = await supabase
          .from('students')
          .update({ enrollment_status: 'declined' })
          .eq('id', studentId)
          .select();
        
        if (updateError) {
          console.error("Error updating student status to declined:", updateError);
          throw new Error(`Failed to update student status to declined: ${updateError.message}`);
        }
        
        console.log("Updated student status to declined successfully:", updatedStudent);
        return { success: true, studentId, action: 'updated_declined', data: updatedStudent };
      } catch (error: any) {
        console.error("Error in declineStudent:", error);
        throw new Error(error.message || 'Unknown error declining student');
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
      
      toast.success(`Student declined successfully`);
      
      // Force refetch to ensure synchronization
      setTimeout(() => {
        refetchStudents();
      }, 500);
    },
    onError: (error, studentId, context: any) => {
      console.error("Error declining student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      toast.error(`Failed to decline student: ${error.message}`);
      
      refetchStudents();
    }
  });

  // Similar pattern for deactivate student
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
          if (fetchError.code === 'PGRST116') {
            // Student record doesn't exist yet
            console.log("Student record doesn't exist. Creating inactive record...");
            
            const { data: newStudent, error: insertError } = await supabase
              .from('students')
              .insert([
                { 
                  id: studentId,
                  level: 'beginner',
                  enrollment_status: 'inactive'
                }
              ])
              .select();
              
            if (insertError) {
              console.error("Error creating inactive student record:", insertError);
              throw new Error(`Failed to create inactive student record: ${insertError.message}`);
            }
            
            return { success: true, studentId, action: 'created_inactive', data: newStudent };
          } else {
            console.error("Error fetching student for deactivation:", fetchError);
            throw new Error("Could not find student to deactivate");
          }
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
        
        return { success: true, studentId, action: 'updated_inactive', data };
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
      
      toast.success(`Student deactivated successfully`);
      
      // Force refetch to ensure synchronization
      setTimeout(() => {
        refetchStudents();
      }, 500);
    },
    onError: (error, studentId, context: any) => {
      console.error("Error deactivating student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      toast.error(`Failed to deactivate student: ${error.message}`);
      
      refetchStudents();
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
