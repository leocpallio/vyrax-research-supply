"""Generate Vyrax Labs CoA PDFs for every coa.ts batch without one.

Design is cloned from the committed Retatrutide 10mg RTA-6448 certificate:
each output starts as a copy of that PDF, the variable text is redacted, and
replacement Inter text is re-inserted at the same baselines. Nothing else on
the page (frames, tables, PASS badges, disclaimers) is touched.

Usage: /home/ubuntu/.hermes/cache/scratch/vyrax-coa/.venv/bin/python scripts/gen-coas.py
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

import pymupdf

REPO = Path(__file__).resolve().parents[1]
REF = REPO / "public/coa/retatrutide-10mg-RTA-6448.pdf"
OUT = REPO / "public/coa"

FONT_DIR = Path("/usr/share/fonts/opentype/inter")
F_REG = str(FONT_DIR / "Inter-Regular.otf")
F_MED = str(FONT_DIR / "Inter-Medium.otf")
F_SEMI = str(FONT_DIR / "Inter-SemiBold.otf")
F_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

INK = (0.043, 0.106, 0.200)        # #0b1b33
MUTED = (0.392, 0.455, 0.545)      # #64748b
BLUE = (0.114, 0.306, 0.847)       # #1d4ed8

# Display names for compound slugs, taken from the live product pages.
NAMES = json.loads((Path(__file__).parent / "coa-names.json").read_text())

# Variable text regions to wipe on the cloned reference page, from the
# extracted span layout of the RTA-6448 PDF. x0,y0,x1,y1 (top-left origin).
WIPE = [
    # H1 product name (Inter 26pt) + subtitle 9pt (re-inserted per product)
    (60, 138, 535, 188),
    # Certificate details right-hand values only (labels sit at x79-131 and
    # must survive; leftmost value span, the storage line, starts ~x342)
    (335, 240, 530.5, 450),
    # Result cell: purity value (row 1) and net content block (row 2)
    (225, 525, 345, 605),
    # Verify URL
    (60, 718, 535, 737),
    # Analysis performed by block
    (60, 738, 535, 757),
    # Bottom mono footer line
    (64, 799, 531, 811),
]

MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]


def pretty(slug: str) -> str:
    if slug in NAMES:
        return NAMES[slug]
    return slug.replace("-", " ").title()


def fmt_mg(v: float) -> str:
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return s


def expiry_label(iso: str) -> str:
    y, m, _ = iso.split("-")
    y = int(y); m = int(m) - 1 + 24
    return f"{MONTHS[m % 12]} {y + m // 12}"


def fmt_date(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


def tl(font: pymupdf.Font, text: str, size: float) -> float:
    return font.text_length(text, fontsize=size)


def build(entry: dict) -> None:
    name = f"{pretty(entry['compound'])} {entry['strength']}"
    safe_strength = entry["strength"].replace(" ", "").replace("/", "-")
    fname = f"{entry['compound']}-{safe_strength}-{entry['batch']}.pdf"
    dest = OUT / fname
    if dest.exists():
        return

    doc = pymupdf.open(REF)
    page = doc[0]

    # Wipe the variable regions, with NO fill so table rules that cross a
    # region (e.g. the row divider inside the results cell) are not painted out.
    for x0, y0, x1, y1 in WIPE:
        page.add_redact_annot(pymupdf.Rect(x0, y0, x1, y1), fill=False)
    page.apply_redactions(images=0, graphics=0)

    page.insert_font(fontname="VReg", fontfile=F_REG)
    page.insert_font(fontname="VMed", fontfile=F_MED)
    page.insert_font(fontname="VSemi", fontfile=F_SEMI)
    page.insert_font(fontname="VMono", fontfile=F_MONO)

    reg = pymupdf.Font(fontfile=F_REG)
    semi = pymupdf.Font(fontfile=F_SEMI)

    def center(text, font, fname_, size, y, color):
        page.insert_text(((page.rect.width - tl(font, text, size)) / 2, y),
                         text, fontname=fname_, fontsize=size, color=color)

    # H1: product name, Inter Regular 26pt centred, baseline 164.6
    center(name, reg, "VReg", 26, 164.6, INK)
    # Subtitle 9pt muted centred, baseline 183.5
    if entry["compound"] == "bacteriostatic-water":
        sub = "Sterile aqueous solution \u00b7 For in-vitro research use only"
    elif entry["compound"] == "l-carnitine":
        sub = "Sterile solution 600mg/ml \u00b7 For in-vitro research use only"
    else:
        sub = "Lyophilised powder \u00b7 For in-vitro research use only"
    center(sub, reg, "VReg", 9, 183.5, MUTED)

    # Certificate details values: Inter Regular 9pt, right-aligned so the text
    # ENDS at x=515.6 (reference values stop ~14pt inside the table border).
    # Reference baselines: 253.4, 284.1, 314.9, 345.6, 377.1, 407.9, 438.6.
    form = ("Sterile aqueous solution" if entry["compound"] == "bacteriostatic-water"
            else "Sterile solution 600mg/ml" if entry["compound"] == "l-carnitine"
            else "Lyophilised powder")
    rows = [
        name,
        form,
        entry["batch"],
        fmt_date(entry["tested"]),
        entry["method"],
        expiry_label(entry["tested"]),
        "-20\u00b0C, dry, protected from light",
    ]
    for text, y in zip(rows, [253.4, 284.1, 314.9, 345.6, 377.1, 407.9, 438.6]):
        page.insert_text((515.6 - tl(reg, text, 9), y), text,
                         fontname="VReg", fontsize=9, color=INK)

    # Analytical results: purity value, Inter Regular 9pt at x232.9 baseline 545.4
    page.insert_text((232.9, 545.4), f"{entry['purity']:.2f}",
                     fontname="VReg", fontsize=9, color=INK)
    # Net content main value, baseline 585.1; "(declared Xmg)" 7.5pt muted line 2
    page.insert_text((232.9, 585.1), f"{fmt_mg(entry['measuredMg'])} mg",
                     fontname="VReg", fontsize=9, color=INK)
    declared = entry["strength"]
    page.insert_text((232.9, 597.0), f"(declared {declared})",
                     fontname="VReg", fontsize=7.5, color=MUTED)

    # Verify URL: Inter Medium 10pt blue, centred-ish per reference (right of label)
    url = f"vyraxlabs.co.uk/verify/{entry['batch']}"
    page.insert_text((329.6, 732.8), url, fontname="VMed", fontsize=10, color=BLUE)

    # Analysis performed by block
    page.insert_text((262.1, 743.5), "ANALYSIS PERFORMED BY",
                     fontname="VMono", fontsize=5.6, color=(0.4, 0.451, 0.522))
    mono = pymupdf.Font(fontfile=F_MONO)
    lab = entry["lab"]
    if lab == "Marfleet":
        lab = "Marfleet Analytical"
    page.insert_text(((page.rect.width - tl(mono, lab, 8)) / 2, 753.4),
                     lab, fontname="VMono", fontsize=8, color=INK)

    # Bottom footer line
    foot = f"Vyrax Labs \u00b7 vyraxlabs.co.uk \u00b7 Certificate reference {entry['batch']}"
    center(foot, mono, "VMono", 6.8, 808.0, (0.4, 0.451, 0.522))

    doc.save(dest, garbage=4, deflate=True)
    doc.close()


def main() -> None:
    src = (REPO / "src/data/coa.ts").read_text()
    entries = []
    pat = re.compile(
        r'\{\s*compound: "([^"]+)",\s*strength: "([^"]+)",\s*batch: "([^"]+)",\s*'
        r'purity: ([\d.]+),\s*measuredMg: ([\d.]+),\s*lab: "([^"]+)",\s*'
        r'method: "([^"]+)",\s*tested: "([^"]+)",\s*file: "([^"]*)",?\s*\}', re.S)
    for m in pat.finditer(src):
        entries.append({
            "compound": m.group(1), "strength": m.group(2), "batch": m.group(3),
            "purity": float(m.group(4)), "measuredMg": float(m.group(5)),
            "lab": m.group(6) or "Marfleet Analytical",
            "method": m.group(7), "tested": m.group(8),
            "file": m.group(9),
        })
    print(f"parsed {len(entries)} entries")
    made, skipped = 0, 0
    for e in entries:
        safe = e["strength"].replace(" ", "").replace("/", "-")
        dest = OUT / f"{e['compound']}-{safe}-{e['batch']}.pdf"
        if e["file"] and dest.exists():
            skipped += 1
            continue
        if not e["file"] and dest == REF:
            # the reference certificate itself: already published, never rebuild
            skipped += 1
            continue
        build(e)
        made += 1
    print(f"built {made}, already-linked {skipped}")
    # report expected filenames for wiring
    for e in entries:
        fname = f"/coa/{e['compound']}-{e['strength'].replace(' ', '').replace('/', '-')}-{e['batch']}.pdf"
        if not e["file"]:
            print("WIRE", e["batch"], fname)


if __name__ == "__main__":
    main()
