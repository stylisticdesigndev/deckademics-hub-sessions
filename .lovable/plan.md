## Goal

Mobile/tablet's off-canvas sidebar regressed during the recent desktop nav work. The avatar footer block that previously sat at the bottom of the mobile sheet (avatar + name + role label + settings gear with Profile/Logout dropdown) is now missing. Restore it exactly as in the production screenshot, without changing any of the desktop expanded/slim behavior we just finalized.

## What's wrong now

`SidebarUserFooter` (the new component) early-returns `null` on mobile, so mobile's sheet has no footer at all. The original mobile footer used a `SidebarFooter` block with avatar + name/role on the left and a `Settings` gear `DropdownMenu` on the right (Profile + Logout items).

## Fix

Add a mobile-only branch inside `SidebarUserFooter` that renders the original layout. Desktop (expanded and collapsed) branches stay exactly as they are today.

### `src/components/navigation/SidebarUserFooter.tsx`

- Remove the `if (isMobile) return null;` early-return.
- Add a new mobile branch (when `isMobile === true`) that renders:
  - A `<div className="p-4 border-t border-sidebar-border">` wrapper (matches the original `SidebarFooter` styling).
  - Inside: a `flex justify-between items-center` row.
  - Left: `Avatar` (default size, `bg-deckademics-primary/20 text-deckademics-primary` fallback) + a `<div>` with name (`text-sm font-medium`) and capitalized role label (`text-xs text-muted-foreground`). For role label use `userType.charAt(0).toUpperCase() + userType.slice(1)`.
  - Right: `DropdownMenu` with a `Button variant="ghost" size="icon"` trigger containing the `Settings` gear icon. Menu items:
    - `View Profile` → navigates to `/${userType}/profile` (for admin keep `/admin/profile` since that route now exists).
    - `Admin Portal` (only when `showAdminPortal` is true) — preserve red styling, same as desktop dropdown.
    - `Logout` → `signOut()`.
- Desktop expanded and collapsed branches: unchanged.
- New imports needed: `Settings` from `lucide-react`, `Button` from `@/components/ui/button`.

### No other files change

- `DashboardLayout.tsx`, `SlimSidebarNav.tsx`, `StudentNavigation.tsx`, `InstructorNavigation.tsx`, `AdminNavigation.tsx` stay as they are. Mobile already correctly includes the "Profile" nav item in the list, the in-sheet hamburger is correctly hidden, and the header hamburger on mobile is correct — that all matches the production screenshot.

## Result

- Mobile sheet: logo at top, full nav list including "Profile", and the restored avatar footer (avatar + name + role + gear dropdown) pinned at the bottom — matches the production screenshot exactly.
- Desktop expanded and slim: unchanged from the version you just approved.
