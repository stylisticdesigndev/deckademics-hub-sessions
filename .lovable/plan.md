
# Rebuild the 3 walkthrough videos — hybrid + accurate narration

## The real problem
Narration describes features that don't exist in production (e.g. "red/green dashboard status", flows that aren't wired the way described). Fixing accuracy matters more than fixing visuals.

## Approach
For each of the 3 videos (Admin, Instructor, Student):

1. **Audit each scene against the actual page in the codebase.** Read the page component, list what's actually there, flag every narration line that doesn't match.
2. **Rewrite the narration script** so every sentence describes something that exists. Keep length roughly the same so I don't have to redo scene timing math from scratch.
3. **Regenerate audio** via the existing `generate-narration.mjs` / `generate-narration-role.mjs` scripts (Lovable AI Gateway TTS, "nova" voice).
4. **Rebuild scenes in hybrid style:**
   - Stylized motion graphics for: intro, close, payroll formula, conceptual scenes ("curriculum vs skills")
   - Real screenshots (`ScreenshotShowcase`) only for: 2–3 key UI scenes per video where seeing the real page matters (Dashboard, Payroll flow, Skills page, etc.)
5. **Render scene-by-scene** using the programmatic renderer with a `--frames=A-B` wrapper, then concat with ffmpeg. This is what keeps us under the 10-min sandbox cap per call.
6. **Mux narration** with the existing `mux-audio.mjs`.
7. **Wire the instructor + student videos into their dashboards** the same way admin already is (manual-play button + modal, no autoplay).

## Order of execution
1. Admin v4 (audit + rewrite + render + mux) — ship first so you can review the accuracy fix before I burn time on the other two
2. You confirm accuracy is good
3. Instructor v2 (same process)
4. Student v2 (same process)
5. Wire both into dashboards + profile replay buttons

## Time estimate
- Admin v4: ~20–30 min in this thread (audit is the slow part, render is chunked but automated)
- Instructor + Student after approval: ~30–45 min each

## Technical notes
- `ScreenshotShowcase` limited to ≤3 scenes per video to keep total heavy-frame count manageable
- Render pipeline: per-scene MP4 via `renderMedia` with `frameRange`, then `ffmpeg concat` → `mux-audio.mjs`
- Screenshots already live in `remotion/public/screenshots/` from the v3 attempt — reused, not regenerated
- No new deps

## What I need from you
Just confirm — should I start with **Admin v4 only** so you can validate the accuracy fix before I commit to instructor + student?
