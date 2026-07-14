import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useInstructorAttendance } from '@/hooks/instructor/useInstructorAttendance';
import { SwipeAttendanceStack } from './SwipeAttendanceStack';

export function TodayAttendanceSection() {
  const { userData } = useAuth();
  const instructorId = userData.user?.id || userData.profile?.id;
  const { todayStudents, saving, markAttendance, loading } = useInstructorAttendance(instructorId);

  if (loading) return null;

  return (
    <SwipeAttendanceStack
      items={todayStudents}
      saving={saving}
      onMark={markAttendance}
    />
  );
}