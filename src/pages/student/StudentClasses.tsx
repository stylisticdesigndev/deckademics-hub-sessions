import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { AttendanceCalendar } from '@/components/student/classes/AttendanceCalendar';
import { ClassAttendanceCard } from '@/components/student/classes/ClassAttendanceCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, Eye, EyeOff, BookOpen, PlusCircle, CalendarRange } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useStudentClassAttendance } from '@/hooks/student/useStudentClassAttendance';
import { addDays, subDays, format, getDay, startOfDay, isBefore } from 'date-fns';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate weekly class dates from a given day of week
function getWeeklyDates(dayOfWeek: number, weeksBack: number, weeksForward: number): Date[] {
  const today = startOfDay(new Date());
  const dates: Date[] = [];
  
  // Find next occurrence of dayOfWeek from today
  const todayDow = getDay(today);
  let diff = dayOfWeek - todayDow;
  if (diff < 0) diff += 7;
  const nextDate = addDays(today, diff);
  
  // Go back weeksBack weeks
  for (let i = weeksBack; i >= 1; i--) {
    dates.push(subDays(nextDate, i * 7));
  }
  
  // Current + forward weeks
  for (let i = 0; i < weeksForward; i++) {
    dates.push(addDays(nextDate, i * 7));
  }
  
  return dates;
}

// Mock data for demo mode
function getMockData() {
  const dayOfWeek = 3; // Wednesday
  const dates = getWeeklyDates(dayOfWeek, 8, 4);
  const today = startOfDay(new Date());
  
  const statuses = ['present', 'present', 'present', 'present', 'present', 'absent', 'present', 'present'] as const;
  
  const attendanceRecords = dates
    .filter(d => isBefore(d, today))
    .map((d, i) => ({
      date: format(d, 'yyyy-MM-dd'),
      status: statuses[i % statuses.length],
      classId: 'demo-class',
    }));
  
  return {
    classInfo: {
      id: 'demo-class',
      title: 'Intermediate',
      location: 'Classroom 1',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      instructorId: 'demo-instructor',
      instructorName: 'DJ Marcus',
      dayOfWeek,
    },
    attendanceRecords,
    allDates: dates,
  };
}

const LEVEL_DISPLAY: Record<string, string> = {
  novice: 'Novice', amateur: 'Amateur', intermediate: 'Intermediate',
  advanced: 'Advanced', beginner: 'Novice',
};

