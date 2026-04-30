## Goal

In the desktop sidebar, make the slim-view Dashboard icon sit at the exact same vertical position as the Dashboard icon in the expanded view, so toggling between expanded and slim does not visually shift the icon.

Only the slim Dashboard item position changes. No other icons, no dividers, no expanded-view changes.

## Why it's currently misaligned

Both views share the same `SidebarContent` wrapper (`pt-4`) and the same hamburger button (`h-9 w-9`). The drift comes from what's between the hamburger and the Dashboard link:

- **Expanded** (`ExpandedSidebarHeader` + `InstructorNavigation`):
  - Hamburger wrapper: `pb-3 mb-1 border-b` → 12px padding + 1px border + 4px margin = **17px** gap
  - Dashboard `<Link>`: `py-2` (8px top padding) + `h-5` icon
  - Icon top edge sits at: 16 (pt-4) + 36 (button) + 17 + 8 = **77px**

- **Slim** (`SlimSidebarNav`):
  - Hamburger has `mb-[14px]` = **14px** gap
  - Dashboard link is `h-9 w-9` flex-centered → icon (`h-5`) has 8px top inside it
  - Icon top edge sits at: 16 + 36 + 14 + 8 = **74px**

Math says slim should be 3px higher, but the screenshots show it visibly lower. The discrepancy is from `space-y-1.5` in `InstructorNavigation` not adding to the first child (so that's not it) — the real issue is likely the `border-b` line itself and its 1px adding visual weight that the slim view doesn't account for, plus subpixel rendering. Regardless of cause, the fix is to match the spacing math exactly.

## Fix

Update only `src/components/navigation/SlimSidebarNav.tsx`:

1. Change the hamburger button's bottom spacing from `mb-[14px]` to `mb-[17px]` so the gap between the hamburger and the Dashboard link's top edge is identical to the expanded view (12 + 1 + 4 = 17px, matching `pb-3 mb-1 border-b`).
2. Keep the Dashboard link as `h-9 w-9` flex-centered — that already matches the expanded link's `py-2 + h-5 icon` height (36px) and centers the icon at the same vertical offset.

No divider line is added. No other icons or items are touched. No changes to `InstructorNavigation`, `StudentNavigation`, `AdminNavigation`, or `DashboardLayout`.

## Files changed

- `src/components/navigation/SlimSidebarNav.tsx` — update one className value (`mb-[14px]` → `mb-[17px]`)

## Verification

After the change, toggling the desktop sidebar between expanded and slim should keep the Dashboard icon's center fixed at the same y-coordinate. If a 1–2px drift remains due to the border line's visual weight, fine-tune the value (e.g., `mb-[16px]` or `mb-[18px]`) — only this one number changes.
