import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the number of student-targeted announcements that the current user
 * has neither read nor dismissed. Used to badge the Announcements nav item.
 */
export const useUnreadAnnouncementsCount = (userId?: string) => {
  return useQuery({
    queryKey: ['unread-announcements-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, announcement_reads!left (id, read_at, user_id, dismissed)')
          .contains('target_role', ['student']);

        if (error) {
          console.error('Error fetching unread announcements count:', error);
          return 0;
        }

        if (!Array.isArray(data)) return 0;

        let unread = 0;
        for (const ann of data as any[]) {
          const reads = Array.isArray(ann.announcement_reads)
            ? ann.announcement_reads.filter((r: any) => r.user_id === userId)
            : [];
          const dismissed = reads.some((r: any) => r.dismissed === true);
          if (dismissed) continue;
          const read = reads.some((r: any) => r.read_at);
          if (!read) unread += 1;
        }
        return unread;
      } catch (err) {
        console.error('Unexpected error fetching unread announcements count:', err);
        return 0;
      }
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};