
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

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
}

const InstructorClasses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  
  const instructorId = session?.user?.id;

  useEffect(() => {
    const fetchClasses = async () => {
      if (!instructorId) return;
      
      try {
        setLoading(true);
        console.log("Fetching classes for instructor:", instructorId);
        
        // Get all classes for this instructor
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            title,
            start_time,
            end_time,
            location
          `)
          .eq('instructor_id', instructorId)
          .order('start_time', { ascending: true });
          
        if (classesError) {
          console.error("Error fetching classes:", classesError);
          return;
        }
        
        console.log("Classes fetched:", classesData?.length || 0);
        
        // If we have classes, fetch enrollments to get students
        if (!classesData || classesData.length === 0) {
          setClasses([]);
          return;
        }
        
        // Get class IDs
        const classIds = classesData.map(cls => cls.id);
        
        // Fetch enrollments for these classes
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            student_id,
            class_id
          `)
          .in('class_id', classIds);
          
        if (enrollmentsError) {
          console.error("Error fetching enrollments:", enrollmentsError);
          return;
        }
        
        console.log("Enrollments fetched:", enrollmentsData?.length || 0);
        
        // Get student IDs
        const studentIds = enrollmentsData?.map(e => e.student_id) || [];
        
        if (studentIds.length === 0) {
          // Format classes without students
          const formattedClasses = classesData.map(cls => {
            const startTime = new Date(cls.start_time);
            const endTime = new Date(cls.end_time);
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationMinutes = Math.floor(durationMs / (1000 * 60));
            
            return {
              id: cls.id,
              week: `Week ${Math.floor(Math.random() * 12) + 1}`, // Placeholder
              title: cls.title,
              date: startTime.toLocaleDateString(),
              time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: `${durationMinutes} min`,
              room: cls.location || 'Main Studio',
              student: { id: 'none', name: 'No students enrolled', initials: 'NS' }
            };
          });
          
          setClasses(formattedClasses);
          return;
        }
        
        // Fetch student profiles
        const { data: studentProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name
          `)
          .in('id', studentIds);
          
        if (profilesError) {
          console.error("Error fetching student profiles:", profilesError);
          return;
        }
        
        console.log("Student profiles fetched:", studentProfiles?.length || 0);
        
        // Create student map
        const studentMap = new Map();
        studentProfiles?.forEach(profile => {
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          let initials = '';
          if (profile.first_name) initials += profile.first_name[0];
          if (profile.last_name) initials += profile.last_name[0];
          
          studentMap.set(profile.id, {
            id: profile.id,
            name: fullName || 'Unknown Student',
            initials: initials || 'US'
          });
        });
        
        // Create class-student mapping
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
        
        // Format final class data with students
        const formattedClasses: ClassSession[] = [];
        
        classesData.forEach(cls => {
          const startTime = new Date(cls.start_time);
          const endTime = new Date(cls.end_time);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationMinutes = Math.floor(durationMs / (1000 * 60));
          
          // Get week number (random for now, replace with actual logic)
          const weekNumber = Math.floor(Math.random() * 12) + 1;
          
          const students = classStudentMap.get(cls.id) || [];
          
          if (students.length === 0) {
            formattedClasses.push({
              id: cls.id,
              week: `Week ${weekNumber}`,
              title: cls.title,
              date: startTime.toLocaleDateString(),
              time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: `${durationMinutes} min`,
              room: cls.location || 'Main Studio',
              student: { id: 'none', name: 'No students enrolled', initials: 'NS' }
            });
          } else {
            // Create a class entry for each student
            students.forEach(student => {
              formattedClasses.push({
                id: `${cls.id}-${student.id}`,
                week: `Week ${weekNumber}`,
                title: cls.title,
                date: startTime.toLocaleDateString(),
                time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: `${durationMinutes} min`,
                room: cls.location || 'Main Studio',
                student
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
  }, [instructorId]);

  // Filter classes based on search and filter
  const filterClasses = (classes: ClassSession[]) => {
    return classes.filter(cls => 
      cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.week.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.student.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(cls => {
      if (filter === 'all') return true;
      return cls.week === filter;
    });
  };

  const filteredClasses = filterClasses(classes);
  
  // Get unique week options
  const weekOptions = [...new Set(classes.map(cls => cls.week))];

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <TooltipProvider>
        <div className="space-y-6">
          <section>
            <h1 className="text-2xl font-bold">Class Schedule</h1>
            <p className="text-muted-foreground mt-2">
              Manage your upcoming DJ classes
            </p>
          </section>

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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-0"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear Search</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Weeks</SelectItem>
                  {weekOptions.map((week) => (
                    <SelectItem key={week} value={week}>{week}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading classes...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Class Room</TableHead>
                      <TableHead>Class Week</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.length > 0 ? (
                      filteredClasses.map((cls) => (
                        <TableRow key={cls.id} className="py-4">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-muted">
                                  {cls.student.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{cls.student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">{cls.date}</TableCell>
                          <TableCell className="py-4">{cls.time} ({cls.duration})</TableCell>
                          <TableCell className="py-4">{cls.room}</TableCell>
                          <TableCell className="py-4">{cls.week}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          {classes.length === 0 ? "No classes found. Schedule a class to get started." : "No scheduled classes match your search criteria."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default InstructorClasses;
