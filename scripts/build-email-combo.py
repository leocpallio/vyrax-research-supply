#!/usr/bin/env python3
"""Compose ONE combined image for a row of products (Leo rule: never separate images/tiles in a line).

Usage: python3 scripts/build-email-combo.py <out-name> <thumb-stem> [<thumb-stem> ...]
  thumb-stem = file stem in public/email-thumbs, e.g. bpc-157__10mg   (2 to 4 of them)
Writes public/email/combo/<out-name>.jpg.

The vials stand on ONE shared ground: no tiles, no boxes, no gaps between cards. The thumbs are
shot on a flat light ground, so they are cropped to the vial, overlapped slightly and feathered into
a single seamless panel with one soft shared floor shadow. Use ONE <img> with explicit width/height
and descriptive alt text, inside a cell whose bgcolor equals GROUND below.
"""
import sys, os
from PIL import Image, ImageFilter, ImageDraw, ImageChops

GROUND = (238, 241, 246)  # keep in sync with the email cell bgcolor (#EEF1F6)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, stems = sys.argv[1], sys.argv[2:]
if not 2 <= len(stems) <= 4:
    sys.exit("give 2 to 4 thumb stems")

H = 420
tiles = []
for s in stems:
    im = Image.open(os.path.join(root, "public", "email-thumbs", s + ".jpg")).convert("RGB")
    bg = im.getpixel((2, 2))
    # keep everything that differs from the thumb ground, feathered, so the vial lifts off cleanly
    diff = ImageChops.difference(im, Image.new("RGB", im.size, bg)).convert("L")
    mask = diff.point(lambda v: 255 if v > 10 else 0).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(5))
    bbox = mask.point(lambda v: 255 if v > 40 else 0).getbbox() or (0, 0, im.size[0], im.size[1])
    im, mask = im.crop(bbox), mask.crop(bbox)
    scale = (H * 0.82) / im.size[1]
    size = (max(1, int(im.size[0] * scale)), int(H * 0.82))
    tiles.append((im.resize(size, Image.LANCZOS), mask.resize(size, Image.LANCZOS)))

overlap = -18
W = sum(t[0].size[0] for t in tiles) + overlap * (len(tiles) - 1) + 120
canvas = Image.new("RGB", (W, H), GROUND)
floor = Image.new("L", (W, H), 0)
fd = ImageDraw.Draw(floor)
x = 60
for im, mask in tiles:
    y = H - im.size[1] - 34
    fd.ellipse((x + 6, H - 52, x + im.size[0] - 6, H - 22), fill=70)
    x += im.size[0] + overlap
floor = floor.filter(ImageFilter.GaussianBlur(10))
canvas = Image.composite(Image.new("RGB", (W, H), (150, 160, 178)), canvas, floor)
x = 60
for im, mask in tiles:
    y = H - im.size[1] - 34
    canvas.paste(im, (x, y), mask)
    x += im.size[0] + overlap
out_dir = os.path.join(root, "public", "email", "combo")
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, name + ".jpg")
canvas.save(path, quality=90, optimize=True)
print(path, canvas.size)
