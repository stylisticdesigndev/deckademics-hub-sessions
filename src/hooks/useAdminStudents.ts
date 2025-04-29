
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
      
      console.log("Debug: All students in database:", allStudents);
      
      // Query all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error("Debug: Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Debug: All profiles in database:", allProfiles);
      
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
      
      // Get all student records from the students table
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*');
      
      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        throw studentsError;
      }

      console.log("All students from database:", students || []);
      
      if (!students || students.length === 0) {
        console.log("No students found in the database");
        return { activeStudents: [], pendingStudents: [] };
      }
      
      // Get all profiles in a single query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      console.log("All profiles from database:", profiles || []);

      // Filter and format active students
      const activeStudents = students
        .filter(student => student.enrollment_status === 'active')
        .map(student => {
          const profile = profiles?.find(p => p.id === student.id);
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

      console.log("Formatted active students:", activeStudents);
      
      // Filter and format pending students
      const pendingStudents = students
        .filter(student => student.enrollment_status === 'pending')
        .map(student => {
          const profile = profiles?.find(p => p.id === student.id);
          return {
            ...student,
            instructor: null,
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
        
      console.log("Formatted pending students:", pendingStudents);
      
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
    queryFn: fetchAllStudents
  });

  // Function to create a demo student
  const createDemoStudent = async () => {
    try {
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
        
        // Force invalidation of queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
        
        // Use setTimeout to ensure the database has time to update
        setTimeout(() => {
          console.log("Refreshing student data after creating demo student...");
          refetchStudents();
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

  // Mutation to approve a student
  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      console.log("Approving student with ID:", studentId);
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
      console.log("Declining student with ID:", studentId);
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
      console.log("Deactivating student with ID:", studentId);
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
