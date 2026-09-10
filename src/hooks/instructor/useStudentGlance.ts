import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentGlance {
  /** Attendance rate over the most recent sessions (0–100), null when no records. */
  attendanceRate: number | null;
  attendanceSampleSize: number;
  /** Consecutive most-recent sessions marked present. */
  presentStreak: number;
  lastAttendanceDate: string | null;
  /** Active status flag set by the student (e.g. running late), if any. */
  activeStatus: string | null;
  /** True when the student has logged an absence for today. */
  absentToday: boolean;
  /** True when a schedule change request is awaiting review. */
  pendingScheduleChange: boolean;
  /** Unread messages this student sent to the current instructor. */
  unreadFromStudent: number;
}

const EMPTY: StudentGlance = {
  attendanceRate: null,
  attendanceSampleSize: 0,
  presentStreak: 0,
  lastAttendanceDate: null,
  activeStatus: null,
  absentToday: false,
  pendingScheduleChange: false,
  unreadFromStudent: 0,
};

async function fetchGlance(studentId: string, instructorId?: string): Promise<StudentGlance> {
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();

  const [attendance, status, absence, scheduleReq, unread] = await Promise.all([
    supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(12),
    supabase
      .from('student_status' as any)
      .select('status, expires_at, set_at')
      .eq('student_id', studentId)
      .order('set_at', { ascending: false })
      .limit(1),
    supabase
      .from('student_absences')
      .select('id')
      .eq('student_id', studentId)
      .eq('absence_date', today)
      .limit(1),
    supabase
      .from('schedule_change_requests')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'pending')
      .limit(1),
    instructorId
      ? supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('sender_id', studentId)
          .eq('receiver_id', instructorId)
          .is('read_at', null)
      : Promise.resolve({ count: 0 } as any),
  ]);

  const rows = ((attendance.data as any[]) || []).filter((r) => r.status);
  const presentCount = rows.filter((r) => r.status === 'present').length;
  let streak = 0;
  for (const row of rows) {
    if (row.status === 'present') streak += 1;
    else break;
  }

  const statusRow = ((status.data as any[]) || [])[0];
  const statusActive =
    statusRow && (!statusRow.expires_at || statusRow.expires_at > nowIso)
      ? statusRow.status
      : null;

  return {
    attendanceRate: rows.length ? Math.round((presentCount / rows.length) * 100) : null,
    attendanceSampleSize: rows.length,
    presentStreak: streak,
    lastAttendanceDate: rows[0]?.date || null,
    activeStatus: statusActive,
    absentToday: !!((absence.data as any[]) || []).length,
    pendingScheduleChange: !!((scheduleReq.data as any[]) || []).length,
    unreadFromStudent: (unread as any)?.count || 0,
  };
}

export function useStudentGlance(studentId?: string, instructorId?: string) {
  return useQuery({
    queryKey: ['student-glance', studentId, instructorId],
    queryFn: () => fetchGlance(studentId as string, instructorId),
    enabled: !!studentId,
    staleTime: 30_000,
    placeholderData: EMPTY,
  });
}
