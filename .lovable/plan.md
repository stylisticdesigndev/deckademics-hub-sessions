## Plan: Ledger Flat-Fee + Messaging Toggle + Payment Generation + Running Late Push

### 1. Ledger → Flat fee per class session (one entry per slot, not per student)

**DB migration:**
- Add `instructors.session_fee numeric NOT NULL DEFAULT 50` (flat fee per class taught).
- Drop the generated `amount` column on `instructor_ledger_entries` and re-add as a regular `numeric` (we'll write `session_fee` directly into it).
- Drop the existing `UNIQUE(instructor_id, student_id, class_date)` constraint.
- Add `UNIQUE(instructor_id, class_date, class_time)` so an instructor earns **once per scheduled time slot per day**, regardless of how many students are present.
- Add nullable `class_time text` column (sourced from `students.class_time`) to support that uniqueness.
- Rewrite `attendance_to_ledger()` trigger:
  - Fetch the student's `class_time` and the instructor's `session_fee`.
  - `INSERT … ON CONFLICT (instructor_id, class_date, class_time) DO NOTHING WHERE payment_id IS NULL` — first present student in that slot creates the entry, subsequent students don't duplicate it.
  - `student_id` on the entry becomes "first student that triggered it" (informational only).

**Frontend:**
- `src/pages/instructor/InstructorLedger.tsx`: replace "Hours" / "Rate" columns with a single "Session Fee" column. Update header copy to "Auto-generated from your marked attendance — flat fee per class session." Replace the "Unpaid Hours" stat card with "Unpaid Sessions" (count).
- `src/pages/admin/AdminInstructors.tsx` instructor sheet: add a "Session Fee ($)" input next to the existing Hourly Rate field so admins can set it per instructor.

### 2. Two-Way Messaging — instructor-controlled only

**DB:** No schema change (`students.two_way_messaging` already exists, default `true`).
- Update RLS so instructors can update `two_way_messaging` on assigned students (already covered by existing "Instructors can update assigned students" policy ✓).
- Add a column-level guard via trigger: students cannot change `two_way_messaging` on their own row (revert to OLD value if `auth.uid() = student.id`).

**Frontend:**
- New toggle in the instructor's per-student view (`src/pages/instructor/InstructorStudentDetail.tsx`) — a `Switch` labeled "Allow this student to reply" wired to `students.two_way_messaging`.
- Remove the toggle from `src/pages/admin/AdminStudents.tsx` student sheet (admin retains visibility but it's not editable here, per requirement: "available only on the instructor side"). Replace with a read-only label showing current state.
- Confirm no student-facing surface exposes the toggle (already verified — none exists).

### 3. Read-Only state in student messaging

- `src/components/student/messages/MessageCard.tsx` and `StudentConversationThread.tsx`: fetch the student's own `two_way_messaging` flag once via React Query.
- When `false`:
  - Hide `<MessageReplyForm />`.
  - Render a muted banner: 🔒 "Read-only — your instructor has disabled replies. You'll still receive their messages."
- Instructor-side composer is untouched — instructors can still send one-way messages.

### 4. Admin "Generate Individual" and "Generate All" buttons

`src/pages/admin/AdminInstructorPayments.tsx`:
- The existing "Generate Pay Period" dialog already loops all instructors. Rename that primary button to **"Generate All Instructors"**.
- Add a sibling dropdown button **"Generate for Instructor ▾"** that lists each active instructor; selecting one opens the same dialog but pre-scoped to that single instructor (filters the preview/insert step to the chosen `instructor_id`).
- Both flows source unpaid `instructor_ledger_entries` for the selected date range, sum `amount`, and create one `instructor_payments` row per instructor, then stamp `payment_id` on the consumed ledger rows.

### 5. Running Late — confirm all three actions fire

`src/components/student/RunningLateButton.tsx` currently only inserts a `student_status` row. Extend `handleClick` to do all three:

1. **Status update** — insert into `student_status` with `status = 'running_late'`, 4 hr expiry ✓ (already present).
2. **Automated message to instructor** — look up the student's `instructor_id` from `students`, then `INSERT INTO messages` with `sender_id = student`, `receiver_id = instructor`, `subject = 'Running Late'`, content like *"Heads up — I'm running late to today's session."* This triggers the existing in-app notification dropdown automatically.
3. **Push notification** — call a new edge function `notify-instructor-late`:
   - Looks up the instructor's `notification_preferences` (phone + push).
   - For now (no FCM/APNs configured), send via the same channel as other admin notifications: insert an `admin_notifications`-style row into a new `instructor_notifications` table (or reuse existing user notification feed). 
   - **Note for user:** True OS-level push notifications require a push provider (FCM/OneSignal). I'll wire the edge-function scaffold and in-app notification now; we can plug in FCM later when you're ready to provision it.

Toast on success: "Instructor notified — status, message, and alert sent."

### Files
| File | Action |
|---|---|
| `supabase/migrations/<new>.sql` | Migration: add `session_fee`, restructure ledger uniqueness, rewrite trigger, role-protect `two_way_messaging` |
| `src/pages/instructor/InstructorLedger.tsx` | Edit — flat-fee columns/stats |
| `src/pages/admin/AdminInstructors.tsx` | Edit — session_fee input |
| `src/pages/instructor/InstructorStudentDetail.tsx` | Edit — two-way messaging Switch |
| `src/pages/admin/AdminStudents.tsx` | Edit — remove toggle, show read-only |
| `src/components/student/messages/MessageCard.tsx` | Edit — hide reply when off |
| `src/components/student/messages/StudentConversationThread.tsx` | Edit — read-only banner |
| `src/components/student/RunningLateButton.tsx` | Edit — also send message + invoke edge fn |
| `supabase/functions/notify-instructor-late/index.ts` | New — push/notification dispatcher |
| `src/pages/admin/AdminInstructorPayments.tsx` | Edit — rename + add "Generate for Instructor" dropdown |