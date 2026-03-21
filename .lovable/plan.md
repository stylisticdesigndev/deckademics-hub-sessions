

# Add Demo Mode to Student Progress Page

## What Changes

Add the same demo mode toggle pattern from the dashboard to the Student Progress page. When enabled, it populates the page with mock skill data so you can see how the overall progress bar and skills breakdown look when fully populated.

## Implementation

### File: `src/pages/student/StudentProgress.tsx`

1. Add `demoMode` state (`useState(false)`)
2. Import `Eye`, `EyeOff` icons and mock skills data from `src/data/mockDashboardData.ts`
3. When `demoMode` is true:
   - Override `progressData` with `mockSkills` (Beat Matching 82%, EQ Control 71%, Scratching 55%, etc.)
   - Skip the loading/empty states -- always show the progress cards
4. Add a "Demo" button in the header and a colored banner when active (same pattern as dashboard)
5. No changes to data fetching logic -- demo mode simply overrides what's displayed

### No new files needed
Reuses existing `mockSkills` from `src/data/mockDashboardData.ts`.

