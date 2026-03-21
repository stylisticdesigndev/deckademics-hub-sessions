
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { MessageSquare, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard } from '@/components/cards/AnnouncementCard';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AuthorProfile {
  first_name?: string;
  last_name?: string;
}

const demoAnnouncements = [
  {
    id: 'demo-1',
    title: 'Spring Showcase Performance — Sign Up Now!',
    content: 'Our annual Spring Showcase is coming up on April 19th! All students are invited to perform a 5-minute set. Sign up with your instructor by April 5th. This is a great opportunity to show off what you\'ve learned this semester.',
    date: new Date().toLocaleDateString(),
    instructor: { name: 'Admin', initials: 'DA' },
    isNew: true,
    type: 'event' as const,
  },
  {
    id: 'demo-2',
    title: 'New Equipment in Classroom B',
    content: 'We\'ve upgraded Classroom B with new Pioneer DDJ-REV7 controllers and KRK studio monitors. Please handle all equipment with care and report any issues to your instructor immediately.',
    date: new Date(Date.now() - 2 * 86400000).toLocaleDateString(),
    instructor: { name: 'DJ Marcus', initials: 'DM' },
    isNew: true,
    type: 'announcement' as const,
  },
  {
    id: 'demo-3',
    title: 'Schedule Change — No Classes March 28',
    content: 'There will be no classes on Friday, March 28th due to building maintenance. All missed classes will be made up the following week. Please check with your instructor for your makeup time.',
    date: new Date(Date.now() - 5 * 86400000).toLocaleDateString(),
    instructor: { name: 'Admin', initials: 'DA' },
    isNew: false,
    type: 'update' as const,
  },
  {
    id: 'demo-4',
    title: 'Great Progress This Month!',
    content: 'Just wanted to give a shoutout to all students — the progress I\'ve seen this month has been incredible. Keep practicing your transitions and beat matching. Remember, consistency is key!',
    date: new Date(Date.now() - 8 * 86400000).toLocaleDateString(),
    instructor: { name: 'DJ Marcus', initials: 'DM' },
    isNew: false,
    type: 'announcement' as const,
  },
  {
    id: 'demo-5',
    title: 'Curriculum Update for Intermediate Students',
    content: 'We\'ve added new modules on harmonic mixing and live looping to the intermediate curriculum. These will be covered over the next 4 weeks. Make sure to review the updated lesson plan in your Curriculum tab.',
    date: new Date(Date.now() - 12 * 86400000).toLocaleDateString(),
    instructor: { name: 'Admin', initials: 'DA' },
    isNew: false,
    type: 'update' as const,
  },
];

const StudentMessages = () => {
  const { userData, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  const isNewUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  const isDemoMode = !session;
  
  useEffect(() => {
    if (isDemoMode) {
      setAnnouncements(demoAnnouncements);
      setLoading(false);
      return;
    }

    async function fetchAnnouncements() {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAnnouncements(demoAnnouncements);
          setLoading(false);
          return;
        }

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
          .contains('target_role', ['student'])
          .order('published_at', { ascending: false });

        if (error) {
          console.error('Error fetching announcements:', error);
          setAnnouncements(demoAnnouncements);
          return;
        }

        if (data && data.length > 0) {
          const formattedAnnouncements = data.map((ann: any) => {
            const authorProfile = ann.profiles as AuthorProfile;
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
        } else {
          setAnnouncements(demoAnnouncements);
        }
      } catch (err) {
        console.error('Error in fetchAnnouncements:', err);
        setAnnouncements(demoAnnouncements);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, [isDemoMode]);

  const handleMarkAsRead = async (id: string) => {
    if (isDemoMode || id.startsWith('demo-')) {
      setAnnouncements(prev => 
        prev.map(a => a.id === id ? { ...a, isNew: false } : a)
      );
      toast({ title: 'Marked as read', description: 'The announcement has been marked as read.' });
      return;
    }

    try {
      const { error } = await supabase
        .from('announcement_reads')
        .insert({
          announcement_id: id,
          user_id: session?.user?.id
        });

      if (error) {
        console.error('Error marking announcement as read:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark announcement as read.' });
        return;
      }

      setAnnouncements(prev => 
        prev.map(a => a.id === id ? { ...a, isNew: false } : a)
      );
      
      toast({ title: 'Marked as read', description: 'The announcement has been marked as read.' });
    } catch (err) {
      console.error('Error in handleMarkAsRead:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark announcement as read.' });
    }
  };
  
  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Messages & Updates</h1>
          <p className="text-muted-foreground mt-2">
            View messages and updates from your instructors and administrators
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
                ? "Complete your profile to start receiving messages from instructors."
                : "You don't have any messages at the moment."}
            </p>
            
            {isNewUser && (
              <div className="flex gap-4 mt-2">
                <Button asChild>
                  <Link to="/student/profile">
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

export default StudentMessages;
