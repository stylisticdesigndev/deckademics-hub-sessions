## Goal

Restructure the desktop chrome so it mirrors a Gemini-style flow: logo lives in the header next to the hamburger, and the sidebar collapses to a narrow icon rail showing only Dashboard, Profile, and (for admins) the Admin Portal. Mobile/tablet behavior stays exactly as it is today.

## Changes

### 1. `src/components/layout/DashboardLayout.tsx`

- Remove the `<SidebarHeader>` containing the `<Logo />` from inside `<Sidebar>`.
- Switch `<Sidebar>` to `collapsible="icon"` so the desktop "collapsed" state renders a narrow rail (~3rem wide) instead of disappearing offcanvas. Mobile remains the Sheet drawer (unchanged — `isMobile` branch in the Sidebar component already handles this).
- In the sticky header, place the `<Logo size="header" />` immediately to the right of the existing hamburger/`MobileMenuButton` + desktop `SidebarTrigger`.
- Right-side header actions remain exactly four icons in this order: BugReportDialog, FeatureRequestDialog, Notifications (UserNotificationDropdown for student/instructor, NotificationDropdown for admin), Logout. The current admin-only suppression of bug/feature icons stays as-is — this still yields four icons for admins (Notifications + Logout + the two admin-mode bar items aren't counted; on admin pages the right side will show Notifications, Logout). Confirm with the user if admin needs the bug/feature icons too — current spec says "exactly four" which matches student/instructor layout.
- The footer block in the sidebar (avatar + settings dropdown) is removed since Profile now lives in the slim rail and Logout already lives in the header. This keeps the slim rail clean.

### 2. New component: `src/components/navigation/SlimSidebarNav.tsx`

A small wrapper rendered inside `<SidebarContent>` alongside the full nav. It uses `useSidebar()` to read `state` and `isMobile`:

- When desktop + `state === "collapsed"`: render a vertical stack of icon-only buttons:
  - Dashboard → `/{userType}/dashboard` (admin → `/admin/dashboard`)
  - Admin Portal (red) → `/admin/dashboard` — only if `isAdminUser(userData.profile?.email)` and current userType is instructor
  - Profile → `/{userType}/profile` (admin → `/admin/settings`), pinned to the bottom via `mt-auto`
- Otherwise (desktop expanded OR mobile): render `null` and let the existing full navigation render.

The full nav (`StudentNavigation` / `InstructorNavigation` / `AdminNavigation`) gets a sibling check: when desktop + collapsed, hide it. Simplest implementation is to wrap them in a `<div className="group-data-[state=collapsed]:hidden md:group-data-[state=collapsed]:hidden">` inside `DashboardLayout`, or have each nav early-return when `useSidebar().state === "collapsed" && !isMobile`. Plan: do the early-return inside each existing nav file — three small edits, no new wrapper needed.

### 3. Each navigation file (`StudentNavigation.tsx`, `InstructorNavigation.tsx`, `AdminNavigation.tsx`)

- Pull `state` from `useSidebar()`.
- If `!isMobile && state === "collapsed"`, return `null` (the SlimSidebarNav handles that case).

### 4. `DashboardLayout.tsx` sidebar content

```
<SidebarContent className="py-4">
  <SlimSidebarNav userType={userType} userEmail={userData.profile?.email} />
  {sidebarContent}
</SidebarContent>
```

### Visual notes

- Slim rail width comes from `SIDEBAR_WIDTH_ICON = "3rem"` already defined in `sidebar.tsx` — no change needed.
- Slim icons use `Button variant="ghost" size="icon"` with `Link` via `asChild`. Active route gets `bg-deckademics-primary/10 text-deckademics-primary`.
- Admin Portal slim icon uses `text-red-400 hover:bg-red-500/10` to match existing styling in `InstructorNavigation`.
- Hamburger toggle: the existing desktop `<SidebarTrigger className="hidden md:flex" />` in the header already toggles between expanded and collapsed — no new control needed. The SidebarTrigger stays in the header (top of the slim rail visually aligns with the header hamburger, satisfying the "Hamburger Menu (at the top)" requirement).

### Files touched

- `src/components/layout/DashboardLayout.tsx` — remove SidebarHeader, add Logo to header, wire SlimSidebarNav, switch to `collapsible="icon"`, drop SidebarFooter.
- `src/components/navigation/SlimSidebarNav.tsx` — new.
- `src/components/navigation/StudentNavigation.tsx` — early-return when desktop-collapsed.
- `src/components/navigation/InstructorNavigation.tsx` — same.
- `src/components/navigation/AdminNavigation.tsx` — same.

### Out of scope

- No changes to routes, auth, or any page content.
- Mobile sheet drawer behavior is untouched.
