
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Megaphone, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';

interface AnnouncementDb {
  id: string;
  title: string;
  content: string;
  created_at: string;
  published_at: string | null;
  target_role: string[];
}

const InstructorAnnouncements = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<string>('student');

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', 'instructor'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching announcements:', error);
          throw error;
        }

        return (data as any[]).map((item: any) => ({
          id: item.id,
          title: item.title || '',
          content: item.content || '',
          created_at: item.created_at || '',
          published_at: item.published_at,
          target_role: item.target_role || []
        })) as AnnouncementDb[];
      } catch (error) {
        console.error('Error in announcements query:', error);
        return [];
      }
    }
  });

  // Create announcement mutation
  const createAnnouncement = useMutation({
    mutationFn: async (newAnnouncement: { title: string; content: string; target_role: string[] }) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          author_id: session.user.id,
          target_role: newAnnouncement.target_role
        } as any]);

      if (error) {
        console.error('Error creating announcement:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created successfully');
      setTitle('');
      setContent('');
      setTargetRole('student');
    },
    onError: (error: Error) => {
      console.error('Error creating announcement:', error);
      toast.error(`Failed to create announcement: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const targetRoles = targetRole === 'all' ? ['student', 'instructor', 'admin'] : [targetRole];
    
    createAnnouncement.mutate({
      title: title.trim(),
      content: content.trim(),
      target_role: targetRoles
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy at h:mm a');
  };

  const getTargetRoleBadgeColor = (roles: string[]) => {
    if (roles.includes('admin')) return 'bg-red-100 text-red-800';
    if (roles.includes('instructor')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">Loading announcements...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage announcements for students
          </p>
        </div>

        {/* Create Announcement Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Announcement
            </CardTitle>
            <CardDescription>
              Share important updates and information with your students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter announcement title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target Audience</Label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Students Only</SelectItem>
                      <SelectItem value="instructor">Instructors Only</SelectItem>
                      <SelectItem value="all">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your announcement content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={createAnnouncement.isPending}
                className="w-full sm:w-auto"
              >
                {createAnnouncement.isPending ? 'Creating...' : 'Create Announcement'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Announcements List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
            <CardDescription>
              Your recent announcements and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDate(announcement.created_at)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getTargetRoleBadgeColor(announcement.target_role)}
                      >
                        {announcement.target_role.includes('student') && 
                         announcement.target_role.includes('instructor') && 
                         announcement.target_role.includes('admin') ? 'Everyone' :
                         announcement.target_role.includes('student') ? 'Students' :
                         announcement.target_role.includes('instructor') ? 'Instructors' : 'Admin'}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <p className="text-gray-700 leading-relaxed">
                      {announcement.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Megaphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
                <p className="text-gray-600 mb-4">Create your first announcement to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InstructorAnnouncements;
