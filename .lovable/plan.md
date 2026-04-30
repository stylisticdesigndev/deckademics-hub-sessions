## Goal

Match the Gemini-style layout for the **expanded** sidebar: place the hamburger menu *inside* the sidebar at the top, alongside the existing nav. Reorganize the top header bar so the hamburger sits on the far left and the logo is pushed to the right of the nav bar area (i.e. only visible/anchored when the sidebar is collapsed/slim — no duplicate hamburger in the header when the sidebar is expanded).

Slim sidebar should go back to the previous clean version (Dashboard up top, Admin Portal + Profile pinned to bottom) — **no hamburger inside the slim rail**, since the toggle now lives in the header when collapsed.

## Changes

### 1. `src/components/layout/DashboardLayout.tsx`

- Header layout becomes: `[Hamburger]  [Logo]   ...spacer...   [Bug] [Feature] [Notifications] [Logout]`
- The hamburger in the header is **only rendered when the sidebar is collapsed (desktop) or on mobile**. When the desktop sidebar is expanded, the header hamburger is hidden because the in-sidebar hamburger takes over.
- Logo stays immediately to the right of where the hamburger would sit. When the header hamburger is hidden (expanded state), the logo aligns flush to the left edge of the main content area — visually it appears "pushed to the right of the nav bar" because the expanded sidebar now occupies that left strip.
- Implementation: wrap `HamburgerButton` with `useSidebar()` and render conditionally:
  ```tsx
  const { state, isMobile } = useSidebar();
  const showHeaderHamburger = isMobile || state === 'collapsed';
  {showHeaderHamburger && <HamburgerButton />}
  ```
  Since `useSidebar` only works inside `SidebarProvider`, extract the header into a small inner component.

### 2. `src/components/layout/DashboardLayout.tsx` — sidebar content

Add a small header row inside `<SidebarContent>` that's only visible in the **expanded desktop** state, containing just the hamburger toggle aligned to the left:

```tsx
<SidebarContent className="py-4">
  <SlimSidebarNav userType={userType} />
  <ExpandedSidebarHeader />   {/* new: hamburger inside sidebar, only when expanded */}
  {sidebarContent}
</SidebarContent>
```

`ExpandedSidebarHeader` returns `null` on mobile or when collapsed; otherwise renders a single `Menu` icon button (ghost, h-9 w-9) in a `px-2 pb-3 mb-1 border-b border-sidebar-border` row. This visually anchors the top of the expanded sidebar similar to Gemini, without disrupting the existing nav typography or spacing below.

### 3. `src/components/navigation/SlimSidebarNav.tsx`

Revert the recent change — remove the in-rail hamburger and the divider. Restore:
- Dashboard at top
- Admin Portal (red) + Profile pinned to bottom (Admin above Profile, as already implemented)

The header hamburger handles toggling from the slim state.

## Behavior summary

| State | Header left | Sidebar top |
|---|---|---|
| Desktop expanded | Logo only (flush left of main area) | Hamburger inside sidebar |
| Desktop collapsed (slim) | Hamburger + Logo | Dashboard icon (no hamburger) |
| Mobile | Hamburger + Logo | Sheet drawer (unchanged) |

Right-side header actions (Bug, Feature, Notifications, Logout) remain unchanged in all states.

## Files touched

- `src/components/layout/DashboardLayout.tsx` — split header into inner component using `useSidebar`, conditional hamburger, add `ExpandedSidebarHeader` inside `SidebarContent`.
- `src/components/navigation/SlimSidebarNav.tsx` — revert to pre-hamburger version (Dashboard top; Admin + Profile bottom).

## Out of scope

- No changes to nav items, routes, or mobile sheet behavior.
- No changes to `StudentNavigation` / `InstructorNavigation` / `AdminNavigation`.
