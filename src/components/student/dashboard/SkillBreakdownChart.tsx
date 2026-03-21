import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SkillData {
  skill_name: string;
  proficiency: number;
}

interface SkillBreakdownChartProps {
  skills: SkillData[];
}

const SKILL_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(133, 43%, 55%)',
  'hsl(262, 83%, 73%)',
  'hsl(45, 93%, 58%)',
  'hsl(200, 80%, 55%)',
];

const SkillRing = ({ name, value, color }: { name: string; value: number; color: string }) => {
  const data = [
    { value: value },
    { value: 100 - value },
  ];

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
          <span className="text-xs font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground text-center truncate w-20">{name}</span>
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

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Skill Breakdown</h3>
      <div className="flex flex-wrap gap-4 justify-center">
        {skills.map((skill, i) => (
          <SkillRing
            key={skill.skill_name}
            name={skill.skill_name}
            value={skill.proficiency}
            color={SKILL_COLORS[i % SKILL_COLORS.length]}
          />
        ))}
      </div>
    </div>
  );
};
