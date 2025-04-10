
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/cards/StatsCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { Search, Calendar, CheckCircle, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProgressBar } from '@/components/progress/ProgressBar';

interface Student {
  id: string;
  name: string;
  progress: number;
  level: string;
  hasNotes: boolean;
}

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [todayClasses, setTodayClasses] = useState(0);
  const [averageProgress, setAverageProgress] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  
  // Get instructor name from auth provider
  const instructorName = userData.profile 
    ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim() 
    : 'Instructor';
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData.user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch instructor's assigned students (through classes)
        const { data: assignedClasses, error: classesError } = await supabase
          .from('classes')
          .select('id')
          .eq('instructor_id', userData.user.id);
          
        if (classesError) throw classesError;
        
        // If instructor has classes, fetch students enrolled in those classes
        if (assignedClasses && assignedClasses.length > 0) {
          const classIds = assignedClasses.map(c => c.id);
          
          // Get enrollments for the instructor's classes
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
              student_id,
              students!inner(
                id,
                level,
                notes,
                profiles!inner(first_name, last_name)
              )
            `)
            .in('class_id', classIds);
            
          if (enrollmentsError) throw enrollmentsError;
          
          // Get progress data for these students
          if (enrollmentsData && enrollmentsData.length > 0) {
            const studentIds = enrollmentsData.map(e => e.student_id);
            
            // Get student progress
            const { data: progressData, error: progressError } = await supabase
              .from('student_progress')
              .select('student_id, proficiency')
              .in('student_id', studentIds);
              
            if (progressError) throw progressError;
            
            // Process and format student data
            const formattedStudents = enrollmentsData.map(enrollment => {
              const student = enrollment.students;
              const studentProgress = progressData?.filter(p => p.student_id === student.id) || [];
              const averageStudentProgress = studentProgress.length > 0 
                ? Math.round(studentProgress.reduce((sum, p) => sum + (p.proficiency || 0), 0) / studentProgress.length)
                : 0;
                
              return {
                id: student.id,
                name: `${student.profiles.first_name || ''} ${student.profiles.last_name || ''}`.trim(),
                progress: averageStudentProgress,
                level: student.level || 'Beginner',
                hasNotes: !!student.notes
              };
            });
            
            // Remove duplicates (students enrolled in multiple classes)
            const uniqueStudents = formattedStudents.filter((student, index, self) => 
              index === self.findIndex(s => s.id === student.id)
            );
            
            setStudents(uniqueStudents);
            setTotalStudents(uniqueStudents.length);
            
            // Calculate average progress
            if (uniqueStudents.length > 0) {
              const totalProgress = uniqueStudents.reduce((sum, student) => sum + student.progress, 0);
              setAverageProgress(Math.round(totalProgress / uniqueStudents.length));
            }
          }
          
          // Count today's classes
          const today = new Date().toISOString().split('T')[0];
          const { count, error: todayClassesError } = await supabase
            .from('classes')
            .select('id', { count: 'exact', head: true })
            .eq('instructor_id', userData.user.id)
            .gte('start_time', `${today}T00:00:00`)
            .lte('start_time', `${today}T23:59:59`);
            
          if (todayClassesError) throw todayClassesError;
          setTodayClasses(count || 0);
        }
      } catch (error) {
        console.error('Error fetching instructor dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [userData.user?.id]);
  
  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.level.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome, {instructorName}</h1>
          <p className="text-muted-foreground">
            Your dashboard is ready for you to start managing your students and classes.
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
        ) : students.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Getting Started</AlertTitle>
            <AlertDescription>
              As a new instructor, you don't have any students or classes assigned yet. The admin will assign students to you soon.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard 
            title="Today's Classes"
            value={todayClasses.toString()}
            icon={<Calendar className="h-5 w-5" />}
            description={todayClasses === 0 ? "No classes scheduled today" : todayClasses === 1 ? "1 class today" : `${todayClasses} classes today`}
          />
          <StatsCard 
            title="Average Progress"
            value={`${averageProgress}%`}
            icon={<CheckCircle className="h-5 w-5" />}
            description={students.length === 0 ? "No student data available" : `Across ${students.length} students`}
          />
          <StatsCard 
            title="Total Students"
            value={totalStudents.toString()}
            icon={<Users className="h-5 w-5" />}
            description={totalStudents === 0 ? "No students assigned yet" : totalStudents === 1 ? "1 student assigned" : `${totalStudents} students assigned`}
          />
        </section>

        <section>
          <Card>
            <CardHeader className="flex-row justify-between items-center pb-4">
              <CardTitle>Today's Students</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={students.length === 0}
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
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Student</TableHead>
                      <TableHead className="w-[30%]">Progress</TableHead>
                      <TableHead className="w-[15%] text-center">Level</TableHead>
                      <TableHead className="w-[15%] text-center">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <TableRow 
                          key={student.id}
                          className="cursor-pointer hover:bg-muted/60"
                          onClick={() => navigate(`/instructor/students/${student.id}`)}
                        >
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ProgressBar 
                                value={student.progress} 
                                max={100} 
                              />
                              <span className="text-xs">{student.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{student.level}</TableCell>
                          <TableCell className="text-center">
                            {student.hasNotes ? (
                              <span className="h-2 w-2 rounded-full bg-green-500 inline-block"/>
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-gray-300 inline-block"/>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No students match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 p-3 font-medium border-b text-xs sm:text-sm">
                    <div className="col-span-3">STUDENT</div>
                    <div className="col-span-1">PROGRESS</div>
                    <div className="col-span-1 text-center">LEVEL</div>
                    <div className="col-span-1 text-center">NOTES</div>
                  </div>
                  
                  <div className="p-6 text-center text-muted-foreground">
                    No students assigned to you yet.
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <Button onClick={() => navigate('/instructor/students')}>
                  View All Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
