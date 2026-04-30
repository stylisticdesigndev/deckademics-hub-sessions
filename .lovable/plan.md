## Goal

Stop iOS Safari from auto-zooming when the user taps an input, textarea, or select anywhere in the app — student, instructor, and admin sides.

## Why this happens

iOS Safari auto-zooms into any focused form control whose computed font size is **smaller than 16px**. Several of our base UI components currently render at 14px (`text-sm`) on mobile:

- `Textarea` — always `text-sm` (this matches the Bug Report screen recording you sent)
- `Select` trigger — always `text-sm`
- `Input` — already correct on mobile (`text-base` then `md:text-sm`), but a few places override it with `text-sm` directly

The viewport meta tag is fine and we will **not** lock zoom with `maximum-scale=1` — that's an accessibility anti-pattern and breaks pinch-to-zoom for users who need it. The real fix is making the controls themselves big enough that iOS has no reason to zoom.

## Changes

### 1. Base UI primitives (the bulk of the fix)

Update three files so they render 16px on mobile and 14px from the `md` breakpoint up — same pattern `Input` already uses:

- `src/components/ui/textarea.tsx` — change `text-sm` → `text-base md:text-sm`
- `src/components/ui/select.tsx` — change `SelectTrigger` `text-sm` → `text-base md:text-sm`
- `src/components/ui/input.tsx` — already correct, leave alone

This single change fixes the vast majority of inputs across student, instructor, and admin pages because nearly everything uses these primitives.

### 2. Direct overrides that re-introduce the bug

Audit the handful of places that override the primitive with `text-sm` or `text-xs` and apply the same `text-base md:text-sm` pattern (or remove the override):

- `src/components/instructor/students/InstructorStudentDetailDialog.tsx` — task title `Input` and description `Textarea` (`text-sm`)
- `src/pages/admin/AdminBugReports.tsx` — `SelectTrigger` `text-xs`
- `src/pages/admin/AdminFeatureRequests.tsx` — `SelectTrigger` `text-xs`
- `src/pages/admin/AdminSkills.tsx` — raw `<input>` styled with `text-sm`

(Plain text labels using `text-sm` are not affected — only editable form controls trigger the zoom.)

### 3. Quick sweep for any `<input>` / `<textarea>` / `<select>` not using the primitives

Scan once for raw HTML form elements with small text classes and fix any stragglers the same way.

### 4. Optional safety net (CSS)

Add a single utility rule in `src/index.css` so any future input that slips through still won't trigger zoom:

```css
@media (max-width: 767px) {
  input, textarea, select { font-size: 16px; }
}
```

Desktop styling (`md:text-sm` etc.) remains unaffected because the rule only applies below the `md` breakpoint.

## What stays the same

- No change to the viewport meta tag — pinch-to-zoom remains enabled for accessibility.
- No visual change on desktop — all controls still render at 14px from `md` up.
- No change to non-editable text (labels, badges, table cells) — those don't cause zoom and shrinking them keeps mobile density.

## Verification

After the change I'll spot-check the two flows from your recordings (Bug Report textarea, login/auth inputs) plus a representative form on each side: instructor Add Cover Session dialog, admin Create Payment dialog, student Profile.
