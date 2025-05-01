
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

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
  const { session } = useAuth();
  
  // Check if the current user is the mock admin
  const isMockAdmin = session?.user?.id === "00000000-0000-0000-0000-000000000000";

  // List all users directly from profiles table for debugging
  const { data: allUsers } = useQuery<Profile[]>({
    queryKey: ['admin', 'all-users'],
    queryFn: async () => {
      console.log('Fetching all profiles for debugging...');
      
      // For mock admin, return mock profiles
      if (isMockAdmin) {
        console.log('Using mock profiles for demo admin');
        return [
          {
            id: "mock-user-1",
            email: "student1@example.com",
            first_name: "Student",
            last_name: "One",
            role: "student"
          },
          {
            id: "mock-user-2",
            email: "student2@example.com",
            first_name: "Student",
            last_name: "Two",
            role: "student"
          },
          {
            id: "mock-instructor-1",
            email: "instructor1@example.com",
            first_name: "Instructor",
            last_name: "One",
            role: "instructor"
          },
          {
            id: "mock-instructor-2",
            email: "instructor2@example.com",
            first_name: "Instructor",
            last_name: "Two",
            role: "instructor"
          },
          {
            id: "00000000-0000-0000-0000-000000000000",
            email: "admin@deckademics.com",
            first_name: "Admin",
            last_name: "User",
            role: "admin"
          }
        ];
      }
      
      try {
        const { data, error } = await supabase.rpc('get_all_users');
        
        if (error) {
          console.error('Error fetching profiles:', error);
          return [];
        }
        
        console.log('All profiles:', data);
        return data || [];
      } catch (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
    }
  });

  const { data: activeInstructors, isLoading: isLoadingActive } = useQuery({
    queryKey: ['admin', 'instructors', 'active'],
    queryFn: async () => {
      try {
        console.log('Fetching active instructors...');
        
        // For mock admin, return mock active instructors
        if (isMockAdmin) {
          console.log('Using mock active instructors for demo admin');
          return [
            {
              id: "mock-instructor-1",
              status: "active",
              specialties: ["Hip Hop", "Scratching"],
              bio: "Experienced instructor specializing in Hip Hop and Scratching techniques.",
              hourly_rate: 35,
              years_experience: 5,
              profile: {
                first_name: "Instructor",
                last_name: "One",
                email: "instructor1@example.com"
              }
            }
          ];
        }
        
        const { data, error } = await supabase.rpc('get_instructors_with_profiles', {
          status_param: 'active'
        });
        
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
        
        // For mock admin, return mock pending instructors
        if (isMockAdmin) {
          console.log('Using mock pending instructors for demo admin');
          return [
            {
              id: "mock-instructor-2",
              status: "pending",
              specialties: ["EDM", "Mixing"],
              bio: "New instructor with expertise in EDM and mixing.",
              hourly_rate: 30,
              years_experience: 2,
              profile: {
                first_name: "Instructor",
                last_name: "Two",
                email: "instructor2@example.com"
              }
            }
          ];
        }
        
        const { data, error } = await supabase.rpc('get_instructors_with_profiles', {
          status_param: 'pending'
        });
        
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
        
        // For mock admin, return mock inactive instructors (empty array for simplicity)
        if (isMockAdmin) {
          console.log('Using mock inactive instructors for demo admin');
          return [];
        }
        
        const { data, error } = await supabase.rpc('get_instructors_with_profiles', {
          status_param: 'inactive' 
        });
        
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
      // For mock admin, just return success without calling the database
      if (isMockAdmin) {
        console.log("Mock admin approving instructor:", instructorId);
        return { success: true, instructorId };
      }
      
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'active' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Instructor approved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve instructor: ${error.message}`);
    }
  });

  const declineInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      // For mock admin, just return success without calling the database
      if (isMockAdmin) {
        console.log("Mock admin declining instructor:", instructorId);
        return { success: true, instructorId };
      }
      
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'declined' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Instructor declined successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to decline instructor: ${error.message}`);
    }
  });

  const deactivateInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      // For mock admin, just return success without calling the database
      if (isMockAdmin) {
        console.log("Mock admin deactivating instructor:", instructorId);
        return { success: true, instructorId };
      }
      
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'inactive' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Instructor deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate instructor: ${error.message}`);
    }
  });

  const activateInstructor = useMutation({
    mutationFn: async (instructorId: string) => {
      // For mock admin, just return success without calling the database
      if (isMockAdmin) {
        console.log("Mock admin activating instructor:", instructorId);
        return { success: true, instructorId };
      }
      
      const { error } = await supabase
        .from('instructors')
        .update({ status: 'active' })
        .eq('id', instructorId);

      if (error) throw error;
      return { success: true, instructorId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Instructor activated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate instructor: ${error.message}`);
    }
  });

  const createInstructor = useMutation({
    mutationFn: async (userId: string) => {
      console.log(`Creating instructor record for user ${userId} using admin function`);
      
      // For mock admin, just return success without calling the database
      if (isMockAdmin) {
        console.log("Mock admin creating instructor record for:", userId);
        return { success: true, userId };
      }
      
      try {
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
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
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
