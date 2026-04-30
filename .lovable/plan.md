## Goal

Unify the student-detail experience in the instructor app. Today there are two different views:

- **Dashboard → Today's Students table** → navigates to a separate page (`/instructor/students/:studentId`) showing a stripped-down profile.
- **Sidebar → Students → click a student** → opens a rich in-page dialog with contact, schedule, bio, progress %, skills, notes, tasks, and a "Request Schedule Change" action.

We'll standardize on the **rich dialog** version (the one in the Students nav page) for both entry points so instructors always see the same info in the same layout.

## Approach

Reuse the existing rich dialog in `InstructorStudents.tsx` rather than duplicating ~700 lines. The dashboard table will route the user to the Students page with a query parameter that auto-opens the matching student's detail dialog.

```text
[Dashboard StudentTable row click]
            │
            ▼
   navigate('/instructor/students?student=<id>')
            │
            ▼
[InstructorStudents page reads ?student=<id>]
            │
            ▼
   auto-call openStudentDetails(id) on mount/data-load
            │
            ▼
   Same rich Dialog as the regular Students page
```

The standalone `/instructor/students/:studentId` route and `InstructorStudentDetail.tsx` page become obsolete and will be removed so there's only one canonical detail UI.

## Changes

1. **`src/components/instructor/dashboard/StudentTable.tsx`**
   - Replace the two `navigate(\`/instructor/students/${student.id}\`)` calls with `navigate(\`/instructor/students?student=${student.id}\`)`.
   - Update the "View All" button target if needed (already points at `/instructor/students`).

2. **`src/pages/instructor/InstructorStudents.tsx`**
   - Read `?student=<id>` from the URL on mount.
   - After the students list loads, if a matching student exists, call `openStudentDetails(id)` once to open the dialog automatically.
   - Clear the query param after opening so refresh/back behaves predictably.

3. **`src/App.tsx`** (or wherever routes are declared)
   - Remove the `/instructor/students/:studentId` route entry.

4. **`src/pages/instructor/InstructorStudentDetail.tsx`**
   - Delete the file (no longer referenced).

5. **Memory**
   - Add a small note to `mem://index.md` Core: "Instructor student detail uses a single rich dialog opened from `/instructor/students` (deep-linkable via `?student=<id>`)."

## Out of Scope

- No changes to the dialog's contents — we're not redesigning the rich view, just making it the only one.
- No changes to admin or student portals.
- The "Today's Attendance" cards on the dashboard remain non-clickable (Present/Absent buttons only) — same as today.
