import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InstructorWithProfile {
  id: string;
  status: string;
  specialties: string[];
  bio: string | null;
  hourly_rate: number;
  years_experience: number;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export const useAdminInstructors = () => {
  const queryClient = useQueryClient();

  // List all users directly from profiles table for debugging
  const { data: allUsers } = useQuery({
    queryKey: ['admin', 'all-users'],
    queryFn: async () => {
      console.log('Fetching all profiles for debugging...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role');
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
      
      console.log('All profiles:', data);
      return data || [];
    }
  });

  const { data: activeInstructors, isLoading: isLoadingActive } = useQuery({
    queryKey: ['admin', 'instructors', 'active'],
    queryFn: async () => {
      try {
        console.log('Fetching active instructors...');
        
        const { data, error } = await supabase
          .from('instructors')
          .select(`
            id,
            status,
            specialties,
            bio,
            hourly_rate,
            years_experience,
            profile:profiles(
              first_name,
              last_name,
              email
            )
          `)
          .eq('status', 'active');
        
        if (error) {
          console.error('Error fetching active instructors:', error);
          return [];
        }

        console.log('Active instructors data:', data);
        return data as InstructorWithProfile[] || [];
      } catch (error) {
        console.error('Error in activeInstructors query:', error);
        return [];
      }
    }
  });

  const { data: pendingInstructors, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: async () => {
      try {
        console.log('Fetching pending instructors...');
        
        const { data, error } = await supabase
          .from('instructors')
          .select(`
            id,
            status,
            specialties,
            bio,
            hourly_rate,
            years_experience,
            profile:profiles(
              first_name,
              last_name,
              email
            )
          `)
          .eq('status', 'pending');
        
        if (error) {
          console.error('Error fetching pending instructors:', error);
          return [];
        }

        console.log('Pending instructors data:', data);
        return data as InstructorWithProfile[] || [];
      } catch (error) {
        console.error('Error in pendingInstructors query:', error);
        return [];
      }
    }
  });

  const { data: inactiveInstructors, isLoading: isLoadingInactive } = useQuery({
    queryKey: ['admin', 'instructors', 'inactive'],
    queryFn: async () => {
      try {
        console.log('Fetching inactive instructors...');
        
        const { data, error } = await supabase
          .from('instructors')
          .select(`
            id,
            status,
            specialties,
            bio,
            hourly_rate,
            years_experience,
            profile:profiles(
              first_name,
              last_name,
              email
            )
          `)
          .eq('status', 'inactive');
        
        if (error) {
          console.error('Error fetching inactive instructors:', error);
          return [];
        }

        console.log('Inactive instructors data:', data);
        return data as InstructorWithProfile[] || [];
      } catch (error) {
        console.error('Error in inactiveInstructors query:', error);
        return [];
      }
    }
  });

  const approveInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'active' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor approved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve instructor: ${error.message}`);
    }
  });

  const declineInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'declined' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor declined successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline instructor: ${error.message}`);
    }
  });

  const deactivateInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'inactive' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate instructor: ${error.message}`);
    }
  });

  const activateInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'active' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Instructor activated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate instructor: ${error.message}`);
    }
  });

  // Update the createInstructor mutation to use the admin_create_instructor DB function
  const createInstructor = useMutation({
    mutationFn: async (userId: string) => {
      console.log(`Creating instructor record for user ${userId} using admin function`);
      
      try {
        // Use the admin_create_instructor function
        const { data, error } = await supabase.rpc(
          'admin_create_instructor',
          {
            user_id: userId,
            initial_status: 'pending',
            initial_hourly_rate: 25
          }
        );
          
        if (error) {
          console.error('Error creating instructor record:', error);
          throw new Error(`Failed to create instructor: ${error.message}`);
        }
        
        console.log('Instructor creation result:', data);
        return data;
      } catch (error) {
        console.error('Error in createInstructor mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'all-users'] });
      toast.success('Instructor record created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create instructor record: ${error.message}`);
    }
  });

  return {
    activeInstructors: activeInstructors || [],
    pendingInstructors: pendingInstructors || [],
    inactiveInstructors: inactiveInstructors || [],
    allUsers: allUsers || [],
    isLoading: isLoadingActive || isLoadingPending || isLoadingInactive,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor,
    createInstructor
  };
};
