
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

interface StudentData {
  id: string;
  level?: string;
  notes?: string;
  profiles?: { first_name?: string; last_name?: string }[];
}

interface InstructorDashboardData {
  students: Student[];
  todayClasses: number;
  averageProgress: number;
  totalStudents: number;
  loading: boolean;
  fetchError: string | null;
}

// Type guard to check if an object has a specific property
function hasProperty<T, K extends string>(obj: T, prop: K): obj is T & { [key in K]: unknown } {
  return obj !== null && typeof obj === 'object' && prop in obj;
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
          const classIds = assignedClasses
            .filter(c => c && hasProperty(c, 'id'))
            .map(c => c.id)
            .filter(Boolean);
          
          if (classIds.length === 0) {
            setStudents([]);
            setLoading(false);
            return;
          }
          
          // Get enrollments for the instructor's classes
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
              student_id,
              students:student_id(
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
          if (enrollmentsData && Array.isArray(enrollmentsData) && enrollmentsData.length > 0) {
            // Add null check for enrollmentsData
            const studentIds = enrollmentsData
              .filter(enrollment => 
                enrollment && 
                hasProperty(enrollment, 'student_id') && 
                enrollment.student_id
              )
              .map(e => e.student_id)
              .filter(Boolean);
            
            if (studentIds.length === 0) {
              setStudents([]);
              setLoading(false);
              return;
            }
            
            // Get student progress
            const { data: progressData, error: progressError } = await supabase
              .from('student_progress')
              .select('student_id, proficiency')
              .in('student_id', studentIds);
              
            if (progressError) {
              console.error("Error fetching student progress:", progressError);
              throw progressError;
            }
            
            // Process and format student data with null safety
            const formattedStudents = enrollmentsData
              .filter(enrollment => 
                enrollment && 
                hasProperty(enrollment, 'student_id') && 
                hasProperty(enrollment, 'students') &&
                enrollment.student_id && 
                enrollment.students
              )
              .map(enrollment => {
                if (!enrollment || !hasProperty(enrollment, 'students')) return null;
                
                // Each enrollment has a 'students' property with nested data
                const student = enrollment.students as unknown as StudentData;
                const progress = progressData || [];
                
                // Filter progress data for this student and get average with null safety
                const studentProgress = progress
                  .filter(p => p && hasProperty(p, 'student_id') && hasProperty(p, 'proficiency') && p.student_id === enrollment.student_id) || [];
                  
                const averageStudentProgress = studentProgress.length > 0 
                  ? Math.round(studentProgress.reduce((sum, p) => sum + (hasProperty(p, 'proficiency') ? Number(p.proficiency) || 0 : 0), 0) / studentProgress.length)
                  : 0;
                  
                // Get the first element's profile data with null safety
                const studentProfile = student?.profiles?.[0];
                const firstName = studentProfile?.first_name || '';
                const lastName = studentProfile?.last_name || '';
                
                return {
                  id: enrollment.student_id,
                  name: `${firstName} ${lastName}`.trim() || 'Unknown Student',
                  progress: averageStudentProgress,
                  level: student?.level || 'Beginner',
                  hasNotes: !!student?.notes
                };
              })
              .filter(Boolean) as Student[]; // Filter out any null results
            
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
