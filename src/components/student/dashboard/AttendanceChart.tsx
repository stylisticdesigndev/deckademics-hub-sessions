import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { AttendanceCounts } from '@/hooks/student/useStudentAttendance';

interface AttendanceChartProps {
  attendance: AttendanceCounts;
  isLoading?: boolean;
}

const COLORS = {
  present: 'hsl(var(--primary))',
  late: 'hsl(45, 93%, 58%)',
  absent: 'hsl(var(--destructive))',
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

  const data = [
    { name: 'Present', value: attendance.present, color: COLORS.present },
    { name: 'Late', value: attendance.late, color: COLORS.late },
    { name: 'Absent', value: attendance.absent, color: COLORS.absent },
  ].filter(d => d.value > 0);

  const attendanceRate = Math.round((attendance.present / attendance.total) * 100);

  return (
    <div className="rounded-xl bg-card border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Attendance</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={45}
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
            <span className="text-lg font-bold text-foreground">{attendanceRate}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.present }} />
            <span className="text-muted-foreground">Present: {attendance.present}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.late }} />
            <span className="text-muted-foreground">Late: {attendance.late}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.absent }} />
            <span className="text-muted-foreground">Absent: {attendance.absent}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
