
# Fix Persistent Logo Flicker and Size Regression

## Root Cause
The logo is still reloading because `DashboardLayout` is mounted inside every individual page component (`StudentProgress`, `StudentClasses`, `StudentProfile`, admin/instructor pages, etc.). When you navigate between sections, the whole layout unmounts and mounts again, so the sidebar header/logo is recreated each time.

The logo also got smaller because the current `Logo` header sizing was changed to:
```ts
header: 'h-10 w-auto md:h-12'
```
which is likely smaller than the original visual size.

## Fix Approach

### 1. Make the dashboard layout persistent per role
Create shared route-layout wrappers so the sidebar/header stays mounted while only the page content changes.

**Add role layout components:**
- `StudentLayoutRoute`
- `InstructorLayoutRoute`
- `AdminLayoutRoute`

Each one should render:
```tsx
<DashboardLayout sidebarContent={<...Navigation />} userType="...">
  <Outlet />
</DashboardLayout>
```

### 2. Restructure routes in `src/App.tsx`
Instead of every page rendering its own `DashboardLayout`, nest role pages under the shared layout route:

```text
ProtectedRoute
└── StudentLayoutRoute
    ├── /student/dashboard
    ├── /student/progress
    ├── /student/classes
    └── ...
```

Do the same for instructor and admin routes.

This keeps the top-left logo, sidebar, and header mounted across section changes.

### 3. Remove per-page layout wrappers
Update all student/instructor/admin pages so they return only their page content, not:
```tsx
<DashboardLayout ...>...</DashboardLayout>
```

This affects all pages currently importing:
- `DashboardLayout`
- role navigation components

Those imports will be removed from the individual page files.

### 4. Restore stable logo sizing
Adjust `src/components/logo/Logo.tsx` so the `header` size matches the intended larger appearance with fixed dimensions that do not visually collapse during render.

Example direction:
- use a fixed header-height class
- keep `object-contain`
- avoid sizing that is smaller than before

### 5. Keep the existing auth fixes
Retain the earlier `ProtectedRoute` and `AuthProvider` fixes. They address auth redirect/loading issues, but the remaining flicker is now a layout architecture issue.

## Files to Update
- `src/App.tsx`
- `src/components/logo/Logo.tsx`
- `src/components/layout/DashboardLayout.tsx` (only if minor sizing cleanup is needed)
- New shared layout route file(s), e.g.:
  - `src/routes/StudentLayoutRoute.tsx`
  - `src/routes/InstructorLayoutRoute.tsx`
  - `src/routes/AdminLayoutRoute.tsx`
- All dashboard-section pages that currently wrap themselves in `DashboardLayout`

## Expected Result
- The top-left Deckademics logo no longer disappears when switching sections
- The sidebar/navbar no longer shifts during navigation
- The logo returns to the intended size
- Only the main page content updates when moving between sections, not the entire shell

## Technical Notes
This is the correct long-term fix because the app currently duplicates the dashboard shell in each page. A shared nested layout is the React Router pattern that prevents remounting and keeps navigation/UI chrome stable.
