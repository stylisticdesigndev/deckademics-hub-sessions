import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Instructor {
  id: string;
  status: string;
  specialties: string[];
  bio: string;
  hourly_rate: number;
  years_experience: number;
  profile: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useAdminInstructors = () => {
  const queryClient = useQueryClient();

  // First check if there are ANY instructors in the database
  const { data: rawInstructorCount } = useQuery({
    queryKey: ['admin', 'instructors', 'count'],
    queryFn: async () => {
      console.log('Checking if any instructors exist in the database...');
      
      const { count, error } = await supabase
        .from('instructors')
        .select('*', { count: 'exact', head: true });
      
      console.log('Total instructor count:', count);
      console.log('Error checking count:', error);
      
      return count;
    }
  });

  // Check if there are ANY user profiles in the database
  const { data: rawProfileCount } = useQuery({
    queryKey: ['admin', 'profiles', 'count'],
    queryFn: async () => {
      console.log('Checking if any profiles exist in the database...');
      
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('Total profile count:', count);
      console.log('Error checking count:', error);
      
      return count;
    }
  });

  // List all users directly from auth.users for debugging
  const { data: allUsers } = useQuery({
    queryKey: ['admin', 'all-users'],
    queryFn: async () => {
      console.log('Fetching all auth users for debugging...');
      
      // We can't query auth.users directly, but we can list all profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role');
      
      console.log('All profiles:', data);
      console.log('Error fetching profiles:', error);
      
      return data;
    }
  });

  const { data: activeInstructors, isLoading: isLoadingActive } = useQuery({
    queryKey: ['admin', 'instructors', 'active'],
    queryFn: async () => {
      console.log('Fetching active instructors...');
      
      // Fetch all active instructors directly
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructors')
        .select('*')
        .eq('status', 'active');
      
      console.log('Active Instructors Raw Query Result:', { instructorsData, instructorsError });
      
      if (instructorsError) {
        console.error('Error fetching active instructors:', instructorsError);
        throw instructorsError;
      }
      
      if (!instructorsData || instructorsData.length === 0) {
        console.log('No active instructors found');
        return [] as Instructor[];
      }

      // For each instructor, fetch their profile in a separate call
      const instructorsWithProfiles: Instructor[] = await Promise.all(
        instructorsData.map(async (instructor) => {
          // Get profile data
          console.log(`Fetching profile for instructor ${instructor.id}`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', instructor.id)
            .single();
          
          console.log(`Profile data for ${instructor.id}:`, profileData);
          console.log(`Profile error for ${instructor.id}:`, profileError);
          
          if (profileError) {
            console.error(`Error fetching profile for instructor ${instructor.id}:`, profileError);
            // Return instructor with placeholder profile data
            return {
              ...instructor,
              profile: {
                first_name: 'Unknown',
                last_name: 'User',
                email: 'unknown@example.com'
              }
            };
          }
          
          // Return instructor with profile data
          return {
            ...instructor,
            profile: profileData
          };
        })
      );
      
      console.log('Active instructors with profiles:', instructorsWithProfiles);
      return instructorsWithProfiles;
    }
  });

  const { data: pendingInstructors, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: async () => {
      console.log('Fetching pending instructors...');
      
      // Fetch all pending instructors directly
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructors')
        .select('*')
        .eq('status', 'pending');
      
      console.log('Pending Instructors Raw Query Result:', { instructorsData, instructorsError });
      
      if (instructorsError) {
        console.error('Error fetching pending instructors:', instructorsError);
        throw instructorsError;
      }
      
      if (!instructorsData || instructorsData.length === 0) {
        console.log('No pending instructors found');
        return [] as Instructor[];
      }

      // For each instructor, fetch their profile in a separate call
      const instructorsWithProfiles: Instructor[] = await Promise.all(
        instructorsData.map(async (instructor) => {
          // Get profile data
          console.log(`Fetching profile for instructor ${instructor.id}`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', instructor.id)
            .single();
          
          console.log(`Profile data for ${instructor.id}:`, profileData);
          console.log(`Profile error for ${instructor.id}:`, profileError);
          
          if (profileError) {
            console.error(`Error fetching profile for instructor ${instructor.id}:`, profileError);
            return {
              ...instructor,
              profile: {
                first_name: 'Unknown',
                last_name: 'User',
                email: 'unknown@example.com'
              }
            };
          }
          
          return {
            ...instructor,
            profile: profileData
          };
        })
      );
      
      return instructorsWithProfiles;
    }
  });

  const { data: inactiveInstructors, isLoading: isLoadingInactive } = useQuery({
    queryKey: ['admin', 'instructors', 'inactive'],
    queryFn: async () => {
      console.log('Fetching inactive instructors...');
      
      // Fetch all inactive instructors directly
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('instructors')
        .select('*')
        .eq('status', 'inactive');
      
      console.log('Inactive Instructors Raw Query Result:', { instructorsData, instructorsError });
      
      if (instructorsError) {
        console.error('Error fetching inactive instructors:', instructorsError);
        throw instructorsError;
      }
      
      if (!instructorsData || instructorsData.length === 0) {
        console.log('No inactive instructors found');
        return [] as Instructor[];
      }

      // For each instructor, fetch their profile in a separate call
      const instructorsWithProfiles: Instructor[] = await Promise.all(
        instructorsData.map(async (instructor) => {
          // Get profile data
          console.log(`Fetching profile for instructor ${instructor.id}`);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', instructor.id)
            .single();
          
          console.log(`Profile data for ${instructor.id}:`, profileData);
          console.log(`Profile error for ${instructor.id}:`, profileError);
          
          if (profileError) {
            console.error(`Error fetching profile for instructor ${instructor.id}:`, profileError);
            return {
              ...instructor,
              profile: {
                first_name: 'Unknown',
                last_name: 'User',
                email: 'unknown@example.com'
              }
            };
          }
          
          return {
            ...instructor,
            profile: profileData
          };
        })
      );
      
      return instructorsWithProfiles;
    }
  });

  // Mutations remain the same as they're working fine
  const approveInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'active' })
        .eq('id', instructorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve instructor: ' + error.message);
    }
  });

  const declineInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'declined' })
        .eq('id', instructorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor declined successfully');
    },
    onError: (error) => {
      toast.error('Failed to decline instructor: ' + error.message);
    }
  });

  const deactivateInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'inactive' })
        .eq('id', instructorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor deactivated successfully');
    },
    onError: (error) => {
      toast.error('Failed to deactivate instructor: ' + error.message);
    }
  });

  const activateInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'active' })
        .eq('id', instructorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor activated successfully');
    },
    onError: (error) => {
      toast.error('Failed to activate instructor: ' + error.message);
    }
  });

  // Add a mutation to create a new instructor record for an existing user
  const createInstructor = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('instructors')
        .insert([{ 
          id: userId,
          status: 'pending',
          specialties: [],
          hourly_rate: 25 // default hourly rate
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor record created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create instructor record: ' + error.message);
    }
  });

  return {
    activeInstructors,
    pendingInstructors,
    inactiveInstructors,
    rawInstructorCount,
    rawProfileCount,
    allUsers,
    isLoading: isLoadingActive || isLoadingPending || isLoadingInactive,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor,
    createInstructor
  };
};
