#!/usr/bin/env python3
"""Generate branded Deckademics user-guide PDFs from the Markdown sources.

Usage:
    python docs/user-guide/generate_pdfs.py

Renders each *-guide.md in this folder into a branded PDF in /mnt/documents/.
Keep the Markdown files as the source of truth; rerun this script whenever
a guide changes so the PDFs stay in sync.
"""
import os
import re

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    ListFlowable, ListItem, NextPageTemplate,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register embeddable TrueType fonts (bundled with reportlab) so glyph metrics
# match exactly in every viewer instead of relying on font substitution.
_FONT_DIR = os.path.join(os.path.dirname(
    __import__("reportlab").__file__), "fonts")
pdfmetrics.registerFont(TTFont("Body", os.path.join(_FONT_DIR, "Vera.ttf")))
pdfmetrics.registerFont(TTFont("Body-Bold", os.path.join(_FONT_DIR, "VeraBd.ttf")))
pdfmetrics.registerFont(TTFont("Body-Italic", os.path.join(_FONT_DIR, "VeraIt.ttf")))
pdfmetrics.registerFontFamily(
    "Body", normal="Body", bold="Body-Bold", italic="Body-Italic")

FONT = "Body"
FONT_BOLD = "Body-Bold"

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = "/mnt/documents"

PRIMARY = HexColor("#40a647")   # deckademics primary green
ACCENT = HexColor("#307834")    # deckademics accent
DARK = HexColor("#212529")      # deckademics dark
MUTED = HexColor("#6c757d")
LIGHT_BG = HexColor("#eef7ef")

GUIDES = [
    ("student-guide.md", "Student Guide", "Deckademics-Student-Guide.pdf"),
    ("instructor-guide.md", "Instructor Guide", "Deckademics-Instructor-Guide.pdf"),
    ("admin-guide.md", "Admin Guide", "Deckademics-Admin-Guide.pdf"),
]


def styles():
    ss = getSampleStyleSheet()
    out = {}
    out["h2"] = ParagraphStyle(
        "h2", parent=ss["Heading1"], fontName=FONT_BOLD, fontSize=18,
        textColor=PRIMARY, spaceBefore=22, spaceAfter=8, leading=22,
    )
    out["h3"] = ParagraphStyle(
        "h3", parent=ss["Heading2"], fontName=FONT_BOLD, fontSize=13,
        textColor=DARK, spaceBefore=12, spaceAfter=4, leading=16,
    )
    out["body"] = ParagraphStyle(
        "body", parent=ss["BodyText"], fontName=FONT, fontSize=10.5,
        textColor=DARK, leading=15, spaceAfter=6, alignment=TA_LEFT,
    )
    out["bullet"] = ParagraphStyle(
        "bullet", parent=out["body"], leftIndent=4, spaceAfter=3,
    )
    out["num"] = ParagraphStyle(
        "num", parent=out["body"], leftIndent=4, spaceAfter=3,
    )
    out["toc"] = ParagraphStyle(
        "toc", parent=out["body"], fontName=FONT_BOLD, fontSize=12,
        textColor=ACCENT, spaceAfter=6, leftIndent=8,
    )
    out["cover_title"] = ParagraphStyle(
        "cover_title", parent=ss["Title"], fontName=FONT_BOLD,
        fontSize=40, textColor=white, leading=46, alignment=TA_LEFT,
    )
    out["cover_sub"] = ParagraphStyle(
        "cover_sub", parent=ss["Title"], fontName=FONT,
        fontSize=16, textColor=white, leading=22, alignment=TA_LEFT,
    )
    return out


def inline_md(text):
    # bold
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    # escape stray ampersands
    text = text.replace(" & ", " &amp; ")
    return text


def parse_markdown(md):
    """Return (doc_title, [sections]) where each section is (name, [flow-items]).
    flow-items are tuples describing content; rendering happens later."""
    lines = md.splitlines()
    doc_title = None
    sections = []  # list of dict {name, blocks}
    current = None
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if line.startswith("# ") and doc_title is None:
            doc_title = line[2:].strip()
            i += 1
            continue
        if line.startswith("## "):
            current = {"name": line[3:].strip(), "blocks": []}
            sections.append(current)
            i += 1
            continue
        if current is None:
            # intro paragraph before first ## — make an intro section
            if line.strip():
                current = {"name": "Introduction", "blocks": []}
                sections.append(current)
            else:
                i += 1
                continue
        if line.startswith("### "):
            current["blocks"].append(("h3", line[4:].strip()))
            i += 1
            continue
        # numbered list
        m_num = re.match(r"^\d+\.\s+(.*)", line)
        if m_num:
            items = []
            while i < len(lines):
                mm = re.match(r"^\d+\.\s+(.*)", lines[i].rstrip())
                if not mm:
                    break
                items.append(mm.group(1))
                i += 1
            current["blocks"].append(("ol", items))
            continue
        # bullet list
        if line.startswith("- "):
            items = []
            while i < len(lines) and lines[i].rstrip().startswith("- "):
                items.append(lines[i].rstrip()[2:])
                i += 1
            current["blocks"].append(("ul", items))
            continue
        if line.strip():
            current["blocks"].append(("p", line.strip()))
        i += 1
    return doc_title, sections


