
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { Plus } from 'lucide-react';
import { AnnouncementForm } from '@/components/admin/announcements/AnnouncementForm';
import { AnnouncementList } from '@/components/admin/announcements/AnnouncementList';

const AdminAnnouncements = () => {
  const { userData } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage school-wide announcements
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        <AnnouncementList />

        <AnnouncementForm 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          authorId={userData?.profile?.id}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminAnnouncements;
