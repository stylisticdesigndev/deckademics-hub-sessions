
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  instructor: {
    name: string;
    avatar?: string;
    initials: string;
  };
  isNew?: boolean;
  type: 'event' | 'announcement' | 'update';
}

interface AuthorProfile {
  first_name?: string;
  last_name?: string;
}

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  published_at: string;
  profiles?: AuthorProfile | AuthorProfile[];
}

export function useAnnouncements(targetRole: string = 'student') {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            id,
            title,
            content,
            published_at,
            author_id,
            profiles:author_id (first_name, last_name)
          `)
          .contains('target_role', [targetRole]);

        if (error) {
          console.error("Error fetching announcements:", error);
          setAnnouncements([]);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          const formattedAnnouncements: Announcement[] = [];
          for (const annRaw of data) {
            if (!annRaw) continue;
            
            let fullName = 'Admin';
            let initials = 'A';
            
            // Add null check and additional type guards before accessing profiles
            if (annRaw.profiles) {
              const pf = Array.isArray(annRaw.profiles) ? annRaw.profiles[0] : annRaw.profiles;
              if (pf) {
                const firstName = pf.first_name ?? '';
                const lastName = pf.last_name ?? '';
                fullName = `${firstName} ${lastName}`.trim() || 'Admin';
                initials = `${(firstName || ' ')[0] || ''}${(lastName || ' ')[0] || ''}`.trim().toUpperCase() || 'A';
              }
            }
            
            formattedAnnouncements.push({
              id: annRaw.id || '',
              title: annRaw.title || '',
              content: annRaw.content || '',
              date: annRaw.published_at ? new Date(annRaw.published_at).toLocaleDateString() : 'Unknown date',
              instructor: {
                name: fullName,
                initials
              },
              isNew: true,
              type: 'announcement',
            });
          }
          setAnnouncements(formattedAnnouncements);
        } else {
          setAnnouncements([]);
        }
      } catch (e) {
        setAnnouncements([]);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [targetRole]);

  return { announcements, loading, setAnnouncements };
}
