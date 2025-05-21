
import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Use refs to track states and prevent infinite loops
  const dataFetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const fetchAttemptRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Get userId from session safely
  const userId = session?.user?.id;

  // Log initial state
  useEffect(() => {
    console.log("StudentDashboardCore: Initializing", { 
      userId, 
      sessionExists: !!session,
      startTime: new Date(startTimeRef.current).toISOString()
    });
  }, []);

  const { upcomingClasses, loading: classesLoading } = useUpcomingClasses();
  const { progress: progressData, loading: progressLoading } = useStudentProgress(userId);

  const fetchStudentInfo = useCallback(async () => {
    // Exit early if user ID is missing, component unmounted, or if we've tried too many times
    if (!userId || !isMountedRef.current || fetchAttemptRef.current > 3) {
      console.log("StudentDashboardCore: Early exit from fetchStudentInfo", {
        userId: !!userId,
        isMounted: isMountedRef.current,
        attempts: fetchAttemptRef.current
      });
      return;
    }
    
    // Increment the fetch attempt counter to prevent infinite loops
    fetchAttemptRef.current += 1;
    
    console.log(`StudentDashboardCore: Fetching student info (attempt ${fetchAttemptRef.current}) for userId:`, userId);
    
    try {
      setLoading(true);
      setFetchError(null);
      
      // First check if student record exists
      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select('level, enrollment_status, notes')
        .eq('id', userId as any)
        .maybeSingle();

      if (studentError) {
        console.error('StudentDashboardCore: Error fetching student info:', studentError);
        setFetchError(studentError.message);
        
        // If student record doesn't exist, create one
        if (studentError.code === 'PGRST116') {
          try {
            console.log('StudentDashboardCore: Creating student record for new user:', userId);
            const { error: insertError } = await supabase
              .from('students')
              .insert({
                id: userId
              } as any);
              
            if (insertError) {
              console.error('StudentDashboardCore: Error creating student record:', insertError.message);
              setFetchError(`Failed to create student record: ${insertError.message}`);
            } else {
              // Successful creation, use default values
              if (isMountedRef.current) {
                setStudentData(prev => ({
                  ...prev,
                  level: 'Beginner'
                }));
                console.log('StudentDashboardCore: Successfully created student record');
              }
            }
          } catch (insertError) {
            console.error('StudentDashboardCore: Exception creating student record:', insertError);
          }
        }
      } else if (studentInfo && typeof studentInfo === 'object' && isMountedRef.current) {
        console.log('StudentDashboardCore: Retrieved student info:', studentInfo);
        setStudentData(prev => ({
          ...prev,
          level: studentInfo.level || 'Beginner'
        }));
      }

      // Determine first-time user status
      const isFirstLogin = upcomingClasses.length === 0 && 
        (!progressData || progressData.length === 0);
      
      if (isMountedRef.current) {
        setIsFirstTimeUser(isFirstLogin);
        console.log('StudentDashboardCore: First time user status:', isFirstLogin);

        // Only update next class if there are upcoming classes
        if (upcomingClasses.length > 0) {
          setStudentData(prev => ({
            ...prev,
            nextClass: `${upcomingClasses[0].date} at ${upcomingClasses[0].time}`,
            instructor: upcomingClasses[0].instructor
          }));
          console.log('StudentDashboardCore: Updated next class info with:', upcomingClasses[0]);
        }
        
        // Calculate progress if data is available
        if (progressData && Array.isArray(progressData) && progressData.length > 0) {
          const totalProficiency = progressData.reduce((sum: number, item: any) =>
            sum + (('proficiency' in item && typeof item.proficiency === 'number') ? item.proficiency : 0)
          , 0);
          const avgProgress = Math.round(totalProficiency / progressData.length);
          setStudentData(prev => ({
            ...prev,
            totalProgress: avgProgress
          }));
          console.log('StudentDashboardCore: Calculated progress:', avgProgress);
        } else {
          console.log('StudentDashboardCore: No progress data available');
        }
        
        // Mark data as fetched to prevent duplicate fetches
        dataFetchedRef.current = true;
      }
      
    } catch (e: any) {
      console.error('StudentDashboardCore: Error in fetchStudentInfo:', e);
      if (isMountedRef.current) {
        setFetchError(e.message || 'An unknown error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        console.log('StudentDashboardCore: Completed fetchStudentInfo');
      }
    }
  }, [userId, upcomingClasses, progressData]); // Remove classesLoading and progressLoading to prevent loops

  // Use a ref to track if this is the first render
  const isInitialRender = useRef(true);

  useEffect(() => {
    // Log data dependencies
    console.log("StudentDashboardCore: Data dependencies updated", {
      upcomingClassesCount: upcomingClasses.length,
      progressDataAvailable: !!progressData,
      classesLoading,
      progressLoading
    });
    
    // Skip data fetching on first render to allow all hooks to initialize
    if (isInitialRender.current) {
      isInitialRender.current = false;
      console.log("StudentDashboardCore: Skipping first render fetch");
      return;
    }
    
    // Only fetch data if we have necessary information and haven't fetched yet
    if (userId && !dataFetchedRef.current && !classesLoading && !progressLoading) {
      console.log("StudentDashboardCore: All dependencies ready, triggering fetch");
      fetchStudentInfo();
    } else if (!userId) {
      console.log("StudentDashboardCore: No userId available, setting loading to false");
      setLoading(false);
    }
  }, [userId, classesLoading, progressLoading, fetchStudentInfo, upcomingClasses, progressData]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log("StudentDashboardCore: Component unmounting");
      isMountedRef.current = false;
      
      // Log performance metrics
      const elapsedTime = Date.now() - startTimeRef.current;
      console.log(`StudentDashboardCore: Lifetime ${elapsedTime}ms, fetch attempts: ${fetchAttemptRef.current}`);
    };
  }, []);

  return {
    userId,
    loading: loading || classesLoading || progressLoading,
    studentData,
    isFirstTimeUser,
    progressData,
    upcomingClasses,
    fetchStudentInfo,
    fetchError
  };
}
