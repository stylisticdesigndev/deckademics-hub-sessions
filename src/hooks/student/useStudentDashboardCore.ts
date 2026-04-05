import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useUpcomingClasses } from './dashboard/useUpcomingClasses';
import { useStudentProgress } from './dashboard/useStudentProgress';
import { supabase } from '@/integrations/supabase/client';

export interface StudentData {
  level: string;
  totalProgress: number;
  currentModule: string;
  moduleProgress: number;
  hoursCompleted: number;
  instructor: string;
  nextClass: string;
}

export function useStudentDashboardCore() {
  const { session } = useAuth();
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentLevel, setStudentLevel] = useState('Novice');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [assignedInstructor, setAssignedInstructor] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const dataFetchedRef = useRef(false);

  const userId = session?.user?.id;

  const { upcomingClasses, loading: classesLoading } = useUpcomingClasses();
  const { progress: progressData, loading: progressLoading } = useStudentProgress(userId);

  // Reset refs on mount (fixes React StrictMode double-mount)
  useEffect(() => {
    isMountedRef.current = true;
    dataFetchedRef.current = false;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch student record independently - no waiting for classes/progress
  const fetchStudentInfo = useCallback(async () => {
    if (!userId || !isMountedRef.current) return;

    try {
      setStudentLoading(true);
      setFetchError(null);

      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select('level, enrollment_status, notes, instructor_id')
        .eq('id', userId as any)
        .maybeSingle();

      if (!isMountedRef.current) return;

      if (studentError) {
        if (studentError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('students')
            .insert({ id: userId } as any);

          if (insertError && isMountedRef.current) {
            setFetchError(`Failed to create student record: ${insertError.message}`);
          }
        } else {
          setFetchError(studentError.message);
        }
      } else if (studentInfo && typeof studentInfo === 'object') {
        setStudentLevel(studentInfo.level || 'Novice');
        
        // Fetch assigned instructor name
        if (studentInfo.instructor_id) {
          const { data: instructorProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', studentInfo.instructor_id)
            .single();
          
          if (isMountedRef.current && instructorProfile) {
            setAssignedInstructor(
              `${instructorProfile.first_name || ''} ${instructorProfile.last_name || ''}`.trim() || null
            );
          }
        }
      }

      dataFetchedRef.current = true;
    } catch (e: any) {
      if (isMountedRef.current) {
        setFetchError(e.message || 'An unknown error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setStudentLoading(false);
      }
    }
  }, [userId]);

  // Fetch immediately when userId is available
  useEffect(() => {
    if (userId && !dataFetchedRef.current) {
      fetchStudentInfo();
    } else if (!userId) {
      setStudentLoading(false);
    }
  }, [userId, fetchStudentInfo]);

  // Derive totalProgress reactively from progressData
  const totalProgress = useMemo(() => {
    if (!progressData || !Array.isArray(progressData) || progressData.length === 0) return 0;
    const total = progressData.reduce((sum: number, item: any) =>
      sum + (typeof item.proficiency === 'number' ? item.proficiency : 0), 0);
    return Math.round(total / progressData.length);
  }, [progressData]);

  // Derive nextClass and instructor reactively from upcomingClasses
  const nextClassInfo = useMemo(() => {
    if (upcomingClasses.length > 0) {
      return {
        nextClass: `${upcomingClasses[0].date} at ${upcomingClasses[0].time}`,
        instructor: assignedInstructor || upcomingClasses[0].instructor
      };
    }
    return { nextClass: 'Not scheduled', instructor: assignedInstructor || 'Not assigned' };
  }, [upcomingClasses, assignedInstructor]);

  // Derive first-time user status
  useEffect(() => {
    if (!classesLoading && !progressLoading && dataFetchedRef.current) {
      setIsFirstTimeUser(upcomingClasses.length === 0 && (!progressData || progressData.length === 0));
    }
  }, [classesLoading, progressLoading, upcomingClasses, progressData]);

  const studentData: StudentData = useMemo(() => ({
    level: studentLevel,
    totalProgress,
    currentModule: 'Not started',
    moduleProgress: 0,
    hoursCompleted: 0,
    instructor: nextClassInfo.instructor,
    nextClass: nextClassInfo.nextClass,
  }), [studentLevel, totalProgress, nextClassInfo]);

  return {
    userId,
    loading: studentLoading || classesLoading || progressLoading,
    studentData,
    isFirstTimeUser,
    progressData,
    upcomingClasses,
    fetchStudentInfo,
    fetchError
  };
}
