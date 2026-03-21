

# Fix Dashboard Desktop Layout — Eliminate Negative Space

## Root Cause
The dashboard uses `lg:grid-cols-2` (1024px breakpoint) for all two-column grids, but with the sidebar open (~256px), the content area at common desktop widths (1000-1280px viewport) often falls below 1024px, causing everything to stack single-column. This creates a tall, narrow left-aligned layout with excessive whitespace on the right.

Additionally, `UpcomingClassesSection` and `AnnouncementsSection` render as bare fragments (h2 + content) rather than cards, so they look structurally different from their grid siblings (AttendanceChart, NotesSection) which are wrapped in cards.

## Changes

### 1. Dashboard grid breakpoints (`StudentDashboard.tsx`)
- Change all three `lg:grid-cols-2` grids to `md:grid-cols-2` (768px breakpoint) so two-column layout activates at typical desktop content widths
- Change stats section from `lg:grid-cols-4` to `md:grid-cols-4` in `StudentStatsSection.tsx`
- Change stats gap from `gap-3` to `gap-4` for consistency

### 2. Wrap UpcomingClassesSection in a Card (`UpcomingClassesSection.tsx`)
- Wrap the entire section in a `Card` with `CardHeader` (title) and `CardContent` (class list)
- Remove the bare `h2` and fragment wrapper
- Change the inner class grid from `grid-cols-1 sm:grid-cols-2` to a simple `space-y-3` vertical list (nested grids inside a grid cell cause layout issues)
- This matches the card structure of NotesSection (its grid sibling)

### 3. Wrap AnnouncementsSection in a Card (`AnnouncementsSection.tsx`)
- Wrap in a `Card` with `CardHeader` (title) and `CardContent`
- Remove the bare `h2` and fragment wrapper
- This matches NotesSection's card structure

### 4. OverallProgressRing fills space (`OverallProgressRing.tsx`)
- Remove fixed `h-[200px]` — use `min-h-[200px] h-full` so it stretches to match its grid sibling's height
- Add a title "Overall Progress" like SkillBreakdownChart has "Skill Breakdown" for structural parity

### 5. AttendanceChart height matching
- Add `h-full` to the outer div so it stretches to match UpcomingClassesSection in the same grid row

## Result
All grid sections use cards with consistent structure (title in header, content below). Two-column layout activates earlier so the dashboard fills the available width. No more bare headings floating outside cards. Every card in a grid row stretches to the same height.

