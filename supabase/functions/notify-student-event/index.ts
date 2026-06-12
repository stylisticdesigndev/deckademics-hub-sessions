import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Public VAPID key is safe to keep in code; private key comes from a secret.
const VAPID_PUBLIC_KEY =
  'BHCXfNGWHrl1oFBpTCQm-J6s8sTOB7OTeLNCnkuostP6nXEYKzipfWak9touj8AgNKsPbL-imwyYzn5T_MIXmCk';
const VAPID_SUBJECT = 'mailto:notify@deckademics.com';

type Kind = 'absent' | 'late' | 'undo_absent';

/** MM/DD/YYYY for a YYYY-MM-DD (or ISO) date string, in a TZ-safe way. */
function formatDateUS(dateStr?: string | null): string {
  if (!dateStr) return '';
  const datePart = dateStr.split('T')[0];
  const [y, m, d] = datePart.split('-');
  if (y && m && d) return `${m}/${d}/${y}`;
  return dateStr;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require an authenticated caller.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    const callerId = userData?.user?.id;
    if (userError || !callerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const student_id = (body?.student_id ?? '').toString();
    const kind = (body?.kind ?? '').toString() as Kind;
    const date = body?.date ? body.date.toString() : null;
    const reason = body?.reason ? body.reason.toString().slice(0, 500) : null;

    if (!student_id || !['absent', 'late', 'undo_absent'].includes(kind)) {
      return new Response(JSON.stringify({ error: 'student_id and a valid kind are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // A student may only fire alerts for themselves.
    if (callerId !== student_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ---- Resolve the full instructor set (service role bypasses RLS) ----
    const instructorIds = new Set<string>();

    const { data: links } = await admin
      .from('student_instructors')
      .select('instructor_id')
      .eq('student_id', student_id);
    (links ?? []).forEach((l: { instructor_id: string | null }) => {
      if (l?.instructor_id) instructorIds.add(l.instructor_id);
    });

    // Fallback to legacy primary column if no link rows exist.
    if (instructorIds.size === 0) {
      const { data: studentRow } = await admin
        .from('students')
        .select('instructor_id')
        .eq('id', student_id)
        .maybeSingle();
      if (studentRow?.instructor_id) instructorIds.add(studentRow.instructor_id as string);
    }

    // Include cover instructors for that specific date.
    if (date) {
      const { data: covers } = await admin
        .from('cover_sessions')
        .select('cover_instructor_id')
        .eq('student_id', student_id)
        .eq('class_date', date.split('T')[0]);
      (covers ?? []).forEach((c: { cover_instructor_id: string | null }) => {
        if (c?.cover_instructor_id) instructorIds.add(c.cover_instructor_id);
      });
    }

    const recipients = [...instructorIds];
    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, notified: 0, pushed: 0, reason: 'no_instructors' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ---- Student display name ----
    const { data: profileRow } = await admin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', student_id)
      .maybeSingle();
    const studentName =
      `${profileRow?.first_name ?? ''} ${profileRow?.last_name ?? ''}`.trim() || 'Your student';

    const friendlyDate = formatDateUS(date);

    // ---- Compose message + push content per kind ----
    let subject: string;
    let content: string;
    let pushTitle: string;
    let pushBody: string;
    if (kind === 'late') {
      subject = 'Running Late';
      content = `Heads up — I'm running late to today's class.`;
      pushTitle = 'Student running late';
      pushBody = `${studentName} is running late to today's class.`;
    } else if (kind === 'undo_absent') {
      subject = 'Absence Cancelled';
      content = `Update — I'll be at class on ${friendlyDate} after all. See you then!`;
      pushTitle = 'Absence cancelled';
      pushBody = `${studentName} will attend class on ${friendlyDate} after all.`;
    } else {
      subject = 'Marked Absent';
      content = reason
        ? `Heads up — I won't be at class on ${friendlyDate}. Reason: ${reason}`
        : `Heads up — I won't be at class on ${friendlyDate}.`;
      pushTitle = 'Student marked absent';
      pushBody = `${studentName} won't be at class on ${friendlyDate}.`;
    }

    const url = `/instructor/messages?from=${student_id}`;

    // ---- Insert in-app messages (always lands) ----
    const messageRows = recipients.map((instructorId) => ({
      sender_id: student_id,
      receiver_id: instructorId,
      subject,
      content,
    }));
    const { error: msgErr } = await admin.from('messages').insert(messageRows);
    if (msgErr) {
      console.error('[notify-student-event] message insert failed', msgErr);
    }
    const notified = msgErr ? 0 : recipients.length;

    // ---- Best-effort web push to opted-in instructors ----
    let pushed = 0;
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (privateKey) {
      try {
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);

        const { data: optedIn } = await admin
          .from('notification_preferences')
          .select('user_id')
          .in('user_id', recipients)
          .eq('push_notifications', true);
        const optedInIds = (optedIn ?? []).map((p: { user_id: string }) => p.user_id);

        if (optedInIds.length > 0) {
          const { data: subs } = await admin
            .from('push_subscriptions')
            .select('id, endpoint, p256dh, auth')
            .in('user_id', optedInIds);

          const payload = JSON.stringify({ title: pushTitle, body: pushBody, url });
          const staleIds: string[] = [];

          await Promise.all(
            (subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
              try {
                await webpush.sendNotification(
                  { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                  payload
                );
                pushed++;
              } catch (err) {
                const status = (err as { statusCode?: number })?.statusCode;
                if (status === 404 || status === 410) {
                  staleIds.push(s.id);
                } else {
                  console.error('[notify-student-event] push error', status, (err as Error)?.message);
                }
              }
            })
          );

          if (staleIds.length > 0) {
            await admin.from('push_subscriptions').delete().in('id', staleIds);
          }
        }
      } catch (pushErr) {
        console.error('[notify-student-event] push block failed', pushErr);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, notified, pushed, instructors: recipients.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[notify-student-event] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});