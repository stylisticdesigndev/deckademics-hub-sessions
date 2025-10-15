
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { MessageSquare, PlusCircle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard } from '@/components/cards/AnnouncementCard';
import { useToast } from '@/hooks/use-toast';

interface AuthorProfile {
  first_name?: string;
  last_name?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  profiles?: AuthorProfile;
}

const InstructorMessages = () => {
  const { userData, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Check if user has completed their profile
  const isNewUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch announcements with read status
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            id,
            title,
            content,
            published_at,
            author_id,
            profiles:author_id (first_name, last_name),
            announcement_reads!left (id, read_at)
          `)
          .contains('target_role', ['instructor'])
          .order('published_at', { ascending: false });

        if (error) {
          console.error('Error fetching announcements:', error);
          return;
        }

        // Format announcements with read status
        if (data && data.length > 0) {
          const formattedAnnouncements = data.map((ann: any) => {
            const authorProfile = ann.profiles as AuthorProfile;
            // Check if there's a read record for this announcement
            const readRecords = Array.isArray(ann.announcement_reads) ? ann.announcement_reads : [];
            const isRead = readRecords.length > 0;
            
            return {
              id: ann.id,
              title: ann.title || 'Announcement',
              content: ann.content || '',
              date: new Date(ann.published_at).toLocaleDateString(),
              instructor: {
                name: authorProfile ? `${authorProfile.first_name || ''} ${authorProfile.last_name || ''}`.trim() : 'Admin',
                initials: authorProfile ? 
                  `${(authorProfile.first_name || ' ')[0]}${(authorProfile.last_name || ' ')[0]}`.trim().toUpperCase() : 'A'
              },
              isNew: !isRead,
              type: 'announcement',
            };
          });
          setAnnouncements(formattedAnnouncements);
        }
      } catch (err) {
        console.error('Error in fetchAnnouncements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Insert read record into database
      const { error } = await supabase
        .from('announcement_reads')
        .insert({
          announcement_id: id,
          user_id: session?.user?.id
        });

      if (error) {
        console.error('Error marking announcement as read:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to mark announcement as read.',
        });
        return;
      }

      // Update local state
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(announcement => 
          announcement.id === id ? { ...announcement, isNew: false } : announcement
        )
      );
      
      toast({
        title: 'Marked as read',
        description: 'The announcement has been marked as read.',
      });
    } catch (err) {
      console.error('Error in handleMarkAsRead:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark announcement as read.',
      });
    }
  };
  
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Messages & Updates</h1>
          <p className="text-muted-foreground mt-2">
            View important announcements and messages from the admin
          </p>
        </section>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onAcknowledge={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">No messages yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              {isNewUser 
                ? "Complete your profile to start receiving messages from administrators."
                : "You don't have any messages at the moment."}
            </p>
            
            {isNewUser && (
              <div className="flex gap-4 mt-2">
                <Button asChild>
                  <Link to="/instructor/profile">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Complete Your Profile
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorMessages;
