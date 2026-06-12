---
name: User Guide Living Documentation
description: Plain-language Student/Instructor/Admin PDF manuals generated from Markdown in docs/user-guide; kept in sync via hash-based audit
type: feature
---
# User Guide (Living Documentation)

End-user manuals for the app, one per role. Source of truth is Markdown; PDFs are generated artifacts.

## Files
- Source Markdown: `docs/user-guide/student-guide.md`, `instructor-guide.md`, `admin-guide.md`
- Generator/audit: `docs/user-guide/generate_pdfs.py` (ReportLab, embeds Bitstream Vera TTF; brand green #40a647, dark #212529, accent #307834)
- Drift manifest: `docs/user-guide/.pdf-manifest.json` (sha256 of each md at last PDF build)
- Output PDFs: `/mnt/documents/Deckademics-{Student,Instructor,Admin}-Guide.pdf`

## Commands
- Rebuild all: `python docs/user-guide/generate_pdfs.py`
- Audit only (no writes): `python docs/user-guide/generate_pdfs.py --check` -> exit 0 if in sync, 1 + list if stale
- Auto-fix stale ones: `python docs/user-guide/generate_pdfs.py --sync`

## Living-document workflow
1. When a user-facing feature is added/changed/removed, update the matching `docs/user-guide/*.md` section AND run `--sync` so the PDF matches.
2. Periodic audit: when active in this project and it has been roughly a week (or whenever convenient), run `--check`; if it reports drift, run `--sync` and tell the user which guides were refreshed.
   Note: there is no background scheduler; audits only happen while the agent is working in the project.

## Style
- Beginner-friendly, jargon-free. Each feature = what it is, why it helps, then numbered steps.
- Organized by category (matches the app nav). Real app terms (Classrooms, Skills, Curriculum, Novice/Amateur/Intermediate/Advanced, DJ Name).
- Vera font lacks some glyphs; generator maps the arrow character to ">". Avoid exotic Unicode in the Markdown.

## Intended use
Currently admin-facing only; these docs will be turned into video tutorials.
