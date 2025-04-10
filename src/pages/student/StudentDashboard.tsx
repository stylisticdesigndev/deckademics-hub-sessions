
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { StatsCard } from '@/components/cards/StatsCard';
import { AnnouncementCard, Announcement } from '@/components/cards/AnnouncementCard';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Award, Calendar, Clock, Music, BookOpenText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const StudentDashboard = () => {
  const { toast } = useToast();
  const { userData } = useAuth();
  
  // Empty announcements for new users
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Empty upcoming classes for new users
  const upcomingClasses: ClassSession[] = [];

  // User data for new student
  const studentData = {
    name: userData.profile ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim() : 'Student',
    level: 'Beginner',
    totalProgress: 0,
    currentModule: 'Not started',
    moduleProgress: 0,
    hoursCompleted: 0,
    instructor: 'Not assigned',
    nextClass: 'Not scheduled',
  };

  const handleAcknowledgeAnnouncement = (id: string) => {
    setAnnouncements(prevAnnouncements => 
      prevAnnouncements.map(announcement => 
        announcement.id === id ? { ...announcement, isNew: false } : announcement
      )
    );
    
    toast({
      title: 'Marked as read',
      description: 'The announcement has been marked as read.',
    });
  };

  const handleAddToCalendar = (id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  };

  const isEmpty = announcements.length === 0 && upcomingClasses.length === 0;

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome, {studentData.name}</h1>
          <p className="text-muted-foreground">
            You're currently at <span className="text-deckademics-primary font-medium">{studentData.level}</span> level. 
            {isEmpty && " Complete your profile and enroll in classes to get started."}
          </p>
        </section>

        {isEmpty && (
          <Alert>
            <BookOpenText className="h-4 w-4" />
            <AlertTitle>Welcome to Deckademics!</AlertTitle>
            <AlertDescription>
              Your dashboard is currently empty. Visit your profile to complete your information and then 
              check back for upcoming classes and announcements.
            </AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <StatsCard 
            title="Current Level"
            value={studentData.level}
            icon={<Award className="h-5 w-5" />}
            description={studentData.totalProgress > 0 ? `${studentData.totalProgress}% complete` : "Just getting started"}
          />
          <StatsCard 
            title="Next Class"
            value={studentData.nextClass}
            icon={<Calendar className="h-5 w-5" />}
            description={studentData.instructor !== "Not assigned" ? `With ${studentData.instructor}` : "No instructor assigned yet"}
          />
        </section>

        <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Progress</h2>
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium">Overall Progress</CardTitle>
                  <Link to="/student/progress">
                    <Button variant="link" size="sm" className="text-deckademics-primary">
                      View All Progress
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentData.totalProgress > 0 ? (
                  <>
                    <ProgressBar 
                      value={studentData.totalProgress} 
                      max={100} 
                      size="lg"
                      label="Total Curriculum" 
                    />
                    
                    <div className="grid gap-3 grid-cols-1 mt-4">
                      <div>
                        <ProgressBar 
                          value={0} 
                          max={100} 
                          label="Beat Matching" 
                        />
                      </div>
                      <div>
                        <ProgressBar 
                          value={0} 
                          max={100} 
                          label="Scratching" 
                        />
                      </div>
                      <div>
                        <ProgressBar 
                          value={0} 
                          max={100} 
                          label="Music Theory" 
                        />
                      </div>
                      <div>
                        <ProgressBar 
                          value={0} 
                          max={100} 
                          label="Equipment Management" 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No progress data yet. Start a class to track your progress.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <h2 className="text-xl font-semibold">Upcoming Classes</h2>
            {upcomingClasses.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {upcomingClasses.map(session => (
                  <UpcomingClassCard 
                    key={session.id} 
                    session={session} 
                    onAddToCalendar={handleAddToCalendar} 
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No upcoming classes scheduled. Check back soon!</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onAcknowledge={handleAcknowledgeAnnouncement}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No announcements yet. Check back soon for updates!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
