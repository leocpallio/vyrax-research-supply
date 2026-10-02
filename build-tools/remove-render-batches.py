"""Remove invented batch identifiers from the 56 illustrative front-vial WebPs.

The original files remain in Git history. Run once against the original renders;
replace this artwork entirely when real, report-backed batch labels are available.
QR/storage side renders are withheld by the product page until batch evidence exists.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ASSETS = Path(__file__).resolve().parents[1] / "src/assets/products"
for path in sorted(ASSETS.glob("*.webp")):
    if "__qr" in path.stem or "__storage" in path.stem:
        continue
    image = Image.open(path).convert("RGB")
    if image.size != (1536, 1536):
        raise ValueError(f"Unexpected render dimensions: {path}")
    pixels = np.asarray(image).copy()
    # All front labels share the same master. The printed batch occupies
    # x=619..918, y=1043..1072. Interpolate only the light label strip, with
    # horizontal feathering, preserving vial edge, compound and RUO footer.
    left, right, top, bottom = 598, 938, 1034, 1082
    x = np.arange(left, right)
    feather = np.minimum(np.minimum(x - left, right - 1 - x) / 12, 1).clip(0, 1)
    upper = pixels[top - 1, left:right].astype(float)
    lower = pixels[bottom, left:right].astype(float)
    for row in range(top, bottom):
        blend = (row - top + 1) / (bottom - top + 1)
        background = upper * (1 - blend) + lower * blend
        pixels[row, left:right] = (
            pixels[row, left:right] * (1 - feather[:, None]) + background * feather[:, None]
        ).astype(np.uint8)
    Image.fromarray(pixels).save(path, "WEBP", quality=88, method=6)
    print(path.name)
