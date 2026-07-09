import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MILESTONE_FILL, milestoneLabel } from '@/lib/skillMilestones';

interface SkillData {
  skill_name: string;
  proficiency: number; // 0–3 milestone
}

interface SkillBreakdownChartProps {
  skills: SkillData[];
}

const SkillRing = ({ name, value }: { name: string; value: number }) => {
  const fraction = Math.max(0, Math.min(3, value)) / 3;
  const data = [
    { value: fraction * 100 },
    { value: 100 - fraction * 100 },
  ];
  const color = MILESTONE_FILL[Math.max(0, Math.min(3, value))];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={35}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{value}/3</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center truncate w-20" title={`${name} — ${milestoneLabel(value)}`}>{name}</span>
    </div>
  );
};

export const SkillBreakdownChart = ({ skills }: SkillBreakdownChartProps) => {
  if (!skills || skills.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">No skill assessments yet</p>
      </div>
    );
  }

  const sorted = [...skills].sort((a, b) => b.proficiency - a.proficiency);
  const displayed = sorted.slice(0, 6);
  const hasMore = skills.length > 6;

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-foreground">Skill Breakdown</h3>
        {hasMore && (
          <Link to="/student/progress">
            <Button variant="link" size="sm" className="text-primary p-0 h-auto">
              View All
            </Button>
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {displayed.map((skill) => (
          <SkillRing
            key={skill.skill_name}
            name={skill.skill_name}
            value={skill.proficiency}
          />
        ))}
      </div>
    </div>
  );
};
