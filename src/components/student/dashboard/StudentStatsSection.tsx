import React from 'react';
import { Award, Calendar, TrendingUp, Users } from 'lucide-react';

interface StudentStatsProps {
  level: string;
  totalProgress: number;
  nextClass: string;
  instructor: string;
  classesAttended: number;
}

export const StudentStatsSection = ({ 
  level, 
  totalProgress, 
  nextClass, 
  instructor,
  classesAttended
}: StudentStatsProps) => {
  const stats = [
    {
      label: 'Level',
      value: level,
      icon: <Award className="h-5 w-5 text-primary" />,
      accent: 'border-primary/30',
    },
    {
      label: 'Classes Attended',
      value: String(classesAttended),
      icon: <Users className="h-5 w-5 text-primary" />,
      accent: 'border-primary/30',
    },
    {
      label: 'Next Class',
      value: nextClass === 'Not scheduled' ? '—' : nextClass,
      icon: <Calendar className="h-5 w-5 text-secondary" />,
      subtitle: instructor !== 'Not assigned' ? `With ${instructor}` : undefined,
      accent: 'border-secondary/30',
    },
  ];

  return (
    <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl bg-card border ${stat.accent} p-4 flex flex-col gap-2`}
        >
          <div className="flex items-center gap-2">
            {stat.icon}
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <span className="text-lg font-bold text-foreground truncate">{stat.value}</span>
          {stat.subtitle && (
            <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
          )}
        </div>
      ))}
    </section>
  );
};
