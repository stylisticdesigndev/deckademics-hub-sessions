
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Megaphone, Plus, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { mockInstructorAnnouncements } from '@/data/mockInstructorData';

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
  const [announcementType, setAnnouncementType] = useState<string>('announcement');
  const [demoMode, setDemoMode] = useState(false);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', 'instructor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]).map((item: any) => ({
        id: item.id, title: item.title || '', content: item.content || '',
        created_at: item.created_at || '', published_at: item.published_at,
        target_role: item.target_role || []
      })) as AnnouncementDb[];
    },
    enabled: !demoMode,
  });

  const createAnnouncement = useMutation({
    mutationFn: async (newAnnouncement: { title: string; content: string; target_role: string[]; type: string }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.from('announcements').insert([{
        title: newAnnouncement.title, content: newAnnouncement.content,
        author_id: session.user.id, target_role: newAnnouncement.target_role,
        type: newAnnouncement.type
      } as any]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created successfully');
      setTitle(''); setContent(''); setTargetRole('student'); setAnnouncementType('announcement');
    },
    onError: (error: Error) => toast.error(`Failed to create announcement: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoMode) { toast.info('Cannot create announcements in demo mode'); return; }
    if (!title.trim() || !content.trim()) { toast.error('Please fill in all required fields'); return; }
    const targetRoles = targetRole === 'all' ? ['student', 'instructor', 'admin'] : [targetRole];
    createAnnouncement.mutate({ title: title.trim(), content: content.trim(), target_role: targetRoles, type: announcementType });
  };

  const formatDate = (dateString: string) => format(new Date(dateString), 'MMM d, yyyy at h:mm a');

  const getTargetRoleBadgeColor = (roles: string[]) => {
    if (roles.includes('admin')) return 'bg-red-100 text-red-800';
    if (roles.includes('instructor')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const activeAnnouncements = demoMode ? mockInstructorAnnouncements : announcements;
  const showLoading = !demoMode && isLoading;

  return (
    <div className="space-y-6">
      {demoMode && (
        <Alert className="bg-warning/10 border-warning/30">
          <Eye className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
          <AlertDescription>Showing sample announcements. Click "Live Data" to switch back.</AlertDescription>
        </Alert>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Create and manage announcements for students</p>
        </div>
        <Button
          variant={demoMode ? "default" : "outline"} size="sm"
          onClick={() => setDemoMode(!demoMode)} className="flex items-center gap-2"
        >
          {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {demoMode ? 'Live Data' : 'Demo'}
        </Button>
      </div>

      {/* Create Announcement Form */}
      <Card className={demoMode ? 'opacity-60 pointer-events-none' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Create New Announcement</CardTitle>
          <CardDescription>Share important updates and information with your students</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter announcement title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Audience</Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Students Only</SelectItem>
                    <SelectItem value="instructor">Instructors Only</SelectItem>
                    <SelectItem value="all">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={announcementType} onValueChange={setAnnouncementType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" placeholder="Write your announcement content here..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} required />
            </div>
            <Button type="submit" disabled={createAnnouncement.isPending || demoMode} className="w-full sm:w-auto">
              {createAnnouncement.isPending ? 'Creating...' : 'Create Announcement'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />Recent Announcements</CardTitle>
          <CardDescription>Your recent announcements and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {showLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[100px] w-full rounded-lg" />)}
            </div>
          ) : activeAnnouncements.length > 0 ? (
            <div className="space-y-4">
              {activeAnnouncements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground">Created {formatDate(announcement.created_at)}</p>
                    </div>
                    <Badge variant="outline" className={getTargetRoleBadgeColor(announcement.target_role)}>
                      {announcement.target_role.includes('student') && announcement.target_role.includes('instructor') && announcement.target_role.includes('admin')
                        ? 'Everyone' : announcement.target_role.includes('student') ? 'Students' : announcement.target_role.includes('instructor') ? 'Instructors' : 'Admin'}
                    </Badge>
                  </div>
                  <Separator />
                  <p className="text-muted-foreground leading-relaxed">{announcement.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
              <p className="text-muted-foreground mb-4">Create your first announcement to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorAnnouncements;
