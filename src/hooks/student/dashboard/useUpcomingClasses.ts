
import { useEffect, useState, useCallback } from 'react';
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    
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

      if (classesError) {
        throw classesError;
      }

      let formattedClasses: ClassSession[] = [];
      
      if (Array.isArray(classesData) && classesData.length > 0) {
        const validClasses = classesData.filter(cls => cls && typeof cls === "object" && "instructor_id" in cls);
        
        // Fetch instructor profiles in a batch
        if (validClasses.length > 0) {
          const instructorIds = validClasses
            .map(cls => cls.instructor_id)
            .filter((id): id is string => typeof id === "string");
            
          let instructorProfiles: Record<string, InstructorProfile> = {};
          
          if (instructorIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', instructorIds);
              
            if (profilesError) {
              console.error('Error fetching instructor profiles:', profilesError);
            } else if (Array.isArray(profiles)) {
              // Create a map for faster lookups
              profiles.forEach(profile => {
                if (profile && profile.id) {
                  instructorProfiles[profile.id] = profile as InstructorProfile;
                }
              });
            }
          }
          
          // Format classes with instructor information
          formattedClasses = validClasses.map(cls => {
            const startTime = cls.start_time ? new Date(cls.start_time) : new Date();
            const endTime = cls.end_time ? new Date(cls.end_time) : new Date();
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            const instructorProfile = cls.instructor_id ? instructorProfiles[cls.instructor_id] : null;
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
        }
      }
      
      setUpcomingClasses(formattedClasses);
      
    } catch (e) {
      console.error('Error fetching upcoming classes:', e);
      setFetchError(e instanceof Error ? e.message : 'Unknown error fetching classes');
      setUpcomingClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch classes once on component mount
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return { upcomingClasses, loading, setUpcomingClasses, fetchError };
}
