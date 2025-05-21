
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDataObject, hasProperty, safelyAccessProperty } from '@/utils/supabaseHelpers';

export interface InstructorProfile {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
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
        // Filter and validate class data
        const validClasses = classesData.filter(cls => 
          isDataObject(cls) && hasProperty(cls, 'instructor_id')
        );
        
        // Fetch instructor profiles in a batch
        if (validClasses.length > 0) {
          const instructorIds = validClasses
            .map(cls => cls.instructor_id)
            .filter(Boolean);
            
          let instructorProfiles: Record<string, InstructorProfile> = {};
          
          if (instructorIds.length > 0) {
            // Use the 'in' filter with array of values, not the array itself
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', instructorIds as any);
              
            if (profilesError) {
              console.error('Error fetching instructor profiles:', profilesError);
            } else if (Array.isArray(profiles)) {
              // Create a map for faster lookups and ensure proper typing
              profiles.forEach(profile => {
                if (isDataObject(profile) && hasProperty(profile, 'id') && profile.id) {
                  const safeProfile = {
                    id: profile.id as string,
                    first_name: profile.first_name as string | null,
                    last_name: profile.last_name as string | null
                  };
                  
                  instructorProfiles[safeProfile.id] = safeProfile;
                }
              });
            }
          }
          
          // Format classes with instructor information
          formattedClasses = validClasses.map(cls => {
            if (!isDataObject(cls) || 
                !hasProperty(cls, 'start_time') || 
                !hasProperty(cls, 'end_time')) return null;
            
            const startTime = cls.start_time ? new Date(cls.start_time) : new Date();
            const endTime = cls.end_time ? new Date(cls.end_time) : new Date();
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            
            const instructorId = cls.instructor_id as string;
            const instructorProfile = instructorId ? instructorProfiles[instructorId] : null;
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
          }).filter(Boolean) as ClassSession[];
        }
      }
      
      setUpcomingClasses(formattedClasses);
      
    } catch (e: any) {
      console.error('Error fetching upcoming classes:', e);
      setFetchError(e.message || 'Unknown error fetching classes');
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
