
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { MessageSquare, PlusCircle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const StudentMessages = () => {
  const { userData } = useAuth();
  
  // Check if user has completed their profile
  const isNewUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  
  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Messages & Updates</h1>
          <p className="text-muted-foreground mt-2">
            View messages and updates from your instructors and administrators
          </p>
        </section>

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
      </div>
    </DashboardLayout>
  );
};

export default StudentMessages;
