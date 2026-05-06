## Disable Save Privacy until changed

In `src/pages/instructor/InstructorProfile.tsx`:

1. Add an `initialPrivacy` state that captures the loaded `{ hidePhone, hideEmail }` values from the instructor record (set alongside `setPrivacy` in `fetchInstructorData`).
2. Compute `privacyDirty = privacy.hidePhone !== initialPrivacy.hidePhone || privacy.hideEmail !== initialPrivacy.hideEmail`.
3. Add `disabled={!privacyDirty}` to the "Save Privacy" `Button`.
4. After a successful save, update `initialPrivacy` to the just-saved values so the button re-disables until the next change.

No other files affected.