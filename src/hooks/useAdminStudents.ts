
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { asInsertParam, asUpdateParam, asDatabaseParam, asStudentData } from '@/utils/supabaseHelpers';

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
  // Get auth context to verify authentication status
  const { session } = useAuth();

  // Helper function to check authentication before performing database operations
  const checkAuthentication = () => {
    if (!session || !session.user) {
      console.error("Authentication required: No active session found");
      throw new Error("Authentication required. Please sign in again.");
    }
    
    // Return the session for convenience
    return session;
  };
  
  // Centralized error handler
  const handleError = (error: any, fallbackMessage: string) => {
    console.error("Error in admin students operation:", error);
    
    // Check for common error types and provide specific messages
    if (error.message?.includes('Authentication required')) {
      toast.error("Authentication required. Please sign in again.");
    } else if (error.message?.includes('Access denied') || 
              error.message?.includes('Permission denied') || 
              error.message?.includes('Policy check failed') ||
              error.code === 'PGRST109') {
      toast.error("Permission denied. You need admin access for this operation.");
    } else if (error.message?.includes('JWT') || error.message?.includes('token')) {
      toast.error("Your session has expired. Please sign in again.");
    } else {
      toast.error(fallbackMessage);
    }
  };

  // Get all students with improved error handling and reliable data merging
  const fetchAllStudents = async () => {
    try {
      console.log("Fetching all students with improved reliability...");
      
      // Verify authentication before proceeding
      checkAuthentication();
      
      // Get all profiles that have a student role
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', asDatabaseParam<string>('student'));
      
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
        .select('*');
      
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
    } catch (err: any) {
      console.error("Unexpected error in fetchAllStudents:", err);
      handleError(err, "Failed to load students");
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
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: (failureCount, error: any) => {
      // Don't retry on permission/auth errors
      if (error.message?.includes('Policy check failed') || 
          error.message?.includes('Permission denied') || 
          error.code === 'PGRST109' || 
          !session) {
        return false;
      }
      return failureCount < 3; // Retry other errors up to 3 times
    }
  });

  // Function to create a demo student - modified for mock admin
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
          
          // Handle RLS or auth errors specifically
          if (response.error?.message?.includes('Policy check failed')) {
            toast.error("Access denied. You don't have permission to create students.");
          } else {
            toast.error(`Failed to create demo student: ${response.error?.message || response.data?.error || 'Unknown error'}`);
          }
          
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
      } catch (err: any) {
        console.error("Exception in createDemoStudent:", err);
        handleError(err, "Failed to create demo student");
        return null;
      }
    } catch (err: any) {
      console.error("Unexpected error in createDemoStudent:", err);
      handleError(err, "Failed to create demo student");
      return null;
    }
  };

  // Debug function to directly fetch all database data
  const debugFetchStudents = async () => {
    console.log("Debug: Directly fetching all data");
    
    try {
      // Verify authentication before proceeding
      const userSession = checkAuthentication();
      
      // Query all students
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*');
      
      if (error) {
        console.error("Debug: Error fetching all students:", error);
        if (error.message?.includes('JWTError') || error.message?.includes('jwt expired')) {
          toast.error("Your session has expired. Please sign in again.");
        } else if (error.message?.includes('PGRST109') || error.message?.includes('Policy check failed')) {
          toast.error("Access denied. Only admins can view student data.");
        } else {
          toast.error(`Database error: ${error.message}`);
        }
        throw error;
      }
      
      console.log("Debug: All students in database:", allStudents || []);
      
      // Query all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error("Debug: Error fetching profiles:", profilesError);
        if (profilesError.message?.includes('JWTError') || profilesError.message?.includes('jwt expired')) {
          toast.error("Your session has expired. Please sign in again.");
        } else if (profilesError.message?.includes('PGRST109') || profilesError.message?.includes('Policy check failed')) {
          toast.error("Access denied. Only admins can view profile data.");
        } else {
          toast.error(`Database error: ${profilesError.message}`);
        }
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
    } catch (err: any) {
      console.error("Debug: Unexpected error in debugFetchStudents:", err);
      
      handleError(err, "Failed to fetch debug data");
      throw err;
    }
  };

  // Modified mutation to approve a student - handle mock admin case
  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Starting approval process for student ID:", studentId);
      
      try {
        // Verify authentication before proceeding
        checkAuthentication();
        
        // First, check if a student record exists
        const { data: checkStudent, error: checkError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        
        // Approach for creating new student or updating existing one
        let result;
        
        if (checkError) {
          // If the error is not found, we need to create the student record
          if (checkError.code === 'PGRST116') {
            console.log("Student record doesn't exist yet. Creating one...");
            
            // Insert a new student record
            const { data: newStudent, error: insertError } = await supabase
              .from('students')
              .insert([
                asInsertParam<any>({ 
                  id: studentId,
                  level: 'beginner',
                  enrollment_status: 'active'
                }, 'students')
              ])
              .select();
            
            if (insertError) {
              console.error("Error creating new student record:", insertError);
              
              if (insertError.message?.includes('Policy check failed') || insertError.code === 'PGRST109') {
                throw new Error(`Access denied. You don't have permission to approve students.`);
              }
              
              throw new Error(`Failed to create student record: ${insertError.message}`);
            }
            
            console.log("Created new student record successfully:", newStudent);
            result = { success: true, studentId, action: 'created', data: newStudent };
          } else {
            console.error("Error checking for existing student:", checkError);
            
            if (checkError.message?.includes('Policy check failed') || checkError.code === 'PGRST109') {
              throw new Error(`Access denied. You don't have permission to approve students.`);
            }
            
            throw new Error(`Failed to check for existing student: ${checkError.message}`);
          }
        } else {
          console.log("Found existing student record:", checkStudent);
          
          // Update the existing student record to active
          const { data: updatedStudent, error: updateError } = await supabase
            .from('students')
            .update(asUpdateParam<any>({ enrollment_status: 'active' }, 'students'))
            .eq('id', asDatabaseParam<string>(studentId))
            .select();
          
          if (updateError) {
            console.error("Error updating student status:", updateError);
            
            if (updateError.message?.includes('Policy check failed') || updateError.code === 'PGRST109') {
              throw new Error(`Access denied. You don't have permission to approve students.`);
            }
            
            throw new Error(`Failed to update student status: ${updateError.message}`);
          }
          
          console.log("Updated student status successfully:", updatedStudent);
          result = { success: true, studentId, action: 'updated', data: updatedStudent };
        }
        
        return result;
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
      
      // Use our updated safe toast implementation
      toast.success(`Student approved successfully`);
      
      // Force a guaranteed refetch after a delay to ensure UI is in sync with server
      setTimeout(() => {
        console.log("Forcing data refresh after approval...");
        refetchStudents();
      }, 500);
    },
    onError: (error: any, studentId, context: any) => {
      console.error("Error approving student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      // Use centralized error handling
      handleError(error, `Failed to approve student: ${error.message}`);
      
      // Refetch to ensure UI is in sync with server
      refetchStudents();
    }
  });

  // Modified mutation to decline a student - handle mock admin case
  const declineStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Starting decline process for student ID:", studentId);
      
      try {
        // Verify authentication before proceeding
        checkAuthentication();
        
        // First, check if a student record exists
        const { data: checkStudent, error: checkError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        
        let result;
        
        if (checkError) {
          // If the error is not found, we need to create the student record
          if (checkError.code === 'PGRST116') {
            console.log("Student record doesn't exist yet. Creating one with declined status...");
            
            // Insert a new student record with declined status
            const { data: newStudent, error: insertError } = await supabase
              .from('students')
              .insert([
                asInsertParam<any>({ 
                  id: studentId,
                  level: 'beginner',
                  enrollment_status: 'declined'
                }, 'students')
              ])
              .select();
            
            if (insertError) {
              console.error("Error creating new declined student record:", insertError);
              
              if (insertError.message?.includes('Policy check failed') || insertError.code === 'PGRST109') {
                throw new Error(`Access denied. You don't have permission to decline students.`);
              }
              
              throw new Error(`Failed to create declined student record: ${insertError.message}`);
            }
            
            console.log("Created new declined student record successfully:", newStudent);
            result = { success: true, studentId, action: 'created_declined', data: newStudent };
          } else {
            console.error("Error checking for existing student:", checkError);
            
            if (checkError.message?.includes('Policy check failed') || checkError.code === 'PGRST109') {
              throw new Error(`Access denied. You don't have permission to decline students.`);
            }
            
            throw new Error(`Failed to check for existing student: ${checkError.message}`);
          }
        } else {
          console.log("Found existing student record:", checkStudent);
          
          // Update the existing student record to declined
          const { data: updatedStudent, error: updateError } = await supabase
            .from('students')
            .update(asUpdateParam<any>({ enrollment_status: 'declined' }, 'students'))
            .eq('id', asDatabaseParam<string>(studentId))
            .select();
          
          if (updateError) {
            console.error("Error updating student status to declined:", updateError);
            
            if (updateError.message?.includes('Policy check failed') || updateError.code === 'PGRST109') {
              throw new Error(`Access denied. You don't have permission to decline students.`);
            }
            
            throw new Error(`Failed to update student status to declined: ${updateError.message}`);
          }
          
          console.log("Updated student status to declined successfully:", updatedStudent);
          result = { success: true, studentId, action: 'updated_declined', data: updatedStudent };
        }
        
        return result;
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
    onError: (error: any, studentId, context: any) => {
      console.error("Error declining student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      // Use centralized error handling
      handleError(error, `Failed to decline student: ${error.message}`);
      
      refetchStudents();
    }
  });

  // Modified mutation for deactivate student - handle mock admin case
  const deactivateStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Deactivating student with ID:", studentId);
      
      try {
        // Verify authentication before proceeding
        checkAuthentication();
        
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
                asInsertParam<any>({ 
                  id: studentId,
                  level: 'beginner',
                  enrollment_status: 'inactive'
                }, 'students')
              ])
              .select();
              
            if (insertError) {
              console.error("Error creating inactive student record:", insertError);
              
              if (insertError.message?.includes('Policy check failed') || insertError.code === 'PGRST109') {
                throw new Error(`Access denied. You don't have permission to deactivate students.`);
              }
              
              throw new Error(`Failed to create inactive student record: ${insertError.message}`);
            }
            
            return { success: true, studentId, action: 'created_inactive', data: newStudent };
          } else {
            console.error("Error fetching student for deactivation:", fetchError);
            
            if (fetchError.message?.includes('Policy check failed') || fetchError.code === 'PGRST109') {
              throw new Error(`Access denied. You don't have permission to deactivate students.`);
            }
            
            throw new Error("Could not find student to deactivate");
          }
        }
        
        // Update the student record
        const { data, error } = await supabase
          .from('students')
          .update(asUpdateParam<any>({ enrollment_status: 'inactive' }, 'students'))
          .eq('id', asDatabaseParam<string>(studentId))
          .select();

        if (error) {
          console.error("Error in deactivateStudent mutation:", error);
          
          if (error.message?.includes('Policy check failed') || error.code === 'PGRST109') {
            throw new Error(`Access denied. You don't have permission to deactivate students.`);
          }
          
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
    onError: (error: any, studentId, context: any) => {
      console.error("Error deactivating student:", error);
      
      // Rollback to previous state
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'students', 'all'], context.previousData);
      }
      
      // Use centralized error handling
      handleError(error, `Failed to deactivate student: ${error.message}`);
      
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
