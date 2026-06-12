# User Guide (PDF Manuals)

Create plain-language **PDF user manuals** — written so a complete beginner can follow — covering every part of the app for **Students**, **Instructors**, and **Admins**. Three separate PDFs (one per role) so each maps cleanly to a future video tutorial series. The guides stay current: whenever app features change, the source is updated and the PDFs are regenerated.

## Deliverables (downloadable PDFs)

```text
/mnt/documents/
  Deckademics-Student-Guide.pdf
  Deckademics-Instructor-Guide.pdf
  Deckademics-Admin-Guide.pdf
```

Each PDF previewable/downloadable directly in chat.

## How it stays a "living document"

A PDF can't edit itself, so the real source of truth is kept in the project:

```text
docs/user-guide/
  student-guide.md
  instructor-guide.md
  admin-guide.md
```

- These Markdown files are the editable source.
- A small generator script renders each `.md` into a branded PDF.
- A **project-memory rule** will instruct all future work: whenever a user-facing feature is added, changed, or removed, update the matching `docs/user-guide/*.md` section **and** regenerate the PDF. Since memory is always in context, the manuals stay in sync automatically.

## Look & feel

- Branded cover page per role (app name, guide title, "Deckademics" styling using the app's primary brand color).
- Clear table of contents with categories.
- Readable typography, generous spacing, numbered step-by-step instructions.
- No screenshots for now (these become videos), but structured to read aloud as a script.

## Writing style

- Simple, friendly, jargon-free; assumes no prior app experience.
- Every feature = **what it is → why you'd use it → step-by-step how to do it.**
- Uses the app's real terms (Classrooms, Skills, Curriculum, Novice/Amateur/Intermediate/Advanced, DJ Name, etc.).

## Content outline (organized by category)

### Student Guide
- **Getting Started**: sign up, admin approval wait, first login, profile setup, mandatory photo upload, installing the app to your phone (Add to Home Screen), enabling push notifications.
- **Dashboard**: reading your overview, next class, skills at a glance.
- **Skills & Progress**: how proficiency levels work, viewing your skill breakdown.
- **Curriculum**: browsing what you'll learn at each level.
- **Classes**: schedule, marking yourself absent, "Running Late" button.
- **Notes**: personal notes, saving instructor messages/images to notes.
- **Messages**: chatting with your instructor, the 7-day reply window.
- **Announcements**: reading, marking as read / dismissing.
- **Profile & Settings**: editing profile, notification preferences (email/SMS/push).
- **Help**: reporting a bug, Sunday Practice link.

### Instructor Guide
- **Getting Started**: sign up, approval, login, profile setup, DJ Name, photo.
- **Dashboard**: daily overview.
- **Students**: roster, student detail, primary vs. secondary instructor.
- **Classes**: schedule, Day/Week/Month filtering.
- **Attendance**: marking Present/Absent per weekly session in Classrooms 1–3.
- **Skills & Curriculum**: assessing student skills, viewing curriculum.
- **Notes & Messages**: student notes, conversational threads, auto-alerts (late/absent) sent to both assigned instructors.
- **Announcements**: posting/reading.
- **My Payment**: reading your payment ledger.
- **Profile & Settings**.

### Admin Guide
- **Getting Started & Roles**: admin login, "Return to Teaching View," who can see payroll.
- **Dashboard & Notifications**: overview, unread/critical badges.
- **Instructor Management**: approve, add, edit, deactivate (reassignment behavior).
- **Student Management**: approve, add, edit, Active/Pending/Inactive tabs.
- **Curriculum Management**: rubrics vs. trackable Skills.
- **Skills & Progress Overview**: monitoring proficiency school-wide.
- **Attendance**: school-wide attendance.
- **Payments**: Student Payments (installment plans, tiered pricing), Instructor Payments (payroll history), Payments sandbox preview.
- **Communication**: Messages, Announcements (categories).
- **Feedback**: Bug Reports, Feature Requests.
- **Settings**.

## Technical approach
- Write the three Markdown source files under `docs/user-guide/`.
- Use a Python generator (ReportLab) to render branded PDFs into `/mnt/documents/`.
- Visually QA every page of each PDF (convert to images, inspect) and fix layout issues before delivering.
- Save the project-memory maintenance rule.

## What this does NOT include
- No in-app Help page or navigation changes.
- No database, component, or route changes — documentation only.
