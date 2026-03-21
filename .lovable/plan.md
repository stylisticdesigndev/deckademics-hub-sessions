

# Visual Student Dashboard Redesign

## What Changes

Replace the current text-heavy student dashboard with a visually rich layout featuring radial/donut charts for progress, attendance stats, and at-a-glance class info cards.

## New Components

### 1. `OverallProgressRing` - Hero radial chart
A large centered radial/donut chart (using Recharts `PieChart` with `RadialBarChart`) showing overall curriculum progress percentage in the center. Placed prominently at the top of the dashboard.

### 2. `SkillBreakdownChart` - Per-skill radial rings
Multiple small donut charts (one per skill from `student_progress` table) arranged in a grid. Each shows skill name + proficiency %. Uses real data from `progressData` instead of hardcoded zeros.

### 3. `AttendanceChart` - Attendance donut
A donut chart showing attendance breakdown (present/absent/late) queried from the `attendance` table for the current student.

### 4. `QuickStatsRow` - Visual stat cards
Redesigned stats row with:
- **Level** badge with icon
- **Overall Progress** as a mini circular gauge
- **Classes Attended** count
- **Next Class** countdown

## Data Changes

### `useStudentDashboardCore.ts`
- Pass `progressData` (per-skill breakdown) through to the dashboard so `SkillBreakdownChart` can render real skill-level data
- Already returns `progressData` - just needs to be used in the dashboard

### New hook: `useStudentAttendance.ts`
- Query `attendance` table filtered by `student_id = userId`
- Group by `status` (present/absent/late) to get counts for the donut chart

## Dashboard Layout

```text
┌─────────────────────────────────────────────┐
│  Welcome, [Name]  |  Level: Beginner        │
├─────────────────────────────────────────────┤
│  [Progress Ring]  │  [Skill 1] [Skill 2]    │
│   67% Overall     │  [Skill 3] [Skill 4]    │
├─────────────────────────────────────────────┤
│  [Attendance     │  [Next Class Card]       │
│   Donut Chart]   │  [Upcoming Classes]      │
├─────────────────────────────────────────────┤
│  [Notes Section] │  [Announcements]         │
└─────────────────────────────────────────────┘
```

## Implementation Steps

1. **Create `useStudentAttendance.ts`** hook - query attendance table, return counts by status
2. **Create `OverallProgressRing.tsx`** - Recharts RadialBarChart showing total progress %
3. **Create `SkillBreakdownChart.tsx`** - Grid of mini donut charts per skill from real `progressData`
4. **Create `AttendanceChart.tsx`** - Donut chart for attendance breakdown
5. **Redesign `StudentStatsSection.tsx`** - Add mini circular gauges and visual indicators
6. **Update `StudentDashboard.tsx`** - New layout with charts, pass `progressData` to skill breakdown
7. **Remove old `ProgressSection.tsx`** usage (replaced by the new chart components)

## Technical Details

- All charts use Recharts (already installed via `src/components/ui/chart.tsx`)
- Color palette: use existing `--primary` (green), `--secondary` (purple), and `--accent` CSS vars
- Components use `ChartContainer` from `src/components/ui/chart.tsx` for consistent styling
- Responsive: charts stack vertically on mobile, 2-column grid on desktop
- Empty states: show greyed-out chart outlines with "No data yet" message

