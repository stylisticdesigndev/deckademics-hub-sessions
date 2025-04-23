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
      
      // First, query instructors table
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
      
      // Then, for each instructor, get their profile data
      const instructorsWithProfiles = await Promise.all(
        instructorsData.map(async (instructor) => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', instructor.id)
            .single();
            
          console.log(`Profile data for instructor ${instructor.id}:`, profileData);
          
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
      
      console.log('Active instructors with profiles:', instructorsWithProfiles);
      return instructorsWithProfiles as Instructor[];
    }
  });

  const { data: pendingInstructors, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: async () => {
      console.log('Fetching pending instructors...');
      
      // First, query instructors table
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
      
      // Then, for each instructor, get their profile data
      const instructorsWithProfiles = await Promise.all(
        instructorsData.map(async (instructor) => {
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
      
      return instructorsWithProfiles as Instructor[];
    }
  });

  const { data: inactiveInstructors, isLoading: isLoadingInactive } = useQuery({
    queryKey: ['admin', 'instructors', 'inactive'],
    queryFn: async () => {
      console.log('Fetching inactive instructors...');
      
      // First, query instructors table
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
      
      // Then, for each instructor, get their profile data
      const instructorsWithProfiles = await Promise.all(
        instructorsData.map(async (instructor) => {
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
      
      return instructorsWithProfiles as Instructor[];
    }
  });

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
