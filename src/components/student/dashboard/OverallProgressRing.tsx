import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface OverallProgressRingProps {
  progress: number;
}

export const OverallProgressRing = ({ progress }: OverallProgressRingProps) => {
  const data = [
    { name: 'bg', value: 100, fill: 'hsl(var(--muted))' },
    { name: 'progress', value: progress, fill: 'hsl(var(--primary))' },
  ];

  if (progress === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] h-full rounded-xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 self-start">Overall Progress</h3>
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">0%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">No progress data yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl bg-card border border-border p-6 min-h-[200px] h-full">
      <h3 className="text-sm font-semibold text-foreground mb-4">Overall Progress</h3>
      <div className="flex-1 flex items-center justify-center">
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            data={data}
            barSize={12}
          >
            <RadialBar dataKey="value" cornerRadius={6} background={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{progress}%</span>
          <span className="text-xs text-muted-foreground">Overall</span>
        </div>
      </div>
      </div>
    </div>
  );
};
