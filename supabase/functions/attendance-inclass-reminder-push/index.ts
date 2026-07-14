import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const VAPID_PUBLIC_KEY =
  "BHCXfNGWHrl1oFBpTCQm-J6s8sTOB7OTeLNCnkuostP6nXEYKzipfWak9touj8AgNKsPbL-imwyYzn5T_MIXmCk";
const VAPID_SUBJECT = "mailto:notify@deckademics.com";

const STUDIO_TZ = Deno.env.get("STUDIO_TIMEZONE") || "America/New_York";

// How wide the trigger window is. Cron runs every 5 min, so any reminder whose
// scheduled fire time falls inside the last WINDOW_MIN minutes will be sent.
const WINDOW_MIN = 6; // small overlap prevents gaps at 5-min cron boundaries

// Reminder offsets (in minutes)
const START_OFFSET_MIN = 15;   // 15 min after class start
const END_LEAD_MIN = 15;       // 15 min before class end

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

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

function parseClassRange(classTime?: string | null): { start: { h: number; m: number }; end: { h: number; m: number } } | null {
  if (!classTime) return null;
  const parts = classTime.split("-");
  if (parts.length !== 2) return null;
  const parseOne = (s: string) => {
    const m = s.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const mer = m[3].toUpperCase();
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return { h, m: min };
  };
  const start = parseOne(parts[0]);
  const end = parseOne(parts[1]);
  if (!start || !end) return null;
  return { start, end };
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
    const todayDow = now.getUTCDay();
    const todayStr = ymd(now);

    // Pull today's active students with a schedule
    const { data: students, error: studentsErr } = await admin
      .from("students")
      .select("id, class_day, class_time")
      .eq("enrollment_status", "active");
    if (studentsErr) throw studentsErr;

    // Group students by class_time (today's classes only)
    type ClassSlot = { classTime: string; studentIds: Set<string>; startAt: Date; endAt: Date };
    const slots = new Map<string, ClassSlot>();

    for (const s of students ?? []) {
      const dow = getClassDayNumber(s.class_day);
      if (dow !== todayDow) continue;
      const range = parseClassRange(s.class_time);
      if (!range) continue;
      const key = s.class_time as string;
      if (!slots.has(key)) {
        const startAt = new Date(now);
        startAt.setUTCHours(range.start.h, range.start.m, 0, 0);
        const endAt = new Date(now);
        endAt.setUTCHours(range.end.h, range.end.m, 0, 0);
        slots.set(key, { classTime: key, studentIds: new Set(), startAt, endAt });
      }
      slots.get(key)!.studentIds.add(s.id);
    }

    // Determine which slot/kind should fire in this run
    type Fire = { slot: ClassSlot; kind: "start" | "end" };
    const toFire: Fire[] = [];
    for (const slot of slots.values()) {
      const startFire = new Date(slot.startAt.getTime() + START_OFFSET_MIN * 60000);
      const endFire = new Date(slot.endAt.getTime() - END_LEAD_MIN * 60000);
      const windowStart = new Date(now.getTime() - WINDOW_MIN * 60000);
      if (startFire >= windowStart && startFire <= now) toFire.push({ slot, kind: "start" });
      if (endFire >= windowStart && endFire <= now) toFire.push({ slot, kind: "end" });
    }

    if (toFire.length === 0) {
      return new Response(JSON.stringify({ ok: true, checked: slots.size, fired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect all student IDs involved so we can compute who's already fully marked
    const allStudentIds = [...new Set(toFire.flatMap(f => [...f.slot.studentIds]))];
    const { data: attendance } = await admin
      .from("attendance")
      .select("student_id, date")
      .in("student_id", allStudentIds)
      .eq("date", todayStr);
    const marked = new Set((attendance ?? []).map(a => `${a.student_id}|${a.date}`));

    // Resolve instructors for each student: primary/secondary + covers today
    const { data: links } = await admin
      .from("student_instructors")
      .select("student_id, instructor_id")
      .in("student_id", allStudentIds);
    const { data: covers } = await admin
      .from("cover_sessions")
      .select("student_id, cover_instructor_id, class_date, class_time")
      .in("student_id", allStudentIds)
      .eq("class_date", todayStr);

    const studentToInstructors = new Map<string, Set<string>>();
    for (const l of links ?? []) {
      if (!l.instructor_id) continue;
      if (!studentToInstructors.has(l.student_id)) studentToInstructors.set(l.student_id, new Set());
      studentToInstructors.get(l.student_id)!.add(l.instructor_id);
    }
    for (const c of covers ?? []) {
      if (!c.cover_instructor_id) continue;
      if (!studentToInstructors.has(c.student_id)) studentToInstructors.set(c.student_id, new Set());
      studentToInstructors.get(c.student_id)!.add(c.cover_instructor_id);
    }

    // For each fire, aggregate per instructor + skip if all their students in that slot are marked
    type Push = { instructorId: string; slot: ClassSlot; kind: "start" | "end"; unmarkedCount: number };
    const pushes: Push[] = [];

    for (const f of toFire) {
      // instructor -> set of unmarked students in this slot
      const perInst = new Map<string, Set<string>>();
      for (const sid of f.slot.studentIds) {
        const insts = studentToInstructors.get(sid);
        if (!insts) continue;
        const isMarked = marked.has(`${sid}|${todayStr}`);
        if (isMarked) continue;
        for (const iid of insts) {
          if (!perInst.has(iid)) perInst.set(iid, new Set());
          perInst.get(iid)!.add(sid);
        }
      }
      for (const [iid, unmarked] of perInst.entries()) {
        if (unmarked.size === 0) continue;
        pushes.push({ instructorId: iid, slot: f.slot, kind: f.kind, unmarkedCount: unmarked.size });
      }
    }

    if (pushes.length === 0) {
      return new Response(JSON.stringify({ ok: true, fired: toFire.length, pushed: 0, reason: "all_marked_or_no_instructor" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedupe per instructor+date+time+kind and only push opted-in instructors
    const instructorIds = [...new Set(pushes.map(p => p.instructorId))];
    const { data: optedIn } = await admin
      .from("notification_preferences")
      .select("user_id")
      .in("user_id", instructorIds)
      .eq("push_notifications", true);
    const optedInIds = new Set((optedIn ?? []).map(p => p.user_id));

    let pushed = 0;
    let deduped = 0;
    const staleIds: string[] = [];

    for (const p of pushes) {
      if (!optedInIds.has(p.instructorId)) continue;

      // Reserve the dedupe row first (unique constraint prevents duplicates)
      const { error: dedupeErr } = await admin
        .from("attendance_inclass_reminder_sent")
        .insert({
          instructor_id: p.instructorId,
          class_date: todayStr,
          class_time: p.slot.classTime,
          kind: p.kind,
        });
      if (dedupeErr) { deduped += 1; continue; }

      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", p.instructorId);
      if (!subs || subs.length === 0) continue;

      const noun = p.unmarkedCount === 1 ? "student" : "students";
      const title = p.kind === "start"
        ? "Class is rolling — take attendance"
        : "Wrap-up time — log attendance";
      const body = p.kind === "start"
        ? `${p.unmarkedCount} ${noun} in your ${p.slot.classTime} class still need attendance.`
        : `Class ends soon. ${p.unmarkedCount} ${noun} still unmarked in the ${p.slot.classTime} class.`;
      const url = `/instructor/attendance/quick?classTime=${encodeURIComponent(p.slot.classTime)}`;
      const payload = JSON.stringify({
        title,
        body,
        url,
        tag: `inclass-attendance-${p.slot.classTime}-${p.kind}`,
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
            else console.error("[attendance-inclass-reminder-push] send error", status, (err as Error)?.message);
          }
        }),
      );
    }

    if (staleIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", staleIds);
    }

    return new Response(
      JSON.stringify({ ok: true, slots: slots.size, fired: toFire.length, pushed, deduped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[attendance-inclass-reminder-push] error", err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});