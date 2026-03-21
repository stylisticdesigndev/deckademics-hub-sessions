

# Fix Student Profile Page Visual Hierarchy

## Current Issues
At the current viewport (1000px with sidebar), the page uses a `md:grid-cols-3` layout where:
- Left column (2/3): Personal Information card with avatar, form fields, and bio
- Right column (1/3): Course Info, Instructor, Instructor Notes, and Notification Preferences cards stacked vertically

The right sidebar cards are narrow and create uneven visual weight. The empty states in Course Info and Instructor cards have excessive `py-8` padding. The overall layout doesn't flow cohesively.

## Plan

### 1. Restructure to full-width stacked layout
Change from the 2/3 + 1/3 grid to a full-width layout where cards span the available width in a logical top-to-bottom flow:

**Row 1**: Profile header card (avatar + name/email + Edit button) — full width, compact  
**Row 2**: Two-column grid — Personal Details (name, email, phone, bio form) | Course & Instructor info (combined into one card)  
**Row 3**: Notification Preferences — full width

### 2. Combine Course Info + Instructor into one card
Merge the separate Course Information and Instructor cards into a single "Enrollment Details" card with sections for course, level, duration, and instructor. Reduces card count and eliminates redundant headers.

### 3. Reduce empty state padding
Change `py-8` to `py-4` on empty states to reduce negative space when no data is available.

### 4. Pull avatar into a compact profile header
Extract the avatar + name display from the form into a top-level full-width card. This creates a clear visual anchor at the top of the page. The form card below focuses purely on editable fields.

### Files Changed
- `src/pages/student/StudentProfile.tsx` — restructure layout, combine cards, add profile header card

