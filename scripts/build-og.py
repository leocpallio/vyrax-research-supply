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
def product(c, lab):
    src = f"{R}/src/assets/products/{c['slug']}__{key(lab)}.webp"
    if not os.path.exists(src): return None
    a = accent(src); name = c["name"]; fs = 78 if len(name) < 10 else 64 if len(name) < 14 else 52 if len(name) < 20 else 42 if len(name) < 28 else 36
    return f"""<html><head>{BASE}<style>
.l{{position:absolute;left:0;top:0;width:640px;height:630px;background:{NAVY};padding:64px 56px 64px 60px;overflow:hidden}}
.bar{{position:absolute;left:0;top:0;width:12px;height:630px;background:{a}}}
.k{{color:{PERI};font-weight:700;letter-spacing:.2em;font-size:25px;text-transform:uppercase}}
h1{{color:#fff;font-weight:800;font-size:{fs}px;line-height:1.02;margin-top:30px;letter-spacing:-.02em}}
.p{{display:inline-block;margin-top:34px;border:3px solid #fff;color:#fff;border-radius:99px;padding:8px 26px;font-weight:700;font-size:34px}}
.logo{{position:absolute;left:56px;bottom:56px;height:92px}}
.r{{position:absolute;left:640px;top:0;width:560px;height:630px;background:#fff}}
.r img{{position:absolute;left:-120px;top:-70px;width:800px;height:800px}}</style></head><body>
<div class=l><div class=bar></div><div class=k>{CATNAME.get(c['category'],'')}</div><h1>{name}</h1><div class=p>{lab.replace('mg',' mg') if lab.endswith('mg') else lab}</div><div class=logo>{LOGO_W}</div></div>
<div class=r><img src="file://{src}"></div></body></html>"""
def brand(kicker, title, sub, slugs=None):
    pick = []
    for s_ in (slugs or ["retatrutide"]):
        fl = sorted(glob.glob(f"{R}/src/assets/products/{s_}__*.webp"))
        if fl: pick.append(fl[0])
    pick = pick[:3]; n = len(pick); imgs = ""
    for i, f in enumerate(pick):
        if n == 1: w, cx = 740, 920
        else: w, cx = 470, 920 + (i - (n - 1) / 2) * 190
        imgs += f'<img src="file://{f}" style="position:absolute;left:{cx - w/2:.0f}px;top:{(630 - w)/2 - 10:.0f}px;width:{w}px;height:{w}px;mix-blend-mode:multiply;z-index:{3 - i}">'
    fs = 78 if len(title) < 16 else 62 if len(title) < 24 else 52 if len(title) < 36 else 44
    return f"""<html><head>{BASE}<style>
.l{{position:absolute;left:0;top:0;width:640px;height:630px;background:{NAVY};padding:64px 56px 64px 60px;z-index:9;overflow:hidden}}
.k{{color:{PERI};font-weight:700;letter-spacing:.2em;font-size:25px;text-transform:uppercase}}
h1{{color:#fff;font-weight:800;font-size:{fs}px;line-height:1.04;margin-top:30px;letter-spacing:-.02em}}
.s{{color:#b8c4dc;font-size:30px;font-weight:500;margin-top:26px;line-height:1.3;max-width:520px}}
.logo{{position:absolute;left:60px;bottom:56px;height:92px}}</style></head><body>
<div class=l><div class=k>{kicker}</div><h1>{title}</h1><div class=s>{sub}</div><div class=logo>{LOGO_W}</div></div>{imgs}</body></html>"""
def default():
    return f"""<html><head>{BASE}<style>body{{background:{NAVY}}}
.c{{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center}}
.logo{{height:300px}}.t{{color:{PERI};font-weight:700;letter-spacing:.3em;font-size:28px;margin-top:50px;text-transform:uppercase}}</style></head><body>
<div class=c><div class=logo>{LOGO_W}</div><div class=t>UK research peptides</div></div></body></html>"""
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
PAGES = {"home": ("Vyrax Labs", "UK research peptides", "Batch-documented, tracked UK delivery", ["retatrutide","bpc-157","tb-500","ghk-cu"]),
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
