import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useAnnouncements } from './dashboard/useAnnouncements';
import { useUpcomingClasses } from './dashboard/useUpcomingClasses';
import { useStudentProgress } from './dashboard/useStudentProgress';
import { supabase } from '@/integrations/supabase/client';

interface StudentData {
  level: string;
  totalProgress: number;
  currentModule: string;
  moduleProgress: number;
  hoursCompleted: number;
  instructor: string;
  nextClass: string;
}

export const useStudentDashboard = () => {
  const { toast } = useToast();
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

  // Get current user ID from session for reliability
  const userId = session?.user?.id;

  // Fetch announcements
  const { announcements, loading: announcementsLoading, setAnnouncements } = useAnnouncements('student');
  // Fetch classes
  const { upcomingClasses, loading: classesLoading } = useUpcomingClasses();
  // Fetch progress
  const { progress: progressData, loading: progressLoading } = useStudentProgress(userId);

  // Fetch student info (level, enrollment_status, notes)
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

      // Check first time user (no classes/progress)
      const isFirstLogin = (!upcomingClasses || upcomingClasses.length === 0) &&
        (!progressData || !Array.isArray(progressData) || progressData.length === 0);
      setIsFirstTimeUser(isFirstLogin);

      // Fill in next class, instructor, totalProgress
      if (upcomingClasses.length > 0) {
        setStudentData(prev => ({
          ...prev,
          nextClass: `${upcomingClasses[0].date} at ${upcomingClasses[0].time}`,
          instructor: upcomingClasses[0].instructor
        }));
      }
      // Calculate total progress
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
  // include upcomingClasses.length and progressData.length as deps
  // but re-run only if userId changes or their length changes
  }, [userId, upcomingClasses.length, progressData.length]);

  const refreshData = useCallback(() => {
    fetchStudentInfo();
  }, [fetchStudentInfo]);

  // Run effect only on first load or if userId changes
  useEffect(() => {
    fetchStudentInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleAcknowledgeAnnouncement = (id: string) => {
    setAnnouncements(prevAnnouncements => 
      prevAnnouncements.map(announcement => 
        announcement.id === id ? { ...announcement, isNew: false } : announcement
      )
    );
    toast({
      title: 'Marked as read',
      description: 'The announcement has been marked as read.',
    });
  };

  const handleAddToCalendar = (id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  };

  const isEmpty = announcements.length === 0 && upcomingClasses.length === 0;

  return {
    loading: loading || announcementsLoading || classesLoading || progressLoading,
    studentData,
    announcements,
    upcomingClasses,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser,
    refreshData
  };
};
