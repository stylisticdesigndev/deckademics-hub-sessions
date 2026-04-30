## Three changes to instructor experience

### 1. Show Class Room in instructor's student dialog

In `src/components/instructor/students/InstructorStudentDetailDialog.tsx`, the Enrollment grid currently shows Status, Start Date, Class Day, Class Time. Add a fifth field for **Class Room** (read-only display — admins still control assignment from `/admin/students`).

Required supporting changes:
- `src/hooks/instructor/useInstructorStudentsSimple.ts` — add `class_room` to the `StudentWithProfile` interface, include it in the `students` SELECT, and pass it through into the formatted `Student` object.
- `src/hooks/instructor/useInstructorStudentsSimple.ts` — extend the exported `Student` interface with `classRoom?: string | null`.

### 2. Remove status badges from Today's Attendance

In `src/components/instructor/dashboard/TodayAttendanceSection.tsx`, remove the Present / Absent / Not Recorded `<Badge>` block (lines ~57–70). The colored Present/Absent buttons already convey state. The unused `Badge` and `cn` imports for badges can stay for the button styling.

### 3. DJ Name as the instructor's primary display name

This is the largest change. Add an optional `dj_name` field on `profiles` (instructor-only usage) and surface it as the canonical name shown to students and elsewhere in the app.

**Database (migration):**
- `ALTER TABLE public.profiles ADD COLUMN dj_name text;`
- Update `handle_new_user()` to also read `raw_user_meta_data->>'dj_name'` and persist it on the new profile row.

**Signup (required for instructors):**
- `src/components/auth/SignupForm.tsx` — add a `djName` field. Show it only when `userType === 'instructor'` (pass `userType` as a new prop, or create a small conditional block). Required for instructors.
- `src/components/auth/AuthForm.tsx` — add `djName: ''` to `formData` state, validate it for instructors, and include `dj_name: formData.djName` in the `signUp(...)` metadata payload.

**Instructor profile (editable field):**
- `src/pages/instructor/InstructorProfile.tsx` — add a "DJ Name" Input next to First/Last Name, load it from `userData.profile.dj_name`, save it via `updateProfile({ dj_name: ... })`.
- `src/pages/instructor/InstructorProfileSetup.tsx` — add the same DJ Name input (required) and include it in the profile update.

**Display "DJ Name" everywhere students see the instructor:**
The rule: if `dj_name` is present, use it; otherwise fall back to `first_name + last_name`. Apply in:
- `src/hooks/student/useStudentDashboardCore.ts` (Next Class instructor name) — select `dj_name` and prefer it.
- `src/pages/student/StudentNotes.tsx` (note author labels — both list and detail) — fetch and prefer `dj_name`.
- `src/hooks/student/useStudentNotes.ts` — include `dj_name` in the joined select and pass through.
- `src/pages/student/StudentMessages.tsx` — fetch instructor `dj_name` when building conversation list and prefer it for `name` / `instructorName`.
- `src/components/student/RunningLateButton.tsx` — include `dj_name` in the instructor profile select.
- `src/hooks/useStudentAssignment.ts` — include `dj_name` in instructor profile select so any consumer can prefer it.
- `src/pages/student/StudentClasses.tsx` — when wiring up real instructor data from the assignment, prefer `dj_name`.

A small helper `src/utils/instructorName.ts` exporting `getInstructorDisplayName({ dj_name, first_name, last_name })` will be added so every consumer uses one rule.

**Out of scope for this pass (to keep diff focused):**
- Admin-side instructor list (`AdminInstructors`) and instructor profile dropdowns — admins can keep seeing the legal name there.
- Instructor dashboard "Welcome, {name}" — keeps using the instructor's own first name (their own greeting, not what students see).

### Why this approach

- Class Room stays admin-managed (per your earlier direction); the dialog just surfaces it.
- Removing the badges follows your "buttons already show state" preference and matches the messaging-UI minimalism we've used elsewhere.
- A single helper plus a `dj_name` column means we can later add it to admin surfaces or signage without touching every call site again.

### Files changed (summary)

```text
NEW migration: add dj_name to profiles + update handle_new_user
NEW src/utils/instructorName.ts

EDIT src/components/instructor/students/InstructorStudentDetailDialog.tsx  (Class Room)
EDIT src/hooks/instructor/useInstructorStudentsSimple.ts                   (class_room passthrough)
EDIT src/components/instructor/dashboard/TodayAttendanceSection.tsx        (remove badges)

EDIT src/components/auth/SignupForm.tsx                                    (DJ Name field, instructor only, required)
EDIT src/components/auth/AuthForm.tsx                                      (validate + send dj_name)
EDIT src/pages/instructor/InstructorProfile.tsx                            (DJ Name input + save)
EDIT src/pages/instructor/InstructorProfileSetup.tsx                       (DJ Name input + save)

EDIT src/hooks/student/useStudentDashboardCore.ts
EDIT src/hooks/student/useStudentNotes.ts
EDIT src/pages/student/StudentNotes.tsx
EDIT src/pages/student/StudentMessages.tsx
EDIT src/components/student/RunningLateButton.tsx
EDIT src/hooks/useStudentAssignment.ts
EDIT src/pages/student/StudentClasses.tsx
```
