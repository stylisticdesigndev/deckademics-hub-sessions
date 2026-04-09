

# Production-Ready Audit & PWA Setup

## 1. PWA Setup (Installable Web App — No Service Worker)

Since this is for stakeholder handoff and "Add to Home Screen" installability, we use a simple manifest + meta tags approach (no `vite-plugin-pwa`, no service worker). This avoids preview/iframe issues.

### Files to create/modify:

**Copy uploaded icon to project:**
- Copy `user-uploads://Untitled_design_1.png` → `public/app-icon.png`

**Create `public/manifest.json`:**
- `name`: "Deckademics Hub"
- `short_name`: "Deckademics"
- `display`: "standalone"
- `start_url`: "/"
- `background_color`: "#222730" (dark background — generates Android splash)
- `theme_color`: "#41A55B" (green primary)
- `icons`: 192x192 and 512x512 entries pointing to `/app-icon.png`

**Update `index.html`:**
- Add `<link rel="manifest" href="/manifest.json">`
- Add `<meta name="theme-color" content="#41A55B">`
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- Add `<link rel="apple-touch-icon" href="/app-icon.png">`
- Add `<link rel="apple-touch-startup-image" href="/app-icon.png">` (basic; see iOS splash note below)
- Add `<link rel="icon" type="image/png" href="/app-icon.png">`
- Remove old `favicon.ico` reference if any

**iOS Splash Screen Logic (`src/components/pwa/IOSSplashScreen.tsx`):**
- A React component that shows `app-icon.png` centered on `#222730` background during initial load
- Only renders in standalone mode (`window.matchMedia('(display-mode: standalone)')`)
- Auto-hides after app mounts (1.5s fade-out)
- Mounted in `main.tsx` before the root app

## 2. Code Documentation

**`src/providers/AuthProvider.tsx`** — already has a JSDoc header; will add inline comments to `signIn`, `signUp`, `signOut`, and `createProfileFromMetadata` methods.

**`src/integrations/supabase/client.ts`** — already documented; no changes needed.

**Demo sections** — verify all demo code blocks have `// ===== DEMO MODE START =====` / `// ===== DEMO MODE END =====` markers. Files to check:
- `StudentDashboardGate.tsx`
- `StudentDashboard.tsx`
- `InstructorDashboardGate.tsx`
- `InstructorDashboard.tsx`
- `mockDashboardData.ts`
- `mockInstructorData.ts`

## 3. Security & UI Audit

**Environment variables** — already verified: `supabase/client.ts` uses `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with a guard. No hardcoded credentials.

**Route guards** — all `/student/*`, `/instructor/*`, `/admin/*` routes wrapped in `<ProtectedRoute allowedRoles={[...]} />`. Verified in `App.tsx`.

**Responsive check** — visual pass on layouts (no code changes unless issues found).

## 4. Updated Stakeholder Summary

Update `STAKEHOLDER_SUMMARY.md` with:
- PWA / installability section
- Student Setup Guide: how to "install" the app from Safari (iOS) and Chrome (Android)
- What to expect: the icon, the splash screen, standalone mode
- Existing sections preserved

## Files Changed

| File | Action |
|---|---|
| `public/app-icon.png` | Copy from upload |
| `public/manifest.json` | Create |
| `index.html` | Add PWA meta tags |
| `src/components/pwa/IOSSplashScreen.tsx` | Create — iOS splash component |
| `src/main.tsx` | Mount iOS splash component |
| `src/providers/AuthProvider.tsx` | Add inline code comments |
| `STAKEHOLDER_SUMMARY.md` | Add PWA + Student Setup Guide sections |
| Demo files (4 files) | Verify/add demo markers if missing |

No demo code will be removed or altered.

