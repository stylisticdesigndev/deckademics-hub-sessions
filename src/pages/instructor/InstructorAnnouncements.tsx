
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { AnnouncementCard, Announcement } from '@/components/cards/AnnouncementCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Megaphone, Calendar, Info } from 'lucide-react';

const InstructorAnnouncements = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [announcementType, setAnnouncementType] = useState<'announcement' | 'event' | 'update'>('announcement');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'New Scratching Workshop',
      content: 'Join us this weekend for an intensive scratching workshop with DJ Precision. All levels welcome!',
      date: '2 hours ago',
      instructor: {
        name: 'DJ Smith',
        initials: 'DS',
      },
      type: 'event',
    },
    {
      id: '2',
      title: 'Studio Access Updates',
      content: 'The practice studio hours have been extended to 10 PM on weekdays. Make sure to book your slot!',
      date: '2 days ago',
      instructor: {
        name: 'DJ Smith',
        initials: 'DS',
      },
      type: 'announcement',
    },
    {
      id: '3',
      title: 'Vinyl Maintenance Session',
      content: 'Learn how to properly clean and store your vinyl records in next week\'s maintenance session.',
      date: '5 days ago',
      instructor: {
        name: 'DJ Smith',
        initials: 'DS',
      },
      type: 'update',
    },
  ]);

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a title and content for your announcement.',
        variant: 'destructive'
      });
      return;
    }
    
    const announcement: Announcement = {
      id: (announcements.length + 1).toString(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: 'Just now',
      instructor: {
        name: 'DJ Smith',
        initials: 'DS',
      },
      isNew: true,
      type: announcementType,
    };
    
    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({ title: '', content: '' });
    setIsCreating(false);
    
    toast({
      title: 'Announcement Created',
      description: 'Your announcement has been published to students.',
    });
  };

  const handleDelete = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast({
      title: 'Announcement Deleted',
      description: 'The announcement has been removed.',
    });
  };

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage announcements for your students
            </p>
          </div>
          
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          )}
        </section>

        {isCreating ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Announcement</CardTitle>
              <CardDescription>
                This will be visible to all your students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Announcement Type</label>
                <Select 
                  value={announcementType} 
                  onValueChange={(value: 'announcement' | 'event' | 'update') => setAnnouncementType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        General Announcement
                      </div>
                    </SelectItem>
                    <SelectItem value="event">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Event
                      </div>
                    </SelectItem>
                    <SelectItem value="update">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Update
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Write your announcement here..."
                  rows={5}
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false);
                  setNewAnnouncement({ title: '', content: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAnnouncement}>
                Publish Announcement
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="space-y-4">
                {announcements.length > 0 ? (
                  announcements.map(announcement => (
                    <div key={announcement.id} className="relative">
                      <AnnouncementCard announcement={announcement} />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium">No announcements</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't created any announcements yet. Click the "Create Announcement" button to get started.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="events">
              <div className="space-y-4">
                {announcements.filter(a => a.type === 'event').length > 0 ? (
                  announcements
                    .filter(a => a.type === 'event')
                    .map(announcement => (
                      <div key={announcement.id} className="relative">
                        <AnnouncementCard announcement={announcement} />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium">No events</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't created any events yet. Click the "Create Announcement" button to add an event.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="announcements">
              <div className="space-y-4">
                {announcements.filter(a => a.type === 'announcement' || a.type === 'update').length > 0 ? (
                  announcements
                    .filter(a => a.type === 'announcement' || a.type === 'update')
                    .map(announcement => (
                      <div key={announcement.id} className="relative">
                        <AnnouncementCard announcement={announcement} />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium">No announcements</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't created any announcements yet. Click the "Create Announcement" button to get started.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorAnnouncements;
