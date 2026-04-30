## Goal

Reframe the **Add Cover Session** dialog so the **class slot (date + time)** is the primary thing being covered, and the student(s) taught are recorded as supporting detail. Also fix the calendar so it fills the dialog width.

## Why

Currently the dialog forces you to pick **one student first**, which doesn't match reality — when an instructor covers a 3:30–5:00 PM slot, they're covering the whole class, which may include 1, 2, or 3 students. The student is documentation of who was actually there, not the unit of coverage.

We can do this **without changing the database schema**. The existing `cover_sessions` table already stores one row per `(student_id, class_date, class_time)`. We just insert one row per student who attended that covered slot — same table, same columns, just multiple rows tied to the same slot.

## Changes

### 1. Redesign `AddCoverSessionDialog.tsx`

New field order (top to bottom, matching the new logical hierarchy):

1. **Date** — calendar picker, full width
2. **Time slot** — the three existing options (3:30, 5:30, 7:30)
3. **Students taught during this slot** — multi-select checklist (0 to many)
   - Header text clarifies: "Select every student who attended this covered class. You can leave it empty if no students showed up."
   - Each student row shows name + their normal day/time as a subtle hint, so the instructor can quickly recognize who's normally in that slot
   - Optional: a small "Suggested" group at the top listing students whose `class_day`/`class_time` matches the picked date+slot, then "All active students" below

On save:
- If 0 students selected → insert a single placeholder is **not** possible (table requires `student_id`). Instead, require at least one student (with a clearer error: "Add at least one student you taught during this slot — even if it was just one"). This keeps the schema intact.
- If 1+ students selected → insert one `cover_sessions` row per student, all sharing the same `class_date`, `class_time`, `cover_instructor_id`, `created_by`. Use a single `.insert([...])` array call.

Toast on success: "Cover session logged for {N} student{s}".

### 2. Fix the calendar width

The `Calendar` component currently sits inside `space-y-2` with `rounded-md border` but its internal `DayPicker` uses `p-3` and intrinsic widths, leaving whitespace on the right inside the `max-w-md` dialog.

Fix by:
- Wrapping the calendar in a `w-full` container
- Passing `className="w-full pointer-events-auto"` to `Calendar`
- Adding `classNames={{ months: "w-full", month: "w-full space-y-4", table: "w-full", head_row: "flex w-full", row: "flex w-full mt-2", head_cell: "flex-1 text-muted-foreground rounded-md font-normal text-[0.8rem]", cell: "flex-1 h-9 text-center text-sm p-0 relative ...", day: "h-9 w-full p-0 font-normal aria-selected:opacity-100" }}` so each day cell flexes to fill the row.

This matches the "airline-style" full-width calendar pattern already used elsewhere in the project (per the date range picker memory).

### 3. Also widen the dialog slightly

Bump `DialogContent` from `max-w-md` to `max-w-lg` so the calendar has comfortable room and the student multi-select doesn't feel cramped.

## Files to modify

- `src/components/instructor/attendance/AddCoverSessionDialog.tsx` — full rewrite of dialog body, field reorder, multi-student select, batch insert, calendar width fix

## Files NOT changed

- `cover_sessions` table — no schema change
- `useInstructorAttendance.ts` — already aggregates cover sessions correctly per `(student_id, class_date, class_time)`, so multiple rows for the same slot Just Work
- Ledger / payment logic — unchanged, since each student-row continues to represent a billable unit

## Out of scope

- Tracking a "covered slot with zero students" (would require schema change — flagging for later if you want it)
- Editing or deleting existing cover sessions from this dialog
