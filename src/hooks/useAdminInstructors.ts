
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
      
      if (error) {
        console.error('Error checking instructor count:', error);
        return 0;
      }
      
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
      
      if (error) {
        console.error('Error checking profile count:', error);
        return 0;
      }
      
      return count;
    }
  });

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
        
        // Fetch all active instructors with profile data in a single query
        const { data: instructorsWithProfiles, error } = await supabase
          .from('instructors')
          .select(`
            *,
            profile:profiles(first_name, last_name, email)
          `)
          .eq('status', 'active');
        
        console.log('Active Instructors Raw Query Result:', { instructorsWithProfiles, error });
        
        if (error) {
          console.error('Error fetching active instructors:', error);
          throw error;
        }
        
        // Transform the data to match our expected Instructor interface
        const formattedInstructors = instructorsWithProfiles.map(instructor => ({
          id: instructor.id,
          status: instructor.status,
          specialties: instructor.specialties || [],
          bio: instructor.bio || '',
          hourly_rate: instructor.hourly_rate || 0,
          years_experience: instructor.years_experience || 0,
          profile: {
            first_name: instructor.profile?.first_name || 'Unknown',
            last_name: instructor.profile?.last_name || 'User',
            email: instructor.profile?.email || 'unknown@example.com'
          }
        }));
        
        console.log('Formatted active instructors:', formattedInstructors);
        return formattedInstructors;
      } catch (error) {
        console.error('Error in activeInstructors query:', error);
        throw error;
      }
    }
  });

  const { data: pendingInstructors, isLoading: isLoadingPending } = useQuery({
    queryKey: ['admin', 'instructors', 'pending'],
    queryFn: async () => {
      try {
        console.log('Fetching pending instructors...');
        
        // Fetch all pending instructors with profile data in a single query
        const { data: instructorsWithProfiles, error } = await supabase
          .from('instructors')
          .select(`
            *,
            profile:profiles(first_name, last_name, email)
          `)
          .eq('status', 'pending');
        
        console.log('Pending Instructors Raw Query Result:', { instructorsWithProfiles, error });
        
        if (error) {
          console.error('Error fetching pending instructors:', error);
          throw error;
        }
        
        // Transform the data to match our expected Instructor interface
        const formattedInstructors = instructorsWithProfiles.map(instructor => ({
          id: instructor.id,
          status: instructor.status,
          specialties: instructor.specialties || [],
          bio: instructor.bio || '',
          hourly_rate: instructor.hourly_rate || 0,
          years_experience: instructor.years_experience || 0,
          profile: {
            first_name: instructor.profile?.first_name || 'Unknown',
            last_name: instructor.profile?.last_name || 'User',
            email: instructor.profile?.email || 'unknown@example.com'
          }
        }));
        
        console.log('Formatted pending instructors:', formattedInstructors);
        return formattedInstructors;
      } catch (error) {
        console.error('Error in pendingInstructors query:', error);
        throw error;
      }
    }
  });

  const { data: inactiveInstructors, isLoading: isLoadingInactive } = useQuery({
    queryKey: ['admin', 'instructors', 'inactive'],
    queryFn: async () => {
      try {
        console.log('Fetching inactive instructors...');
        
        // Fetch all inactive instructors with profile data in a single query
        const { data: instructorsWithProfiles, error } = await supabase
          .from('instructors')
          .select(`
            *,
            profile:profiles(first_name, last_name, email)
          `)
          .eq('status', 'inactive');
        
        console.log('Inactive Instructors Raw Query Result:', { instructorsWithProfiles, error });
        
        if (error) {
          console.error('Error fetching inactive instructors:', error);
          throw error;
        }
        
        // Transform the data to match our expected Instructor interface
        const formattedInstructors = instructorsWithProfiles.map(instructor => ({
          id: instructor.id,
          status: instructor.status,
          specialties: instructor.specialties || [],
          bio: instructor.bio || '',
          hourly_rate: instructor.hourly_rate || 0,
          years_experience: instructor.years_experience || 0,
          profile: {
            first_name: instructor.profile?.first_name || 'Unknown',
            last_name: instructor.profile?.last_name || 'User',
            email: instructor.profile?.email || 'unknown@example.com'
          }
        }));
        
        console.log('Formatted inactive instructors:', formattedInstructors);
        return formattedInstructors;
      } catch (error) {
        console.error('Error in inactiveInstructors query:', error);
        throw error;
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

  // Add a mutation to create a new instructor record for an existing user
  const createInstructor = useMutation({
    mutationFn: async (userId: string) => {
      console.log(`Creating instructor record for user ${userId}`);
      
      // First check if this instructor record already exists
      const { data: existingInstructor, error: checkError } = await supabase
        .from('instructors')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking for existing instructor:', checkError);
        throw checkError;
      }
        
      if (existingInstructor) {
        console.log('Instructor record already exists for this user');
        throw new Error('Instructor record already exists for this user');
      }

      // Insert the new instructor record
      const { data, error } = await supabase
        .from('instructors')
        .insert([{ 
          id: userId,
          status: 'pending',
          specialties: [],
          hourly_rate: 25, // default hourly rate
          years_experience: 0 // default years of experience
        }])
        .select();

      console.log('Instructor creation result:', { data, error });

      if (error) {
        console.error('Error creating instructor record:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
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
    rawInstructorCount,
    rawProfileCount,
    allUsers: allUsers || [],
    isLoading: isLoadingActive || isLoadingPending || isLoadingInactive,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor,
    createInstructor
  };
};
