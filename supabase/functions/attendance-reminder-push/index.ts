import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// Public VAPID key is safe to keep in code; private key comes from a secret.
const VAPID_PUBLIC_KEY =
  "BHCXfNGWHrl1oFBpTCQm-J6s8sTOB7OTeLNCnkuostP6nXEYKzipfWak9touj8AgNKsPbL-imwyYzn5T_MIXmCk";
const VAPID_SUBJECT = "mailto:notify@deckademics.com";

// Wall-clock timezone the studio operates in. Class times are stored as local
// strings (e.g. "3:30 PM - 5:00 PM"), so all date math runs in this zone.
const STUDIO_TZ = Deno.env.get("STUDIO_TIMEZONE") || "America/New_York";

// How long after a class ends before logging attendance is considered overdue.
const OVERDUE_AFTER_HOURS = 2;

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

/** Return a Date whose UTC fields equal the studio-local wall clock "now". */
function studioNow(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STUDIO_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  let hour = get("hour");
  if (hour === 24) hour = 0;
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second")));
}

function getClassDayNumber(day?: string | null): number {
  const normalized = (day || "").trim().toLowerCase().replace(/s$/, "");
  return DAY_NAME_TO_NUMBER[normalized] ?? -1;
}

// Parse the END time from a range like "3:30 PM - 5:00 PM".
function parseClassEndTime(classTime?: string | null): { h: number; m: number } | null {
  if (!classTime) return null;
  const parts = classTime.split("-");
  const endPart = (parts[1] ?? parts[0]).trim();
  const match = endPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return { h, m };
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Most recent occurrence (today or earlier) of the given weekday.
function mostRecentOccurrence(dayOfWeek: number, now: Date): Date {
  const today = startOfDayUTC(now);
  const todayDow = today.getUTCDay();
  let diff = dayOfWeek - todayDow;
  if (diff > 0) diff -= 7;
  return new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
}

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Shared-secret gate: only the scheduled cron (which holds the secret) may run this.
  const cronSecret = Deno.env.get("ATTENDANCE_CRON_SECRET");
  const provided =
    req.headers.get("x-cron-secret") ??
    (await req.clone().json().catch(() => ({})))?.cron_secret;
  if (!cronSecret || provided !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!privateKey) {
      return new Response(JSON.stringify({ error: "Push not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = studioNow();
    const todayStart = startOfDayUTC(now);

    // Active students with a scheduled class day/time.
    const { data: students, error: studentsErr } = await admin
      .from("students")
      .select("id, class_day, class_time")
      .eq("enrollment_status", "active");
    if (studentsErr) throw studentsErr;

    // Compute overdue (student_id -> class_date) for the most recent occurrence.
    type Overdue = { studentId: string; classDate: string };
    const candidates: Overdue[] = [];
    for (const s of students ?? []) {
      const dow = getClassDayNumber(s.class_day);
      if (dow === -1) continue;
      const end = parseClassEndTime(s.class_time);
      if (!end) continue;

      const classDate = mostRecentOccurrence(dow, now);
      const daysAgo = Math.round((todayStart.getTime() - classDate.getTime()) / 86400000);
      if (daysAgo > 7) continue; // ignore stale history

      const classEnd = new Date(classDate);
      classEnd.setUTCHours(end.h, end.m, 0, 0);
      const deadline = new Date(classEnd.getTime() + OVERDUE_AFTER_HOURS * 3600000);
      if (now < deadline) continue; // still within grace window

      candidates.push({ studentId: s.id, classDate: ymd(classDate) });
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ ok: true, overdue: 0, pushed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter to those still missing an attendance record for that date.
    const studentIds = [...new Set(candidates.map((c) => c.studentId))];
    const dates = [...new Set(candidates.map((c) => c.classDate))];
    const { data: attendance } = await admin
      .from("attendance")
      .select("student_id, date")
      .in("student_id", studentIds)
      .in("date", dates);
    const marked = new Set((attendance ?? []).map((a) => `${a.student_id}|${a.date}`));

    const overdue = candidates.filter((c) => !marked.has(`${c.studentId}|${c.classDate}`));
    if (overdue.length === 0) {
      return new Response(JSON.stringify({ ok: true, overdue: 0, pushed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve assigned instructors for each overdue student.
    const overdueStudentIds = [...new Set(overdue.map((o) => o.studentId))];
    const { data: links } = await admin
      .from("student_instructors")
      .select("student_id, instructor_id")
      .in("student_id", overdueStudentIds);

    // Fallback to legacy students.instructor_id where no join rows exist.
    const { data: fallback } = await admin
      .from("students")
      .select("id, instructor_id")
      .in("id", overdueStudentIds);
    const fallbackMap = new Map<string, string | null>(
      (fallback ?? []).map((f) => [f.id, f.instructor_id]),
    );

    const studentToInstructors = new Map<string, Set<string>>();
    for (const l of links ?? []) {
      if (!l.instructor_id) continue;
      if (!studentToInstructors.has(l.student_id)) studentToInstructors.set(l.student_id, new Set());
      studentToInstructors.get(l.student_id)!.add(l.instructor_id);
    }
    for (const sid of overdueStudentIds) {
      if (!studentToInstructors.has(sid)) {
        const inst = fallbackMap.get(sid);
        if (inst) studentToInstructors.set(sid, new Set([inst]));
      }
    }

    // Aggregate per instructor: how many students overdue, and the class dates involved.
    const perInstructor = new Map<string, { count: number; dates: Set<string> }>();
    for (const o of overdue) {
      const insts = studentToInstructors.get(o.studentId);
      if (!insts) continue;
      for (const instId of insts) {
        if (!perInstructor.has(instId)) perInstructor.set(instId, { count: 0, dates: new Set() });
        const agg = perInstructor.get(instId)!;
        agg.count += 1;
        agg.dates.add(o.classDate);
      }
    }

    if (perInstructor.size === 0) {
      return new Response(JSON.stringify({ ok: true, overdue: overdue.length, pushed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instructorIds = [...perInstructor.keys()];

    // Keep only instructors who opted into push.
    const { data: optedIn } = await admin
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", instructorIds)
      .eq("push_notifications", true);
    const optedInIds = new Set((optedIn ?? []).map((p) => p.user_id));

    let pushed = 0;
    let deduped = 0;
    const staleIds: string[] = [];

    for (const instId of instructorIds) {
      if (!optedInIds.has(instId)) continue;
      const agg = perInstructor.get(instId)!;
      const latestDate = [...agg.dates].sort().reverse()[0];

      // Dedupe: at most one reminder per instructor per class date.
      const { error: dedupeErr } = await admin
        .from("attendance_reminder_sent")
        .insert({ instructor_id: instId, class_date: latestDate });
      if (dedupeErr) {
        deduped += 1;
        continue; // unique violation -> already reminded for this date
      }

      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", instId);
      if (!subs || subs.length === 0) continue;

      const noun = agg.count === 1 ? "student" : "students";
      const payload = JSON.stringify({
        title: "Attendance needs logging",
        body: `${agg.count} ${noun} still need attendance marked from a recent class.`,
        url: "/instructor/attendance",
        tag: "attendance-reminder",
      });

      await Promise.all(
        subs.map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload,
            );
            pushed += 1;
          } catch (err) {
            const status = (err as { statusCode?: number })?.statusCode;
            if (status === 404 || status === 410) staleIds.push(s.id);
            else console.error("[attendance-reminder-push] send error", status, (err as Error)?.message);
          }
        }),
      );
    }

    if (staleIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(
      JSON.stringify({ ok: true, overdue: overdue.length, instructors: perInstructor.size, pushed, deduped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[attendance-reminder-push] error", err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});