
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

  // Get userId from session safely
  const userId = session?.user?.id;

  const { upcomingClasses, loading: classesLoading } = useUpcomingClasses();
  const { progress: progressData, loading: progressLoading } = useStudentProgress(userId);

  const fetchStudentInfo = useCallback(async () => {
    // Exit early if user ID is missing, component unmounted, or if we've tried too many times
    if (!userId || !isMountedRef.current || fetchAttemptRef.current > 3) {
      return;
    }
    
    // Increment the fetch attempt counter to prevent infinite loops
    fetchAttemptRef.current += 1;
    
    console.log(`Fetching student info (attempt ${fetchAttemptRef.current}) for userId:`, userId);
    
    try {
      setLoading(true);
      
      // First check if student record exists
      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select('level, enrollment_status, notes')
        .eq('id', userId)
        .maybeSingle();

      if (studentError) {
        console.error('Error fetching student info:', studentError);
        setFetchError(studentError.message);
        
        // If student record doesn't exist, create one
        if (studentError.code === 'PGRST116') {
          try {
            console.log('Creating student record for new user:', userId);
            const { error: insertError } = await supabase
              .from('students')
              .insert([{ id: userId }]);
              
            if (insertError) {
              console.error('Error creating student record:', insertError.message);
              setFetchError(`Failed to create student record: ${insertError.message}`);
            } else {
              // Successful creation, use default values
              if (isMountedRef.current) {
                setStudentData(prev => ({
                  ...prev,
                  level: 'Beginner'
                }));
              }
            }
          } catch (insertError) {
            console.error('Exception creating student record:', insertError);
          }
        }
      } else if (studentInfo && typeof studentInfo === 'object' && isMountedRef.current) {
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

        // Only update next class if there are upcoming classes
        if (upcomingClasses.length > 0) {
          setStudentData(prev => ({
            ...prev,
            nextClass: `${upcomingClasses[0].date} at ${upcomingClasses[0].time}`,
            instructor: upcomingClasses[0].instructor
          }));
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
        }
        
        // Mark data as fetched to prevent duplicate fetches
        dataFetchedRef.current = true;
      }
      
    } catch (e: any) {
      console.error('Error in fetchStudentInfo:', e);
      if (isMountedRef.current) {
        setFetchError(e.message || 'An unknown error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, upcomingClasses, progressData]); // Remove classesLoading and progressLoading to prevent loops

  // Use a ref to track if this is the first render
  const isInitialRender = useRef(true);

  useEffect(() => {
    // Skip data fetching on first render to allow all hooks to initialize
    if (isInitialRender.current) {
      isInitialRender.current = false;
      setLoading(false);
      return;
    }
    
    // Only fetch data if we have necessary information and haven't fetched yet
    if (userId && !dataFetchedRef.current && !classesLoading && !progressLoading) {
      console.log("Dashboard Core - Fetching initial data for userId:", userId);
      fetchStudentInfo();
    } else if (!userId) {
      setLoading(false);
    }
  }, [userId, classesLoading, progressLoading, fetchStudentInfo]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Reset other refs to ensure clean state if remounted
      dataFetchedRef.current = false;
      fetchAttemptRef.current = 0;
      isInitialRender.current = true;
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
