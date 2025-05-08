
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  progress: number;
  level: string;
  hasNotes: boolean;
}

interface InstructorDashboardData {
  students: Student[];
  todayClasses: number;
  averageProgress: number;
  totalStudents: number;
  loading: boolean;
  fetchError: string | null;
}

export const useInstructorDashboard = (): InstructorDashboardData => {
  const { userData } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [todayClasses, setTodayClasses] = useState(0);
  const [averageProgress, setAverageProgress] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userData.user?.id) return;

      try {
        setLoading(true);
        setFetchError(null);
        
        console.log("Fetching dashboard data for instructor:", userData.user.id);
        
        // Fetch instructor's assigned classes
        const { data: assignedClasses, error: classesError } = await supabase
          .from('classes')
          .select('id')
          .eq('instructor_id', userData.user.id);
          
        if (classesError) {
          console.error("Error fetching assigned classes:", classesError);
          throw classesError;
        }
        
        console.log("Assigned classes:", assignedClasses);
        
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
            
          if (enrollmentsError) {
            console.error("Error fetching enrollments:", enrollmentsError);
            throw enrollmentsError;
          }
          
          console.log("Enrollments data:", enrollmentsData);
          
          // Get progress data for these students
          if (enrollmentsData && enrollmentsData.length > 0) {
            const studentIds = enrollmentsData.map(e => e.student_id);
            
            // Get student progress
            const { data: progressData, error: progressError } = await supabase
              .from('student_progress')
              .select('student_id, proficiency')
              .in('student_id', studentIds);
              
            if (progressError) {
              console.error("Error fetching student progress:", progressError);
              throw progressError;
            }
            
            // Process and format student data
            const formattedStudents = enrollmentsData.map(enrollment => {
              // Each enrollment has a 'students' property with nested data
              const student = enrollment.students;
              const studentProgress = progressData?.filter(p => p.student_id === enrollment.student_id) || [];
              const averageStudentProgress = studentProgress.length > 0 
                ? Math.round(studentProgress.reduce((sum, p) => sum + (p.proficiency || 0), 0) / studentProgress.length)
                : 0;
                
              // Access the first element of the profiles array for first_name and last_name
              const firstName = student?.profiles?.[0]?.first_name || '';
              const lastName = student?.profiles?.[0]?.last_name || '';
              
              return {
                id: enrollment.student_id,
                name: `${firstName} ${lastName}`.trim(),
                progress: averageStudentProgress,
                level: student?.level || 'Beginner',
                hasNotes: !!student?.notes
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
            
          if (todayClassesError) {
            console.error("Error counting today's classes:", todayClassesError);
            throw todayClassesError;
          }
          
          setTodayClasses(count || 0);
        } else {
          console.log("Instructor has no assigned classes yet");
        }
      } catch (error: any) {
        console.error('Error fetching instructor dashboard data:', error);
        setFetchError(error.message || 'Failed to load dashboard data');
        toast({
          title: 'Error fetching data',
          description: error.message || 'An error occurred while fetching dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userData.user?.id) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [userData.user?.id, toast]);

  return {
    students,
    todayClasses,
    averageProgress,
    totalStudents,
    loading,
    fetchError
  };
};
