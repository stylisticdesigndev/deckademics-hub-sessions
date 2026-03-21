

# Add Demo Toggle to Student Messages Page

## Overview
Add the same Demo/Live Data toggle pattern used on Notes, Classes, and other student pages to the Messages page. When toggled on, demo announcements display with a banner. No routing changes needed.

## Changes

**File: `src/pages/student/StudentMessages.tsx`**

1. **Add `demoMode` state** (`useState(false)`) alongside existing state
2. **Add Demo toggle button** in the header section (next to the title), matching the pattern from StudentNotes/StudentClasses:
   - `Eye`/`EyeOff` icon with "Demo"/"Live Data" label
   - Uses `variant={demoMode ? "default" : "outline"}` 
3. **Add Demo Mode banner** when active (yellow warning alert matching other pages)
4. **Update data resolution**: When `demoMode` is true, use the existing `demoAnnouncements` array. When false, use fetched data from Supabase
5. **Update `isDemoMode` logic**: Currently it checks `!session` — change so demo data shows when either `!session` OR `demoMode` is true, but the toggle button only appears when logged in (has session)
6. **Remove `/demo/messages` public route** from `App.tsx` since it's no longer needed

