

# Add Week/Day/Month View Filter to Instructor Classes

## Summary
Replace the current week-only dropdown filter with a view mode selector (Week, Day, Month) that filters classes by time period relative to the current date. Week view remains the default.

## Changes

### File: `src/pages/instructor/InstructorClasses.tsx`

1. **Add a `viewMode` state** defaulting to `'week'` with options `'day'`, `'week'`, `'month'`
2. **Add date-based filtering logic**:
   - **Day**: show only classes matching today's date
   - **Week**: show classes within the current Monday–Sunday range
   - **Month**: show classes within the current calendar month
   - Parse `cls.date` strings back to `Date` objects for comparison (for live data, use `start_time`; for mock data, parse the formatted date string)
3. **Replace the week dropdown** with a view mode selector (3 toggle buttons or a Select with Day/Week/Month options) placed alongside the search bar
4. **Remove the old `filter` state and `weekOptions`** logic since filtering is now date-range-based
5. **Keep the search filter** as-is (student name, room, title still searchable)
6. **Update the table's "Class Week" column** to remain visible — it still shows which curriculum week the class belongs to

### UI Layout
- Search bar on the left (unchanged)
- View mode selector on the right: three buttons (Day | Week | Month) using a toggle group or segmented control, with "Week" active by default

### Filtering Logic (pseudocode)
```text
today = new Date()
if viewMode === 'day':
  filter where classDate === today (same year/month/day)
if viewMode === 'week':
  startOfWeek = Monday of current week
  endOfWeek = Sunday of current week
  filter where classDate >= startOfWeek && classDate <= endOfWeek
if viewMode === 'month':
  filter where classDate.month === today.month && classDate.year === today.year
```

### Mock Data Note
The mock data uses hardcoded date strings. To make the filter meaningful in demo mode, update `mockInstructorClasses` in `src/data/mockInstructorData.ts` to use dates relative to today (e.g., today, yesterday, next week, etc.) so all three views show relevant results.

## Files Changed
- `src/pages/instructor/InstructorClasses.tsx` — replace week filter with day/week/month view mode
- `src/data/mockInstructorData.ts` — update mock class dates to be relative to current date

