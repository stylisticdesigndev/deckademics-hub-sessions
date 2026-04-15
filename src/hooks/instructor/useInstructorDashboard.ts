/**
 * useInstructorDashboard — Fetches all dashboard data for an instructor.
 *
 * Data flow:
 * 1. Resolves `instructorId` from AuthProvider (only when role === 'instructor').
 * 2. Queries `students` table (with inner join to `profiles`) for assigned students.
 * 3. Fetches `student_progress` for those students and cross-references against
 *    admin-defined `progress_skills` to compute per-student average proficiency.
 * 4. Counts today's classes from the `classes` table.
 * 5. Returns formatted student list, stats, and loading/error state.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  avatar?: string;
  initials: string;
  classTime?: string;
}

interface StudentData {
  id: string;
  level?: string;
  notes?: string;
  class_time?: string;
  profiles?: { first_name?: string; last_name?: string; avatar_url?: string };
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
  
  // Use ref to track if request is in progress to prevent multiple simultaneous requests
  const requestInProgress = useRef(false);
  
  // Only resolve instructor ID once role is confirmed to prevent flicker
  const instructorId = useMemo(() => {
    if (userData?.role !== 'instructor') return null;
    return userData?.user?.id || userData?.profile?.id;
  }, [userData?.role, userData?.user?.id, userData?.profile?.id]);
  
  const fetchDashboardData = useCallback(async () => {
    if (!instructorId || requestInProgress.current) {
      return;
    }

    try {
      requestInProgress.current = true;
      setLoading(true);
      setFetchError(null);
      
      if (import.meta.env.DEV) console.log("Fetching dashboard data for instructor:", instructorId);
      
      // Determine today's day name for filtering
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayName = dayNames[new Date().getDay()];

      // Fetch only students whose class_day matches today
      const { data: assignedStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          level,
          notes,
          class_day,
          class_time,
          profiles!inner(first_name, last_name, avatar_url)
        `)
        .eq('instructor_id', instructorId)
        .eq('class_day', todayDayName);
        
      if (studentsError) {
        console.error("Error fetching assigned students:", studentsError);
        throw studentsError;
      }
      
      if (import.meta.env.DEV) console.log("Assigned students raw data:", assignedStudents);
      
      if (assignedStudents && Array.isArray(assignedStudents) && assignedStudents.length > 0) {
        // Get progress data for these students
        const studentIds = assignedStudents
          .filter(student => 
            isDataObject(student) && 
            hasProperty(student, 'id')
          )
          .map(student => student.id as string)
          .filter(Boolean);
        
        if (import.meta.env.DEV) console.log("Student IDs to fetch progress for:", studentIds);
        
        let progressData: any[] = [];
        if (studentIds.length > 0) {
          const { data: progress, error: progressError } = await supabase
            .from('student_progress')
            .select('student_id, skill_name, proficiency')
            .in('student_id', studentIds);
            
          if (progressError) {
            console.error("Error fetching student progress:", progressError);
          } else {
            progressData = progress || [];
          }
        }
        
        // Fetch admin-defined progress skills
        const { data: allProgressSkills } = await supabase
          .from('progress_skills' as any)
          .select('name, level');
        
        const skillsByLevel = new Map<string, string[]>();
        (allProgressSkills || []).forEach((s: any) => {
          const existing = skillsByLevel.get(s.level) || [];
          existing.push(s.name);
          skillsByLevel.set(s.level, existing);
        });
        
        if (import.meta.env.DEV) console.log("Progress data:", progressData);
        
        // Process and format student data
        const formattedStudents = assignedStudents
          .filter(student => 
            isDataObject(student) && 
            hasProperty(student, 'id') && 
            hasProperty(student, 'profiles')
          )
          .map(student => {
            const studentData = student as unknown as StudentData;
            const studentLevel = (studentData?.level || 'novice').toLowerCase();
            const adminSkills = skillsByLevel.get(studentLevel) || [];
            const adminSkillSet = new Set(adminSkills);
            
            // Build a map of proficiency for admin-defined skills only
            const proficiencyMap = new Map<string, number>();
            progressData
              .filter(p => 
                isDataObject(p) && 
                hasProperty(p, 'student_id') && 
                p.student_id === student.id &&
                hasProperty(p, 'skill_name') &&
                adminSkillSet.has(p.skill_name as string)
              )
              .forEach(p => {
                proficiencyMap.set(p.skill_name as string, Number(p.proficiency) || 0);
              });
            
            // Average across ALL admin skills (missing = 0%)
            const averageStudentProgress = adminSkills.length > 0
              ? Math.round(adminSkills.reduce((sum, skillName) => sum + (proficiencyMap.get(skillName) || 0), 0) / adminSkills.length)
              : 0;
              
            const studentProfile = studentData?.profiles;
            const firstName = studentProfile?.first_name || '';
            const lastName = studentProfile?.last_name || '';
            
            return {
              id: student.id as string,
              name: `${firstName} ${lastName}`.trim() || 'Unknown Student',
              progress: averageStudentProgress,
              level: studentData?.level || 'Novice',
              hasNotes: !!studentData?.notes,
              avatar: studentProfile?.avatar_url || undefined,
              initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
              classTime: (student as any).class_time || undefined,
            };
          })
          .filter(Boolean) as Student[];

        // Sort by class time
        const timeOrder = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];
        formattedStudents.sort((a, b) => {
          const aIdx = timeOrder.indexOf(a.classTime || '');
          const bIdx = timeOrder.indexOf(b.classTime || '');
          return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });
        
        if (import.meta.env.DEV) console.log("Formatted students:", formattedStudents);
        
        setStudents(formattedStudents);
        
        if (formattedStudents.length > 0) {
          const totalProgress = formattedStudents.reduce((sum, student) => sum + student.progress, 0);
          setAverageProgress(Math.round(totalProgress / formattedStudents.length));
        } else {
          setAverageProgress(0);
        }
      } else {
        if (import.meta.env.DEV) console.log("No students scheduled for today");
        setStudents([]);
        setAverageProgress(0);
      }

      // Fetch total student count (all days) separately for the stats card
      const { count: allStudentCount, error: countError } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', instructorId);

      if (countError) {
        console.error("Error counting total students:", countError);
      }
      setTotalStudents(allStudentCount || 0);
      
      // Count today's classes for this instructor
      const today = new Date().toISOString().split('T')[0];
      const { count, error: todayClassesError } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`);
        
      if (todayClassesError) {
        console.error("Error counting today's classes:", todayClassesError);
        // Don't throw here, just log and continue
      } else {
        setTodayClasses(count || 0);
        if (import.meta.env.DEV) console.log("Today's classes count:", count);
      }
      
    } catch (error: any) {
      console.error('Error fetching instructor dashboard data:', error);
      setFetchError('Failed to load dashboard data');
      setTimeout(() => {
        toast({
          title: 'Error fetching data',
          description: 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }, 0);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [instructorId]); // Only depend on instructorId, not toast
  
  useEffect(() => {
    if (instructorId) {
      fetchDashboardData();
    } else if (userData?.role === 'instructor') {
      // Role is confirmed but no instructor record — stop loading
      setLoading(false);
    }
    
    // Cleanup function to cancel any pending requests
    return () => {
      requestInProgress.current = false;
    };
  }, [fetchDashboardData]);

  return {
    students,
    todayClasses,
    averageProgress,
    totalStudents,
    loading,
    fetchError
  };
};
