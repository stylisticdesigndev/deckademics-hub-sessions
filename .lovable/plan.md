## Big Batch — Data, Profiles, Messaging, Attendance, Payroll, Mobile

I'll ship every item in one pass. Where I found a clear root cause during exploration I've called it out so you know exactly what's being fixed.

---

### 1. Data integrity — Nick (Owner) sees everything Evan sees

**Root cause found:** Both Nick and Evan have `profile.role = 'instructor'` but the `user_roles` table has them as `admin`. Most admin pages are gated correctly via the `is_admin()` security definer, but a handful of components/queries still read `profile.role` directly — which is why Nick (treated as instructor in some spots) sees a smaller slice than Evan.

- **Audit & switch every admin gate to `user_roles**` — sweep the codebase for `profile?.role === 'admin'` / `userData.profile.role === 'admin'` and replace with the `isAdminUser(email)` helper or a `useIsAdmin()` hook backed by `user_roles`.
- **Single source of truth for student lists** — `useAdminStudents` already queries `students` directly with RLS doing the filtering. I'll make sure Nick's session loads it the same way Evan's does (no extra `.eq('instructor_id', ...)` filter sneaks in for users whose `profile.role` says instructor).
- **Add a `useCurrentUserRoles()` hook** that reads from `user_roles` once on login and caches it in the auth provider — every gate uses this instead of `profile.role`.

### 2. Student registration & profiles — phone + pronouns

**DB change required:** `profiles` table currently has no `phone` or `pronouns` column (verified). Migration:

- `ALTER TABLE profiles ADD COLUMN phone text, ADD COLUMN pronouns text;`

Then:

- **Student signup form (`SignupForm.tsx`)** — add required Phone + Pronouns (free-text) fields. Block submit if blank.
- `**StudentProfileSetup.tsx**` — add required Pronouns field; mark Phone required (currently optional).
- **Student profile page** — display phone + pronouns.
- **Instructor's student detail view (`InstructorStudents.tsx` + student row/sheet)** — show phone + pronouns next to name/level.
- **Dashboard student-name click → individual profile** — wire student name links on instructor & admin dashboards to navigate to `/instructor/students/:id` (or admin equivalent) instead of the generic list. I'll add the route + a basic detail view if one doesn't already exist.

### 3. Messaging — two-way default, toggle, Running Late, compose fix

**DB change required:**

- `ALTER TABLE classes ADD COLUMN two_way_messaging boolean NOT NULL DEFAULT true;` (or store on the instructor↔student relationship — I'll put it on `students` as `two_way_messaging boolean default true` since classes aren't 1:1 with the messaging context here).
- New table `student_status` for the Running Late button: `id, student_id, status text, set_at timestamptz, expires_at timestamptz` with RLS (student can insert/update own; instructor of student can read).

Implementation:

- **Two-way default ON** + instructor toggle in the conversation thread header. When OFF, students see a "This conversation is read-only — your instructor has disabled replies" banner and the reply box is hidden. Instructor can still send.
- **Compose recipient bug** — `InstructorMessages.tsx` fetches `students` by `instructor_id` but does NOT filter by `enrollment_status`. Confirmed not a query bug — the issue is that some assigned students are `enrollment_status = 'inactive'` (8 inactive vs 4 active in DB). I'll change compose to show **all assigned students regardless of status** and label inactive ones with a small badge so the instructor can see and pick them.
- **"Running Late" button on student dashboard** — sets `student_status = 'late'` (auto-expires after 2 hrs), inserts a message to the assigned instructor (`"<Student> is running late"`), and triggers a browser/PWA push notification via the existing notifications system.

### 4. Attendance + Payment Ledger

**Root cause of "Failed to update":** The `attendance.class_id` column is UUID and the RLS policy requires `EXISTS (SELECT FROM classes c WHERE c.id = attendance.class_id AND c.instructor_id = auth.uid())`. The current code inserts the literal string `'schedule'` as `class_id`, which (a) isn't a valid UUID, and (b) has no matching `classes` row, so RLS denies the write.

**Fix:**

