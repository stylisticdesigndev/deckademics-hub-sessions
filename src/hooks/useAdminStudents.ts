
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  instructor?: Instructor;
}

export const useAdminStudents = () => {
  const queryClient = useQueryClient();

  const { data: activeStudents, isLoading: isLoadingActive } = useQuery({
    queryKey: ['admin', 'students', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          profile:profiles(first_name, last_name, email),
          instructor:instructors(
            id,
            profile:profiles(first_name, last_name)
          )
        `)
        .eq('enrollment_status', 'active');

      if (error) throw error;
      return data as Student[];
    }
  });

  const { data: pendingStudents, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          level,
          enrollment_status,
          profile:profiles(first_name, last_name, email)
        `)
        .eq('enrollment_status', 'pending');

      if (error) throw error;
      return data as Student[];
    }
  });

  const approveStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'active' })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve student: ' + error.message);
    }
  });

  const declineStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'declined' })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student declined successfully');
    },
    onError: (error) => {
      toast.error('Failed to decline student: ' + error.message);
    }
  });

  const deactivateStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase
        .from('students')
        .update({ enrollment_status: 'inactive' })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Student deactivated successfully');
    },
    onError: (error) => {
      toast.error('Failed to deactivate student: ' + error.message);
    }
  });

  return {
    activeStudents,
    pendingStudents,
    isLoading: isLoadingActive || isLoadingPending,
    approveStudent,
    declineStudent,
    deactivateStudent
  };
};
