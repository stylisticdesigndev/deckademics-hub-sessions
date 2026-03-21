import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { AttendanceCounts } from '@/hooks/student/useStudentAttendance';

interface AttendanceChartProps {
  attendance: AttendanceCounts;
  isLoading?: boolean;
}

const COLORS = {
  present: 'hsl(var(--primary))',
  absent: 'hsl(var(--destructive))',
  remaining: 'hsl(var(--muted))',
};

export const AttendanceChart = ({ attendance, isLoading }: AttendanceChartProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse w-24 h-24 rounded-full bg-muted" />
      </div>
    );
  }

  if (attendance.total === 0) {
    return (
      <div className="rounded-xl bg-card border border-border p-6 flex flex-col items-center justify-center min-h-[200px]">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        </svg>
        <p className="text-sm text-muted-foreground mt-3">No attendance records yet</p>
      </div>
    );
  }

  const presentCount = attendance.present + (attendance.late || 0);
  const absentCount = attendance.absent;
  const totalClasses = attendance.total;
  const attendanceRate = Math.round((presentCount / totalClasses) * 100);

  const data = [
    { name: 'Present', value: presentCount, color: COLORS.present },
    { name: 'Absent', value: absentCount, color: COLORS.absent },
  ].filter(d => d.value > 0);

  // If somehow both are 0, show empty ring
  if (data.length === 0) {
    data.push({ name: 'None', value: 1, color: COLORS.remaining });
  }

  return (
    <div className="rounded-xl bg-card border border-border p-6 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-3">Attendance</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Donut chart */}
        <div className="relative w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={52}
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{attendanceRate}%</span>
            <span className="text-[10px] text-muted-foreground">attendance</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-primary/10 p-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{presentCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Days Present</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-destructive/10 p-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-none">{absentCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Days Missed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
