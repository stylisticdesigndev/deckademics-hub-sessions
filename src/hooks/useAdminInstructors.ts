
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
    avatar_url?: string | null;
  };
}

export const useAdminInstructors = () => {
  const queryClient = useQueryClient();


  const { data: activeInstructors, isLoading: isLoadingActive } = useQuery({
    queryKey: ['admin', 'instructors', 'active'],
    queryFn: async () => {
      try {
        if (import.meta.env.DEV) console.log('Fetching active instructors...');
        
        const { data, error } = await supabase.rpc(
          'get_instructors_with_profiles',
          { status_param: 'active' }
        );
        
        if (error) {
          console.error('Error fetching active instructors:', error);
          return [];
        }

        if (import.meta.env.DEV) console.log('Active instructors data:', data);
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
        if (import.meta.env.DEV) console.log('Fetching pending instructors...');
        
        const { data, error } = await supabase.rpc(
          'get_instructors_with_profiles',
          { status_param: 'pending' }
        );
        
        if (error) {
          console.error('Error fetching pending instructors:', error);
          return [];
        }

        if (import.meta.env.DEV) console.log('Pending instructors data:', data);
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
        if (import.meta.env.DEV) console.log('Fetching inactive instructors...');
        
        const { data, error } = await supabase.rpc(
          'get_instructors_with_profiles',
          { status_param: 'inactive' }
        );
        
        if (error) {
          console.error('Error fetching inactive instructors:', error);
          return [];
        }

        if (import.meta.env.DEV) console.log('Inactive instructors data:', data);
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
        .update({ status: 'active' } as any)
        .eq('id', instructorId as any);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
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
        .update({ status: 'declined' } as any)
        .eq('id', instructorId as any);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
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
        .update({ status: 'inactive' } as any)
        .eq('id', instructorId as any);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'assigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
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
        .update({ status: 'active' } as any)
        .eq('id', instructorId as any);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-counts-nav'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'assigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Instructor activated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate instructor: ${error.message}`);
    }
  });


  return {
    activeInstructors: activeInstructors || [],
    pendingInstructors: pendingInstructors || [],
    inactiveInstructors: inactiveInstructors || [],
    isLoading: isLoadingActive || isLoadingPending || isLoadingInactive,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor,
  };
};
