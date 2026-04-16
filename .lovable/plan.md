

## Fix: Stop defaulting unrecorded past attendance to "Present"

### Problem
When there is no attendance record for a past class date, the code defaults the status to `'present'`. This makes it look like the instructor marked the student as present when no action was taken.

**Root cause** — two lines in `StudentClasses.tsx`:
- Line 126: `record || (isPast ? 'present' : 'upcoming')` in the calendar
- Line 301: `record || 'present'` in the Past tab cards

### Solution
Add a new `'unmarked'` status that shows these dates as needing instructor action.

### Changes

**`src/components/student/classes/AttendanceCalendar.tsx`**
- Add `'unmarked'` to the `AttendanceDay` status type
- Add a new modifier style — neutral gray dot (e.g. `bg-muted-foreground/40`)
- Add "Unmarked" to the calendar legend

**`src/pages/student/StudentClasses.tsx`**
- Line 126: change default from `'present'` to `'unmarked'` for past dates with no record
- Line 301: change default from `'present'` to `'unmarked'`

**`src/components/student/classes/ClassAttendanceCard.tsx`**
- Add visual treatment for `'unmarked'` status — a neutral badge saying "Not Recorded" or similar, distinct from present (green) and absent (red)

### What the student will see
- Past class dates where the instructor hasn't logged attendance will show as a **gray dot** on the calendar and a **"Not Recorded"** badge on the card, instead of falsely showing green/present.
- No database changes needed — this is purely a frontend display fix.