- DB: change `attendance.class_id` to **nullable** and loosen the instructor RLS policy to allow inserts/updates when the student is assigned to that instructor (`EXISTS (SELECT FROM students s WHERE s.id = attendance.student_id AND s.instructor_id = auth.uid())`), regardless of `class_id`. This matches the schedule-based attendance model the app actually uses.
- Code: stop sending `class_id: 'schedule'`, leave it null.
- **Allow editing any past date** — remove any client-side date guards in `InstructorAttendance.tsx` so instructors can pick and edit attendance for any historical date via a date picker added to the page.

**Payment Ledger — auto from attendance:**

- New table `instructor_ledger_entries`: `id, instructor_id, student_id, class_date, hours numeric, hourly_rate numeric, amount numeric (generated), source text default 'attendance', payment_id uuid null, created_at`. RLS: instructor sees own; admins see all.
- DB trigger on `attendance` insert/update: when status becomes `present` (or `absent` — class still happened), upsert a ledger entry per (instructor, class_date) at `instructor.hourly_rate × class duration` (default 1.5 hrs from existing schedule blocks). Deduplicates per day.
- **Instructor view** at `/instructor/payroll` (or new "Ledger" tab on existing payments page) — shows tallied unpaid hours grouped by week with totals.
- **Owner-only (Nick) admin view** — a "Generate Payments" panel on the existing `AdminInstructorPayments` page that:
  - Lists every instructor with their unpaid ledger total.
  - "Generate payment" button per instructor → creates an `instructor_payments` row covering all unpaid ledger entries and stamps `payment_id` on those entries.
  - "Generate for all" button does the above in one batch.
- Gated by the existing `canAccessPayroll(email)` (Owner only).

### 5. Mobile + UI polish

- **Hamburger menu closes on link click** — patch `DashboardLayout.tsx` (or the mobile sidebar component) so navigating fires `setOpen(false)` immediately on `<NavLink onClick>` rather than waiting for route effect.
- **Vertical list view on mobile for class schedule** — in `InstructorClasses.tsx` (and student equivalent if it shares the issue), at `< md` breakpoint render a stacked vertical list of time slots instead of the side-by-side grid that overlaps.
- **Student Level dropdown on mobile** — the current Radix `<Select>` in the student row likely has a `pointer-events` / `touch-action` issue on mobile, or the row's click handler is swallowing the touch. I'll: (a) stop event propagation on the Select trigger, (b) ensure the `SelectContent` portals correctly, (c) verify the `updateStudentLevel` mutation is wired to the `onValueChange` and not an outer form. Test on the 390px viewport.

---

### Files & migrations summary

**Migrations:**

1. Add `phone`, `pronouns` to `profiles`.
2. Add `two_way_messaging` to `students` (default true).
3. Create `student_status` table + RLS.
4. Make `attendance.class_id` nullable + replace instructor RLS policy.
5. Create `instructor_ledger_entries` table + RLS + trigger from `attendance`.

**New files:** `src/hooks/useIsAdmin.ts`, `src/hooks/useStudentStatus.ts`, `src/hooks/useInstructorLedger.ts`, `src/components/student/RunningLateButton.tsx`, `src/components/instructor/messages/TwoWayToggle.tsx`, `src/pages/instructor/InstructorStudentDetail.tsx` (if missing), `src/pages/instructor/InstructorLedger.tsx`.

**Edited files (high-level):** `AuthProvider.tsx`, `ProtectedRoute.tsx`, `SignupForm.tsx`, `StudentProfileSetup.tsx`, `StudentProfile.tsx`, `InstructorStudents.tsx`, `InstructorMessages.tsx`, `ConversationThread.tsx` (instructor + student), `InstructorAttendance.tsx`, `useInstructorAttendance.ts`, `AdminInstructorPayments.tsx`, `DashboardLayout.tsx`, `InstructorClasses.tsx`, plus the admin-role audit sweep.

No data migrations needed beyond schema; existing rows backfill cleanly with defaults.  
  
Payment Ledger Update  
  
One final requirement for the ledger: The flat rate is per **class session**, not per student. If an instructor teaches a 1.5-hour slot with multiple students, they should only be paid the flat rate **once** for that time period. Please ensure the database logic groups attendance by the class session to avoid overpayment.