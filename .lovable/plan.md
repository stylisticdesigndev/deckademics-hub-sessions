

# Add Mock Data Toggle to Student Dashboard

## What Changes

Add a "Demo Mode" toggle button to the student dashboard that swaps all real data with rich mock data, letting you see every chart and section fully populated. A banner + toggle button at the top makes it obvious you're in demo mode, and one click reverts to real data.

## Mock Data

- **Student Stats**: Level "Intermediate", 67% progress, 12 classes attended, next class tomorrow
- **Overall Progress Ring**: 67%
- **Skills**: Beat Matching (82%), EQ Control (71%), Scratching (55%), Track Selection (90%), Transitions (63%), Performance (48%)
- **Attendance**: 18 present, 3 late, 2 absent
- **Upcoming Classes**: 3 sample classes with titles, times, locations
- **Notes**: 2 sample instructor notes (1 unread)
- **Announcements**: 2 sample announcements

## Implementation

### 1. Create `src/data/mockDashboardData.ts`
A single file exporting all mock data objects matching the exact interfaces used by each component.

### 2. Update `StudentDashboard.tsx`
- Add `const [demoMode, setDemoMode] = useState(false)`
- When `demoMode` is true, override all data variables with mock data imports
- Show a colored banner at the top with "Demo Mode" label and a "Switch to Live Data" button
- When false, everything works exactly as before (no changes to hooks or data fetching)

### 3. No other files change
All chart components already accept the right props -- we just feed them mock data from the dashboard page level.

