

# Fix Dashboard Demo Data

## Issues

1. **Upcoming Classes mock data uses wrong field names**: Classes use `location: 'Studio A'` etc., but the attendance system uses `location: 'Classroom 1/2/3'`. The `title` field has lesson-style names like "Advanced Beat Matching" — but live data uses the class title from the DB, not lesson topics.
2. **Attendance mock data doesn't reflect the once-a-week model**: 23 total sessions is high. Should reflect a more realistic semester count (e.g., 12 weeks).
3. **NotesSection is NOT demo-aware**: In demo mode, it still calls `useStudentNotes(studentId)` which hits the DB and shows "No notes yet." It needs mock notes passed in or generated internally when demo mode is active.

## Plan

### 1. Update `mockDashboardData.ts`

**Upcoming Classes** — fix locations to Classroom 1/2/3, simplify titles:
```ts
mockUpcomingClasses = [
  { id: 'mock-1', title: 'Intermediate Class', date: 'Tomorrow', time: '3:00 PM', instructor: 'DJ Master K', location: 'Classroom 1', duration: '1h 30m', attendees: 0, isUpcoming: true },
  { id: 'mock-2', title: 'Intermediate Class', date: 'Next Wednesday', time: '5:00 PM', instructor: 'DJ Master K', location: 'Classroom 2', duration: '1h 30m', attendees: 0, isUpcoming: true },
]
```

**Attendance** — adjust to realistic once-a-week numbers:
```ts
mockAttendance = { present: 9, absent: 1, late: 2, total: 12 }
```

**Add mock notes** — new export `mockNotes` with 3 sample instructor notes:
```ts
mockNotes = [
  { id: 'mock-note-1', title: 'Great progress on transitions', content: 'Your transitions between tracks are getting much smoother...', is_read: false, created_at: '2026-03-20T...', instructor: { first_name: 'DJ Master', last_name: 'K' } },
  { id: 'mock-note-2', title: 'Practice EQ sweeps', content: 'Focus on using the low-pass filter during buildups...', is_read: true, created_at: '2026-03-15T...', instructor: { first_name: 'DJ Master', last_name: 'K' } },
  { id: 'mock-note-3', title: 'Homework: Mix 3 tracks', content: 'Record a 15-minute mix blending at least 3 tracks...', is_read: true, created_at: '2026-03-10T...', instructor: { first_name: 'DJ Master', last_name: 'K' } },
]
```

### 2. Make NotesSection demo-aware

**File: `src/components/student/dashboard/NotesSection.tsx`**
- Add optional `demoNotes` prop
- When `demoNotes` is provided, skip `useStudentNotes` data and render `demoNotes` instead
- Keep the same card layout and formatting

**File: `src/pages/student/StudentDashboard.tsx`**
- Import `mockNotes`
- Pass `demoNotes={demoMode ? mockNotes : undefined}` to `NotesSection`

