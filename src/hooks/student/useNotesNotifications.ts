/**
 * useNotesNotifications
 * ---------------------
 * Previously used a Supabase Realtime channel to listen for new instructor
 * notes. That channel was removed because Realtime does not enforce RLS by
 * default, creating an authorization gap where any authenticated user could
 * subscribe to another student's note events.
 *
 * Notes are now refreshed via react-query's refetchInterval on the notes
 * query itself (see useStudentNotes / useStudentDashboard), so this hook
 * is intentionally a no-op. It is kept as a stub so existing imports don't
 * break.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useNotesNotifications = (_studentId: string | undefined) => {
  // No-op — Realtime subscription removed for security.
  // Notes data is refreshed via react-query polling.
};
