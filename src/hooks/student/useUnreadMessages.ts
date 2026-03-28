
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessagesCount = (userId?: string) => {
  return useQuery({
    queryKey: ['unread-messages-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .is('read_at', null);
      if (error) {
        console.error('Error fetching unread messages count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};
