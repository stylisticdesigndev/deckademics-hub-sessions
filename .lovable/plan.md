

# Update Demo Pages for Consistency

## Issues Found

1. **StudentClasses demo**: `getMockData()` still uses `title: 'DJ Fundamentals'` — should reflect the level-only change (e.g., "Intermediate")
2. **Demo toggle pattern is inconsistent** across pages:
   - Dashboard & Progress use a `variant="ghost"` button (hidden when demo is active) + a primary-colored banner with "Switch to Live Data"
   - Notes, Messages, Classes use a toggle-style button (`variant="outline"` when off, `variant="default"` when on) + a warning-colored Alert banner
3. **No functional issues** with mock data shapes — announcements have `type`, skills have correct fields, attendance matches

## Plan

### Standardize demo toggle to one pattern across all 5 pages

Use the **toggle button + warning Alert** pattern (Notes/Messages/Classes style) as the standard — it's more discoverable since the button is always visible regardless of mode.

**Files to update:**

### 1. `StudentDashboard.tsx`
- Change demo button from `variant="ghost"` (only visible when not in demo) to always-visible toggle button matching Notes/Messages pattern
- Change demo banner from primary-colored `div` to warning-colored `Alert` with `AlertTitle`/`AlertDescription`

### 2. `StudentProgress.tsx`
- Same change: replace ghost button + primary banner with toggle button + warning Alert

### 3. `StudentClasses.tsx`
- In `getMockData()`, change `title: 'DJ Fundamentals'` to `title: 'Intermediate'` to reflect the level-only display change
- Demo toggle already uses correct pattern — no toggle style changes needed

### 4. `StudentNotes.tsx` — no changes needed (already correct pattern)
### 5. `StudentMessages.tsx` — no changes needed (already correct pattern)

### Result
All 5 demo pages use the same toggle button style and warning Alert banner. Classes demo no longer references "DJ Fundamentals."

