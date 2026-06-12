import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve every instructor assigned to a student — both primary and secondary
 * — via the student_instructors join table. Falls back to the legacy
 * students.instructor_id column if no join rows exist. Never throws.
 */
export async function getStudentInstructorIds(
  studentId: string | null | undefined
): Promise<string[]> {
  if (!studentId) return [];
  const ids = new Set<string>();
  try {
    const { data: links } = await supabase
      .from('student_instructors' as any)
      .select('instructor_id')
      .eq('student_id', studentId);
    (links ?? []).forEach((l: any) => {
      if (l?.instructor_id) ids.add(l.instructor_id as string);
    });
  } catch (err) {
    console.debug('[getStudentInstructorIds] link fetch failed', err);
  }
  // Fallback to the primary column when no join rows are present.
  if (ids.size === 0) {
    try {
      const { data: studentRow } = await supabase
        .from('students')
        .select('instructor_id')
        .eq('id', studentId)
        .maybeSingle();
      if (studentRow?.instructor_id) ids.add(studentRow.instructor_id as string);
    } catch (err) {
      console.debug('[getStudentInstructorIds] primary fetch failed', err);
    }
  }
  return Array.from(ids);
}

/**
 * Fire-and-forget push notification. Never throws and never blocks the caller —
 * push delivery is a best-effort side effect of a user action. The edge function
 * itself checks the recipient's push opt-in and active subscriptions.
 */
export function notifyPush(
  recipientId: string | null | undefined,
  title: string,
  body: string,
  url = '/'
): void {
  if (!recipientId) return;
  try {
    void supabase.functions
      .invoke('send-push', {
        body: { recipient_id: recipientId, title, body, url },
      })
      .catch((err) => console.debug('[notifyPush] failed', err));
  } catch (err) {
    console.debug('[notifyPush] failed', err);
  }
}

/**
 * Fire-and-forget push to everyone with one of the given roles. The edge
 * function fans out to opted-in subscribers server-side.
 */
export function notifyPushRoles(
  roles: string[],
  title: string,
  body: string,
  url = '/'
): void {
  if (!roles || roles.length === 0) return;
  try {
    void supabase.functions
      .invoke('send-push', {
        body: { target_roles: roles, title, body, url },
      })
      .catch((err) => console.debug('[notifyPushRoles] failed', err));
  } catch (err) {
    console.debug('[notifyPushRoles] failed', err);
  }
}

/**
 * Server-side fan-out for student-initiated events (absent / running late /
 * undo absence). The edge function resolves ALL of the student's instructors
 * (primary + secondary + cover) with the service role, inserts the in-app
 * messages, and sends push — so it never misses an instructor due to client
 * RLS visibility. Returns the summary so callers can surface failures.
 */
export async function notifyStudentEvent(
  studentId: string,
  kind: 'absent' | 'late' | 'undo_absent',
  opts: { date?: string | null; reason?: string | null } = {}
): Promise<{ ok: boolean; notified: number; pushed: number } | null> {
  if (!studentId) return null;
  try {
    const { data, error } = await supabase.functions.invoke('notify-student-event', {
      body: {
        student_id: studentId,
        kind,
        date: opts.date ?? null,
        reason: opts.reason ?? null,
      },
    });
    if (error) {
      console.error('[notifyStudentEvent] failed', error);
      return null;
    }
    return data as { ok: boolean; notified: number; pushed: number };
  } catch (err) {
    console.error('[notifyStudentEvent] failed', err);
    return null;
  }
}