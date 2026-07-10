import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeReadiness, nextLevelOf, normalizeLevel } from '@/lib/skillMilestones';
import { getOverdueAttendanceStudents } from '@/lib/attendanceReminder';

export interface UserNotification {
  id: string;
  type: 'message' | 'announcement' | 'photo_reminder' | 'level_reminder' | 'attendance_reminder';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const useUserNotifications = (userId?: string, userRole?: 'student' | 'instructor') => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['user-notifications', userId, userRole],
    queryFn: async (): Promise<UserNotification[]> => {
      if (!userId || !userRole) return [];

      // Fetch unread messages
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, sent_at, subject, sender_id, profiles!messages_sender_id_fkey(first_name, last_name)')
        .eq('receiver_id', userId)
        .is('read_at', null)
        .order('sent_at', { ascending: false })
        .limit(25);

      // Fetch announcements targeted at this role
      const { data: announcements } = await supabase
        .from('announcements')
        .select(`
          id, title, content, published_at,
          announcement_reads!left(id, user_id)
        `)
        .contains('target_role', [userRole])
        .order('published_at', { ascending: false })
        .limit(25);

      const messageNotifications: UserNotification[] = (messages || []).map((m: any) => {
        const senderName = m.profiles
          ? `${m.profiles.first_name || ''} ${m.profiles.last_name || ''}`.trim()
          : 'Unknown';
        return {
          id: m.id,
          type: 'message' as const,
          title: m.subject || `Message from ${senderName}`,
          message: m.content?.substring(0, 100) || '',
          read: false,
          created_at: m.sent_at || new Date().toISOString(),
        };
      });

      const announcementNotifications: UserNotification[] = (announcements || [])
        .filter((a: any) => {
          const reads = a.announcement_reads || [];
          return !reads.some((r: any) => r.user_id === userId);
        })
        .map((a: any) => ({
          id: a.id,
          type: 'announcement' as const,
          title: a.title,
          message: a.content?.substring(0, 100) || '',
          read: false,
          created_at: a.published_at || new Date().toISOString(),
        }));

      // Instructor-only: persistent reminder about assigned students missing a
      // profile photo. Photos let cover instructors identify students, so this
      // reminder cannot be dismissed until every student has one.
      const photoReminders: UserNotification[] = [];
      const levelReminders: UserNotification[] = [];
      const attendanceReminders: UserNotification[] = [];
      if (userRole === 'instructor') {
        // Only consider students assigned to THIS instructor (primary or secondary).
        const { data: links } = await supabase
          .from('student_instructors' as any)
          .select('student_id')
          .eq('instructor_id', userId);
        const assignedIds = ((links as any[]) || []).map((l: any) => l.student_id);
        let ids: string[] = [];
        let assignedRows: any[] = [];
        if (assignedIds.length > 0) {
          const { data: assigned } = await supabase
            .from('students')
            .select('id, level, enrollment_status, class_day, class_time')
            .in('id', assignedIds)
            .eq('enrollment_status', 'active');
          assignedRows = assigned || [];
          ids = (assigned || []).map((s: any) => s.id);
        }
        if (ids.length > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', ids);
          const missing = (profs || []).filter(
            (p: any) => !p.avatar_url || String(p.avatar_url).trim() === '',
          );
          if (missing.length > 0) {
            const names = missing
              .map((p: any) => `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'A student')
              .join(', ');
            photoReminders.push({
              id: 'photo-reminder',
              type: 'photo_reminder',
              title: `${missing.length} student${missing.length === 1 ? '' : 's'} missing a profile photo`,
              message: `Please remind ${names} to add a photo so cover instructors can identify them.`,
              read: false,
              created_at: new Date().toISOString(),
            });
          }

          // Persistent reminder about assigned students who meet the skill
          // requirements to move up a level. This is informational only — the
          // instructor decides whether/when to actually advance them.
          const nameById: Record<string, string> = {};
          (profs || []).forEach((p: any) => {
            nameById[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'A student';
          });

          // Reminder to log attendance for classes that already ended and are
          // still unmarked. Cover sessions aside, we nudge on assigned students'
          // most recent past class within the last week.
          const { data: attRecords } = await supabase
            .from('attendance')
            .select('student_id, date, status')
            .in('student_id', ids);
          const attendanceMap: Record<string, Record<string, 'present' | 'absent'>> = {};
          ((attRecords as any[]) || []).forEach((r: any) => {
            if (!attendanceMap[r.student_id]) attendanceMap[r.student_id] = {};
            attendanceMap[r.student_id][r.date] = r.status;
          });
          const overdueNames = getOverdueAttendanceStudents(
            assignedRows.map((s: any) => ({
              id: s.id,
              name: nameById[s.id] || 'A student',
              classDay: s.class_day,
              classTime: s.class_time,
            })),
            attendanceMap,
          );
          if (overdueNames.length > 0) {
            attendanceReminders.push({
              id: 'attendance-reminder',
              type: 'attendance_reminder',
              title: `Attendance not logged for ${overdueNames.length} class${overdueNames.length === 1 ? '' : 'es'}`,
              message: `Please record attendance for ${overdueNames.join(', ')}.`,
              read: false,
              created_at: new Date().toISOString(),
            });
          }

          const [{ data: skills }, { data: progress }] = await Promise.all([
            supabase
              .from('progress_skills' as any)
              .select('name, level, is_core'),
            supabase
              .from('student_progress')
              .select('student_id, skill_name, proficiency')
              .in('student_id', ids),
          ]);

          const allSkills = (skills as any[]) || [];
          const skillNames = new Set(allSkills.map((s: any) => s.name));
          const progressMap: Record<string, Record<string, number>> = {};
          ((progress as any[]) || []).forEach((row: any) => {
            if (row.skill_name && skillNames.has(row.skill_name)) {
              if (!progressMap[row.student_id]) progressMap[row.student_id] = {};
              progressMap[row.student_id][row.skill_name] = row.proficiency || 0;
            }
          });

          const readyNames: string[] = [];
          assignedRows.forEach((s: any) => {
            const level = normalizeLevel(s.level);
            // Only levels below advanced can advance further.
            if (!nextLevelOf(s.level)) return;
            const levelSkills = allSkills.filter(
              (sk: any) => normalizeLevel(sk.level) === level,
            );
            if (levelSkills.length === 0) return;
            const studentProgress = progressMap[s.id] || {};
            const readiness = computeReadiness(
              levelSkills.map((sk: any) => ({
                proficiency: studentProgress[sk.name] || 0,
                is_core: sk.is_core ?? true,
              })),
            );
            if (readiness.isReady) readyNames.push(nameById[s.id] || 'A student');
          });

          if (readyNames.length > 0) {
            levelReminders.push({
              id: 'level-reminder',
              type: 'level_reminder',
              title: `${readyNames.length} student${readyNames.length === 1 ? '' : 's'} ready to advance a level`,
              message: `${readyNames.join(', ')} meet${readyNames.length === 1 ? 's' : ''} the requirements to move up. Advance them when you feel they're ready.`,
              read: false,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      return [...photoReminders, ...levelReminders, ...messageNotifications, ...announcementNotifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useMutation({
    mutationFn: async (notification: UserNotification) => {
      if (notification.type === 'photo_reminder' || notification.type === 'level_reminder') {
        // Persistent reminder — cannot be marked read until resolved.
        return;
      }
      if (notification.type === 'message') {
        const { error } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('announcement_reads')
          .insert({ announcement_id: notification.id, user_id: userId! });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', userId, userRole] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const unreadMessages = notifications.filter(n => n.type === 'message' && !n.read);
      const unreadAnnouncements = notifications.filter(n => n.type === 'announcement' && !n.read);

      const promises: PromiseLike<any>[] = [];

      if (unreadMessages.length > 0) {
        promises.push(
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('receiver_id', userId)
            .is('read_at', null)
            .then()
        );
      }

      if (unreadAnnouncements.length > 0) {
        const inserts = unreadAnnouncements.map(a => ({
          announcement_id: a.id,
          user_id: userId,
        }));
        promises.push(supabase.from('announcement_reads').insert(inserts).then());
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications', userId, userRole] });
    },
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
};
