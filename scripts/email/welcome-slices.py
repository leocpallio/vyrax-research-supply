#!/usr/bin/env python3
"""Welcome email artwork, two steps around build-welcome-slices.ts.

  python3 scripts/email/welcome-slices.py prep    # cut-out renders -> node_modules/.cache/welcome-art
  PW=... bun scripts/email/build-welcome-slices.ts
  python3 scripts/email/welcome-slices.py slice   # full.png + cuts.json -> public/email/welcome-N.png

Slices are 1200px wide (2x of 600) PNG, palette-quantised to keep each band small.
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SCRATCH = ROOT / "node_modules/.cache/welcome-art"
OUT = ROOT / "public/email"
SCRATCH.mkdir(parents=True, exist_ok=True)


def cutout(src: Path, dst: Path, h: int = 320):
    try:
        im = Image.open(src).convert("RGBA")
    except OSError:
        return False
    box = im.split()[3].getbbox()
    if not box or box == (0, 0, *im.size):
        # Flat render on white: crop to the non-white content. Only used on white tiles.
        from PIL import ImageChops
        rgb = im.convert("RGB")
        box = ImageChops.difference(rgb, Image.new("RGB", rgb.size, "white")).point(lambda v: 255 if v > 12 else 0).getbbox()
        if not box:
            return False
    im = im.crop(box)
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    im.save(dst, optimize=True)
    return True


def prep():
    prod = ROOT / "src/assets/products"
    cutout(prod / "bacteriostatic-water__10ml.webp", SCRATCH / "water.png")
    for f in prod.glob("*.webp"):
        ok = cutout(f, SCRATCH / f"{f.stem}.png")
        if not ok:
            (SCRATCH / f"{f.stem}.png").unlink(missing_ok=True)
    print("prepped", len(list(SCRATCH.glob("*.png"))), "cut-outs")


def slice_():
    cuts = json.loads((SCRATCH / "cuts.json").read_text())
    im = Image.open(SCRATCH / "full.png").convert("RGB")
    W, H = im.size
    scale = W / 600
    for i in range(len(cuts) - 1):
        band = im.crop((0, round(cuts[i] * scale), W, min(round(cuts[i + 1] * scale), H)))
        p = OUT / f"welcome-{i + 1}.png"
        band.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(p, optimize=True)
        print(p.name, band.size, p.stat().st_size // 1024, "KB")


{"prep": prep, "slice": slice_}[sys.argv[1]]()
