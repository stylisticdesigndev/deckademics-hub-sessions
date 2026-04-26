## Problem
On `/admin/ledger-preview` (and the live `/admin/instructor-payments`), the Instructor Payroll header row shifts/reflows when you pick instructors from the dropdown. Two causes:

1. **Badge widens the trigger button** — When `selectedInstructorIds.length > 0`, a count `<Badge>` is appended inside the "Pick Instructors" / "Generate Selected" button. The button grows by ~24–32px and pushes neighboring buttons.
2. **Row wraps at ~1000px** — The header uses `flex-wrap` with `justify-between`, so any width change in the right-side button group can cause it to drop to a new line or re-distribute spacing.

## Fix (preview + live, 1-for-1)

**File: `src/pages/admin/AdminLedgerPreview.tsx`** (preview header, lines ~667–753)
- Give the "Pick Instructors" button a **fixed minimum width** (`min-w-[180px]`) so the badge appearing/disappearing doesn't change its size.
- Keep badge inside but reserve consistent space using `justify-between` inside the button so icon/label/badge/chevron sit in stable slots.
- Remove `flex-wrap` from the action group's parent, OR keep it but make the right-hand action cluster a fixed-order `flex-nowrap` group so buttons don't reorder. Outer container keeps `flex-wrap` only for very small screens.

**File: `src/pages/admin/AdminInstructorPayments.tsx`** (live header, lines ~575–610)
- Apply identical treatment to the "Generate Selected" trigger button (`min-w-[200px]`, internal `justify-between` for icon/label/badge/chevron) so the badge insertion is non-shifting.
- Confirm the right-side `<div className="flex items-center gap-2">` stays `flex-nowrap` (it already is — no change needed beyond button width stabilization).

## What stays the same
- All functionality (selection, generate, extra pay, help video) unchanged.
- Visual style (variants, icons, gap, alignment) unchanged.
- The count badge still appears — it just no longer resizes the button.

## Acceptance
- Selecting/deselecting instructors in either the preview or the live page leaves every other button in the header in the **exact same x/y position**.
- No row wrapping changes triggered by selection state at viewport widths ≥768px.