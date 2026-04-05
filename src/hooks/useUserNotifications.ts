import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserNotification {
  id: string;
  type: 'message' | 'announcement';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const useUserNotifications = (userId?: string, userRole?: 'student' | 'instructor') => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['user-notifications', userId, userRole],
    queryFn: async (): Promise<UserNotification[]> => {
      if (!userId || !userRole) return [];

      // Fetch unread messages
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, sent_at, subject, sender_id, profiles!messages_sender_id_fkey(first_name, last_name)')
        .eq('receiver_id', userId)
        .is('read_at', null)
        .order('sent_at', { ascending: false })
        .limit(25);

      // Fetch announcements targeted at this role
      const { data: announcements } = await supabase
        .from('announcements')
        .select(`
          id, title, content, published_at,
          announcement_reads!left(id, user_id)
        `)
        .contains('target_role', [userRole])
        .order('published_at', { ascending: false })
        .limit(25);

      const messageNotifications: UserNotification[] = (messages || []).map((m: any) => {
        const senderName = m.profiles
          ? `${m.profiles.first_name || ''} ${m.profiles.last_name || ''}`.trim()
          : 'Unknown';
        return {
          id: m.id,
          type: 'message' as const,
          title: m.subject || `Message from ${senderName}`,
          message: m.content?.substring(0, 100) || '',
          read: false,
          created_at: m.sent_at || new Date().toISOString(),
        };
      });

      const announcementNotifications: UserNotification[] = (announcements || [])
        .filter((a: any) => {
          const reads = a.announcement_reads || [];
          return !reads.some((r: any) => r.user_id === userId);
        })
        .map((a: any) => ({
          id: a.id,
          type: 'announcement' as const,
          title: a.title,
          message: a.content?.substring(0, 100) || '',
          read: false,
          created_at: a.published_at || new Date().toISOString(),
        }));

      return [...messageNotifications, ...announcementNotifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useMutation({
    mutationFn: async (notification: UserNotification) => {
      if (notification.type === 'message') {
        const { error } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcement_reads')
          .insert({ announcement_id: notification.id, user_id: userId! });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', userId, userRole] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const unreadMessages = notifications.filter(n => n.type === 'message' && !n.read);
      const unreadAnnouncements = notifications.filter(n => n.type === 'announcement' && !n.read);

      const promises: Promise<any>[] = [];

      if (unreadMessages.length > 0) {
        promises.push(
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('receiver_id', userId)
            .is('read_at', null)
            .then()
        );
      }

      if (unreadAnnouncements.length > 0) {
        const inserts = unreadAnnouncements.map(a => ({
          announcement_id: a.id,
          user_id: userId,
        }));
        promises.push(supabase.from('announcement_reads').insert(inserts).then());
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', userId, userRole] });
    },
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
};
