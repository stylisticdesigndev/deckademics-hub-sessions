
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
        .eq('id', userId as any)
        .maybeSingle();
        
      if (studentError && studentError.code !== 'PGRST116') {
        console.error("Error fetching student info:", studentError);
      } else {
        console.log("Student data fetched:", studentInfo);
      }

      // Fetch announcements with proper type handling
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
        console.log("Announcements fetched:", announcementsData?.length || 0);
      }

      // Fetch upcoming classes with proper error handling
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

      if (classesError) {
        console.error("Error fetching classes:", classesError);
      } else {
        console.log("Classes fetched:", classesData?.length || 0);
        
        // If we have classes, fetch the instructor profiles separately
        if (classesData && Array.isArray(classesData) && classesData.length > 0) {
          // Get unique instructor IDs with type checking
          const instructorIds: string[] = [];
          classesData.forEach(cls => {
            if (cls && cls.instructor_id) {
              instructorIds.push(cls.instructor_id);
            }
          });
            
          if (instructorIds.length > 0) {
            // Fetch instructor profiles with proper type handling
            const { data: instructorProfiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', instructorIds as any);
              
            if (profilesError) {
              console.error("Error fetching instructor profiles:", profilesError);
            } else if (instructorProfiles && Array.isArray(instructorProfiles)) {
              // Create a map of instructor profiles for easy lookup
              const profilesMap = new Map<string, InstructorProfile>();
              instructorProfiles.forEach(profile => {
                if (profile && profile.id) {
                  profilesMap.set(profile.id, profile as InstructorProfile);
                }
              });
              
              // Enhance class data with instructor profiles
              const typedClassData = classesData as unknown as ClassInfo[];
              typedClassData.forEach(cls => {
                if (cls && cls.instructor_id) {
                  const profile = profilesMap.get(cls.instructor_id);
                  if (profile) {
                    cls.instructorProfile = profile;
                  }
                }
              });
            }
          }
        }
      }

      // Fetch progress data with proper type handling
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('skill_name, proficiency')
        .eq('student_id', userId as any);

      if (progressError) {
        console.error("Error fetching progress:", progressError);
      } else {
        console.log("Progress data fetched:", progressData?.length || 0);
      }
      
      // Check if this is a first-time user (no classes, no progress data)
      const isFirstLogin = 
        (!classesData || !Array.isArray(classesData) || classesData.length === 0) && 
        (!progressData || !Array.isArray(progressData) || progressData.length === 0);
        
      setIsFirstTimeUser(isFirstLogin);

      // Update student data with level from student data
      if (studentInfo && typeof studentInfo === 'object') {
        setStudentData(prev => ({
          ...prev,
          level: studentInfo.level || 'Beginner'
        }));
      }

      // Format announcements (if there are any)
      if (announcementsData && Array.isArray(announcementsData) && announcementsData.length > 0) {
        const formattedAnnouncements: Announcement[] = [];
        
        for (const ann of announcementsData) {
          // Safely handle potentially missing data
          if (!ann) continue;
          
          // Type-safe access to data
          const typedAnn = ann as unknown as AnnouncementData;
          
          // Safely access profiles data with type checking
          let fullName = 'Admin';
          let initials = 'A';
          
          if (typedAnn.profiles) {
            const firstName = typedAnn.profiles.first_name || '';
            const lastName = typedAnn.profiles.last_name || '';
            fullName = `${firstName} ${lastName}`.trim() || 'Admin';
            initials = `${(firstName || ' ')[0] || ''}${(lastName || ' ')[0] || ''}`.trim().toUpperCase() || 'A';
          }
          
          formattedAnnouncements.push({
            id: typedAnn.id || '',
            title: typedAnn.title || '',
            content: typedAnn.content || '',
            date: typedAnn.published_at ? new Date(typedAnn.published_at).toLocaleDateString() : 'Unknown date',
            instructor: {
              name: fullName,
              initials: initials
            },
            isNew: true,
            type: 'announcement',
          });
        }
        
        setAnnouncements(formattedAnnouncements);
      } else {
        setAnnouncements([]);
      }

      // Format upcoming classes (if there are any)
      if (classesData && Array.isArray(classesData) && classesData.length > 0) {
        const formattedClasses: ClassSession[] = [];
        const typedClassData = classesData as unknown as ClassInfo[];
        
        for (const cls of typedClassData) {
          if (!cls) continue;
          
          const startTime = cls.start_time ? new Date(cls.start_time) : new Date();
          const endTime = cls.end_time ? new Date(cls.end_time) : new Date();
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          
          // Use the instructorProfile we've added during the separate query
          const instructorProfile = cls.instructorProfile;
          const instructorName = instructorProfile 
            ? `${instructorProfile.first_name || ''} ${instructorProfile.last_name || ''}`.trim()
            : 'Not assigned';
            
          formattedClasses.push({
            id: cls.id || '',
            title: cls.title || '',
            instructor: instructorName,
            date: startTime.toLocaleDateString(),
            time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: `${durationHours}h ${durationMinutes}m`,
            location: cls.location || 'Main Studio',
            attendees: 0,
            isUpcoming: true,
          });
        }
        
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
      if (progressData && Array.isArray(progressData) && progressData.length > 0) {
        const totalProficiency = progressData.reduce((sum, item) => {
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
