
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface Instructor {
  id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

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
  name: string;
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
  const { userData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [studentData, setStudentData] = useState<StudentData>({
    name: userData.profile ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim() : 'Student',
    level: 'Beginner',
    totalProgress: 0,
    currentModule: 'Not started',
    moduleProgress: 0,
    hoursCompleted: 0,
    instructor: 'Not assigned',
    nextClass: 'Not scheduled',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userData.user?.id) return;

      try {
        setLoading(true);
        
        // Fetch student information
        const { data: studentInfo, error: studentError } = await supabase
          .from('students')
          .select('level, enrollment_status, notes')
          .eq('id', userData.user.id)
          .single();
          
        if (studentError) throw studentError;

        // Fetch announcements
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
          .in('target_role', [['student']])
          .order('published_at', { ascending: false });

        if (announcementsError) throw announcementsError;

        // Fetch upcoming classes
        const now = new Date().toISOString();
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            title,
            location,
            start_time,
            end_time,
            instructors:instructor_id (
              id,
              profiles:id (first_name, last_name)
            )
          `)
          .gt('start_time', now)
          .order('start_time', { ascending: true })
          .limit(3);

        if (classesError) throw classesError;

        // Fetch progress data
        const { data: progressData, error: progressError } = await supabase
          .from('student_progress')
          .select('skill_name, proficiency')
          .eq('student_id', userData.user.id);

        if (progressError) throw progressError;

        // Update student data
        if (studentInfo) {
          setStudentData(prev => ({
            ...prev,
            level: studentInfo.level || 'Beginner'
          }));
        }

        // Format announcements
        if (announcementsData) {
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
            isNew: true, // Mark as new initially
            type: 'announcement', // Default type
          }));
          setAnnouncements(formattedAnnouncements);
        }

        // Format upcoming classes
        if (classesData) {
          const formattedClasses: ClassSession[] = classesData.map(cls => {
            const startTime = new Date(cls.start_time);
            const endTime = new Date(cls.end_time);
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            const instructorName = cls.instructors?.profiles 
              ? `${cls.instructors.profiles.first_name || ''} ${cls.instructors.profiles.last_name || ''}`.trim()
              : 'Not assigned';
              
            return {
              id: cls.id,
              title: cls.title,
              instructor: instructorName,
              date: startTime.toLocaleDateString(),
              time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: `${durationHours}h ${durationMinutes}m`,
              location: cls.location || 'Main Studio',
              attendees: 0, // This would need another query to count enrollments
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
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData.user?.id, toast, userData.profile]);

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
    isEmpty: announcements.length === 0 && upcomingClasses.length === 0
  };
};
