## Narrated 3-Minute Admin Walkthrough

Extend the existing Remotion video into a longer, narrated tour of the admin side with a warm/professional female voice, motion graphics AND real UI screenshots of the running app.

### Deliverable
- `Deckademics-Admin-Walkthrough-v2.mp4` in `/mnt/documents/` (~180s, 1920x1080, 30fps, with audio)

### Narration
- **Voice:** ElevenLabs "Sarah" (EXAVITQu4vr4xnSDxMaL), warm & professional female
- **Generation:** One-off script via `code--exec` calling ElevenLabs API with the connector-synced `ELEVENLABS_API_KEY`; if the connector isn't linked, link `elevenlabs` first
- **Output:** MP3 saved to `remotion/public/audio/narration.mp3`, imported into Remotion via `<Audio>` and used to time scenes

### Script outline (~180s, ~430 words)
1. **Intro (0:00–0:15)** — Welcome to the Deckademics admin console; two big jobs: run the school, run payroll.
2. **Dashboard (0:15–0:30)** — Red status badges = things that need you. Signups, overdue payments, bug reports.
3. **Instructors (0:30–0:50)** — Add/edit, assign classes and rates, deactivate safely (students get reassigned).
4. **Students (0:50–1:10)** — Approve pending, assign to primary/secondary instructors, track proficiency.
5. **Curriculum vs Skills (1:10–1:25)** — Curriculum = what's taught. Skills = what's graded (0–100).
6. **Attendance & Announcements (1:25–1:40)** — School-wide oversight; categorized announcements.
7. **Payroll mental model (1:40–2:00)** — Weekly classes × class rate. That's it.
8. **Payroll 5-step flow (2:00–2:40)** — Generate → Preview → Confirm → Adjust (Extra Pay) → Mark as Paid.
9. **Edge cases (2:40–2:55)** — Sick day, cover session, void vs delete.
10. **Close (2:55–3:00)** — You're ready. Ship it.

### Visuals — mix motion graphics + real UI
- Keep the existing "Tech Product" green/dark aesthetic and typography (SpaceGrotesk / Inter)
- **New:** Capture ~10 real screenshots of the running app (localhost:8080) via Playwright as an authenticated admin: Dashboard, Instructors list, Student sheet, Curriculum page, Attendance grid, Announcements, Instructor Payments preview, Extra Pay dialog, Payroll history
- Screenshots saved to `remotion/public/screens/*.png`, displayed inside a subtle rounded "browser frame" card with a soft green glow, using Ken Burns-style slow zoom/pan (`interpolate` on scale + translate)
- Motion-graphic beats: title, formula, 5-step flow, closing — same style as v1
- New persistent lower-third: caption bar that mirrors the current narration line for accessibility

### Structure
```text
Scene 1  Title / Intro                     0:00–0:15   motion
Scene 2  Dashboard (screenshot + KB)       0:15–0:30   UI
Scene 3  Instructors (screenshot pan)      0:30–0:50   UI
Scene 4  Students (screenshot pan)         0:50–1:10   UI
Scene 5  Curriculum vs Skills (split)      1:10–1:25   motion + 2 UI
Scene 6  Attendance & Announcements        1:25–1:40   UI
Scene 7  Payroll Mental Model              1:40–2:00   motion
Scene 8  Payroll 5-Step Flow (per step UI) 2:00–2:40   motion + UI
Scene 9  Edge cases (cheatsheet cards)     2:40–2:55   motion
Scene 10 Close                             2:55–3:00   motion
```

### Timing sync
Since narration is one continuous MP3, place a single `<Audio src>` at the root of `MainVideo.tsx`. Time each `TransitionSeries.Sequence` to match the script beats above (frame counts at 30fps). After first render, listen back and nudge sequence durations if any scene lags the voice.

### Technical notes
- Reuse the existing `remotion/` project, `theme.ts`, and the working `scripts/render-remotion.mjs` (already handles the NixOS chromium/compositor quirks)
- New files:
  - `scripts/generate-narration.mjs` — calls ElevenLabs, writes `public/audio/narration.mp3`
  - `scripts/capture-screens.mjs` — Playwright script that restores the Supabase session from `LOVABLE_BROWSER_SUPABASE_*` env, navigates each admin route, and saves PNGs to `public/screens/`
  - `src/components/BrowserFrame.tsx` — reusable rounded window chrome
  - `src/components/CaptionBar.tsx` — lower-third caption synced by frame
  - New scenes under `src/scenes/` (Dashboard, Instructors, Students, Curriculum, Attendance, PayrollSteps, EdgeCases)
- Update `Root.tsx` durationInFrames to 5400 (180s × 30fps)
- Render with `muted: false` in `scripts/render-remotion.mjs` so the ElevenLabs MP3 audio is encoded into the final MP4; the earlier `muted: true` was only needed because there was no audio track

### If auth-blocked screenshots aren't possible
If `LOVABLE_BROWSER_AUTH_STATUS` is `signed_out` or `external_unmanaged`, fall back to capturing only public routes (`/`, `/auth`, `/design-system`) and rendering the rest of the admin scenes as high-fidelity mock UI cards built in Remotion (same look, no real data). I'll note which scenes used mocks in the closing message.
