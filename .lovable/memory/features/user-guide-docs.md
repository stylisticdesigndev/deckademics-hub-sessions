---
name: User Guide Living Documentation
description: Plain-language Student/Instructor/Admin PDF manuals generated from Markdown in docs/user-guide; must be kept in sync as features change
type: feature
---
# User Guide (Living Documentation)

End-user manuals for the app, one per role. Source of truth is Markdown; PDFs are generated artifacts.

## Files
- Source Markdown: `docs/user-guide/student-guide.md`, `instructor-guide.md`, `admin-guide.md`
- Generator: `docs/user-guide/generate_pdfs.py` (ReportLab, embeds Bitstream Vera TTF; brand green #40a647, dark #212529, accent #307834)
- Output PDFs: `/mnt/documents/Deckademics-{Student,Instructor,Admin}-Guide.pdf`

## Style
- Beginner-friendly, jargon-free. Each feature = what it is, why it helps, then numbered steps.
- Organized by category (matches the app nav). Uses real app terms (Classrooms, Skills, Curriculum, Novice/Amateur/Intermediate/Advanced, DJ Name).
- Vera font lacks some glyphs; the generator maps the arrow character to ">". Avoid exotic Unicode in the Markdown.

## Living-document rule
Whenever a user-facing feature is added, changed, or removed, update the matching section in the relevant docs/user-guide/*.md file AND regenerate the PDFs by running: python docs/user-guide/generate_pdfs.py

## Intended use
Currently admin-facing only; these docs will be turned into video tutorials.
