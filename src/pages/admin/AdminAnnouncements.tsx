
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Plus } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: ''
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Upcoming DJ Workshop',
      content: 'We\'re excited to announce a special workshop on advanced DJ techniques this weekend. Open to all students with at least 3 months of experience.',
      date: '04/02/2025'
    },
    {
      id: '2',
      title: 'School Closure - April 10',
      content: 'Please note that Deckademics will be closed on April 10 for building maintenance. All classes scheduled for that day will be rescheduled.',
      date: '04/01/2025'
    }
  ]);

  const handleCreateAnnouncement = () => {
    // Validate inputs
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a title and content for your announcement.',
        variant: 'destructive'
      });
      return;
    }

    // Create new announcement with US date format (MM/dd/yyyy)
    const today = new Date();
    const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    
    const announcement = {
      id: (announcements.length + 1).toString(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: formattedDate
    };

    // Add to announcements list
    setAnnouncements([...announcements, announcement]);
    
    // Reset form and close dialog
    setNewAnnouncement({ title: '', content: '' });
    setIsDialogOpen(false);
    
    // Show success toast
    toast({
      title: 'Announcement Created',
      description: 'Your announcement has been published.',
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast({
      title: 'Announcement Deleted',
      description: 'The announcement has been removed.',
    });
  };

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground mt-1">
              Manage school-wide announcements and notifications
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {announcements.slice(0, 2).map(announcement => (
            <Card key={announcement.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription>Posted on {announcement.date}</CardDescription>
                </div>
                <Megaphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {announcement.content}
                </p>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                  >Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Announcements</CardTitle>
            <CardDescription>View and manage all announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">{announcement.title}</h4>
                      <p className="text-sm text-muted-foreground">Posted on {announcement.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                      >Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No announcements available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Announcement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Add a new announcement that will be visible to students, instructors and staff.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                placeholder="Announcement title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="content" className="text-sm font-medium">Content</label>
              <Textarea
                id="content"
                placeholder="Write your announcement here..."
                rows={5}
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setNewAnnouncement({ title: '', content: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement}>
              Publish Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminAnnouncements;
