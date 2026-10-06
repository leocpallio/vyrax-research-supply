"""Move the RTA-6448 certificate footer above its frame, without changing results.

Run with a Python environment containing pymupdf, e.g. a scratch uv venv:
  PYTHONPATH= /path/to/venv/bin/python scripts/fix-rta-6448-footer.py
The input is the committed PDF; this script writes a temporary PDF and replaces it.
"""
from pathlib import Path
import os
import tempfile

import pymupdf

PDF = Path(__file__).resolve().parents[1] / "public/coa/retatrutide-10mg-RTA-6448.pdf"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
FOOTER = "Vyrax Labs · vyraxlabs.co.uk · Certificate reference RTA-6448"


def main():
    doc = pymupdf.open(PDF)
    page = doc[0]
    assert len(doc) == 1 and abs(page.rect.height - 841.92) < 1
    assert FOOTER in page.get_text(), "Unexpected source PDF; refuse to edit"
    assert page.get_text("blocks")[-1][3] > 810, "Footer already moved; refuse to reapply"

    # Clear only the old divider/footer region. The original two bottom frame
    # strokes are restored below; the disclaimer above y790 stays untouched.
    page.add_redact_annot(pymupdf.Rect(64, 801, 531, 823), fill=(1, 1, 1))
    page.apply_redactions(images=0, graphics=0, text=0)
    shape = page.new_shape()
    shape.draw_line((64.5, 796), (530.2, 796))
    shape.finish(color=(0.8902, 0.9098, 0.9412), width=0.75)
    shape.draw_line((26.6, 814.9), (568.1, 814.9))
    shape.finish(color=(0.0431, 0.1059, 0.2), width=2.25)
    shape.draw_line((19.9, 821.6), (574.9, 821.6))
    shape.finish(color=(0.1137, 0.3059, 0.8471), width=0.75)
    shape.commit(overlay=True)

    page.insert_font(fontname="VyraxFooter", fontfile=FONT)
    size = 6.8
    width = pymupdf.Font(fontfile=FONT).text_length(FOOTER, fontsize=size)
    page.insert_text(((page.rect.width - width) / 2, 808), FOOTER,
                     fontname="VyraxFooter", fontsize=size, color=(0.40, 0.45, 0.52))
    with tempfile.NamedTemporaryFile(dir=PDF.parent, suffix=".pdf", delete=False) as temp:
        output = Path(temp.name)
    try:
        doc.save(output, garbage=4, deflate=True)
        doc.close()
        os.replace(output, PDF)
    finally:
        output.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
