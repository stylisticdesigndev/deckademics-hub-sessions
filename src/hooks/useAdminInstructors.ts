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
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', instructor.id)
            .single();
          
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
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', instructor.id)
            .single();
          
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
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', instructor.id)
            .single();
          
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

  return {
    activeInstructors,
    pendingInstructors,
    inactiveInstructors,
    isLoading: isLoadingActive || isLoadingPending || isLoadingInactive,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor
  };
};
