

## Fix PWA Title Bar Color on macOS Desktop

### Problem
The `theme_color` in both `manifest.json` and the `<meta name="theme-color">` tag in `index.html` is set to `#41A55B` (green). macOS uses this color for the title bar area when the app is saved to the desktop, causing the green bar you see.

### Solution
Change the `theme_color` to match the app's dark background color `#222730` (the same value already used for `background_color` in the manifest).

### Changes

**File: `public/manifest.json`**
- Change `theme_color` from `#41A55B` to `#222730`

**File: `index.html`**
- Change `<meta name="theme-color" content="#41A55B">` to `<meta name="theme-color" content="#222730">`

After this change, you'll need to re-add the app to your desktop for the new color to take effect (remove the old one first, then re-save it).

