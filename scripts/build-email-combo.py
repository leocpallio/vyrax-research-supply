#!/usr/bin/env python3
"""Compose ONE combined image for a row of products (Leo rule: never separate images in a line).

Usage: python3 scripts/build-email-combo.py <out-name> <thumb-slug> [<thumb-slug> ...]
  thumb-slug = file stem in public/email-thumbs, e.g. bpc-157__10mg
Writes public/email/combo/<out-name>.jpg (1200 x 400 for 3, scales with count), light card ground.
Reference it in an email as ONE <img> with explicit width/height and descriptive alt text.
"""
import sys, os
from PIL import Image, ImageDraw

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, slugs = sys.argv[1], sys.argv[2:]
if not 2 <= len(slugs) <= 4:
    sys.exit("give 2 to 4 thumb slugs")
H, PAD, GAP, BG = 400, 28, 24, (238, 241, 246)
tiles = []
for s in slugs:
    im = Image.open(os.path.join(root, "public", "email-thumbs", s + ".jpg")).convert("RGB")
    side = H - 2 * PAD
    tiles.append(im.resize((side, side), Image.LANCZOS))
W = PAD * 2 + len(tiles) * (H - 2 * PAD) + (len(tiles) - 1) * GAP
canvas = Image.new("RGB", (W, H), BG)
x = PAD
for t in tiles:
    mask = Image.new("L", t.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, t.size[0], t.size[1]), radius=22, fill=255)
    canvas.paste(t, (x, PAD), mask)
    x += t.size[0] + GAP
out_dir = os.path.join(root, "public", "email", "combo")
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, name + ".jpg")
canvas.save(path, quality=88, optimize=True)
print(path, canvas.size)
