
import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isDataObject, hasProperty } from '@/utils/supabaseHelpers';

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
  profiles?: { first_name?: string; last_name?: string };
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
        
        // Fetch students directly assigned to this instructor
        const { data: assignedStudents, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            level,
            notes,
            profiles!inner(first_name, last_name)
          `)
          .eq('instructor_id', userData.user.id as any);
          
        if (studentsError) {
          console.error("Error fetching assigned students:", studentsError);
          throw studentsError;
        }
        
        console.log("Assigned students:", assignedStudents);
        
        if (assignedStudents && Array.isArray(assignedStudents) && assignedStudents.length > 0) {
          // Get progress data for these students
          const studentIds = assignedStudents
            .filter(student => 
              isDataObject(student) && 
              hasProperty(student, 'id')
            )
            .map(student => student.id as string)
            .filter(Boolean);
          
          if (studentIds.length > 0) {
            // Get student progress
            const { data: progressData, error: progressError } = await supabase
              .from('student_progress')
              .select('student_id, proficiency')
              .in('student_id', studentIds as any);
              
            if (progressError) {
              console.error("Error fetching student progress:", progressError);
              // Don't throw here, just log and continue without progress data
            }
            
            // Process and format student data
            const formattedStudents = assignedStudents
              .filter(student => 
                isDataObject(student) && 
                hasProperty(student, 'id') && 
                hasProperty(student, 'profiles')
              )
              .map(student => {
                const studentData = student as unknown as StudentData;
                const progress = progressData && Array.isArray(progressData) ? progressData : [];
                
                // Filter progress data for this student and get average
                const studentProgress = progress
                  .filter(p => 
                    isDataObject(p) && 
                    hasProperty(p, 'student_id') && 
                    hasProperty(p, 'proficiency') && 
                    p.student_id === student.id
                  );
                  
                const averageStudentProgress = studentProgress.length > 0 
                  ? Math.round(studentProgress.reduce((sum, p) => {
                      return sum + (isDataObject(p) && hasProperty(p, 'proficiency') ? 
                        (Number(p.proficiency) || 0) : 0);
                    }, 0) / studentProgress.length)
                  : 0;
                  
                // Get profile data
                const studentProfile = studentData?.profiles;
                const firstName = studentProfile?.first_name || '';
                const lastName = studentProfile?.last_name || '';
                
                return {
                  id: student.id as string,
                  name: `${firstName} ${lastName}`.trim() || 'Unknown Student',
                  progress: averageStudentProgress,
                  level: studentData?.level || 'Beginner',
                  hasNotes: !!studentData?.notes
                };
              })
              .filter(Boolean) as Student[];
            
            setStudents(formattedStudents);
            setTotalStudents(formattedStudents.length);
            
            // Calculate average progress
            if (formattedStudents.length > 0) {
              const totalProgress = formattedStudents.reduce((sum, student) => sum + student.progress, 0);
              setAverageProgress(Math.round(totalProgress / formattedStudents.length));
            }
          }
        } else {
          console.log("Instructor has no directly assigned students");
          setStudents([]);
          setTotalStudents(0);
          setAverageProgress(0);
        }
        
        // Count today's classes for this instructor
        const today = new Date().toISOString().split('T')[0];
        const { count, error: todayClassesError } = await supabase
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('instructor_id', userData.user.id as any)
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`);
          
        if (todayClassesError) {
          console.error("Error counting today's classes:", todayClassesError);
          // Don't throw here, just log and continue
        } else {
          setTodayClasses(count || 0);
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
