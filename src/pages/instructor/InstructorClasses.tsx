
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Eye, EyeOff, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDateUS } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { mockInstructorClasses } from '@/data/mockInstructorData';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, parse } from 'date-fns';

interface Student {
  id: string;
  name: string;
  initials: string;
}

interface ClassSession {
  id: string;
  week: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  student: Student;
  _rawDate?: Date;
}

type ViewMode = 'day' | 'week' | 'month';

const parseClassDate = (dateStr: string): Date => {
  // Try parsing as a locale date string or ISO
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  // Fallback: try common US format
  try {
    return parse(dateStr, 'M/d/yyyy', new Date());
  } catch {
    return new Date();
  }
};

const getDateRange = (mode: ViewMode): { start: Date; end: Date } => {
  const now = new Date();
  switch (mode) {
    case 'day':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

const InstructorClasses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const { session } = useAuth();
  
  const instructorId = session?.user?.id;

  useEffect(() => {
    if (demoMode) return;

    const fetchClasses = async () => {
      if (!instructorId) return;
      
      try {
        setLoading(true);
        
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id, title, start_time, end_time, location')
          .eq('instructor_id', instructorId)
          .order('start_time', { ascending: true });
          
        if (classesError) {
          console.error("Error fetching classes:", classesError);
          return;
        }
        
        if (!classesData || classesData.length === 0) {
          setClasses([]);
          return;
        }
        
        const classIds = classesData.map(cls => cls.id);
        
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('student_id, class_id')
          .in('class_id', classIds);
          
        if (enrollmentsError) {
          console.error("Error fetching enrollments:", enrollmentsError);
          return;
        }
        
        const studentIds = enrollmentsData?.map(e => e.student_id) || [];
        
        let studentMap = new Map();
        if (studentIds.length > 0) {
          const { data: studentProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', studentIds);
            
          studentProfiles?.forEach(profile => {
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            let initials = '';
            if (profile.first_name) initials += profile.first_name[0];
            if (profile.last_name) initials += profile.last_name[0];
            studentMap.set(profile.id, { id: profile.id, name: fullName || 'Unknown Student', initials: initials || 'US' });
          });
        }
        
        const classStudentMap = new Map();
        enrollmentsData?.forEach(enrollment => {
          if (!classStudentMap.has(enrollment.class_id)) {
            classStudentMap.set(enrollment.class_id, []);
          }
          const studentInfo = studentMap.get(enrollment.student_id);
          if (studentInfo) {
            classStudentMap.get(enrollment.class_id).push(studentInfo);
          }
        });
        
        const formattedClasses: ClassSession[] = [];
        classesData.forEach(cls => {
          const startTime = new Date(cls.start_time);
          const endTime = new Date(cls.end_time);
          const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          const weekNumber = Math.floor(Math.random() * 12) + 1;
          const students = classStudentMap.get(cls.id) || [];
          
          if (students.length === 0) {
            formattedClasses.push({
              id: cls.id, week: `Week ${weekNumber}`, title: cls.title,
              date: formatDateUS(startTime),
              time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: `${durationMinutes} min`, room: cls.location || 'Main Studio',
              student: { id: 'none', name: 'No students enrolled', initials: 'NS' },
              _rawDate: startTime
            });
          } else {
            students.forEach((student: Student) => {
              formattedClasses.push({
                id: `${cls.id}-${student.id}`, week: `Week ${weekNumber}`, title: cls.title,
                date: formatDateUS(startTime),
                time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: `${durationMinutes} min`, room: cls.location || 'Main Studio', student,
                _rawDate: startTime
              });
            });
          }
        });
        
        setClasses(formattedClasses);
      } catch (error) {
        console.error("Error in fetchClasses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [instructorId, demoMode]);

  const activeClasses = demoMode ? mockInstructorClasses : classes;
  const isLoading = !demoMode && loading;

  const { start, end } = getDateRange(viewMode);

  const filteredClasses = activeClasses.filter(cls => {
    const classDate = (cls as ClassSession)._rawDate || parseClassDate(cls.date);
    return isWithinInterval(classDate, { start, end });
  }).filter(cls =>
    cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.week.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewLabel = viewMode === 'day' ? "Today's" : viewMode === 'week' ? "This Week's" : "This Month's";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>Showing sample class data. Click "Live Data" to switch back.</AlertDescription>
          </Alert>
        )}

        <section className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Class Schedule</h1>
            <p className="text-muted-foreground mt-2">Manage your upcoming DJ classes</p>
          </div>
          <Button
            variant={demoMode ? "default" : "outline"} size="sm"
            onClick={() => setDemoMode(!demoMode)} className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search classes..." className="pl-10 pr-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-0" onClick={() => setSearchTerm('')}>
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Clear Search</p></TooltipContent>
              </Tooltip>
            )}
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(val) => { if (val) setViewMode(val as ViewMode); }}
            className="border rounded-md"
          >
            <ToggleGroupItem value="day" aria-label="Day view" className="px-3 gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Day</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="week" aria-label="Week view" className="px-3 gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Week</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="month" aria-label="Month view" className="px-3 gap-1.5">
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Month</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <Card>
          <CardHeader><CardTitle>{viewLabel} Classes</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="hidden sm:table-cell">Class Room</TableHead>
                      <TableHead className="hidden md:table-cell">Class Week</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.length > 0 ? (
                      filteredClasses.map((cls) => (
                        <TableRow key={cls.id} className="py-4">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-muted">{cls.student.initials}</AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[120px] sm:max-w-none">{cls.student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">{cls.date}</TableCell>
                          <TableCell className="py-4">{cls.time} ({cls.duration})</TableCell>
                          <TableCell className="py-4 hidden sm:table-cell">{cls.room}</TableCell>
                          <TableCell className="py-4 hidden md:table-cell">{cls.week}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          {activeClasses.length === 0 ? "No classes found. Schedule a class to get started." : `No classes found for this ${viewMode}.`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default InstructorClasses;
