

# Redesign Student Classes Page: Attendance-Based with Self-Absent Feature

## Overview

Transform the classes page from a generic schedule view into an attendance-focused page. Since the school operates once per week with a consistent instructor, the page should reflect that rhythm: show the current/next class prominently, plus the next 3 weeks (4 total upcoming), a month calendar toggle for navigation, and allow students to pre-mark themselves absent -- notifying the instructor and recording it for admin makeup tracking.

## Layout

```text
┌──────────────────────────────────────────────────┐
│  Class Attendance          [Month < March > ]    │
│  Your instructor: DJ Marcus | Every Wednesday    │
├────────────────────┬─────────────────────────────┤
│  Month Calendar    │  Next 4 Upcoming Classes    │
│  (highlights       │  ┌─────────────────────┐    │
│   class days,      │  │ Mar 26 - NEXT CLASS │    │
│   color-coded      │  │ "Mark Absent" btn   │    │
│   attendance)      │  ├─────────────────────┤    │
│                    │  │ Apr 2               │    │
│  Legend:           │  │ Apr 9               │    │
│  ● Present         │  │ Apr 16              │    │
│  ● Absent          │  └─────────────────────┘    │
│  ● Upcoming        │                             │
├────────────────────┴─────────────────────────────┤
│  Past Classes tab (with attendance status shown) │
└──────────────────────────────────────────────────┘
```

## Database Changes

**New migration**: Add a `student_absences` table for student-initiated absence requests (separate from the admin-managed `attendance` table):

```sql
CREATE TABLE public.student_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid NOT NULL,
  absence_date date NOT NULL,
  reason text,
  notified_instructor boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, absence_date)
);
-- RLS: students can insert/view their own, instructors can view for their classes, admins can view all
```

This also inserts an `absent` record into the existing `attendance` table so admin/instructor dashboards see it immediately.

## Implementation Steps

### 1. Create `student_absences` table migration
New table with RLS policies for student insert/select, instructor select, admin all.

### 2. Create `useStudentClassAttendance` hook
- Fetches the student's enrolled class info (weekly schedule, instructor)
- Fetches attendance records for the student (from `attendance` table)
- Fetches student-initiated absences (from `student_absences` table)  
- Provides a `markAbsent(classId, date, reason?)` mutation that:
  - Inserts into `student_absences`
  - Inserts into `attendance` with status `'absent'`
  - Shows success toast

### 3. Create `AttendanceCalendar` component
- Uses the existing `Calendar` component (react-day-picker) with month navigation
- Color-coded dots on class days: green = present, red = absent, blue = upcoming
- Clicking a future class day opens the "mark absent" flow
- Month forward/back navigation

### 4. Create updated `ClassAttendanceCard` component
- Replaces UpcomingClassCard usage on this page
- Shows date, time, location, topic, instructor
- For upcoming classes: "Mark Absent" button with optional reason dialog
- For past classes: shows attendance status badge (Present/Absent/Late)
- Highlighted styling for the next immediate class

### 5. Rewrite `StudentClasses.tsx`
- Top section: page title + month toggle
- Left column: `AttendanceCalendar` with legend
- Right column: next 4 upcoming class cards (current week + 3 more)
- Below: past classes tab showing attendance history with status badges
- Demo mode: generates weekly mock data with mixed attendance statuses
- Remove search/filter by instructor (since there's one instructor per student)

### 6. Update `UpcomingClassCard` interface
- Add optional `attendanceStatus` and `onMarkAbsent` props to `ClassSession` type
- Keep the component backward-compatible for other pages that use it

## Technical Details

- The `markAbsent` function inserts into both `student_absences` (for tracking the student-initiated request) and `attendance` (so it appears in admin/instructor views immediately)
- Calendar uses `modifiers` and `modifiersStyles` from react-day-picker to color-code days
- Month navigation uses controlled `month`/`onMonthChange` state on the Calendar component
- Weekly class dates are computed from the enrolled class's day-of-week pattern
- Demo mode generates 8 weeks of past data (mixed present/absent/late) and 4 weeks upcoming

