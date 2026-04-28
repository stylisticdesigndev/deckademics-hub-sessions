
# Instructor Dashboard — Bug Fixes + Feature Upgrades

Seven items shipped together. Bugs first (no schema changes), then the two features (the cover-class feature requires a small DB change).

---

## Bug 1 — Class Time column wraps on tablet portrait

**File:** `src/components/instructor/dashboard/StudentTable.tsx`

The desktop table shows on `sm:` (≥640px). At tablet portrait widths the 20% Class Time cell isn't wide enough for "5:30 PM - 7:00 PM" so it wraps.

Changes:
- Re-balance column widths: Student 30%, Progress 25%, Level 15%, Class Time 30%.
- Add `whitespace-nowrap` to the Class Time `<TableCell>` so the slot stays on one line.
- Replace the spaces around the dash in the displayed string with a non-breaking sequence (`5:30 PM\u00A0-\u00A05:00 PM`) defensively in the formatter that builds `classTime`, so other consumers also benefit.

No horizontal scroll added — the percentages still total 100%.

---

## Bug 2 — Dismissed announcements reappear on student/mobile

**Files:**
- `src/hooks/student/dashboard/useAnnouncements.ts`
- `src/hooks/student/useStudentDashboardActions.ts` (already inserts `dismissed: true` correctly)

Root cause: the `announcements` query joins `announcement_reads!left` without filtering, so the row is returned. The hook then walks `readRecords` looking for `r.user_id === user.id` — but the `select` string only pulls `id, read_at, user_id`, *not* `dismissed`. `isDismissed` is therefore always `false` and the row is shown again after refresh.

