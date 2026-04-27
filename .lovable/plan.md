## Goal
Let instructors, on their **Attendance** page, schedule a make-up class for any student marked **Absent**, and then mark that make-up day as **Attended** or **Not Attended**.

## Data model

Create a new table `student_makeups` (no FKs, matching existing convention):

```
id              uuid PK
student_id      uuid not null
instructor_id   uuid not null
absence_date    date not null   -- the original missed class date
makeup_date     date not null   -- the scheduled make-up
status          text not null default 'scheduled'  -- 'scheduled' | 'attended' | 'not_attended'
notes           text
created_at      timestamptz default now()
updated_at      timestamptz default now()
unique (student_id, absence_date)
```

RLS:
- Admins: ALL via `has_role(auth.uid(),'admin')`
- Instructors: ALL where `instructor_id = auth.uid()`
- Students: SELECT where `student_id = auth.uid()`

Trigger to keep `updated_at` fresh.

## UI changes — `InstructorAttendance.tsx`

For every row where `status === 'absent'` (current week or past weeks):

1. Show a small **"Schedule Make-up"** button next to the Absent badge.
2. Clicking opens a `Popover` with a `Calendar` (single date, `fromDate={today}`) → on select, upsert into `student_makeups`.
3. Once a make-up exists for that absence, replace the button with a compact card:
   - "Make-up: {MM/DD/YYYY}" + status badge (Scheduled / Attended / Not Attended)
   - Two buttons: **Attended** (green) / **Not Attended** (red) that update `status`
   - **Reschedule** link reopens the calendar popover

## Hook

New `src/hooks/instructor/useInstructorMakeups.ts`:
- `makeupsByAbsence`: Map keyed by `${studentId}|${absenceDate}` → makeup row
- `scheduleMakeup(studentId, absenceDate, makeupDate)` → upsert
- `setMakeupStatus(makeupId, 'attended' | 'not_attended')`
- React Query for caching + invalidation; no manual refresh button (per project rule)

`useInstructorAttendance` stays untouched; the new hook is composed in the page.

## Demo mode
Add 1–2 mock makeup entries in the existing `DEMO_STUDENTS` flow so the UI is visible in Demo.

## Out of scope (call out)
- No admin-side change in this pass — admin attendance page already has its own makeup flow.
- No auto-notifications to student about scheduled make-up (can be added later).

## Files
- **New migration**: `student_makeups` table + RLS + trigger
- **New**: `src/hooks/instructor/useInstructorMakeups.ts`
- **New**: `src/components/instructor/attendance/MakeupControl.tsx` (popover + status buttons)
- **Edit**: `src/pages/instructor/InstructorAttendance.tsx` (render `<MakeupControl>` on absent rows in both current-week and past-weeks sections)
