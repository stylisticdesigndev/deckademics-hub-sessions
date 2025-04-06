
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { StatsCard } from '@/components/cards/StatsCard';
import { AnnouncementCard, Announcement } from '@/components/cards/AnnouncementCard';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { useToast } from '@/hooks/use-toast';
import { Award, Calendar, Clock, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'New Scratching Workshop',
      content: 'Join us this weekend for an intensive scratching workshop with DJ Precision. All levels welcome!',
      date: '2 hours ago',
      instructor: {
        name: 'DJ Precision',
        initials: 'DP',
      },
      isNew: true,
      type: 'event',
    },
    {
      id: '2',
      title: 'Studio Access Updates',
      content: 'The practice studio hours have been extended to 10 PM on weekdays. Make sure to book your slot!',
      date: '2 days ago',
      instructor: {
        name: 'Admin',
        initials: 'AD',
      },
      isNew: true,
      type: 'announcement',
    },
    {
      id: '3',
      title: 'Vinyl Maintenance Session',
      content: 'Learn how to properly clean and store your vinyl records in next week\'s maintenance session.',
      date: '5 days ago',
      instructor: {
        name: 'DJ Classic',
        initials: 'DC',
      },
      type: 'update',
    },
  ]);

  const upcomingClasses: ClassSession[] = [
    {
      id: '1',
      title: 'Beat Matching 101',
      instructor: 'DJ Rhythm',
      date: 'April 7, 2025',
      time: '6:00 PM',
      duration: '90 min',
      location: 'Studio A',
      attendees: 8,
      isUpcoming: true,
      topic: 'Understanding tempo and phrase matching',
    },
    {
      id: '2',
      title: 'Advanced Scratching',
      instructor: 'DJ Scratch Master',
      date: 'April 9, 2025',
      time: '5:30 PM',
      duration: '120 min',
      location: 'Main Studio',
      attendees: 6,
      isUpcoming: true,
      topic: 'Baby scratches and transforms',
    },
  ];

  // Mock student data
  const studentData = {
    name: 'Alex Johnson',
    level: 'Intermediate',
    totalProgress: 68,
    currentModule: 'Advanced Beat Matching',
    moduleProgress: 45,
    hoursCompleted: 32,
    instructor: 'DJ Rhythm',
    nextClass: 'April 7, 2025',
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

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome back, {studentData.name}</h1>
          <p className="text-muted-foreground">
            You're currently at <span className="text-deckademics-primary font-medium">{studentData.level}</span> level. 
            Keep up the good work!
          </p>
        </section>

        <section className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <StatsCard 
            title="Current Level"
            value={studentData.level}
            icon={<Award className="h-5 w-5" />}
            description="68% complete"
          />
          <StatsCard 
            title="Next Class"
            value={studentData.nextClass}
            icon={<Calendar className="h-5 w-5" />}
            description={`With ${studentData.instructor}`}
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
                <ProgressBar 
                  value={studentData.totalProgress} 
                  max={100} 
                  size="lg"
                  label="Total Curriculum" 
                />
                
                <div className="grid gap-3 grid-cols-1 mt-4">
                  <div>
                    <ProgressBar 
                      value={80} 
                      max={100} 
                      label="Beat Matching" 
                    />
                  </div>
                  <div>
                    <ProgressBar 
                      value={65} 
                      max={100} 
                      label="Scratching" 
                    />
                  </div>
                  <div>
                    <ProgressBar 
                      value={45} 
                      max={100} 
                      label="Music Theory" 
                    />
                  </div>
                  <div>
                    <ProgressBar 
                      value={90} 
                      max={100} 
                      label="Equipment Management" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <h2 className="text-xl font-semibold">Upcoming Classes</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {upcomingClasses.map(session => (
                <UpcomingClassCard 
                  key={session.id} 
                  session={session} 
                  onAddToCalendar={handleAddToCalendar} 
                />
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
            <div className="space-y-4">
              {announcements.map(announcement => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onAcknowledge={handleAcknowledgeAnnouncement}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
