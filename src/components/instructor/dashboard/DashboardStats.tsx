
import React from 'react';
import { Calendar, CheckCircle, Users } from 'lucide-react';
import { StatsCard } from '@/components/cards/StatsCard';

interface DashboardStatsProps {
  todayClasses: number;
  averageProgress: number;
  totalStudents: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  todayClasses,
  averageProgress,
  totalStudents
}) => {
  return (
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard 
        title="Today's Classes"
        value={todayClasses.toString()}
        icon={<Calendar className="h-5 w-5" />}
        description={todayClasses === 0 ? "No classes scheduled today" : todayClasses === 1 ? "1 class today" : `${todayClasses} classes today`}
      />
      <StatsCard 
        title="Average Progress"
        value={`${averageProgress}%`}
        icon={<CheckCircle className="h-5 w-5" />}
        description={totalStudents === 0 ? "No student data available" : `Across ${totalStudents} students`}
      />
      <StatsCard 
        title="Total Students"
        value={totalStudents.toString()}
        icon={<Users className="h-5 w-5" />}
        description={totalStudents === 0 ? "No students assigned yet" : totalStudents === 1 ? "1 student assigned" : `${totalStudents} students assigned`}
      />
    </section>
  );
};
