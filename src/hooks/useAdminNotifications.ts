import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const useAdminNotifications = (adminId?: string) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications', adminId],
    queryFn: async (): Promise<AdminNotification[]> => {
      if (!adminId) return [];
      const { data, error } = await supabase
        .from('admin_notifications' as any)
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching admin notifications:', error);
        return [];
      }
      return (data || []) as AdminNotification[];
    },
    enabled: !!adminId,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('admin_notifications' as any)
        .update({ read: true } as any)
        .eq('id', notificationId as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications', adminId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!adminId) return;
      const { error } = await supabase
        .from('admin_notifications' as any)
        .update({ read: true } as any)
        .eq('admin_id', adminId as any)
        .eq('read', false as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications', adminId] });
    },
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
};
