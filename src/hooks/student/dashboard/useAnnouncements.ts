
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isDataObject, hasProperty } from '@/utils/supabaseHelpers';

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
            // Verify we have a valid data object before processing
            if (!isDataObject(annRaw)) continue;
            
            let fullName = 'Admin';
            let initials = 'A';
            
            // Process profile data safely with type checking
            if (hasProperty(annRaw, 'profiles') && annRaw.profiles) {
              const profileData = Array.isArray(annRaw.profiles) 
                ? (annRaw.profiles[0] as AuthorProfile | undefined)
                : (annRaw.profiles as AuthorProfile | undefined);
              
              if (profileData) {
                const firstName = profileData.first_name ?? '';
                const lastName = profileData.last_name ?? '';
                fullName = `${firstName} ${lastName}`.trim() || 'Admin';
                initials = `${(firstName || ' ')[0] || ''}${(lastName || ' ')[0] || ''}`.trim().toUpperCase() || 'A';
              }
            }
            
            // Only add objects with required properties
            if (hasProperty(annRaw, 'id') && 
                hasProperty(annRaw, 'title') && 
                hasProperty(annRaw, 'content') && 
                hasProperty(annRaw, 'published_at')) {
              
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
