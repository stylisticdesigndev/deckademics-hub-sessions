
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { useStudentDashboard } from '@/hooks/student/useStudentDashboard';
import { StudentStatsSection } from '@/components/student/dashboard/StudentStatsSection';
import { ProgressSection } from '@/components/student/dashboard/ProgressSection';
import { UpcomingClassesSection } from '@/components/student/dashboard/UpcomingClassesSection';
import { AnnouncementsSection } from '@/components/student/dashboard/AnnouncementsSection';
import { DashboardSkeleton } from '@/components/student/dashboard/DashboardSkeleton';
import { EmptyDashboard } from '@/components/student/dashboard/EmptyDashboard';

const StudentDashboard = () => {
  const {
    loading,
    studentData,
    announcements,
    upcomingClasses,
    handleAcknowledgeAnnouncement,
    handleAddToCalendar,
    isEmpty,
    isFirstTimeUser
  } = useStudentDashboard();

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome, {studentData.name}</h1>
          <p className="text-muted-foreground">
            You're currently at <span className="text-deckademics-primary font-medium">{studentData.level}</span> level. 
            {isEmpty && " Complete your profile and enroll in classes to get started."}
          </p>
        </section>

        {loading ? (
          <DashboardSkeleton />
        ) : isEmpty || isFirstTimeUser ? (
          <EmptyDashboard />
        ) : (
          <>
            <StudentStatsSection
              level={studentData.level}
              totalProgress={studentData.totalProgress}
              nextClass={studentData.nextClass}
              instructor={studentData.instructor}
            />

            <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Your Progress</h2>
                <ProgressSection totalProgress={studentData.totalProgress} />
                
                <UpcomingClassesSection 
                  classes={upcomingClasses} 
                  onAddToCalendar={handleAddToCalendar} 
                />
              </div>
              
              <div>
                <AnnouncementsSection 
                  announcements={announcements} 
                  onAcknowledge={handleAcknowledgeAnnouncement} 
                />
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
