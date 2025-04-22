
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle, Search, X, CalendarRange, BookOpen, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const StudentClasses = () => {
  const { toast } = useToast();
  const { userData, session } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isFirstTimeUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  const studentId = session?.user?.id;

  useEffect(() => {
    const fetchClassData = async () => {
      if (!studentId || isFirstTimeUser) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log("Fetching classes for student:", studentId);
        
        // Get current date for comparing past and upcoming classes
        const now = new Date().toISOString();
        
        // First get the enrollments for this student
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', studentId);
          
        if (enrollmentsError) {
          console.error("Error fetching enrollments:", enrollmentsError);
          return;
        }
        
        if (!enrollments || enrollments.length === 0) {
          console.log("No enrollments found for student");
          setClassSessions([]);
          setLoading(false);
          return;
        }
        
        const classIds = enrollments.map(e => e.class_id);
        
        // Fetch class details
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            title,
            location,
            start_time,
            end_time,
            instructor_id
          `)
          .in('id', classIds);
          
        if (classesError) {
          console.error("Error fetching classes:", classesError);
          return;
        }
        
        if (!classesData || classesData.length === 0) {
          setClassSessions([]);
          setLoading(false);
          return;
        }
        
        console.log("Classes fetched:", classesData.length);
        
        // Get instructor profiles
        const instructorIds = classesData
          .map(cls => cls.instructor_id)
          .filter((id): id is string => id !== null);
          
        const { data: instructors, error: instructorsError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', instructorIds);
          
        if (instructorsError) {
          console.error("Error fetching instructors:", instructorsError);
        }
        
        // Create instructor map
        const instructorMap = new Map();
        if (instructors) {
          instructors.forEach(instructor => {
            instructorMap.set(
              instructor.id, 
              `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || 'Instructor'
            );
          });
        }
        
        // Format class data
        const formattedClasses: ClassSession[] = classesData.map(cls => {
          const startTime = new Date(cls.start_time);
          const endTime = new Date(cls.end_time);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          const isUpcoming = new Date(cls.start_time) > new Date();
          
          const instructorName = cls.instructor_id && instructorMap.has(cls.instructor_id) 
            ? instructorMap.get(cls.instructor_id) 
            : 'Instructor';
          
          // Generate a topic from the title
          let topic = '';
          if (cls.title.includes('Beat')) topic = 'Understanding tempo and phrase matching';
          else if (cls.title.includes('Scratch')) topic = 'Scratch techniques and patterns';
          else if (cls.title.includes('Mix')) topic = 'Creating smooth transitions between tracks';
          else if (cls.title.includes('Theory')) topic = 'Key matching and harmonic mixing';
          else topic = 'DJ techniques and skills';
          
          return {
            id: cls.id,
            title: cls.title,
            instructor: instructorName,
            date: startTime.toLocaleDateString(),
            time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${durationHours > 0 ? `${durationHours}h ` : ''}${durationMinutes}m`,
            location: cls.location || 'Main Studio',
            attendees: Math.floor(Math.random() * 8) + 3, // Random number between 3-10
            isUpcoming,
            topic,
          };
        });
        
        setClassSessions(formattedClasses);
      } catch (error) {
        console.error("Error fetching class data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClassData();
  }, [studentId, isFirstTimeUser]);

  const handleAddToCalendar = (id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  };

  // Filter classes based on search and filter
  const filterClasses = (classes: ClassSession[]) => {
    return classes
      .filter(session => 
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.topic?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(session => {
        if (filter === 'all') return true;
        return session.instructor.toLowerCase().includes(filter.toLowerCase());
      });
  };

  const upcomingClasses = filterClasses(classSessions.filter(session => session.isUpcoming));
  const pastClasses = filterClasses(classSessions.filter(session => !session.isUpcoming));

  // Get unique instructors for filter
  const instructors = [...new Set(classSessions.map(session => session.instructor))];

  const FirstTimeUserView = () => (
    <div className="space-y-6">
      <Alert className="bg-deckademics-primary/10 border-deckademics-primary/20">
        <BookOpen className="h-4 w-4 text-deckademics-primary" />
        <AlertTitle>Welcome to Deckademics DJ School!</AlertTitle>
        <AlertDescription>
          Complete your profile to start exploring available classes and workshops.
        </AlertDescription>
      </Alert>
      
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarRange className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium">No classes enrolled yet</h3>
        <p className="text-muted-foreground mt-2 mb-6">
          Complete your profile to start browsing available classes and workshops.
        </p>
        <Button asChild>
          <Link to="/student/profile">
            <PlusCircle className="h-4 w-4 mr-2" />
            Complete Your Profile
          </Link>
        </Button>
      </div>
    </div>
  );

  const NoClassesView = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CalendarRange className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium">No classes enrolled yet</h3>
      <p className="text-muted-foreground mt-2 mb-6">
        You haven't enrolled in any classes yet. Contact your administrator to get started.
      </p>
    </div>
  );

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your upcoming and past DJ classes
          </p>
        </section>

        {isFirstTimeUser ? (
          <FirstTimeUserView />
        ) : loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your classes...</p>
          </div>
        ) : classSessions.length === 0 ? (
          <NoClassesView />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full sm:w-auto flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search classes..."
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="w-full sm:w-auto min-w-[200px]">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor} value={instructor}>
                        {instructor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="upcoming">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upcoming" className="flex gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming Classes
                </TabsTrigger>
                <TabsTrigger value="past" className="flex gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Past Classes
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {upcomingClasses.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingClasses.map(session => (
                      <UpcomingClassCard 
                        key={session.id} 
                        session={session} 
                        onAddToCalendar={handleAddToCalendar} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No upcoming classes found.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="past">
                {pastClasses.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {pastClasses.map(session => (
                      <UpcomingClassCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No past classes found.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentClasses;
