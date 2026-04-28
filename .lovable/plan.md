## Goal

Replace the current "Past Weeks" infinite list inside the collapsible on the Instructor Attendance page with paginated navigation, so instructors view one previous week at a time instead of scrolling indefinitely.

## Scope

File: `src/pages/instructor/InstructorAttendance.tsx` only. No hook/data changes — `pastWeeksData` already returns all past records; pagination is purely a UI concern.

## Behavior

- "Past Weeks" remains a Collapsible. When opened, it shows **one week at a time** (most recent past week first).
- Pagination controls below the week:
  - "Previous Week" button (goes further back in time)
  - "Next Week" button (goes forward toward current week)
  - Center label: `Week X of Y` (e.g., "Week 1 of 6") plus the week range label.
- Buttons disable at the boundaries.
- Default page = most recent past week (index 0) every time the section is opened.
- If only one past week exists, hide the pagination controls (just show the week).

## Technical Details

- Sort `Object.entries(groupedPastWeeks)` chronologically descending (most recent past week first). Currently grouping order depends on insertion; sort by the actual `classDate` of the first item in each group to guarantee order.
- Add local state: `const [pastWeekIndex, setPastWeekIndex] = useState(0);`
- Reset `pastWeekIndex` to 0 whenever `pastOpen` toggles to `true` or when the number of past weeks changes.
- Render only `weeks[pastWeekIndex]` instead of mapping over all entries.
- Pagination footer uses existing `Button` component with `variant="outline"` and `size="sm"`, plus `ChevronLeft`/`ChevronRight` icons from `lucide-react`.

## Out of Scope

- No changes to `useInstructorAttendance` (still fetches full history; pagination is client-side, which is fine given typical volume).
- No changes to row rendering, makeup logic, or current-week section.