Fix:
- Update the embedded select in `useAnnouncements.ts` from `announcement_reads!left (id, read_at, user_id)` to `announcement_reads!left (id, read_at, user_id, dismissed)`.
- Verify the same select in `InstructorAnnouncements.tsx` already includes `dismissed` (it does in `handleDismiss`'s update path, but its initial fetch must also pull it). Patch its initial select the same way.
- After insert/update of `dismissed: true`, also remove the row from local state immediately (already done in actions hook — confirm parity in instructor page).

---

## Bug 3 — "Pay Period" column blank on Instructor → My Payments

**File:** `src/pages/instructor/InstructorLedger.tsx`

The page reads `pay_period_start/end` only from `instructor_payments` rows joined via `payment_id`. For unpaid ledger entries (no `payment_id` yet) this is fine — they show "—". But for paid rows, `instructor_payments` selects rely on RLS `instructor_id = auth.uid()`. Some legacy paid rows have `payment_id` referencing a row the instructor can't read, so the map lookup returns undefined → blank.

Fix:
- Compute a deterministic pay-period locally for every ledger row by deriving the **pay period that contains `class_date`** (school uses bi-weekly Mon→Sun periods anchored to a fixed reference date). Add a helper `getPayPeriodForDate(date)` in `src/utils/payPeriods.ts` returning `{ start, end }`.
- Always display the computed pay period. If the row is `paid` and we *also* have a matching `instructor_payments` row, prefer that row's stored period (source of truth); otherwise fall back to the computed one.
- This guarantees the Pay Period column is never blank and remains accurate after the row gets attached to an `instructor_payments` record.

(No DB change. If the user has a different anchor/cadence, we'll expose the constants at the top of `payPeriods.ts` for easy tweaking.)

---

## Bug 4 — Past weeks: missing Present/Absent buttons

**File:** `src/pages/instructor/InstructorAttendance.tsx` — Past Weeks section (lines 168–202)

The Past Weeks card only renders a `StatusBadge` and the makeup control. The Present/Absent buttons exist only in `StudentAttendanceRow` (used for current week).

Fix:
- Refactor Past Weeks rows to reuse `StudentAttendanceRow` with `isPast={true}`, so the same Present/Absent buttons render for every historical date.
- `StudentAttendanceRow` already wires `onMark` → `markAttendance(studentId, dateStr, status)`, which triggers the `attendance_to_ledger` DB trigger → flat-fee payroll. No payroll code change required.
- Keep the makeup control rendering identical to today.

---

## Bug 5 — Mobile/tablet taps don't open the Level dropdown

**File:** `src/pages/instructor/InstructorStudents.tsx` (around line 455)

The Level cell is in its own column and not wrapped in the row's click handler, so the Radix `<Select>` trigger should work. But on touch devices the small `Pencil` button (24×24) requires a precise tap, and once `isEditingLevel` flips on, the same tap can race with the trigger so the dropdown doesn't open.

Fix:
- Eliminate the two-step "click pencil → then click select" pattern. Render the `<Select>` trigger inline at all times (styled as a small badge button). Tapping it directly opens the menu — one gesture, no race.
- Add `touch-manipulation` and `relative z-10` to the trigger; ensure no parent has `pointer-events-none` during loading.
- Stop click propagation on the trigger (`onClick={(e) => e.stopPropagation()}`) so the row's drill-in handler never intercepts the tap.

---

## Feature 6 — Sticky header across all roles

**File:** `src/components/layout/DashboardLayout.tsx`

Make the `<header>` element pinned. The current layout has `<div className="flex-1 overflow-auto">` containing the header + main, so a normal `sticky top-0` works.

Changes:
- On the header: `sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm border-b border-border`.
- If the Admin Mode banner is shown, wrap header+banner in a single sticky container so both pin together.
- No layout reflow needed — `<main>` already scrolls inside the same flex column. Verified for student/instructor/admin.

---

## Feature 7 — Secondary instructor + Cover sessions (shared full pay)

**Goal:** A student can have multiple instructors. Each instructor who teaches a given time slot earns the full session fee for that slot, independently.

### DB changes (one migration)

```sql
-- Many-to-many assignment
create table public.student_instructors (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'primary',          -- 'primary' | 'secondary'
  created_at timestamptz not null default now(),
  unique (student_id, instructor_id)
);
alter table public.student_instructors enable row level security;
-- RLS: admins all; instructors see rows where instructor_id = auth.uid();
--      students see rows where student_id = auth.uid().

-- One-off cover sessions (a student appears on a different instructor's roster
-- for a single date+time slot)
create table public.cover_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  cover_instructor_id uuid not null references public.profiles(id) on delete cascade,
  class_date date not null,
  class_time text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (student_id, class_date, class_time, cover_instructor_id)
);
alter table public.cover_sessions enable row level security;
-- RLS: admins all; cover_instructor sees own; original instructor read-only.

-- Loosen ledger uniqueness so multiple instructors can both earn for the same slot.
-- Existing constraint is per (instructor_id, class_date, class_time) — keep it.
-- The trigger attendance_to_ledger already inserts per (instructor_id, slot),
-- so once the trigger is updated to fan out across all assigned/cover instructors,
-- each one gets their own row.
```

Then update the `attendance_to_ledger()` trigger to:
1. Resolve the *set* of instructors that should be paid for this `(student_id, date, class_time)`:
   - All rows from `student_instructors` for that student, **plus**
   - Any `cover_sessions` whose `(student_id, class_date, class_time)` match.
2. For each instructor in the set, upsert the same flat-fee ledger row (`ON CONFLICT DO NOTHING` on the existing unique constraint), so no duplicates per instructor per slot.
3. Backfill `student_instructors` from `students.instructor_id` (one row per current primary).

### Frontend changes

- **Admin → Student detail / assignment dialog:** allow assigning multiple instructors with a role of Primary or Secondary. Writes go to `student_instructors`. Keep `students.instructor_id` in sync with the row marked Primary (legacy compat).
- **Instructor roster query (`useInstructorAttendance`, `useInstructorStudentsSimple`, `useInstructorDashboard`):** switch from `students.instructor_id = me` to "students where I am in `student_instructors` OR I have a `cover_sessions` row that matches today/this week". Cover-only students appear only on the matching date+slot.
- **"Add Cover Session" button** on Instructor Attendance page: opens a small dialog (student picker filtered to the school's roster, date picker, time-slot picker). Inserts into `cover_sessions`. The student then appears on the cover instructor's Today's Students for that day with full notes/messaging.
- **Payroll display:** no UI change required — each instructor's ledger naturally shows their own flat-fee row for the slot once the trigger fans out.

### RLS notes

- Profile/student visibility for secondary + cover instructors: extend the existing `Instructors can view assigned student profiles` policy to also match via `student_instructors` and `cover_sessions`.
- Same for `students` table SELECT/UPDATE policies and `student_progress`, `student_notes`, `attendance` policies that currently key off `students.instructor_id = auth.uid()`.

---

## Out of scope / assumptions

- Pay period anchor for Bug 3 will be set to bi-weekly Monday→Sunday starting Mon 2024-01-01. Easy to change in one constant.
- The cover-pay rule "every teaching instructor gets full pay" matches your latest answer; admin can still void individual ledger rows from the existing payroll UI if they want to override.
- Sticky header doesn't change any existing scroll behavior inside `<main>`.

## Files touched (summary)

- `src/components/instructor/dashboard/StudentTable.tsx`
- `src/hooks/student/dashboard/useAnnouncements.ts`
- `src/pages/instructor/InstructorAnnouncements.tsx`
- `src/utils/payPeriods.ts` (new)
- `src/pages/instructor/InstructorLedger.tsx`
- `src/pages/instructor/InstructorAttendance.tsx`
- `src/pages/instructor/InstructorStudents.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/hooks/instructor/useInstructorAttendance.ts`, `useInstructorDashboard.ts`, `useInstructorStudentsSimple.ts`
- `src/components/admin/student-assignment/StudentAssignmentDialog.tsx`
- `src/components/instructor/attendance/AddCoverSessionDialog.tsx` (new)
- One migration: `student_instructors`, `cover_sessions`, RLS, updated `attendance_to_ledger` trigger, backfill.
