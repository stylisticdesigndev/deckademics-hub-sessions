## Plan: Add Payroll Help Video Button

### What

Add a small help/tutorial button (e.g., a "?" or video icon) to the payroll page header that opens a dialog overlay containing the uploaded explainer video. The dialog floats over the page without navigating away.

### How

1. **Copy the video file** to `public/videos/instructor-payroll-guide.mp4` so it can be served as a static asset.
2. **Update `AdminInstructorPayments.tsx**`:
  - Add a state variable `showHelpVideo` (boolean).
  - Add a small icon button (using `CircleHelp` or `Video` from lucide-react) next to the page title in the header area, wrapped in a Tooltip saying "How to use Payroll".
  - Add a `Dialog` controlled by `showHelpVideo` containing:
    - `DialogTitle`: "Payroll Tutorial"
    - A `<video>` element with `controls`, `src="/videos/instructor-payroll-guide.mp4"`, sized to fill the dialog (max-w-3xl).
  - Closing the dialog stops/pauses the video.

### Technical Details

- The dialog uses the existing `Dialog`/`DialogContent` components already imported in the file.
- Video uses native HTML5 `<video controls>` for play/pause/seek.
- A `ref` on the video element will pause playback when the dialog closes via `onOpenChange`.
- Only visible to users who pass the `canAccessPayroll` gate (already handled by the existing access check).  
  
Give me a screenshot on what the page looks like with this feature 