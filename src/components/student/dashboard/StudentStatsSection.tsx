
import React from 'react';
import { StatsCard } from '@/components/cards/StatsCard';
import { Award, Calendar } from 'lucide-react';

interface StudentStatsProps {
  level: string;
  totalProgress: number;
  nextClass: string;
  instructor: string;
}

export const StudentStatsSection = ({ 
  level, 
  totalProgress, 
  nextClass, 
  instructor 
}: StudentStatsProps) => {
  return (
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <StatsCard 
        title="Current Level"
        value={level}
        icon={<Award className="h-5 w-5" />}
        description={totalProgress > 0 ? `${totalProgress}% complete` : "Just getting started"}
      />
      <StatsCard 
        title="Next Class"
        value={nextClass}
        icon={<Calendar className="h-5 w-5" />}
        description={instructor !== "Not assigned" ? `With ${instructor}` : "No instructor assigned yet"}
      />
    </section>
  );
};
