

# Upgrade Instructor Side: Demo Modes, Polish, and Dashboard Fix

## Overview
Mirror the student-side demo mode pattern across all instructor pages, fix the glitchy/slow dashboard loading, and add rich mock data for each instructor page.

## Changes

### 1. Create instructor mock data file
**New file: `src/data/mockInstructorData.ts`**

Contains demo data for all instructor pages:
- **Dashboard**: 4 mock students with progress/levels/notes, 3 today's classes, average progress
- **Classes**: 6-8 mock class sessions with students, dates, rooms, weeks
- **Students**: 4-5 mock students with full detail (progress, modules, notes, levels)
- **Messages**: 5 demo announcements (matching student-side pattern with events/updates/announcements)
- **Profile**: Mock instructor profile with name, email, bio, specialties, schedule
- **Announcements**: 3-4 mock announcements the instructor has created
- **Curriculum**: No demo needed (already pulls from shared curriculum tables)

### 2. Fix Instructor Dashboard loading issues
**File: `src/pages/instructor/InstructorDashboard.tsx`**
**File: `src/hooks/instructor/useInstructorDashboard.ts`**

- Add demo mode toggle (Eye/EyeOff button) like student dashboard
- Add demo mode banner alert
- Fix loading state: show stats and student table skeleton immediately instead of hiding everything behind a loading spinner
- When in demo mode, bypass all Supabase calls and show mock data instantly
- Remove the conditional rendering that hides DashboardStats and StudentTable during loading (show them always, with skeleton/placeholder values while loading)

### 3. Add demo mode to InstructorClasses
**File: `src/pages/instructor/InstructorClasses.tsx`**

- Add `demoMode` state + toggle button in header
- Add demo banner when active
- When demo, show mock class sessions instead of fetching from Supabase
- Show empty state improvements for new instructors

### 4. Add demo mode to InstructorMessages
**File: `src/pages/instructor/InstructorMessages.tsx`**

- Add `demoMode` state + toggle button in header
- Add demo banner, tab filtering (All/Events/Announcements/Updates) like student messages
- When demo, show mock announcements targeted at instructors

### 5. Add demo mode to InstructorProfile
**File: `src/pages/instructor/InstructorProfile.tsx`**

- Add `demoMode` state + toggle button in header
- Add demo banner
- When demo, show mock profile data (name, email, bio, specialties, schedule)
- Disable editing in demo mode

### 6. Add demo mode to InstructorStudents
**File: `src/pages/instructor/InstructorStudents.tsx`**

- Add `demoMode` state + toggle button in header
- Add demo banner
- When demo, show mock student roster with progress, levels, notes, module progress

### 7. Add demo mode to InstructorAnnouncements
**File: `src/pages/instructor/InstructorAnnouncements.tsx`**

- Add `demoMode` state + toggle button in header
- Add demo banner
- When demo, show mock announcements list (disable create form)

### 8. InstructorCurriculum — no changes needed
Already pulls from shared curriculum tables and works the same as student side.

## Technical Pattern (consistent across all pages)

Each page gets:
```tsx
const [demoMode, setDemoMode] = useState(false);

// In header section:
<Button variant={demoMode ? "default" : "outline"} size="sm"
  onClick={() => setDemoMode(!demoMode)} className="flex items-center gap-2">
  {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
  {demoMode ? 'Live Data' : 'Demo'}
</Button>

// Demo banner:
{demoMode && (
  <Alert className="bg-warning/10 border-warning/30">
    <Eye className="h-4 w-4 text-warning" />
    <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
    <AlertDescription>Showing sample data. Click "Live Data" to switch back.</AlertDescription>
  </Alert>
)}

// Data resolution:
const activeData = demoMode ? mockData : realData;
const isLoading = !demoMode && loading;
```

## Dashboard Loading Fix Details

The current dashboard hook (`useInstructorDashboard`) makes multiple sequential Supabase calls which causes slow/glitchy loading. Fix:
- Always render DashboardStats and StudentTable (not hidden behind loading conditional)
- Show skeleton cards for stats during load instead of a generic spinner
- In demo mode, skip all fetches and return mock data immediately

## Files Changed (8 files)
- `src/data/mockInstructorData.ts` (new)
- `src/pages/instructor/InstructorDashboard.tsx`
- `src/hooks/instructor/useInstructorDashboard.ts`
- `src/pages/instructor/InstructorClasses.tsx`
- `src/pages/instructor/InstructorMessages.tsx`
- `src/pages/instructor/InstructorProfile.tsx`
- `src/pages/instructor/InstructorStudents.tsx`
- `src/pages/instructor/InstructorAnnouncements.tsx`

