import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMockUsers = () => {
  const queryClient = useQueryClient();

  const { data: mockUsers = [], isLoading } = useQuery({
    queryKey: ['admin', 'mock-users'],
    queryFn: async () => {
      const query: any = supabase.from('profiles' as any);
      const { data, error } = await query
        .select('id, first_name, last_name, email, role, avatar_url, is_mock')
        .eq('is_mock', true)
        .order('role', { ascending: true });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'mock-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin-student-counts-nav'] });
    queryClient.invalidateQueries({ queryKey: ['admin-instructor-counts-nav'] });
  };

  const setMockFlag = useMutation({
    mutationFn: async ({ userIds, isMock }: { userIds: string[]; isMock: boolean }) => {
      const { data, error } = await supabase.rpc('set_mock_flag' as any, {
        _user_ids: userIds,
        _is_mock: isMock,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      invalidateAll();
      toast.success(
        vars.isMock
          ? `Marked ${vars.userIds.length} user${vars.userIds.length === 1 ? '' : 's'} as mock`
          : `Unmarked ${vars.userIds.length} user${vars.userIds.length === 1 ? '' : 's'}`
      );
    },
    onError: (err: Error) => toast.error(`Failed to update mock flag: ${err.message}`),
  });

  const deleteAllMockUsers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('delete_all_mock_users' as any);
      if (error) throw error;
      return data as { deleted: number };
    },
    onSuccess: (data) => {
      invalidateAll();
      toast.success(`Permanently deleted ${data?.deleted ?? 0} mock user${data?.deleted === 1 ? '' : 's'}`);
    },
    onError: (err: Error) => toast.error(`Failed to delete mock users: ${err.message}`),
  });

  return { mockUsers, isLoading, setMockFlag, deleteAllMockUsers };
};