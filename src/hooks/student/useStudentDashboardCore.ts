
import { useState, useCallback, useEffect } from 'react';
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
  const { userData, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData>({
    level: 'Beginner',
    totalProgress: 0,
    currentModule: 'Not started',
    moduleProgress: 0,
    hoursCompleted: 0,
    instructor: 'Not assigned',
    nextClass: 'Not scheduled',
  });
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const userId = session?.user?.id;

  const { upcomingClasses, loading: classesLoading } = useUpcomingClasses();
  const { progress: progressData, loading: progressLoading } = useStudentProgress(userId);

  const fetchStudentInfo = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select('level, enrollment_status, notes')
        .eq('id', userId)
        .maybeSingle();

      if (studentInfo && typeof studentInfo === 'object') {
        setStudentData(prev => ({
          ...prev,
          level: studentInfo.level || 'Beginner'
        }));
      }

      const isFirstLogin = (!upcomingClasses || upcomingClasses.length === 0) &&
        (!progressData || !Array.isArray(progressData) || progressData.length === 0);
      setIsFirstTimeUser(isFirstLogin);

      if (upcomingClasses.length > 0) {
        setStudentData(prev => ({
          ...prev,
          nextClass: `${upcomingClasses[0].date} at ${upcomingClasses[0].time}`,
          instructor: upcomingClasses[0].instructor
        }));
      }
      if (progressData && Array.isArray(progressData) && progressData.length > 0) {
        const totalProficiency = progressData.reduce((sum: number, item: any) =>
          sum + (('proficiency' in item && typeof item.proficiency === 'number') ? item.proficiency : 0)
        , 0);
        const avgProgress = Math.round(totalProficiency / progressData.length);
        setStudentData(prev => ({
          ...prev,
          totalProgress: avgProgress
        }));
      }
    } catch (e) {
      console.error('Error fetching student info:', e);
    } finally {
      setLoading(false);
    }
  }, [userId, upcomingClasses.length, progressData.length]);

  useEffect(() => {
    fetchStudentInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    userId,
    loading: loading || classesLoading || progressLoading,
    studentData,
    isFirstTimeUser,
    progressData,
    upcomingClasses,
    fetchStudentInfo,
  };
}
