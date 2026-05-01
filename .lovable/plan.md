## Goal

Make the avatar and name in the sidebar profile footer slightly larger and more prominent across Student, Instructor, and Admin portals — for Desktop (expanded), Desktop (slim/collapsed), Tablet, and Mobile (off-canvas sheet). Long names (long First+Last for students, long DJ names for instructors) stay on a single line and gracefully truncate with an ellipsis. Full name remains visible in the dropdown menu label.

## Changes

### 1. `src/components/navigation/SidebarUserFooter.tsx` — expanded footer (Desktop expanded + Mobile sheet)

- Avatar: `h-7 w-7` → `h-9 w-9` (28px → 36px). Remove the `-ml-0.5` nudge so the larger avatar aligns cleanly.
- Name text: `text-sm font-medium` → `text-base font-semibold`.
- Row padding: `px-2.5 py-2` → `px-3 py-2.5` to balance the larger avatar.
- Gap: `gap-x-2` → `gap-x-3`.
- Avatar fallback initials: `text-xs` → `text-sm`.
- Keep `flex-1 text-left truncate` on the name span — guarantees single-line ellipsis on every breakpoint (sidebar width is fixed, so long names clip cleanly).
- Add `min-w-0` to the name span's parent flex item context (already implicit via `flex-1 truncate`, but verify).
- Dropdown label (`DropdownMenuLabel`) keeps the full name visible on click — already has `truncate` plus ample width (`w-[calc(100vw-2rem)] max-w-xs sm:w-56`).

### 2. `src/components/navigation/SidebarUserFooter.tsx` — collapsed/slim footer (Desktop collapsed)

- Outer button: `h-9 w-9` → `h-11 w-11`.
- Inner avatar: `h-7 w-7` → `h-9 w-9` to match the expanded state.
- Fallback text: `text-xs` → `text-sm`.
- Vertical padding stays `py-3` so the slim rail keeps its rhythm.

### 3. No changes to `SlimSidebarNav.tsx`

That file only renders the dashboard icon + menu toggle in the slim rail. Avatar in slim mode is owned by `SidebarUserFooter` and is updated above.

## Long-name behavior (per viewport)

- Desktop expanded: sidebar width is fixed (~14–16rem). `truncate` clips the name with `…`. Hovering/clicking the row opens the dropdown whose label shows the full name.
- Desktop slim/collapsed: only the avatar is visible — no name to truncate. Dropdown label still shows the full name.
- Tablet: same expanded sidebar treatment as Desktop (single line + ellipsis).
- Mobile: footer renders inside the off-canvas Sheet at the same sidebar width; single line + ellipsis. Dropdown label shows the full name (`w-[calc(100vw-2rem)] max-w-xs`), so even very long DJ names are fully readable when tapped.

## Out of scope

- No changes to other avatar surfaces (header, message threads, attendance cards, profile pages).
- No font-family or color changes.
- No layout changes to the navigation list above the footer.

## Files touched

- `src/components/navigation/SidebarUserFooter.tsx` (only file)
