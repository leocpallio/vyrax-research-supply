#!/usr/bin/env python3
"""Build 1200x630 link-preview cards into public/og/. Run: /usr/bin/python3 scripts/build-og.py
Inputs: scripts/og-site.json (dump of catalogue), src/assets/products/*.webp renders, Satoshi font.
No claims or RUO wording on cards."""
import json, os, re, glob, subprocess, shutil, colorsys, base64, sys
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{R}/public/og"; TMP = f"{R}/.og-tmp"
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
D = json.load(open(f"{R}/scripts/og-site.json"))
CH = glob.glob(os.path.expanduser("~/.cache/ms-playwright/*/chrome-linux64/chrome"))[0]
NAVY, PERI = "#14213D", "#5B8DEF"
FONT = f"file://{R}/public/fonts/Satoshi-Variable.woff2"
LOGO_W = open(f"{R}/scripts/og-logo-on-navy.svg").read()
LOGO_N = open(f"{R}/scripts/og-logo-on-white.svg").read()
CATNAME = {c["slug"]: c["name"] for c in D["categories"]}
def key(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def accent(img):
    im = Image.open(img).convert("RGB").resize((256, 256)); px = []
    for r, g, b in im.getdata():
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        if s > .45 and .15 < l < .6: px.append((r, g, b))
    if len(px) < 30: return PERI
    px.sort(key=lambda p: colorsys.rgb_to_hls(*[v/255 for v in p])[0])
    r, g, b = px[len(px)//2]; return "#%02x%02x%02x" % (r, g, b)
BASE = f"""<style>@font-face{{font-family:S;src:url({FONT});font-weight:100 900}}
*{{margin:0;box-sizing:border-box}}body{{width:1200px;height:630px;font-family:S,sans-serif;overflow:hidden;position:relative;background:#fff}}
.logo svg{{display:block;height:100%;width:auto}}</style>"""
N_A, N_B, N_C = "#0b1424", "#14213D", "#1a2c52"
MUTED, DOMAIN = "#9fb0cf", "#7385a8"
TAG = "Batch-documented  ·  Tracked UK delivery"
CHECK = f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="{PERI}" stroke-width="2"/><path d="M7 12.4l3.2 3.2L17.5 8.4" stroke="{PERI}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
def motif():
    import math
    r, cx, cy = 96, 360, 300
    cs = [(cx, cy)] + [(cx + math.sqrt(3)*r*math.cos(math.radians(60*k)), cy + math.sqrt(3)*r*math.sin(math.radians(60*k))) for k in range(6)]
    def hexp(x, y):
        pts = " ".join(f"{x + r*math.cos(math.radians(60*k-90)):.1f},{y + r*math.sin(math.radians(60*k-90)):.1f}" for k in range(6))
        return f'<polygon points="{pts}" fill="none" stroke="{PERI}" stroke-width="2.2" stroke-opacity=".26"/>'
    o = "".join(hexp(x, y) for x, y in cs)
    o += "".join(f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" stroke="{PERI}" stroke-width="2" stroke-opacity=".32"/>' for x, y in cs[1:])
    o += "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{9 if i==0 else 7}" fill="{PERI}" fill-opacity="{.6 if i==0 else .42}"/>' for i, (x, y) in enumerate(cs))
    return f'<svg width="720" height="620" viewBox="0 0 720 620">{o}</svg>'
def vial(src):
    from PIL import ImageChops
    im = Image.open(src).convert("RGB")
    bb = ImageChops.difference(im, Image.new("RGB", im.size, (255,255,255))).point(lambda v: 255 if v > 12 else 0).getbbox()
    im = im.crop(bb); h = 1120
    im = im.resize((round(im.width*h/im.height), h), Image.LANCZOS)
    out = f"{TMP}/v_{os.path.basename(src)}.jpg"; im.save(out, quality=92); return out
def headfs(t): n = len(t); return 82 if n <= 11 else 66 if n <= 15 else 54 if n <= 20 else 46
CSS = """*{margin:0;padding:0;box-sizing:border-box}html,body{width:1200px;height:630px}
.brand{height:46px;position:relative}.brand svg{height:100%%;width:auto;display:block}
.name{font-weight:800;line-height:1.02;color:#fff;letter-spacing:-1.2px}
.str{font-weight:600;font-size:31px;color:%s;margin-top:22px}
.tag{font-weight:600;font-size:20px;color:%s;margin-top:28px;display:flex;align-items:center;gap:11px}
.dom{font-weight:600;font-size:23px;color:%s;letter-spacing:.4px;position:relative}""" % (PERI, MUTED, DOMAIN)
def product(c, lab):
    src = f"{R}/src/assets/products/{c['slug']}__{key(lab)}.webp"
    if not os.path.exists(src): return None
    a = accent(src); v = vial(src)
    st = lab.replace("mg", " mg") if lab.endswith("mg") else lab
    return f"""<html><head>{BASE}<style>{CSS}
.card{{width:1200px;height:630px;display:flex;overflow:hidden;background:#fff}}
.left{{width:715px;height:100%;background:linear-gradient(135deg,{N_A} 0%,{N_B} 58%,{N_C} 100%);padding:64px 62px 60px;display:flex;flex-direction:column;justify-content:space-between;position:relative;box-shadow:10px 0 30px rgba(0,0,0,.28);z-index:2}}
.glow{{position:absolute;top:-140px;right:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,{PERI}26 0%,transparent 70%)}}
.right{{width:485px;height:100%;background:#fff;display:flex;align-items:center;justify-content:center;position:relative}}
.right::before{{content:'';position:absolute;left:0;top:0;width:6px;height:100%;background:linear-gradient({a},{a}cc)}}
.vial{{height:544px;max-width:420px;object-fit:contain;mix-blend-mode:multiply}}
.name{{font-size:{headfs(c['name'])}px}}</style></head><body><div class=card>
<div class=left><div class=glow></div><div class=brand>{LOGO_W}</div>
<div style="position:relative"><div class=name>{c['name']}</div><div class=str>{st}</div><div class=tag>{CHECK}{TAG}</div></div>
<div class=dom>vyraxlabs.co.uk</div></div>
<div class=right><img class=vial src="file://{v}"></div></div></body></html>"""
def brand(kicker, title, sub, slugs=None):
    fs = 80 if len(title) < 18 else 64 if len(title) < 28 else 52
    return f"""<html><head>{BASE}<style>{CSS}
.b{{width:1200px;height:630px;position:relative;overflow:hidden;background:linear-gradient(125deg,{N_A} 0%,{N_B} 55%,{N_C} 100%)}}
.m{{position:absolute;right:-70px;top:20px}}.mg{{position:absolute;right:-40px;top:60px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,{PERI}26 0%,transparent 68%)}}
.ct{{position:relative;z-index:2;height:100%;padding:64px 70px 60px;display:flex;flex-direction:column;justify-content:space-between}}
.h{{font-weight:800;font-size:{fs}px;line-height:1.0;color:#fff;letter-spacing:-1.6px;max-width:760px}}
.sub{{font-weight:600;font-size:33px;color:{PERI};margin-top:24px}}</style></head><body><div class=b><div class=mg></div><div class=m>{motif()}</div>
<div class=ct><div class=brand>{LOGO_W}</div><div><div class=h>{title}</div><div class=sub>{sub}</div><div class=tag>{CHECK}{TAG}</div></div><div class=dom>vyraxlabs.co.uk</div></div></div></body></html>"""
def default():
    return brand("", "UK research peptides", "50 compounds, 75 strengths")
jobs = {}
jobs["default"] = default()
for c in D["compounds"]:
    for lab in c["strengths"]:
        h = product(c, lab)
        if h: jobs[f"p/{c['slug']}__{key(lab)}"] = h
by = {c["slug"]: c for c in D["compounds"]}
for ct in D["categories"]:
    n = sum(1 for c in D["compounds"] if c["category"] == ct["slug"])
    sl = [c["slug"] for c in D["compounds"] if c["category"] == ct["slug"]]
    jobs[f"c/{ct['slug']}"] = brand("Category", ct["name"], f"{n} compounds, UK dispatch", sl)
for s in D["sections"]:
    jobs[f"s/{s['slug']}"] = brand("Collection", s["name"], f"{len(s['products'])} compounds, UK dispatch", s["products"])
for g in D["guides"]:
    jobs[f"g/{g['slug']}"] = brand("Guide", g["title"], "Vyrax Labs knowledge base")
PAGES = {"home": ("Vyrax Labs", "UK research peptides", "50 compounds, 75 strengths", ["retatrutide","bpc-157","tb-500","ghk-cu"]),
 "shop": ("Shop", "Full catalogue", "50 compounds, 75 strengths", ["retatrutide","tirzepatide","bpc-157","semaglutide"]),
 "lab-reports": ("Lab reports", "Certificates of Analysis", "Batch certificates in one place", None),
 "guides": ("Guides", "Research guides", "Handling, reading CoAs and comparisons", None),
 "faq": ("FAQ", "Questions, answered", "Delivery, ordering and batches", ["bpc-157"]),
 "about": ("About", "About Vyrax Labs", "Who we are and how we work", None),
 "contact": ("Contact", "Get in touch", "We reply within one working day", None),
 "calculator": ("Tool", "Peptide calculator", "Reconstitution maths made simple", None),
 "shipping": ("Policy", "Shipping and delivery", "UK tracked delivery", None),
 "returns": ("Policy", "Returns and refunds", "Our returns policy", None),
 "terms": ("Policy", "Terms and conditions", "Vyrax Labs", None),
 "privacy": ("Policy", "Privacy policy", "How we handle your data", None),
 "cookies": ("Policy", "Cookie settings", "Vyrax Labs", None),
 "verify": ("Verify", "Verify your batch", "Check a batch certificate", None)}
for k, (a, b, c2, sl) in PAGES.items():
    jobs[f"page/{k}"] = brand(a, b, c2, sl)
only = sys.argv[1:]
n = 0
for k, html in jobs.items():
    if only and not any(o in k for o in only): continue
    f = f"{TMP}/{k.replace('/','_')}.html"; open(f, "w").write(html)
    png = f"{TMP}/{k.replace('/','_')}.png"
    subprocess.run([CH, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--force-device-scale-factor=1", "--window-size=1200,630", "--virtual-time-budget=2500", f"--screenshot={png}", f"file://{f}"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    dest = f"{OUT}/{k}.jpg"; os.makedirs(os.path.dirname(dest), exist_ok=True)
    Image.open(png).convert("RGB").save(dest, quality=88, optimize=True); n += 1
print("built", n, "of", len(jobs))
