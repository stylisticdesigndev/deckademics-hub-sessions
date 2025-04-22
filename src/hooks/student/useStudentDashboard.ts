
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  instructor: {
    name: string;
    avatar?: string;
    initials: string;
  };
  isNew?: boolean;
  type: 'event' | 'announcement' | 'update';
}

interface ClassSession {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  attendees: number;
  isUpcoming: boolean;
}

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [studentData, setStudentData] = useState<StudentData>({
    level: 'Beginner',
    totalProgress: 0,
    currentModule: 'Not started',
    moduleProgress: 0,
    hoursCompleted: 0,
    instructor: 'Not assigned',
    nextClass: 'Not scheduled',
  });

  // Get the current user ID directly from the session for reliability
  const userId = session?.user?.id;

  const fetchData = useCallback(async () => {
    if (!userId) {
      console.log("No user ID available for fetching data");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching data for user:", userId);
      
      // Fetch student information
      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select('level, enrollment_status, notes')
        .eq('id', userId)
        .single();
        
      if (studentError && studentError.code !== 'PGRST116') {
        console.error("Error fetching student info:", studentError);
      } else {
        console.log("Student data fetched:", studentInfo);
      }

      // Fetch announcements - fix the target_role query format
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          published_at,
          author_id,
          profiles:author_id (first_name, last_name)
        `)
        .contains('target_role', ['student'])
        .order('published_at', { ascending: false });

      if (announcementsError) {
        console.error("Error fetching announcements:", announcementsError);
      } else {
        console.log("Announcements fetched:", announcementsData?.length || 0);
      }

      // Fetch upcoming classes - fix the relationship query
      const now = new Date().toISOString();
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          title,
          location,
          start_time,
          end_time,
          instructor_id,
          profiles:instructor_id (
            first_name,
            last_name
          )
        `)
        .gt('start_time', now)
        .order('start_time', { ascending: true })
        .limit(3);

      if (classesError) {
        console.error("Error fetching classes:", classesError);
      } else {
        console.log("Classes fetched:", classesData?.length || 0);
      }

      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('skill_name, proficiency')
        .eq('student_id', userId);

      if (progressError) {
        console.error("Error fetching progress:", progressError);
      } else {
        console.log("Progress data fetched:", progressData?.length || 0);
      }
      
      // Check if this is a first-time user (no classes, no progress data)
      const isFirstLogin = 
        (!classesData || classesData.length === 0) && 
        (!progressData || progressData.length === 0);
        
      setIsFirstTimeUser(isFirstLogin);

      // Update student data with level from student data
      setStudentData(prev => ({
        ...prev,
        level: studentInfo?.level || 'Beginner'
      }));

      // Format announcements (if there are any)
      if (announcementsData && announcementsData.length > 0) {
        const formattedAnnouncements: Announcement[] = announcementsData.map(ann => ({
          id: ann.id,
          title: ann.title,
          content: ann.content,
          date: new Date(ann.published_at).toLocaleDateString(),
          instructor: {
            name: ann.profiles ? `${ann.profiles.first_name || ''} ${ann.profiles.last_name || ''}`.trim() : 'Admin',
            initials: ann.profiles ? 
              `${(ann.profiles.first_name || ' ')[0]}${(ann.profiles.last_name || ' ')[0]}`.trim().toUpperCase() : 'A'
          },
          isNew: true,
          type: 'announcement',
        }));
        setAnnouncements(formattedAnnouncements);
      } else {
        setAnnouncements([]);
      }

      // Format upcoming classes (if there are any)
      if (classesData && classesData.length > 0) {
        const formattedClasses: ClassSession[] = classesData.map(cls => {
          const startTime = new Date(cls.start_time);
          const endTime = new Date(cls.end_time);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          
          const instructorName = cls.profiles 
            ? `${cls.profiles.first_name || ''} ${cls.profiles.last_name || ''}`.trim()
            : 'Not assigned';
            
          return {
            id: cls.id,
            title: cls.title,
            instructor: instructorName,
            date: startTime.toLocaleDateString(),
            time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${durationHours}h ${durationMinutes}m`,
            location: cls.location || 'Main Studio',
            attendees: 0,
            isUpcoming: true,
          };
        });
        
        setUpcomingClasses(formattedClasses);
        
        // Update next class info if available
        if (formattedClasses.length > 0) {
          setStudentData(prev => ({
            ...prev,
            nextClass: `${formattedClasses[0].date} at ${formattedClasses[0].time}`,
            instructor: formattedClasses[0].instructor
          }));
        }
      } else {
        setUpcomingClasses([]);
      }

      // Calculate total progress if progress data exists
      if (progressData && progressData.length > 0) {
        const totalProficiency = progressData.reduce((sum, item) => sum + (item.proficiency || 0), 0);
        const avgProgress = Math.round(totalProficiency / progressData.length);
        
        setStudentData(prev => ({
          ...prev,
          totalProgress: avgProgress
        }));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Provide a way to refresh data on demand
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, userId]);

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

  return {
    loading,
    studentData,
    announcements,
    upcomingClasses,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty: announcements.length === 0 && upcomingClasses.length === 0,
    isFirstTimeUser,
    refreshData
  };
};
