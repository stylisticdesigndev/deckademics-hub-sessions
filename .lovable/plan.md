## Problem

The recent navbar changes (avatar footer, slim collapsed mode, Admin Portal moved into avatar dropdown, removal of in-nav "Profile" item) were intended for desktop only, but they are leaking into tablet view.

Root cause: the `useIsMobile()` hook treats anything ≥768px as "desktop." Tablets (iPad ~820–1024px) therefore get the new desktop sidebar treatment — losing the original "Profile" nav item, gaining the avatar footer / slim sidebar, and (for instructor-admins) losing the in-nav Admin Portal entry.

Mobile (<768px) shouldn't be affected by the avatar footer logic itself (it's gated by `if (isMobile) return null`), but any other regressions there will be inspected and reverted to match production.

## Goal

Restore the production look on **mobile and tablet** while keeping all recent changes scoped to **desktop only** (≥1024px).

## Plan

### 1. Introduce a "desktop" breakpoint

Add a new hook `src/hooks/use-desktop.tsx`:

```ts
const DESKTOP_BREAKPOINT = 1024; // tablet and below = non-desktop
export function useIsDesktop() { /* matchMedia min-width 1024px */ }
```

Leave the existing `useIsMobile` (768px) untouched — other features rely on it.

### 2. Gate every recent navbar change behind `isDesktop` instead of `!isMobile`

Files to update:

- **`src/components/navigation/SidebarUserFooter.tsx`**
  - Render only when `isDesktop` is true. On mobile **and tablet**, return `null` so the sidebar looks like production (no avatar footer).

- **`src/components/navigation/SlimSidebarNav.tsx`**
  - Only activate slim mode when `isDesktop && state === 'collapsed'`. Tablet should behave like the old mobile/sheet sidebar (no slim icon rail).

- **`src/components/navigation/StudentNavigation.tsx`**
  - **`InstructorNavigation.tsx`**
  - **`AdminNavigation.tsx`**
  - Change the "include Profile nav item" rule from `isMobile ? withProfile : withoutProfile` to `isDesktop ? withoutProfile : withProfile`. Tablet keeps the original Profile item, just like production.
  - Change the "hide nav in slim mode" guard from `if (!isMobile && state === 'collapsed') return null` to `if (isDesktop && state === 'collapsed') return null`. Tablet never hides the nav.

- **`src/components/navigation/InstructorNavigation.tsx`** (admin-portal entry)
  - On tablet (non-desktop), reinstate the standalone "Admin Portal" button + divider exactly as it was in production for instructor-admins. On desktop, keep it inside the avatar dropdown only.

- **`src/components/layout/DashboardLayout.tsx`**
  - `ExpandedSidebarHeader` (the in-sidebar hamburger) currently shows whenever `!isMobile && state === 'expanded'`. Change to `isDesktop && state === 'expanded'` so tablet doesn't get the new in-sidebar hamburger.
  - `HeaderHamburger` currently shows only when `isMobile`. Change to `!isDesktop` so the header hamburger is shown on **both mobile and tablet** (matching production, where tablet used the sheet sidebar via the header hamburger).
  - The `Sidebar` itself: shadcn's `Sidebar` already switches to a `Sheet` overlay only when `useIsMobile()` (768px) is true, so on tablet it currently renders inline. To match production (tablet used the sheet/overlay), no change to shadcn is needed — the header hamburger restoration above keeps the existing inline sidebar visible on tablet, which is the production behavior. (If after testing tablet still differs, we'll revisit using a custom override; not changing shadcn internals in this pass.)

### 3. Verify

- Mobile (<768px): identical to production — header hamburger opens sheet, sheet shows full nav including "Profile" and (for instructor-admins) the "Admin Portal" button.
- Tablet (768–1023px): identical to production — inline sidebar with full nav including "Profile" and "Admin Portal", no avatar footer, no slim collapse rail, no in-sidebar hamburger above the nav.
- Desktop (≥1024px): all recent changes preserved — slim/expanded toggle, avatar footer pinned to bottom, Admin Portal inside avatar dropdown, in-sidebar hamburger.

## Out of scope

- No visual/style changes — only breakpoint gating.
- No changes to `useIsMobile` (other features depend on it).
- No changes to shadcn `sidebar.tsx` internals.
