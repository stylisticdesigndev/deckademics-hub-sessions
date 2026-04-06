

# Spinning Vinyl Record Loading State

## Summary

Replace all full-page loading states (skeleton screens, spinner icons) with a centered spinning vinyl record animation using the uploaded record image. This creates a branded, on-theme loading experience that eliminates dashboard flickering.

## What Changes

### 1. New Component: `VinylLoader`

Create `src/components/ui/VinylLoader.tsx` — a reusable full-page loader that displays the vinyl record image spinning with a CSS animation, plus an optional "Loading..." label beneath it.

- Copy the uploaded record PNG to `src/assets/vinyl-record.png`
- CSS `@keyframes spin` animation (smooth infinite rotation)
- Centered on screen with the app's dark background

### 2. Replace Full-Page Loading States

These locations currently show skeletons or a spinner for the entire page and will be replaced with the `VinylLoader`:

| File | Current Loading | Change |
|------|----------------|--------|
| `src/routes/ProtectedRoute.tsx` | Skeleton blocks (lines 118-126, used at lines 130, 160) | Replace with `<VinylLoader />` |
| `src/pages/admin/AdminDashboard.tsx` | `<Loader2>` spinner (lines 51-58) | Replace with `<VinylLoader />` |
| `src/pages/student/StudentDashboard.tsx` | `<DashboardSkeleton />` at line 71 (auth loading) | Replace with `<VinylLoader />` |
| `src/pages/auth/StudentAuth.tsx` | Full-page skeleton (lines 63-73) | Replace with `<VinylLoader />` |
| `src/pages/auth/InstructorAuth.tsx` | Full-page skeleton (lines 41-51) | Replace with `<VinylLoader />` |

### 3. Keep Section-Level Skeletons As-Is

The following are **not** full-page loaders — they show inline skeletons within an already-loaded page layout. These stay unchanged:

- `StudentDashboard.tsx` line 144 (`DashboardSkeleton` within page content)
- `InstructorDashboard.tsx` lines 73-88 (section skeletons within dashboard shell)
- `StudentNotes.tsx` card skeletons
- `AdminProfile.tsx` / `InstructorProfile.tsx` section skeletons

## Files to Change

| File | Action |
|------|--------|
| `src/assets/vinyl-record.png` | Copy uploaded image here |
| `src/components/ui/VinylLoader.tsx` | Create — spinning record component |
| `src/index.css` | Add `@keyframes spin-vinyl` if not using Tailwind's `animate-spin` |
| `src/routes/ProtectedRoute.tsx` | Replace skeleton loader with `<VinylLoader />` |
| `src/pages/admin/AdminDashboard.tsx` | Replace Loader2 spinner with `<VinylLoader />` |
| `src/pages/student/StudentDashboard.tsx` | Replace DashboardSkeleton (auth loading) with `<VinylLoader />` |
| `src/pages/auth/StudentAuth.tsx` | Replace skeleton with `<VinylLoader />` |
| `src/pages/auth/InstructorAuth.tsx` | Replace skeleton with `<VinylLoader />` |

