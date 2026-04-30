## Goal

Two corrections to the recent navigation changes:

1. **Mobile/tablet navbars must be untouched.** The avatar dropdown should only appear in the **desktop** expanded sidebar (and slim sidebar). Mobile/tablet (the off-canvas sheet) goes back to having the original "Profile" nav item with the `UserCog` icon — no dropdown, no avatar.
2. **Stop reordering buttons.** On the instructor desktop sidebar, the "Admin Portal" button stays exactly where it was originally (right under the nav items, with its top border separator). The avatar goes underneath it, pinned to the very bottom of the sidebar — no flip-flopping.

## Files to change

### `src/components/navigation/StudentNavigation.tsx`
- When `isMobile === true`: render the original list including a `Profile` nav item (`UserCog` icon → `/student/profile`). No avatar dropdown.
- When `isMobile === false` (desktop expanded): render the nav items without "Profile", then pin the avatar dropdown at the bottom using `mt-auto` inside a flex column.

### `src/components/navigation/InstructorNavigation.tsx`
- When `isMobile === true`: restore the original layout exactly as it was — `Profile` nav item present, Admin Portal block at the bottom with its `pt-4 mt-4 border-t` separator. No avatar dropdown.
- When `isMobile === false` (desktop expanded):
  - Nav items (without "Profile") at top.
  - Immediately below them, the Admin Portal button in its original position (same `pt-4 mt-4 border-t` styling).
  - Then a flex spacer (`mt-auto`) pushes the avatar dropdown to the very bottom of the sidebar with its own top border separator.

### `src/components/navigation/AdminNavigation.tsx`
- When `isMobile === true`: restore original layout — `Profile` nav item (`UserCog` → `/admin/profile`) in the list, no avatar dropdown, no flex-fill wrapper.
- When `isMobile === false` (desktop expanded): nav items (without "Profile") at top, avatar dropdown pinned to bottom via `mt-auto`.

### `src/components/navigation/SlimSidebarNav.tsx`
- No change needed — it already early-returns when `isMobile || state !== 'collapsed'`, so it's desktop-only by construction.

## Implementation detail

In each nav component, branch on `isMobile`:
- Build `navItems` conditionally — append the original Profile item when `isMobile` is true.
- Wrap the return in `<div className={cn(isMobile ? "space-y-1.5" : "flex flex-col flex-1 min-h-0 space-y-1.5")}>`.
- Wrap the avatar dropdown block in `{!isMobile && (...)}`.
- For instructor: keep the Admin Portal block in its original position (not inside the bottom group). On desktop, place a `<div className="mt-auto" />` spacer (or apply `mt-auto` to the avatar wrapper) so only the avatar gets pushed to the bottom, leaving Admin Portal directly under the nav items.

No other files affected. No design tokens or routes change.
