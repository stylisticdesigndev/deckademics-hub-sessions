
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface InstructorProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
}

export interface ClassSession {
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

export function useUpcomingClasses() {
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
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
        if (!classesError && Array.isArray(classesData)) {
          validClasses = classesData.filter((cls: any) => cls && typeof cls === "object" && "instructor_id" in cls);

          // Fetch instructor profiles
          if (validClasses.length > 0) {
            const instructorIds: string[] = validClasses
              .map(cls => cls.instructor_id)
              .filter(id => typeof id === "string");

            if (instructorIds.length > 0) {
              const { data: instructorProfiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name')
                .in('id', instructorIds as string[]);

              const profilesMap = new Map<string, InstructorProfile>();
              if (Array.isArray(instructorProfiles)) {
                instructorProfiles.forEach((profile: any) => {
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
        } else {
          setUpcomingClasses([]);
        }
      } catch (e) {
        setUpcomingClasses([]);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return { upcomingClasses, loading, setUpcomingClasses };
}
