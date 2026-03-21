

# Standardize Visual Hierarchy Across Student Pages

## Problems Found

After reviewing all 7 student pages, these are the specific layout inconsistencies causing poor visual flow:

| Issue | Pages Affected |
|-------|---------------|
| Notes uses `max-w-4xl` container — narrower than all other pages | StudentNotes |
| Notes title is `3xl` with a large icon; all others are `2xl` with no icon | StudentNotes |
| Subtitle margin varies: `mt-2` vs `mt-1` | Messages, Profile, Progress |
| Header flex alignment differs: `items-center` vs `items-start` | Messages |
| Profile header has no flex layout (no Demo button alignment target) | Profile |
| Curriculum header uses plain `div` instead of `section` | Curriculum |
| Progress always shows "Getting Started" card below real data, adding unnecessary scroll | Progress |
| Notes page has extra `py-6` padding on top of DashboardLayout's own `p-4 md:p-6` | Notes |

## Plan

All changes are CSS/layout only — no logic or data changes.

### 1. StudentNotes.tsx
- Remove `container max-w-4xl py-6` wrapper — use `<div className="space-y-6">` like every other page
- Remove `StickyNote` icon from header
- Change title from `text-3xl` to `text-2xl`
- Change header structure to match standard: `<section className="flex items-start justify-between">`
- Change `mb-6` to spacing handled by parent `space-y-6`

### 2. StudentMessages.tsx
- Change header `items-center` to `items-start`
- Change subtitle `mt-2` to `mt-1`

### 3. StudentProfile.tsx
- Wrap header in `<section className="flex items-start justify-between">` for consistency
- Change subtitle `mt-2` to `mt-1`

### 4. StudentCurriculum.tsx
- Change header wrapper from `div` to `section` with `flex items-start justify-between`
- Add `mt-1` to subtitle (currently has none)

### 5. StudentProgress.tsx
- Change subtitle `mt-2` to `mt-1`
- Move "Getting Started" card inside the empty-state block only (don't show it when the student already has progress data — it adds unnecessary scroll)

### 6. StudentClasses.tsx
- Change subtitle `mt-1` — already correct, no change needed

### 7. StudentDashboard.tsx
- Already the reference pattern — no changes needed

## Summary
Six files touched, all cosmetic. The result: every student page follows an identical header → content flow with consistent spacing, alignment, and typography.

