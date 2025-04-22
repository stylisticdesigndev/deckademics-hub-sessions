import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

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

type StudentInfo = {
  level: string;
  enrollment_status: string;
  notes: string | null;
};

type ClassInfo = {
  id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  instructor_id: string;
  instructorProfile?: InstructorProfile;
};

type InstructorProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

type AnnouncementData = {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
  author_id: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
};

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
        .eq('id', userId as string)
        .maybeSingle();
        
      if (studentError && studentError.code !== 'PGRST116') {
        console.error("Error fetching student info:", studentError);
      } else {
        console.log("Student data fetched:", studentInfo);
      }

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
        .contains('target_role', ['student']);

      if (announcementsError) {
        console.error("Error fetching announcements:", announcementsError);
      } else {
        console.log("Announcements fetched:", Array.isArray(announcementsData) ? announcementsData.length : 'none');
      }

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
          instructor_id
        `)
        .gt('start_time', now)
        .order('start_time', { ascending: true })
        .limit(3);

      let validClasses: any[] = [];
      if (classesError) {
        console.error("Error fetching classes:", classesError);
      } else if (Array.isArray(classesData)) {
        validClasses = classesData.filter((cls: any) => cls && typeof cls === "object" && "instructor_id" in cls);
        console.log("Classes fetched:", validClasses.length);
        
        // If we have classes, fetch the instructor profiles
        if (validClasses.length > 0) {
          // Get unique instructor IDs
          const instructorIds: string[] = validClasses
            .map(cls => cls.instructor_id)
            .filter(id => typeof id === "string");
            
          if (instructorIds.length > 0) {
            const { data: instructorProfiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', instructorIds as string[]);
              
            if (profilesError) {
              console.error("Error fetching instructor profiles:", profilesError);
            } else if (Array.isArray(instructorProfiles)) {
              // Create a map of instructor profiles
              const profilesMap = new Map<string, any>();
              instructorProfiles.forEach(profile => {
                if (profile && typeof profile === "object" && profile.id) {
                  profilesMap.set(profile.id, profile);
                }
              });
              
              validClasses.forEach(cls => {
                if (cls && cls.instructor_id && profilesMap.has(cls.instructor_id)) {
                  cls.instructorProfile = profilesMap.get(cls.instructor_id);
                }
              });
            }
          }
        }
      }

      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('skill_name, proficiency')
        .eq('student_id', userId as string);

      if (progressError) {
        console.error("Error fetching progress:", progressError);
      } else {
        console.log("Progress data fetched:", Array.isArray(progressData) ? progressData.length : 'none');
      }
      
      // Check if this is a first-time user
      const isFirstLogin = 
        (!validClasses || validClasses.length === 0) && 
        (!progressData || !Array.isArray(progressData) || progressData.length === 0);
        
      setIsFirstTimeUser(isFirstLogin);

      // Update student data with level from student data
      if (studentInfo && typeof studentInfo === 'object') {
        setStudentData(prev => ({
          ...prev,
          level: studentInfo.level || 'Beginner'
        }));
      }

      // Format announcements
      if (Array.isArray(announcementsData) && announcementsData.length > 0) {
        const formattedAnnouncements: Announcement[] = [];
        
        for (const annRaw of announcementsData) {
          if (annRaw && typeof annRaw === "object" && "id" in annRaw) {
            // Use casting with proper type check
            const ann: any = annRaw;
            let fullName = 'Admin';
            let initials = 'A';
            if (ann.profiles) {
              const pf = Array.isArray(ann.profiles) ? ann.profiles[0] : ann.profiles;
              if (pf) {
                const firstName = pf.first_name ?? '';
                const lastName = pf.last_name ?? '';
                fullName = `${firstName} ${lastName}`.trim() || 'Admin';
                initials = `${(firstName || ' ')[0] || ''}${(lastName || ' ')[0] || ''}`.trim().toUpperCase() || 'A';
              }
            }
            formattedAnnouncements.push({
              id: ann.id || '',
              title: ann.title || '',
              content: ann.content || '',
              date: ann.published_at ? new Date(ann.published_at).toLocaleDateString() : 'Unknown date',
              instructor: {
                name: fullName,
                initials: initials
              },
              isNew: true,
              type: 'announcement',
            });
          }
        }
        setAnnouncements(formattedAnnouncements);
      } else {
        setAnnouncements([]);
      }

      // Format upcoming classes (if any)
      if (validClasses && validClasses.length > 0) {
        const formattedClasses: ClassSession[] = validClasses.map(cls => {
          const startTime = cls.start_time ? new Date(cls.start_time) : new Date();
          const endTime = cls.end_time ? new Date(cls.end_time) : new Date();
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          const instructorProfile = cls.instructorProfile;
          const instructorName = instructorProfile 
            ? `${instructorProfile.first_name || ''} ${instructorProfile.last_name || ''}`.trim()
            : 'Not assigned';
          return {
            id: cls.id || '',
            title: cls.title || '',
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
      if (progressData && Array.isArray(progressData) && progressData.length > 0) {
        const totalProficiency = progressData.reduce((sum: number, item: any) => {
          if (!item) return sum;
          return sum + (('proficiency' in item && typeof item.proficiency === 'number') ? item.proficiency : 0);
        }, 0);
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
