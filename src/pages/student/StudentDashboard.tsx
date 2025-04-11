
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { StatsCard } from '@/components/cards/StatsCard';
import { AnnouncementCard } from '@/components/cards/AnnouncementCard';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Award, Calendar, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BookOpenText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Updated to match the type in AnnouncementCard.tsx
interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  instructor: {
    name: string;
    avatar?: string;
    initials: string;
  };
  isNew?: boolean;
  type: 'event' | 'announcement' | 'update';
}

const StudentDashboard = () => {
  const { toast } = useToast();
  const { userData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [studentData, setStudentData] = useState({
    name: userData.profile ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim() : 'Student',
    level: 'Beginner',
    totalProgress: 0,
    currentModule: 'Not started',
    moduleProgress: 0,
    hoursCompleted: 0,
    instructor: 'Not assigned',
    nextClass: 'Not scheduled',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userData.user?.id) return;

      try {
        setLoading(true);
        
        // Fetch student information
        const { data: studentInfo, error: studentError } = await supabase
          .from('students')
          .select('level, enrollment_status, notes')
          .eq('id', userData.user.id)
          .single();
          
        if (studentError) throw studentError;

        // Fetch announcements
        // The key fix: pass an array of strings for the in() method, not a single string
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select(`
            id,
            title,
            content,
            published_at,
            author_id,
            profiles:author_id (first_name, last_name)
          `)
          .in('target_role', ['student'])
          .order('published_at', { ascending: false });

        if (announcementsError) throw announcementsError;

        // Fetch upcoming classes
        const now = new Date().toISOString();
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            title,
            location,
            start_time,
            end_time,
            instructors:instructor_id (
              id,
              profiles:id (first_name, last_name)
            )
          `)
          .gt('start_time', now)
          .order('start_time', { ascending: true })
          .limit(3);

        if (classesError) throw classesError;

        // Fetch progress data
        const { data: progressData, error: progressError } = await supabase
          .from('student_progress')
          .select('skill_name, proficiency')
          .eq('student_id', userData.user.id);

        if (progressError) throw progressError;

        // Update student data
        if (studentInfo) {
          setStudentData(prev => ({
            ...prev,
            level: studentInfo.level || 'Beginner'
          }));
        }

        // Format announcements
        if (announcementsData) {
          const formattedAnnouncements: Announcement[] = announcementsData.map(ann => ({
            id: ann.id,
            title: ann.title,
            content: ann.content,
            date: new Date(ann.published_at).toLocaleDateString(),
            instructor: {
              name: ann.profiles ? `${ann.profiles.first_name || ''} ${ann.profiles.last_name || ''}`.trim() : 'Admin',
              initials: ann.profiles ? 
                `${(ann.profiles.first_name || ' ')[0]}${(ann.profiles.last_name || ' ')[0]}`.trim().toUpperCase() : 'A'
            },
            isNew: true, // Mark as new initially
            type: 'announcement', // Default type
          }));
          setAnnouncements(formattedAnnouncements);
        }

        // Format upcoming classes
        if (classesData) {
          const formattedClasses: ClassSession[] = classesData.map(cls => {
            const startTime = new Date(cls.start_time);
            const endTime = new Date(cls.end_time);
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            const instructorName = cls.instructors?.profiles 
              ? `${cls.instructors.profiles.first_name || ''} ${cls.instructors.profiles.last_name || ''}`.trim()
              : 'Not assigned';
              
            return {
              id: cls.id,
              title: cls.title,
              instructor: instructorName,
              date: startTime.toLocaleDateString(),
              time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: `${durationHours}h ${durationMinutes}m`,
              location: cls.location || 'Main Studio',
              attendees: 0, // This would need another query to count enrollments
              isUpcoming: true,
            };
          });
          
          setUpcomingClasses(formattedClasses);
          
          // Update next class info if available
          if (formattedClasses.length > 0) {
            setStudentData(prev => ({
              ...prev,
              nextClass: `${formattedClasses[0].date} at ${formattedClasses[0].time}`,
              instructor: formattedClasses[0].instructor
            }));
          }
        }

        // Calculate total progress if progress data exists
        if (progressData && progressData.length > 0) {
          const totalProficiency = progressData.reduce((sum, item) => sum + (item.proficiency || 0), 0);
          const avgProgress = Math.round(totalProficiency / progressData.length);
          
          setStudentData(prev => ({
            ...prev,
            totalProgress: avgProgress
          }));
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData.user?.id, toast]);

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

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse space-y-2 flex flex-col items-center">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading dashboard data...</p>
            </div>
          </div>
        ) : isEmpty && (
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