def build_story(doc_title, role_title, sections, st):
    story = []
    # ----- Cover -----
    story.append(NextPageTemplate("content"))
    story.append(Spacer(1, 2.2 * inch))
    story.append(Paragraph("DECKADEMICS", ParagraphStyle(
        "brand", fontName=FONT_BOLD, fontSize=18, textColor=white,
        leading=22)))
    story.append(Spacer(1, 0.15 * inch))
    story.append(Paragraph(role_title, st["cover_title"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("A simple, step-by-step guide to using the app.", st["cover_sub"]))
    story.append(PageBreak())

    # ----- Table of contents -----
    story.append(Paragraph("Contents", st["h2"]))
    story.append(Spacer(1, 0.1 * inch))
    for s in sections:
        if s["name"] == "Introduction":
            continue
        story.append(Paragraph("&bull;&nbsp;&nbsp;" + s["name"], st["toc"]))
    story.append(PageBreak())

    # ----- Body -----
    for s in sections:
        if s["name"] != "Introduction":
            story.append(Paragraph(s["name"], st["h2"]))
        for kind, payload in s["blocks"]:
            if kind == "h3":
                story.append(Paragraph(inline_md(payload), st["h3"]))
            elif kind == "p":
                story.append(Paragraph(inline_md(payload), st["body"]))
            elif kind == "ul":
                items = [ListItem(Paragraph(inline_md(t), st["bullet"]),
                                  value=None) for t in payload]
                story.append(ListFlowable(items, bulletType="bullet",
                                          bulletColor=PRIMARY, leftIndent=14,
                                          bulletFontSize=8))
                story.append(Spacer(1, 4))
            elif kind == "ol":
                items = [ListItem(Paragraph(inline_md(t), st["num"]))
                         for t in payload]
                story.append(ListFlowable(items, bulletType="1",
                                          bulletColor=ACCENT, leftIndent=16,
                                          bulletFontName=FONT_BOLD))
                story.append(Spacer(1, 4))
    return story


def make_doc(path, role_title):
    doc = BaseDocTemplate(
        path, pagesize=letter,
        leftMargin=0.9 * inch, rightMargin=0.9 * inch,
        topMargin=0.9 * inch, bottomMargin=0.85 * inch,
        title="Deckademics " + role_title,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin,
                  doc.width, doc.height, id="main")
    cover_frame = Frame(doc.leftMargin, doc.bottomMargin,
                        doc.width, doc.height, id="cover")

    def draw_cover(canvas, d):
        canvas.saveState()
        canvas.setFillColor(DARK)
        canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
        canvas.setFillColor(PRIMARY)
        canvas.rect(0, letter[1] - 0.35 * inch, letter[0], 0.35 * inch, fill=1, stroke=0)
        canvas.rect(0, 0, letter[0], 0.35 * inch, fill=1, stroke=0)
        canvas.restoreState()

    def draw_content(canvas, d):
        canvas.saveState()
        # header rule
        canvas.setStrokeColor(PRIMARY)
        canvas.setLineWidth(2)
        canvas.line(0.9 * inch, letter[1] - 0.6 * inch,
                    letter[0] - 0.9 * inch, letter[1] - 0.6 * inch)
        canvas.setFont(FONT_BOLD, 9)
        canvas.setFillColor(PRIMARY)
        canvas.drawString(0.9 * inch, letter[1] - 0.52 * inch, "DECKADEMICS")
        canvas.setFont(FONT, 9)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(letter[0] - 0.9 * inch, letter[1] - 0.52 * inch, role_title)
        # footer
        canvas.setFont(FONT, 8)
        canvas.setFillColor(MUTED)
        canvas.drawCentredString(letter[0] / 2, 0.5 * inch, "Page %d" % d.page)
        canvas.restoreState()

    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
        PageTemplate(id="content", frames=[frame], onPage=draw_content),
    ])
    return doc


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    st = styles()
    for md_name, role_title, pdf_name in GUIDES:
        with open(os.path.join(HERE, md_name), encoding="utf-8") as f:
            md = f.read()
        doc_title, sections = parse_markdown(md)
        doc = make_doc(os.path.join(OUT_DIR, pdf_name), role_title)
        story = build_story(doc_title, role_title, sections, st)
        doc.build(story)
        print("Wrote", os.path.join(OUT_DIR, pdf_name))


if __name__ == "__main__":
    main()