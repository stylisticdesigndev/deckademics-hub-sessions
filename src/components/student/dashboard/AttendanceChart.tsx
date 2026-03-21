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
    <div className="rounded-xl bg-card border border-border p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-2">Attendance</h3>
      
      <div className="flex-1 flex items-center gap-5">
        {/* Larger donut chart */}
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
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
            <span className="text-3xl font-bold text-foreground leading-none">{attendanceRate}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">rate</span>
          </div>
        </div>

        {/* Stats stacked vertically beside chart */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground leading-none">{presentCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Days Present</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-destructive/10 px-3 py-2.5">
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground leading-none">{absentCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Days Missed</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground leading-none">{totalClasses}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total Classes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
