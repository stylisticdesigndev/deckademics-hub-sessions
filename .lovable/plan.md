

# Fix Profile Picture Upload Visibility

## Problem
The `AvatarUpload` component is only rendered when `isEditing` is true and demo mode is off. In all other states (view mode, demo mode), users see a plain avatar with initials and no upload button.

## Plan

### `src/pages/student/StudentProfile.tsx`

**Profile Header Card (Row 1)** — Always show the `AvatarUpload` component in the header card, not just in edit mode:

- **Live data mode**: Always render `AvatarUpload` with `currentUrl={userData?.profile?.avatar_url}`. This shows the current photo (or fallback initials) plus the "Upload Photo" / "Change Photo" button at all times — no need to enter edit mode first.
- **Demo mode**: Show `AvatarUpload` in a disabled/display-only state. Render the static `Avatar` with demo initials but add a visual indicator (e.g., a sample avatar image or just the initials). Since demo mode is read-only, keep the static avatar but use a larger size to match the live version's visual weight.

Specifically:
1. Remove the `isEditing && !isDemoActive` conditional — always show `AvatarUpload` when not in demo mode
2. In demo mode, show the static avatar (no upload capability, which is correct)
3. Change `AvatarUpload` size from `"sm"` to `"md"` so the photo is more prominent in the header

### Files Changed
- `src/pages/student/StudentProfile.tsx` — restructure avatar rendering in the profile header card

