
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { asDatabaseParam, asInsertParam } from '@/utils/supabaseHelpers';

export interface StudentForAssignment {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  level: string;
  instructorId: string | null;
}

export function useStudentAssignment() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch students that can be assigned to instructors
  const { data: unassignedStudents, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['admin', 'students', 'unassigned'],
    queryFn: async () => {
      try {
        console.log('Fetching students for assignment...');
        setLoading(true);
        
        // Get all students with active enrollment status
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            level,
            profiles:id (
              first_name,
              last_name,
              email
            )
          `)
          .eq('enrollment_status', 'active');

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          return [];
        }

        // Transform the data to match the StudentForAssignment interface
        const formattedStudents: StudentForAssignment[] = students.map(student => ({
          id: student.id,
          first_name: student.profiles?.first_name || null,
          last_name: student.profiles?.last_name || null,
          email: student.profiles?.email || '',
          level: student.level || 'beginner',
          instructorId: null // Will be populated when we fetch enrollments
        }));

        return formattedStudents;
      } catch (error) {
        console.error('Error in unassignedStudents query:', error);
        return [];
      } finally {
        setLoading(false);
      }
    }
  });

  // Assign students to instructor
  const assignStudentsToInstructor = useMutation({
    mutationFn: async ({ 
      instructorId, 
      studentIds 
    }: { 
      instructorId: string; 
      studentIds: string[] 
    }) => {
      if (!instructorId || studentIds.length === 0) {
        throw new Error('Missing instructor ID or student IDs');
      }

      console.log(`Assigning students ${studentIds.join(', ')} to instructor ${instructorId}`);
      
      // For each student, create an entry in the enrollments table
      const enrollments = studentIds.map(studentId => asInsertParam({
        student_id: studentId,
        instructor_id: instructorId,
        status: 'active'
      }, 'enrollments'));

      // Insert the enrollments
      const { data, error } = await supabase
        .from('enrollments')
        .insert(enrollments);

      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      toast.success('Students assigned successfully');
    },
    onError: (error: Error) => {
      console.error('Error assigning students:', error);
      toast.error(`Failed to assign students: ${error.message}`);
    }
  });

  return {
    unassignedStudents: unassignedStudents || [],
    isLoadingStudents,
    loading,
    assignStudentsToInstructor
  };
}
