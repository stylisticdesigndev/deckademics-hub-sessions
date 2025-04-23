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
      
      const { data, error } = await supabase
        .from('instructors')
        .select(`
          id,
          status,
          specialties,
          bio,
          hourly_rate,
          years_experience,
          profile:profiles(first_name, last_name, email)
        `)
        .eq('status', 'active');

      console.log('Active Instructors Query Result:', { data, error });
      
      if (data) {
        console.log('Number of active instructors returned:', data.length);
        data.forEach((instructor, index) => {
          console.log(`Instructor ${index + 1}:`, instructor);
        });
      }

      if (error) {
        console.error('Error fetching active instructors:', error);
        throw error;
      }
      return data as Instructor[];
    }
  });

  const { data: pendingInstructors, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: async () => {
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
          profile:profiles(first_name, last_name, email)
        `)
        .eq('status', 'pending');

      console.log('Pending Instructors Query Result:', { data, error });
      
      if (error) throw error;
      return data as Instructor[];
    }
  });

  const { data: inactiveInstructors, isLoading: isLoadingInactive } = useQuery({
    queryKey: ['admin', 'instructors', 'inactive'],
    queryFn: async () => {
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
          profile:profiles(first_name, last_name, email)
        `)
        .eq('status', 'inactive');

      console.log('Inactive Instructors Query Result:', { data, error });
      
      if (error) throw error;
      return data as Instructor[];
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