const StudentClasses = () => {
  const { userData, session } = useAuth();
  const { classInfo, attendanceRecords, loading, marking, markAbsent } = useStudentClassAttendance();
  const [demoMode, setDemoMode] = useState(false);
  const [studentLevel, setStudentLevel] = useState('');

  // Fetch student level
  React.useEffect(() => {
    const fetchLevel = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('students')
        .select('level')
        .eq('id', session.user.id)
        .single();
      if (data?.level) setStudentLevel(LEVEL_DISPLAY[data.level] || data.level);
    };
    fetchLevel();
  }, [session?.user?.id]);

  const isFirstTimeUser = !userData.profile?.first_name || userData.profile?.first_name === '';

  // Resolve data source
  const activeClassInfo = demoMode ? getMockData().classInfo : classInfo;
  const activeRecords = demoMode ? getMockData().attendanceRecords : attendanceRecords;

  // Generate weekly dates
  const allDates = useMemo(() => {
    if (!activeClassInfo) return [];
    return getWeeklyDates(activeClassInfo.dayOfWeek, 12, 4);
  }, [activeClassInfo?.dayOfWeek]);

  const today = startOfDay(new Date());

  // Build attendance map
  const attendanceMap = useMemo(() => {
    const map = new Map<string, 'present' | 'absent'>();
    activeRecords.forEach(r => map.set(r.date, r.status as any));
    return map;
  }, [activeRecords]);

  // Calendar days
  const calendarDays = useMemo(() => {
    return allDates.map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const record = attendanceMap.get(key);
      const isPast = isBefore(d, today);
      return {
        date: d,
        status: record || (isPast ? 'present' : 'upcoming') as 'present' | 'absent' | 'upcoming',
      };
    });
  }, [allDates, attendanceMap, today]);

  // Split into upcoming and past
  const upcomingDates = allDates.filter(d => !isBefore(d, today)).slice(0, 4);
  const pastDates = allDates.filter(d => isBefore(d, today)).reverse();

  const handleMarkAbsent = (date: Date, reason?: string) => {
    if (activeClassInfo) {
      markAbsent(activeClassInfo.id, date, reason);
    }
  };

  const handleCalendarDayClick = (date: Date) => {
    // Could scroll to that class card or open mark-absent dialog
  };

  const displayLevel = demoMode ? 'Intermediate' : studentLevel;

  const getClassTime = () => {
    if (!activeClassInfo) return { time: '2:00 PM', duration: '1h 30m' };
    const start = new Date(activeClassInfo.startTime);
    const end = new Date(activeClassInfo.endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    return {
      time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: `${hours > 0 ? `${hours}h ` : ''}${mins}m`,
    };
  };

  const classTime = demoMode ? { time: '2:00 PM', duration: '1h 30m' } : getClassTime();
  const hasData = demoMode || (!isFirstTimeUser && !loading && activeClassInfo);

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        {/* Header */}
        <section className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Class Attendance</h1>
            {activeClassInfo && (
              <p className="text-muted-foreground mt-1">
                Your instructor: <span className="font-medium text-foreground">{activeClassInfo.instructorName}</span>
                {' · '}Every {DAY_NAMES[activeClassInfo.dayOfWeek]}
              </p>
            )}
          </div>
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
            className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        </section>

        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>
              Showing sample attendance data. Click "Live Data" to switch back.
            </AlertDescription>
          </Alert>
        )}

        {!hasData ? (
          isFirstTimeUser ? (
            <div className="space-y-6">
              <Alert className="bg-primary/10 border-primary/20">
                <BookOpen className="h-4 w-4 text-primary" />
                <AlertTitle>Welcome to Deckademics DJ School!</AlertTitle>
                <AlertDescription>
                  Complete your profile to start exploring your class schedule.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarRange className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No classes enrolled yet</h3>
                <p className="text-muted-foreground mt-2 mb-6">
                  Complete your profile to get started.
                </p>
                <Button asChild>
                  <Link to="/student/profile">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Complete Your Profile
                  </Link>
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading your classes...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarRange className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">No classes enrolled yet</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Contact your administrator to get enrolled in a class.
              </p>
            </div>
          )
        ) : (
          <>
            {/* Main layout: Calendar + Upcoming */}
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              {/* Calendar */}
              <AttendanceCalendar
                attendanceDays={calendarDays}
                onDayClick={handleCalendarDayClick}
              />

              {/* Upcoming Classes */}
              <div className="space-y-4">
                <Tabs defaultValue="upcoming">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming" className="flex gap-2">
                      <Calendar className="h-4 w-4" />
                      Upcoming ({upcomingDates.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Past ({pastDates.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming" className="space-y-3 mt-4">
                    {upcomingDates.length > 0 ? (
                      upcomingDates.map((date, i) => {
                        const key = format(date, 'yyyy-MM-dd');
                        const record = attendanceMap.get(key);
                        return (
                          <ClassAttendanceCard
                            key={key}
                            date={date}
                            title={displayLevel || 'Class'}
                            time={classTime.time}
                            duration={classTime.duration}
                            location={activeClassInfo!.location}
                            instructor={activeClassInfo!.instructorName}
                            isNext={i === 0}
                            status={record || 'upcoming'}
                            onMarkAbsent={!record ? handleMarkAbsent : undefined}
                            marking={marking}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No upcoming classes.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="past" className="space-y-3 mt-4">
                    {pastDates.length > 0 ? (
                      pastDates.map((date, i) => {
                        const key = format(date, 'yyyy-MM-dd');
                        const record = attendanceMap.get(key);
                        return (
                          <ClassAttendanceCard
                            key={key}
                            date={date}
                            title={displayLevel || 'Class'}
                            time={classTime.time}
                            duration={classTime.duration}
                            location={activeClassInfo!.location}
                            instructor={activeClassInfo!.instructorName}
                            status={record || 'present'}
                          />
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No past classes yet.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentClasses;
