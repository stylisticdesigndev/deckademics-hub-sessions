## Goal

When an instructor clicks a student from the student management list, the dialog should show **all** of that student's profile + enrollment information (matching what the student sees on their own profile page), and the layout should be reorganized to flow more naturally. All existing functions (Skills, Notes, Tasks, Schedule Change Request) stay intact.

## What's missing today

The current "Info" tab only shows: Enrollment Date, Level, Class Day, Class Time, Next Class, Overall Progress.

It is missing student profile fields that are already in the database:
- Email (only shown faintly under the name)
- Phone number
- Pronouns
- Bio
- Enrollment Status (Active / Pending / Inactive)
- Start Date (shown as "Enrollment Date" but mislabeled)

The header is also cramped (avatar + name + tiny email) and the info grid mixes profile data, enrollment data, and a schedule-change action button all in one flat block.

## New dialog layout

Reorganized "Info" tab into three clean grouped sections with icons and clear labels:

```text
┌─────────────────────────────────────────────────┐
│  [Avatar]  Full Name                            │
│            Pronouns · Level badge · Status badge│
│            ──────────────────────────────────── │
│            ✉  email@here.com                    │
│            ☎  (555) 555-5555                    │
└─────────────────────────────────────────────────┘
[ Info ] [ Skills ] [ Notes ] [ Tasks ]

── Enrollment ──────────────────────────────────
  Status        Start Date
  Class Day     Class Time
  Next Class (if any)

── About ───────────────────────────────────────
  Student bio (or "No bio provided yet.")

── Overall Progress ────────────────────────────
  [================== 72%]

── Actions ─────────────────────────────────────
  [ Request Schedule Change ]
```

Key UI improvements:
- Header gets the avatar + name + pronouns + level + status badges + contact info (email/phone) all together so identity is fully visible at a glance.
- Enrollment block becomes a clean 2-column grid grouped under a labeled section header.
- "Enrollment Date" is renamed to "Start Date" (matches the student's own profile and the DB column).
- Status badge color-coded (Active = green, Pending = yellow, Inactive = gray).
- Bio gets its own "About" section.
- Schedule Change action is moved to the bottom under a clear "Actions" heading instead of being awkwardly tucked under Overall Progress.
- Skills / Notes / Tasks tabs stay exactly as they are.

## Technical changes

1. **`src/hooks/instructor/useInstructorStudentsSimple.ts`**
   - Extend the `Student` interface and Supabase query to also fetch:
     - `enrollment_status` from the `students` table
     - `bio` from `profiles`
   - Pass these through into the formatted student object.

2. **`src/pages/instructor/InstructorStudents.tsx`**
   - Update the local `Student` interface to include `phone`, `pronouns`, `bio`, `enrollmentStatus`.
   - Rebuild the `<DialogHeader>` to show avatar + name + pronouns + level badge + status badge + contact rows (email, phone — phone only if present).
   - Rebuild the `Info` tab content into three labeled sections: **Enrollment**, **About**, **Overall Progress**, plus a final **Actions** section containing the existing "Request Schedule Change" button.
   - Use existing icons (`Mail`, `Phone`, `Calendar`, `Clock`, `CheckCircle2`, `BookOpen`, `CalendarClock`).
   - Use `formatDateUS` for Start Date (per project standard).
   - Use `capitalizeLevel` for the level label (per project standard).
   - Keep all existing handlers (`openNoteDialog`, `setShowScheduleDialog`, skill update, tasks) and the Skills / Notes / Tasks tabs untouched.

No DB migration needed — all required columns already exist (`students.enrollment_status`, `profiles.bio`, `profiles.phone`, `profiles.pronouns`).

## Files touched

- `src/hooks/instructor/useInstructorStudentsSimple.ts` — extend query + interface
- `src/pages/instructor/InstructorStudents.tsx` — extend interface + redesign dialog header and Info tab
