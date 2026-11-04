"""Render the home-page range tiles: a lit group of three real Vyrax vial renders per range.

Run from the repository root: python3 scripts/render-range-tiles.py
Requires Pillow. Inputs are the existing storefront vial renders in src/assets/products
(the same label art the live product pages use); nothing new is printed on a label and no
purity, batch or testing claim is generated. Output: src/assets/ranges/<section>.webp
(1600x1200 and 800x600), colour-graded per range on a dark studio ground.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "src" / "assets" / "products"
OUT = ROOT / "src" / "assets" / "ranges"
W, H = 1600, 1200

# section slug -> (three vial renders, ground colour (deep), key-light colour)
RANGES = {
    "weight-metabolic": (["retatrutide__20mg", "retatrutide__10mg", "retatrutide__30mg"], (46, 16, 10), (232, 96, 60)),
    "growth-hormone": (["ipamorelin__5mg", "cjc-1295-no-dac__5mg", "ghrp-2__10mg"], (10, 20, 48), (88, 132, 230)),
    "recovery-repair": (["kpv__10mg", "bpc-157__10mg", "ll-37__5mg"], (8, 34, 30), (64, 184, 160)),
    "copper-blends": (["glow__70mg", "ghk-cu__50mg", "klow__80mg"], (40, 22, 10), (214, 140, 80)),
    "longevity-cellular": (["epithalon__10mg", "nad-plus__500mg", "glutathione__1500mg"], (26, 14, 44), (152, 112, 230)),
    "brain-focus": (["selank__10mg", "selank-semax__10-10mg", "semax__10mg"], (10, 30, 42), (80, 170, 210)),
    "tanning-libido": (["melanotan-1__10mg", "melanotan-2__10mg", "pt-141__10mg"], (44, 14, 24), (220, 90, 120)),
    "sleep": (["dsip__5mg", "dsip__10mg", "dsip__5mg"], (14, 16, 40), (110, 120, 220)),
    "bacteriostatic-water": (["bacteriostatic-water__10ml", "bacteriostatic-water__10ml", "bacteriostatic-water__10ml"], (16, 26, 34), (150, 190, 214)),
}


def ground(deep, light) -> Image.Image:
    """Dark studio sweep with a soft key light behind the group."""
    base = Image.new("RGB", (W, H), deep)
    glow = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(glow)
    d.ellipse((W * 0.18, H * 0.02, W * 0.82, H * 0.86), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    lit = Image.new("RGB", (W, H), tuple(round(c * 0.55) for c in light))
    base = Image.composite(lit, base, glow.point(lambda v: round(v * 0.85)))
    # floor plane, slightly lighter, fading to the bottom
    floor = Image.new("L", (W, H), 0)
    fd = ImageDraw.Draw(floor)
    for y in range(int(H * 0.66), H):
        fd.line((0, y, W, y), fill=round(60 * (1 - (y - H * 0.66) / (H * 0.34))))
    return Image.composite(Image.new("RGB", (W, H), tuple(round(c * 0.35) for c in light)), base, floor)


def knockout(im: Image.Image) -> Image.Image:
    """Some renders carry a baked light-grey studio backdrop. Flood the backdrop from the
    frame edges (bright, low-saturation pixels connected to the border) and make it clear."""
    rgb = im.convert("RGB")
    hsv = rgb.convert("HSV")
    sat, val = hsv.getchannel("S"), hsv.getchannel("V")
    cand = ImageChops.multiply(sat.point(lambda x: 255 if x < 26 else 0), val.point(lambda x: 255 if x > 150 else 0))
    seed = cand.copy()
    ImageDraw.floodfill(seed, (0, 0), 128)
    for xy in [(im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]:
        if seed.getpixel(xy) == 255:
            ImageDraw.floodfill(seed, xy, 128)
    bg = seed.point(lambda x: 255 if x == 128 else 0).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))
    out = rgb.convert("RGBA")
    out.putalpha(ImageChops.invert(bg))
    return out


def vial(name: str, height: int) -> Image.Image:
    im = Image.open(PRODUCTS / f"{name}.webp").convert("RGBA")
    if im.getpixel((2, 2))[3] != 0:
        im = knockout(im)
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.Resampling.LANCZOS)


def grade(v: Image.Image, light) -> Image.Image:
    """Match the vial to the scene: slightly darken, add coloured rim light on the right edge."""
    rgb, a = v.convert("RGB"), v.getchannel("A")
    rgb = Image.blend(rgb, Image.new("RGB", v.size, (0, 0, 0)), 0.10)
    ramp = Image.linear_gradient("L").rotate(90).resize(v.size)  # 0 left .. 255 right
    rim = ramp.point(lambda x: max(0, x - 200) * 2)
    rgb = Image.composite(Image.blend(rgb, Image.new("RGB", v.size, light), 0.35), rgb, rim)
    shade = ramp.point(lambda x: max(0, 70 - x) * 2)  # far-left falloff
    rgb = Image.composite(Image.new("RGB", v.size, (0, 0, 0)), rgb, shade.point(lambda x: x // 2))
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out


def render(slug, names, deep, light) -> Image.Image:
    scene = ground(deep, light).convert("RGBA")
    floor_y = round(H * 0.74)
    hs = [470, 560, 470]
    xs = [W * 0.5 - 250, W * 0.5, W * 0.5 + 250]
    order = [0, 2, 1]  # back vials first, centre vial in front
    for i in order:
        v = grade(vial(names[i], hs[i]), light)
        x = round(xs[i] - v.width / 2)
        y = floor_y - v.height + (0 if i == 1 else -18)
        # contact shadow
        sh = Image.new("L", (W, H), 0)
        ImageDraw.Draw(sh).ellipse((x + 10, y + v.height - 22, x + v.width - 10, y + v.height + 22), fill=200)
        sh = sh.filter(ImageFilter.GaussianBlur(22))
        scene = Image.composite(Image.new("RGBA", (W, H), (0, 0, 0, 255)), scene, sh)
        # faint floor reflection
        ref = v.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        fade = Image.linear_gradient("L").resize(ref.size).point(lambda p: max(0, 70 - p))
        ra = ImageChops.multiply(ref.getchannel("A"), fade)
        ref.putalpha(ra)
        scene.alpha_composite(ref, (x, y + v.height))
        scene.alpha_composite(v, (x, y))
    # bottom darkening so white HTML text stays legible
    shade = Image.linear_gradient("L").resize((W, H)).point(lambda p: max(0, p - 120) * 2)
    scene = Image.composite(Image.new("RGBA", (W, H), (4, 8, 37, 255)), scene, shade.point(lambda p: min(p, 215)))
    return scene.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, (names, deep, light) in RANGES.items():
        im = render(slug, names, deep, light)
        im.save(OUT / f"{slug}.webp", "WEBP", quality=80, method=6)
        im.resize((800, 600), Image.Resampling.LANCZOS).save(OUT / f"{slug}-800.webp", "WEBP", quality=78, method=6)
        print(slug, (OUT / f"{slug}.webp").stat().st_size, (OUT / f"{slug}-800.webp").stat().st_size)


if __name__ == "__main__":
    main()
